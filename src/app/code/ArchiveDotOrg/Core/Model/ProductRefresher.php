<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use ArchiveDotOrg\Core\Api\ArchiveApiClientInterface;
use ArchiveDotOrg\Core\Api\AttributeOptionManagerInterface;
use ArchiveDotOrg\Core\Api\Data\ShowInterface;
use ArchiveDotOrg\Core\Logger\Logger;
use ArchiveDotOrg\Core\Model\Cache\ApiResponseCache;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory as ProductCollectionFactory;
use Magento\Framework\Exception\LocalizedException;

/**
 * Product Refresher
 *
 * Updates existing Magento products with fresh data from Archive.org.
 * Uses batch API calls to efficiently update ratings, reviews, and download stats.
 *
 * Performance optimization:
 * - Before: 523 API calls for STS9 (one per show)
 * - After: ~6 API calls (100 identifiers per batch)
 */
class ProductRefresher
{
    /**
     * Batch size for API requests (100 identifiers per call)
     */
    private const BATCH_SIZE = 100;

    /**
     * Available refresh fields - fast batch fields
     */
    public const FIELD_RATING = 'rating';
    public const FIELD_REVIEWS = 'reviews';
    public const FIELD_DOWNLOADS = 'downloads';
    public const FIELD_TRENDING = 'trending';
    public const FIELD_PUB_DATE = 'pub_date';
    public const FIELD_ADDED_DATE = 'added_date';
    public const FIELD_RUNTIME = 'runtime';

    /**
     * Slow per-show field (requires full metadata API call)
     */
    public const FIELD_LENGTH = 'length';

    /**
     * Default fields for batch refresh (fast)
     */
    public const DEFAULT_FIELDS = [
        self::FIELD_RATING,
        self::FIELD_REVIEWS,
        self::FIELD_DOWNLOADS,
        self::FIELD_TRENDING,
        self::FIELD_PUB_DATE,
        self::FIELD_ADDED_DATE,
        self::FIELD_RUNTIME,
    ];

    /**
     * All available fields
     */
    public const ALL_FIELDS = [
        self::FIELD_RATING,
        self::FIELD_REVIEWS,
        self::FIELD_DOWNLOADS,
        self::FIELD_TRENDING,
        self::FIELD_PUB_DATE,
        self::FIELD_ADDED_DATE,
        self::FIELD_RUNTIME,
        self::FIELD_LENGTH,
    ];

    private ArchiveApiClientInterface $apiClient;
    private ProductCollectionFactory $productCollectionFactory;
    private ProductRepositoryInterface $productRepository;
    private AttributeOptionManagerInterface $attributeOptionManager;
    private ApiResponseCache $apiResponseCache;
    private Logger $logger;

    /**
     * @param ArchiveApiClientInterface $apiClient
     * @param ProductCollectionFactory $productCollectionFactory
     * @param ProductRepositoryInterface $productRepository
     * @param AttributeOptionManagerInterface $attributeOptionManager
     * @param ApiResponseCache $apiResponseCache
     * @param Logger $logger
     */
    public function __construct(
        ArchiveApiClientInterface $apiClient,
        ProductCollectionFactory $productCollectionFactory,
        ProductRepositoryInterface $productRepository,
        AttributeOptionManagerInterface $attributeOptionManager,
        ApiResponseCache $apiResponseCache,
        Logger $logger
    ) {
        $this->apiClient = $apiClient;
        $this->productCollectionFactory = $productCollectionFactory;
        $this->productRepository = $productRepository;
        $this->attributeOptionManager = $attributeOptionManager;
        $this->apiResponseCache = $apiResponseCache;
        $this->logger = $logger;
    }

    /**
     * Refresh products for an artist
     *
     * Uses batch API calls for efficiency. For 500+ shows, makes ~6 API calls
     * instead of 500+ individual calls.
     *
     * @param string $artistName
     * @param array $fields Fields to update (empty = DEFAULT_FIELDS)
     * @param bool $force Force refresh (bypass cache)
     * @param int|null $limit Limit number of shows to process
     * @param callable|null $progressCallback Progress callback function(int $total, int $current, string $message)
     * @return array Refresh results
     * @throws LocalizedException
     */
    public function refresh(
        string $artistName,
        array $fields = [],
        bool $force = false,
        ?int $limit = null,
        ?callable $progressCallback = null
    ): array {
        $fields = empty($fields) ? self::DEFAULT_FIELDS : $fields;

        // Check if length field is requested (requires slow per-show API)
        $needsPerShowApi = in_array(self::FIELD_LENGTH, $fields);
        $batchFields = array_diff($fields, [self::FIELD_LENGTH]);

        // Get products for artist
        $products = $this->getProductsByArtist($artistName);

        if ($products->getSize() === 0) {
            throw new LocalizedException(
                __('No products found for artist "%1"', $artistName)
            );
        }

        // Group products by identifier (show ID)
        $showGroups = $this->groupProductsByIdentifier($products);

        if ($limit !== null) {
            $showGroups = array_slice($showGroups, 0, $limit, true);
        }

        $totalShows = count($showGroups);
        $identifiers = array_keys($showGroups);

        $result = [
            'total_shows' => $totalShows,
            'shows_processed' => 0,
            'products_updated' => 0,
            'products_skipped' => 0,
            'api_calls' => 0,
            'cache_hits' => 0,
            'errors' => [],
        ];

        // Batch fetch stats for all identifiers
        $allStats = [];
        if (!empty($batchFields)) {
            $allStats = $this->fetchBatchStatsWithCache($identifiers, $force, $result, $progressCallback);
        }

        // If length field is needed, fetch per-show metadata
        $perShowData = [];
        if ($needsPerShowApi) {
            $perShowData = $this->fetchPerShowMetadata($showGroups, $force, $result, $progressCallback, count($allStats) > 0);
        }

        // Update products
        $currentShow = 0;
        foreach ($showGroups as $identifier => $productData) {
            $currentShow++;

            if ($progressCallback) {
                $progressCallback($totalShows, $currentShow, "Updating: {$identifier}");
            }

            try {
                $stats = $allStats[$identifier] ?? [];
                $showData = $perShowData[$identifier] ?? null;

                $updateResult = $this->updateProducts($productData, $stats, $showData, $fields);
                $result['products_updated'] += $updateResult['updated'];
                $result['products_skipped'] += $updateResult['skipped'];
                $result['shows_processed']++;

                if (!empty($updateResult['errors'])) {
                    foreach ($updateResult['errors'] as $error) {
                        $result['errors'][] = $error;
                    }
                }
            } catch (\Exception $e) {
                $result['errors'][] = [
                    'identifier' => $identifier,
                    'message' => $e->getMessage(),
                ];
                $this->logger->logImportError('Show refresh failed', [
                    'identifier' => $identifier,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $result;
    }

    /**
     * Fetch batch stats with caching
     *
     * @param array $identifiers
     * @param bool $force
     * @param array &$result
     * @param callable|null $progressCallback
     * @return array [identifier => stats]
     */
    private function fetchBatchStatsWithCache(
        array $identifiers,
        bool $force,
        array &$result,
        ?callable $progressCallback
    ): array {
        $allStats = [];
        $uncachedIdentifiers = [];

        // Check cache first (unless forcing)
        if (!$force) {
            foreach ($identifiers as $identifier) {
                $cachedData = $this->apiResponseCache->get($identifier . '_stats');
                if ($cachedData !== null) {
                    $allStats[$identifier] = $cachedData;
                    $result['cache_hits']++;
                } else {
                    $uncachedIdentifiers[] = $identifier;
                }
            }
        } else {
            $uncachedIdentifiers = $identifiers;
        }

        // Batch fetch uncached identifiers
        if (!empty($uncachedIdentifiers)) {
            $batches = array_chunk($uncachedIdentifiers, self::BATCH_SIZE);
            $batchNum = 0;
            $totalBatches = count($batches);

            foreach ($batches as $batch) {
                $batchNum++;

                if ($progressCallback) {
                    $progressCallback(
                        $totalBatches,
                        $batchNum,
                        sprintf('Fetching batch %d/%d (%d shows)', $batchNum, $totalBatches, count($batch))
                    );
                }

                try {
                    $batchStats = $this->apiClient->fetchBatchStats($batch);
                    $result['api_calls']++;

                    // Cache each result and add to allStats
                    foreach ($batchStats as $identifier => $stats) {
                        $this->apiResponseCache->saveForRefresh($identifier . '_stats', $stats);
                        $allStats[$identifier] = $stats;
                    }

                    // Add nulls for identifiers not returned (no data on Archive.org)
                    foreach ($batch as $identifier) {
                        if (!isset($allStats[$identifier])) {
                            $allStats[$identifier] = [
                                'avg_rating' => null,
                                'num_reviews' => null,
                                'downloads' => null,
                                'downloads_week' => null,
                                'downloads_month' => null,
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    $this->logger->logApiError('Batch stats fetch failed', $e->getMessage());
                    $result['errors'][] = [
                        'identifier' => 'batch_' . $batchNum,
                        'message' => $e->getMessage(),
                    ];
                }
            }
        }

        return $allStats;
    }

    /**
     * Fetch per-show metadata (for length field)
     *
     * @param array $showGroups
     * @param bool $force
     * @param array &$result
     * @param callable|null $progressCallback
     * @param bool $offsetProgress
     * @return array [identifier => ShowInterface]
     */
    private function fetchPerShowMetadata(
        array $showGroups,
        bool $force,
        array &$result,
        ?callable $progressCallback,
        bool $offsetProgress
    ): array {
        $perShowData = [];
        $totalShows = count($showGroups);
        $currentShow = 0;

        foreach ($showGroups as $identifier => $productData) {
            $currentShow++;

            if ($progressCallback) {
                $message = sprintf('Fetching metadata: %s', $identifier);
                if ($offsetProgress) {
                    // Adjust progress to show we're in the second phase
                    $progressCallback($totalShows * 2, $totalShows + $currentShow, $message);
                } else {
                    $progressCallback($totalShows, $currentShow, $message);
                }
            }

            try {
                $fetchResult = $this->fetchShowData($identifier, $force);

                if ($fetchResult['from_cache']) {
                    $result['cache_hits']++;
                } else {
                    $result['api_calls']++;
                }

                if ($fetchResult['data'] !== null) {
                    $perShowData[$identifier] = $fetchResult['data'];
                }
            } catch (\Exception $e) {
                $result['errors'][] = [
                    'identifier' => $identifier,
                    'message' => $e->getMessage(),
                ];
            }
        }

        return $perShowData;
    }

    /**
     * Dry run - preview what would be updated
     *
     * @param string $artistName
     * @param array $fields
     * @param int|null $limit
     * @return array Preview results
     * @throws LocalizedException
     */
    public function dryRun(
        string $artistName,
        array $fields = [],
        ?int $limit = null
    ): array {
        $fields = empty($fields) ? self::DEFAULT_FIELDS : $fields;

        // Get products for artist
        $products = $this->getProductsByArtist($artistName);

        if ($products->getSize() === 0) {
            throw new LocalizedException(
                __('No products found for artist "%1"', $artistName)
            );
        }

        // Group products by identifier
        $showGroups = $this->groupProductsByIdentifier($products);

        if ($limit !== null) {
            $showGroups = array_slice($showGroups, 0, $limit, true);
        }

        $showCount = count($showGroups);
        $needsPerShowApi = in_array(self::FIELD_LENGTH, $fields);

        // Calculate expected API calls
        $batchApiCalls = (int) ceil($showCount / self::BATCH_SIZE);
        $perShowApiCalls = $needsPerShowApi ? $showCount : 0;
        $estimatedApiCalls = $batchApiCalls + $perShowApiCalls;

        return [
            'total_products' => $products->getSize(),
            'unique_shows' => count($showGroups),
            'shows_to_process' => $showCount,
            'fields_to_update' => $fields,
            'estimated_api_calls' => $estimatedApiCalls,
            'batch_api_calls' => $batchApiCalls,
            'per_show_api_calls' => $perShowApiCalls,
            'uses_batch_api' => !$needsPerShowApi || count(array_diff($fields, [self::FIELD_LENGTH])) > 0,
            'shows' => array_map(function ($data) {
                return [
                    'identifier' => $data['identifier'],
                    'product_count' => count($data['product_ids']),
                ];
            }, array_values(array_slice($showGroups, 0, 10))),
        ];
    }

    /**
     * Get products for an artist
     *
     * @param string $artistName
     * @return \Magento\Catalog\Model\ResourceModel\Product\Collection
     */
    private function getProductsByArtist(string $artistName)
    {
        $collection = $this->productCollectionFactory->create();
        $collection->addAttributeToSelect([
            'entity_id',
            'sku',
            'identifier',
            'length',
            'archive_avg_rating',
            'archive_num_reviews',
            'archive_downloads',
            'archive_downloads_week',
            'archive_downloads_month',
        ]);

        // Get the option ID for the artist name in archive_collection
        $optionId = $this->attributeOptionManager->getOptionId('archive_collection', $artistName);

        if ($optionId === null) {
            // Try direct filter on the value (for text-based attributes)
            $collection->addAttributeToFilter('archive_collection', ['eq' => $artistName]);
        } else {
            $collection->addAttributeToFilter('archive_collection', ['eq' => $optionId]);
        }

        return $collection;
    }

    /**
     * Group products by their show identifier
     *
     * @param \Magento\Catalog\Model\ResourceModel\Product\Collection $products
     * @return array [identifier => ['identifier' => string, 'product_ids' => array, 'products' => array]]
     */
    private function groupProductsByIdentifier($products): array
    {
        $groups = [];

        foreach ($products as $product) {
            $identifier = $product->getData('identifier');

            if (empty($identifier)) {
                continue;
            }

            if (!isset($groups[$identifier])) {
                $groups[$identifier] = [
                    'identifier' => $identifier,
                    'product_ids' => [],
                    'products' => [],
                ];
            }

            $groups[$identifier]['product_ids'][] = (int) $product->getId();
            $groups[$identifier]['products'][] = $product;
        }

        return $groups;
    }

    /**
     * Fetch show data from API or cache (for length field)
     *
     * @param string $identifier
     * @param bool $force
     * @return array ['data' => ShowInterface|null, 'from_cache' => bool]
     */
    private function fetchShowData(string $identifier, bool $force): array
    {
        // Check cache first (unless forcing)
        if (!$force) {
            $cachedData = $this->apiResponseCache->get($identifier);
            if ($cachedData !== null) {
                // Reconstruct ShowInterface from cached data
                $show = $this->reconstructShowFromCache($cachedData);
                return ['data' => $show, 'from_cache' => true];
            }
        }

        // Fetch from API
        try {
            $show = $this->apiClient->fetchShowMetadata($identifier);

            // Cache the response data
            $this->apiResponseCache->saveForRefresh($identifier, $this->showToArray($show));

            return ['data' => $show, 'from_cache' => false];
        } catch (\Exception $e) {
            $this->logger->logApiError($identifier, $e->getMessage());
            return ['data' => null, 'from_cache' => false];
        }
    }

    /**
     * Convert ShowInterface to array for caching
     *
     * @param ShowInterface $show
     * @return array
     */
    private function showToArray(ShowInterface $show): array
    {
        $tracks = [];
        foreach ($show->getTracks() as $track) {
            $tracks[] = [
                'name' => $track->getName(),
                'title' => $track->getTitle(),
                'length' => $track->getLength(),
                'sha1' => $track->getSha1(),
            ];
        }

        return [
            'identifier' => $show->getIdentifier(),
            'title' => $show->getTitle(),
            'avg_rating' => $show->getAvgRating(),
            'num_reviews' => $show->getNumReviews(),
            'downloads' => $show->getDownloads(),
            'downloads_week' => $show->getDownloadsWeek(),
            'downloads_month' => $show->getDownloadsMonth(),
            'tracks' => $tracks,
        ];
    }

    /**
     * Reconstruct ShowInterface from cached data
     *
     * @param array $data
     * @return ShowInterface
     */
    private function reconstructShowFromCache(array $data): ShowInterface
    {
        // Create a minimal show object with just the data we need
        $show = new \ArchiveDotOrg\Core\Model\Data\Show();
        $show->setIdentifier($data['identifier'] ?? '');
        $show->setTitle($data['title'] ?? '');
        $show->setAvgRating($data['avg_rating'] ?? null);
        $show->setNumReviews($data['num_reviews'] ?? null);
        $show->setDownloads($data['downloads'] ?? null);
        $show->setDownloadsWeek($data['downloads_week'] ?? null);
        $show->setDownloadsMonth($data['downloads_month'] ?? null);

        // Reconstruct tracks
        if (isset($data['tracks']) && is_array($data['tracks'])) {
            foreach ($data['tracks'] as $trackData) {
                $track = new \ArchiveDotOrg\Core\Model\Data\Track();
                $track->setName($trackData['name'] ?? '');
                $track->setTitle($trackData['title'] ?? '');
                $track->setLength($trackData['length'] ?? null);
                $track->setSha1($trackData['sha1'] ?? null);
                $show->addTrack($track);
            }
        }

        return $show;
    }

    /**
     * Update products with stats and show data
     *
     * @param array $productData
     * @param array $stats Batch stats [avg_rating, num_reviews, downloads, downloads_week, downloads_month]
     * @param ShowInterface|null $show Full show data (for length field)
     * @param array $fields Fields to update
     * @return array ['updated' => int, 'skipped' => int, 'errors' => array]
     */
    private function updateProducts(array $productData, array $stats, ?ShowInterface $show, array $fields): array
    {
        $result = [
            'updated' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        // Build a map of track lengths by SHA1 (for length field)
        $trackLengths = [];
        if ($show !== null && in_array(self::FIELD_LENGTH, $fields)) {
            foreach ($show->getTracks() as $track) {
                if ($track->getSha1()) {
                    $trackLengths[$track->getSha1()] = $track->getLength();
                }
            }
        }

        foreach ($productData['products'] as $product) {
            try {
                $hasChanges = false;

                // Update rating
                if (in_array(self::FIELD_RATING, $fields)) {
                    $newRating = isset($stats['avg_rating']) ? (string) $stats['avg_rating'] : null;
                    $currentRating = $product->getData('archive_avg_rating');
                    if ($newRating !== $currentRating) {
                        $product->setData('archive_avg_rating', $newRating);
                        $hasChanges = true;
                    }
                }

                // Update reviews
                if (in_array(self::FIELD_REVIEWS, $fields)) {
                    $newReviews = $stats['num_reviews'] ?? null;
                    $currentReviews = $product->getData('archive_num_reviews');
                    if ($newReviews !== $currentReviews) {
                        $product->setData('archive_num_reviews', $newReviews);
                        $hasChanges = true;
                    }
                }

                // Update downloads
                if (in_array(self::FIELD_DOWNLOADS, $fields)) {
                    $newDownloads = $stats['downloads'] ?? null;
                    $currentDownloads = $product->getData('archive_downloads');
                    if ($newDownloads !== $currentDownloads) {
                        $product->setData('archive_downloads', $newDownloads);
                        $hasChanges = true;
                    }
                }

                // Update trending (weekly/monthly downloads)
                if (in_array(self::FIELD_TRENDING, $fields)) {
                    $newWeek = $stats['downloads_week'] ?? null;
                    $newMonth = $stats['downloads_month'] ?? null;
                    $currentWeek = $product->getData('archive_downloads_week');
                    $currentMonth = $product->getData('archive_downloads_month');

                    if ($newWeek !== $currentWeek) {
                        $product->setData('archive_downloads_week', $newWeek);
                        $hasChanges = true;
                    }
                    if ($newMonth !== $currentMonth) {
                        $product->setData('archive_downloads_month', $newMonth);
                        $hasChanges = true;
                    }
                }

                // Update length (match by SKU which contains SHA1)
                if (in_array(self::FIELD_LENGTH, $fields) && !empty($trackLengths)) {
                    $sku = $product->getSku();
                    // SKU format is typically sha1-based
                    foreach ($trackLengths as $sha1 => $length) {
                        if (strpos($sku, substr($sha1, 0, 8)) !== false || $sku === $sha1) {
                            $currentLength = $product->getData('length');
                            if ($length !== $currentLength && $length !== null) {
                                $product->setData('length', $length);
                                $hasChanges = true;
                            }
                            break;
                        }
                    }
                }

                // Update new show-level fields from batch stats
                if (isset($stats['pub_date']) && $stats['pub_date'] !== $product->getData('pub_date')) {
                    $product->setData('pub_date', $stats['pub_date']);
                    $hasChanges = true;
                }

                if (isset($stats['added_date']) && $stats['added_date'] !== $product->getData('show_added_date')) {
                    $product->setData('show_added_date', $stats['added_date']);
                    $hasChanges = true;
                }

                if (isset($stats['runtime']) && $stats['runtime'] !== $product->getData('show_runtime')) {
                    $product->setData('show_runtime', $stats['runtime']);
                    $hasChanges = true;
                }

                if ($hasChanges) {
                    $this->productRepository->save($product);
                    $result['updated']++;

                    $this->logger->debug('Product refreshed', [
                        'sku' => $product->getSku(),
                        'identifier' => $productData['identifier'],
                    ]);
                } else {
                    $result['skipped']++;
                }
            } catch (\Exception $e) {
                $result['errors'][] = [
                    'sku' => $product->getSku(),
                    'message' => $e->getMessage(),
                ];
                $result['skipped']++;
            }
        }

        return $result;
    }
}
