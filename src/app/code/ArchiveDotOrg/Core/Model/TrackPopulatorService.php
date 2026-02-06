<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use ArchiveDotOrg\Core\Api\MetadataDownloaderInterface;
use ArchiveDotOrg\Core\Api\TrackPopulatorServiceInterface;
use ArchiveDotOrg\Core\Api\Data\ShowInterfaceFactory;
use ArchiveDotOrg\Core\Api\Data\TrackInterfaceFactory;
use ArchiveDotOrg\Core\Api\TrackImporterInterface;
use ArchiveDotOrg\Core\Api\CategoryAssignmentServiceInterface;
use ArchiveDotOrg\Core\Logger\Logger;
use Magento\Catalog\Model\ResourceModel\Category\CollectionFactory as CategoryCollectionFactory;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\Exception\LocalizedException;

/**
 * Populates track categories with products from cached Archive.org metadata
 *
 * Phase 2 of the track populator: Reads local metadata cache and creates
 * products for tracks that match existing track categories.
 */
class TrackPopulatorService implements TrackPopulatorServiceInterface
{
    private MetadataDownloaderInterface $metadataDownloader;
    private TrackImporterInterface $trackImporter;
    private CategoryAssignmentServiceInterface $categoryAssignmentService;
    private CategoryCollectionFactory $categoryCollectionFactory;
    private ShowInterfaceFactory $showFactory;
    private TrackInterfaceFactory $trackFactory;
    private ResourceConnection $resourceConnection;
    private Config $config;
    private Logger $logger;

    /**
     * Cache of track categories by artist
     * @var array<string, array>
     */
    private array $trackCategoryCache = [];

    /**
     * Cache of title lookup maps by artist
     * @var array<string, array>
     */
    private array $titleLookupCache = [];

    public function __construct(
        MetadataDownloaderInterface $metadataDownloader,
        TrackImporterInterface $trackImporter,
        CategoryAssignmentServiceInterface $categoryAssignmentService,
        CategoryCollectionFactory $categoryCollectionFactory,
        ShowInterfaceFactory $showFactory,
        TrackInterfaceFactory $trackFactory,
        ResourceConnection $resourceConnection,
        Config $config,
        Logger $logger
    ) {
        $this->metadataDownloader = $metadataDownloader;
        $this->trackImporter = $trackImporter;
        $this->categoryAssignmentService = $categoryAssignmentService;
        $this->categoryCollectionFactory = $categoryCollectionFactory;
        $this->showFactory = $showFactory;
        $this->trackFactory = $trackFactory;
        $this->resourceConnection = $resourceConnection;
        $this->config = $config;
        $this->logger = $logger;
    }

    /**
     * @inheritDoc
     */
    public function populate(
        string $artistName,
        string $collectionId,
        ?int $limit = null,
        bool $dryRun = false,
        ?callable $progressCallback = null
    ): array {
        $result = [
            'shows_processed' => 0,
            'products_created' => 0,
            'products_updated' => 0,
            'products_skipped' => 0,
            'tracks_matched' => 0,
            'tracks_unmatched' => 0,
            'categories_populated' => 0,
            'categories_empty' => 0,
            'errors' => [],
        ];

        // Get track categories for this artist
        $this->log($progressCallback, "Loading track categories for: $artistName");
        $trackCategories = $this->getTrackCategoriesForArtist($artistName);

        if (empty($trackCategories)) {
            $this->log($progressCallback, "No track categories found for artist: $artistName");
            return $result;
        }

        $this->log($progressCallback, "Found " . count($trackCategories) . " track categories");

        // Build title lookup map
        $titleLookup = $this->buildTitleLookupMap($trackCategories);
        $this->log($progressCallback, "Built lookup map with " . count($titleLookup) . " unique normalized titles");

        // Get cached identifiers for this collection
        $identifiers = $this->metadataDownloader->getDownloadedIdentifiers($collectionId);

        if (empty($identifiers)) {
            $this->log($progressCallback, "No cached metadata found for collection: $collectionId");
            $this->log($progressCallback, "Run: bin/magento archive:download:metadata --collection=$collectionId");
            return $result;
        }

        $totalShows = count($identifiers);
        if ($limit !== null && $limit > 0) {
            $identifiers = array_slice($identifiers, 0, $limit);
        }

        $this->log($progressCallback, "Processing " . count($identifiers) . " of $totalShows cached shows");

        // Track which categories got products
        $populatedCategories = [];

        foreach ($identifiers as $index => $identifier) {
            $current = $index + 1;
            $total = count($identifiers);

            try {
                $metadata = $this->metadataDownloader->getCachedMetadata($identifier);

                if ($metadata === null) {
                    $this->log($progressCallback, "[$current/$total] Cache miss: $identifier");
                    continue;
                }

                // Parse metadata into Show/Track objects
                $show = $this->parseShowMetadata($metadata, $identifier);
                $tracks = $show->getTracks();

                $showMatched = 0;
                $showUnmatched = 0;

                foreach ($tracks as $track) {
                    $normalizedTitle = $this->normalizeTitle($track->getTitle());

                    // Skip tracks with empty titles
                    if ($normalizedTitle === '') {
                        $showUnmatched++;
                        $result['tracks_unmatched']++;
                        continue;
                    }

                    $matchedCategoryIds = $titleLookup[$normalizedTitle] ?? [];

                    if (empty($matchedCategoryIds)) {
                        $showUnmatched++;
                        $result['tracks_unmatched']++;
                        continue;
                    }

                    $showMatched++;
                    $result['tracks_matched']++;

                    if ($dryRun) {
                        $result['products_skipped']++;
                        continue;
                    }

                    try {
                        // Check if product already exists (to distinguish create vs update)
                        $sku = $track->generateSku();
                        $existingProductId = $this->trackImporter->getProductIdBySku($sku);
                        $isUpdate = $existingProductId !== null;

                        // Create or update product
                        $productId = $this->trackImporter->importTrack($track, $show, $artistName);

                        if ($productId > 0) {
                            if ($isUpdate) {
                                $result['products_updated']++;
                            } else {
                                $result['products_created']++;
                            }
                            $action = $isUpdate ? 'Updated' : 'Created';
                            $this->log($progressCallback, "  $action product ID $productId for: " . $track->getTitle());

                            // Assign to all matching categories
                            foreach ($matchedCategoryIds as $categoryId) {
                                $this->categoryAssignmentService->bulkAssignToCategory([$productId], $categoryId);
                                $populatedCategories[$categoryId] = true;
                            }
                        } else {
                            $result['products_skipped']++;
                            $this->log($progressCallback, "  No product ID returned for: " . $track->getTitle());
                        }
                    } catch (LocalizedException $e) {
                        // Product might already exist (SKU duplicate) or other error
                        $result['products_skipped']++;
                        $this->log($progressCallback, "  ERROR: " . $e->getMessage());
                        $this->logger->debug("Track import skipped: " . $e->getMessage());
                    } catch (\Exception $e) {
                        $result['products_skipped']++;
                        $this->log($progressCallback, "  UNEXPECTED ERROR: " . $e->getMessage());
                        $this->logger->logImportError("Unexpected error importing track", [
                            'track' => $track->getTitle(),
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                $result['shows_processed']++;
                $this->log(
                    $progressCallback,
                    "[$current/$total] $identifier: $showMatched matched, $showUnmatched unmatched"
                );

            } catch (\Exception $e) {
                $result['errors'][] = "$identifier: " . $e->getMessage();
                $this->logger->logImportError("Failed to process show", [
                    'identifier' => $identifier,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Calculate category stats
        $result['categories_populated'] = count($populatedCategories);
        $result['categories_empty'] = count($trackCategories) - count($populatedCategories);

        return $result;
    }

    /**
     * @inheritDoc
     */
    public function getTrackCategoriesForArtist(string $artistName): array
    {
        if (isset($this->trackCategoryCache[$artistName])) {
            return $this->trackCategoryCache[$artistName];
        }

        // First find the artist category
        $artistCategoryId = $this->findArtistCategory($artistName);

        if ($artistCategoryId === null) {
            $this->logger->debug("Artist category not found: $artistName");
            return [];
        }

        // Find all is_song=1 categories under this artist
        $connection = $this->resourceConnection->getConnection();

        // Get the path of the artist category
        $artistPath = $connection->fetchOne(
            $connection->select()
                ->from($this->resourceConnection->getTableName('catalog_category_entity'), ['path'])
                ->where('entity_id = ?', $artistCategoryId)
        );

        if (!$artistPath) {
            return [];
        }

        // Find all descendant categories with is_song=1
        $collection = $this->categoryCollectionFactory->create();
        $collection->addAttributeToSelect(['entity_id', 'name', 'path']);
        $collection->addAttributeToFilter('is_song', 1);
        $collection->addAttributeToFilter('path', ['like' => $artistPath . '/%']);

        $categories = [];
        foreach ($collection as $category) {
            $categories[] = [
                'id' => (int) $category->getId(),
                'name' => $category->getName(),
                'path' => $category->getPath(),
            ];
        }

        $this->trackCategoryCache[$artistName] = $categories;
        return $categories;
    }

    /**
     * @inheritDoc
     */
    public function normalizeTitle(?string $title): string
    {
        if ($title === null || $title === '') {
            return '';
        }

        // Remove segue markers: "Scarlet Begonias >" → "Scarlet Begonias"
        $title = preg_replace('/\s*[>\-]+\s*$/', '', $title);

        // Remove common prefixes/suffixes
        $title = preg_replace('/^\d+[\.\)\-\s]+/', '', $title); // Track numbers
        $title = preg_replace('/\s*\([^)]*\)\s*$/', '', $title); // Trailing parentheses

        // Normalize whitespace and case
        $title = trim($title);
        $title = strtolower($title);

        // Remove non-alphanumeric characters (keep spaces)
        $title = preg_replace('/[^\w\s]/', '', $title);

        // Collapse multiple spaces
        $title = preg_replace('/\s+/', ' ', $title);

        return $title;
    }

    /**
     * @inheritDoc
     */
    public function buildTitleLookupMap(array $categories): array
    {
        $lookup = [];

        foreach ($categories as $category) {
            $normalizedName = $this->normalizeTitle($category['name'] ?? '');

            // Skip empty names
            if ($normalizedName === '') {
                continue;
            }

            if (!isset($lookup[$normalizedName])) {
                $lookup[$normalizedName] = [];
            }

            $lookup[$normalizedName][] = $category['id'];
        }

        return $lookup;
    }

    /**
     * Find artist category by name
     */
    private function findArtistCategory(string $artistName): ?int
    {
        $collection = $this->categoryCollectionFactory->create();
        $collection->addAttributeToSelect('entity_id');
        $collection->addAttributeToFilter('name', $artistName);
        $collection->addAttributeToFilter('is_artist', 1);
        $collection->setPageSize(1);

        $category = $collection->getFirstItem();

        if ($category && $category->getId()) {
            return (int) $category->getId();
        }

        // Try without is_artist filter (fallback)
        $collection = $this->categoryCollectionFactory->create();
        $collection->addAttributeToSelect('entity_id');
        $collection->addAttributeToFilter('name', $artistName);
        $collection->setPageSize(1);

        $category = $collection->getFirstItem();

        return $category && $category->getId() ? (int) $category->getId() : null;
    }

    /**
     * Parse cached metadata into Show object
     */
    private function parseShowMetadata(array $data, string $identifier): \ArchiveDotOrg\Core\Api\Data\ShowInterface
    {
        $show = $this->showFactory->create();

        $metadata = $data['metadata'] ?? [];

        $show->setIdentifier($identifier);
        $show->setTitle($this->extractValue($metadata, 'title') ?? $identifier);
        $show->setDescription($this->extractValue($metadata, 'description'));
        $show->setDate($this->extractValue($metadata, 'date'));
        $show->setYear($this->extractValue($metadata, 'year'));
        $show->setVenue($this->extractValue($metadata, 'venue'));
        $show->setCoverage($this->extractValue($metadata, 'coverage'));
        $show->setCreator($this->extractValue($metadata, 'creator'));
        $show->setTaper($this->extractValue($metadata, 'taper'));
        $show->setSource($this->extractValue($metadata, 'source'));
        $show->setTransferer($this->extractValue($metadata, 'transferer'));
        $show->setLineage($this->extractValue($metadata, 'lineage'));
        $show->setNotes($this->extractValue($metadata, 'notes'));
        $show->setCollection($this->extractValue($metadata, 'collection'));
        $show->setDir($data['dir'] ?? null);
        $show->setServerOne($data['d1'] ?? null);
        $show->setServerTwo($data['d2'] ?? null);

        // Extract extended show metadata
        $show->setFilesCount(isset($data['files_count']) ? (int) $data['files_count'] : null);
        $show->setItemSize(isset($data['item_size']) ? (int) $data['item_size'] : null);
        $show->setUploader($this->extractValue($metadata, 'uploader'));
        $show->setCreatedTimestamp(isset($data['created']) ? (int) $data['created'] : null);
        $show->setLastUpdatedTimestamp(isset($data['item_last_updated']) ? (int) $data['item_last_updated'] : null);

        // Extract restriction data
        $accessRestricted = isset($metadata['access-restricted-item'])
            && $metadata['access-restricted-item'] === 'true';

        $collectionArray = $metadata['collection'] ?? [];
        if (is_string($collectionArray)) {
            $collectionArray = [$collectionArray];
        }
        $isStreamOnly = in_array('stream_only', $collectionArray, true);

        $show->setAccessRestricted($accessRestricted && $isStreamOnly);

        // License URL
        $show->setLicenseUrl($metadata['licenseurl'] ?? null);

        // Subject tags for recording type detection
        $subject = $metadata['subject'] ?? [];
        if (is_string($subject)) {
            $subject = [$subject];
        }
        $show->setSubjectTags($subject);

        // Parse tracks from files
        $audioFormat = $this->config->getAudioFormat();
        $tracks = [];

        if (isset($data['files']) && is_array($data['files'])) {
            foreach ($data['files'] as $file) {
                $fileData = is_array($file) ? $file : (array) $file;
                $name = $fileData['name'] ?? '';

                // Only include files matching the configured audio format
                if (!$this->endsWith($name, '.' . $audioFormat)) {
                    continue;
                }

                // Skip files without a title
                if (empty($fileData['title'])) {
                    continue;
                }

                $track = $this->trackFactory->create();
                $track->setName($name);
                $track->setTitle($fileData['title']);
                $track->setTrackNumber(isset($fileData['track']) ? (int) $fileData['track'] : null);
                $track->setLength($fileData['length'] ?? null);
                $track->setSha1($fileData['sha1'] ?? null);
                $track->setFormat($audioFormat);
                $track->setSource($fileData['source'] ?? null);
                $track->setFileSize(isset($fileData['size']) ? (int) $fileData['size'] : null);

                // Extract extended track metadata
                $track->setMd5($fileData['md5'] ?? null);
                $track->setBitrate(isset($fileData['bitrate']) ? (int) $fileData['bitrate'] : null);

                // Extract AcoustID from external-identifier array
                if (isset($fileData['external-identifier']) && is_array($fileData['external-identifier'])) {
                    foreach ($fileData['external-identifier'] as $externalId) {
                        if (is_string($externalId) && strpos($externalId, 'acoustid:') === 0) {
                            $track->setAcoustid(substr($externalId, 9)); // Remove "acoustid:" prefix
                            break;
                        }
                    }
                }

                $tracks[] = $track;
            }
        }

        $show->setTracks($tracks);

        return $show;
    }

    /**
     * Extract a value from metadata (handles arrays)
     */
    private function extractValue(array $metadata, string $key): ?string
    {
        if (!isset($metadata[$key])) {
            return null;
        }

        $value = $metadata[$key];

        if (is_array($value)) {
            return $value[0] ?? null;
        }

        return (string) $value ?: null;
    }

    /**
     * Check if string ends with suffix
     */
    private function endsWith(string $haystack, string $needle): bool
    {
        $length = strlen($needle);
        if ($length === 0) {
            return true;
        }

        return substr($haystack, -$length) === $needle;
    }

    /**
     * Log message via callback
     */
    private function log(?callable $callback, string $message): void
    {
        if ($callback !== null) {
            $callback($message);
        }
        $this->logger->debug($message);
    }
}
