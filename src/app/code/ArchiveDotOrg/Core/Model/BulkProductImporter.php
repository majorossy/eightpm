<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use ArchiveDotOrg\Core\Api\BulkProductImporterInterface;
use ArchiveDotOrg\Core\Api\Data\ShowInterface;
use ArchiveDotOrg\Core\Api\Data\TrackInterface;
use ArchiveDotOrg\Core\Logger\Logger;
use Magento\Catalog\Model\Product;
use Magento\Catalog\Model\Product\Attribute\Source\Status;
use Magento\Catalog\Model\Product\Type;
use Magento\Catalog\Model\Product\Visibility;
use Magento\Catalog\Model\ResourceModel\Product as ProductResource;
use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory as ProductCollectionFactory;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\Indexer\IndexerRegistry;
use Magento\Indexer\Model\Indexer;

/**
 * Bulk Product Importer Implementation
 *
 * Uses direct database operations for high-performance bulk imports.
 * Manages indexers to prevent performance degradation during large imports.
 */
class BulkProductImporter implements BulkProductImporterInterface
{
    /**
     * Indexers to manage during bulk import
     */
    private const MANAGED_INDEXERS = [
        'catalog_product_flat',
        'catalog_product_price',
        'catalog_product_attribute',
        'cataloginventory_stock'
    ];

    private ProductResource $productResource;
    private ProductCollectionFactory $productCollectionFactory;
    private RecordingTypeDetector $recordingTypeDetector;
    private IndexerRegistry $indexerRegistry;
    private ResourceConnection $resourceConnection;
    private Config $config;
    private Logger $logger;

    /**
     * Cache of existing SKUs
     *
     * @var array<string, int>
     */
    private array $existingSkus = [];

    /**
     * @param ProductResource $productResource
     * @param ProductCollectionFactory $productCollectionFactory
     * @param RecordingTypeDetector $recordingTypeDetector
     * @param IndexerRegistry $indexerRegistry
     * @param ResourceConnection $resourceConnection
     * @param Config $config
     * @param Logger $logger
     */
    public function __construct(
        ProductResource $productResource,
        ProductCollectionFactory $productCollectionFactory,
        RecordingTypeDetector $recordingTypeDetector,
        IndexerRegistry $indexerRegistry,
        ResourceConnection $resourceConnection,
        Config $config,
        Logger $logger
    ) {
        $this->productResource = $productResource;
        $this->productCollectionFactory = $productCollectionFactory;
        $this->recordingTypeDetector = $recordingTypeDetector;
        $this->indexerRegistry = $indexerRegistry;
        $this->resourceConnection = $resourceConnection;
        $this->config = $config;
        $this->logger = $logger;
    }

    /**
     * @inheritDoc
     */
    public function importBulk(
        array $shows,
        string $artistName,
        ?callable $progressCallback = null
    ): array {
        $result = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => []
        ];

        // Collect all SKUs for batch existence check
        $allSkus = $this->collectAllSkus($shows);
        $this->loadExistingSkus($allSkus);

        $totalTracks = $this->countTotalTracks($shows);
        $processedTracks = 0;

        foreach ($shows as $show) {
            foreach ($show->getTracks() as $track) {
                $processedTracks++;

                try {
                    $sku = $track->generateSku();

                    if (empty($sku)) {
                        $result['skipped']++;
                        continue;
                    }

                    $isUpdate = isset($this->existingSkus[$sku]);

                    if ($isUpdate) {
                        $this->updateProduct($sku, $track, $show, $artistName);
                        $result['updated']++;
                    } else {
                        $this->createProduct($sku, $track, $show, $artistName);
                        $result['created']++;
                        $this->existingSkus[$sku] = -1; // Mark as existing
                    }

                    if ($progressCallback !== null) {
                        $progressCallback($totalTracks, $processedTracks, $track->getTitle());
                    }
                } catch (\Exception $e) {
                    $result['skipped']++;
                    $result['errors'][] = [
                        'show' => $show->getIdentifier(),
                        'track' => $track->getTitle(),
                        'error' => $e->getMessage()
                    ];

                    $this->logger->logImportError('Bulk import track error', [
                        'show' => $show->getIdentifier(),
                        'track' => $track->getTitle(),
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Clear caches periodically
            if ($processedTracks % $this->config->getBatchSize() === 0) {
                gc_collect_cycles();
            }
        }

        return $result;
    }

    /**
     * @inheritDoc
     */
    public function prepareIndexers(): array
    {
        $originalModes = [];

        foreach (self::MANAGED_INDEXERS as $indexerId) {
            try {
                $indexer = $this->indexerRegistry->get($indexerId);
                $originalModes[$indexerId] = $indexer->isScheduled();

                if (!$indexer->isScheduled()) {
                    $indexer->setScheduled(true);
                    $this->logger->debug('Set indexer to scheduled mode', ['indexer' => $indexerId]);
                }
            } catch (\Exception $e) {
                // Indexer may not exist
                $this->logger->debug('Could not configure indexer', [
                    'indexer' => $indexerId,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $originalModes;
    }

    /**
     * @inheritDoc
     */
    public function restoreIndexers(array $originalModes): void
    {
        foreach ($originalModes as $indexerId => $wasScheduled) {
            try {
                $indexer = $this->indexerRegistry->get($indexerId);

                if (!$wasScheduled) {
                    $indexer->setScheduled(false);
                }
            } catch (\Exception $e) {
                $this->logger->debug('Could not restore indexer mode', [
                    'indexer' => $indexerId,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * @inheritDoc
     */
    public function reindexAll(): void
    {
        foreach (self::MANAGED_INDEXERS as $indexerId) {
            try {
                $indexer = $this->indexerRegistry->get($indexerId);

                if ($indexer->isScheduled()) {
                    continue; // Will be handled by cron
                }

                $indexer->reindexAll();
                $this->logger->debug('Reindexed', ['indexer' => $indexerId]);
            } catch (\Exception $e) {
                $this->logger->logImportError('Reindex failed', [
                    'indexer' => $indexerId,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Collect all SKUs from shows
     *
     * @param ShowInterface[] $shows
     * @return string[]
     */
    private function collectAllSkus(array $shows): array
    {
        $skus = [];

        foreach ($shows as $show) {
            foreach ($show->getTracks() as $track) {
                $sku = $track->generateSku();
                if (!empty($sku)) {
                    $skus[] = $sku;
                }
            }
        }

        return $skus;
    }

    /**
     * Load existing SKUs into cache
     *
     * @param string[] $skus
     * @return void
     */
    private function loadExistingSkus(array $skus): void
    {
        if (empty($skus)) {
            return;
        }

        // Batch query for existing products
        $collection = $this->productCollectionFactory->create();
        $collection->addAttributeToSelect('entity_id');
        $collection->addAttributeToFilter('sku', ['in' => $skus]);

        foreach ($collection as $product) {
            $this->existingSkus[$product->getSku()] = (int) $product->getId();
        }

        $this->logger->debug('Loaded existing SKUs', [
            'requested' => count($skus),
            'found' => count($this->existingSkus)
        ]);
    }

    /**
     * Count total tracks in shows
     *
     * @param ShowInterface[] $shows
     * @return int
     */
    private function countTotalTracks(array $shows): int
    {
        $count = 0;
        foreach ($shows as $show) {
            $count += count($show->getTracks());
        }
        return $count;
    }

    /**
     * Create a new product
     *
     * @param string $sku
     * @param TrackInterface $track
     * @param ShowInterface $show
     * @param string $artistName
     * @return void
     */
    private function createProduct(
        string $sku,
        TrackInterface $track,
        ShowInterface $show,
        string $artistName
    ): void {
        $connection = $this->resourceConnection->getConnection();

        // Begin transaction to ensure atomicity
        $connection->beginTransaction();

        try {
            // Insert into catalog_product_entity
            $connection->insert(
                $this->resourceConnection->getTableName('catalog_product_entity'),
                [
                    'sku' => $sku,
                    'type_id' => Type::TYPE_VIRTUAL,
                    'attribute_set_id' => $this->config->getAttributeSetId(),
                    'has_options' => 0,
                    'required_options' => 0
                ]
            );

            $entityId = (int) $connection->lastInsertId();

            // Set attributes
            $this->setProductAttributes($entityId, $track, $show, $artistName);

            // Set website assignment
            $connection->insert(
                $this->resourceConnection->getTableName('catalog_product_website'),
                [
                    'product_id' => $entityId,
                    'website_id' => $this->config->getDefaultWebsiteId()
                ]
            );

            // Set stock (virtual products)
            $connection->insert(
                $this->resourceConnection->getTableName('cataloginventory_stock_item'),
                [
                    'product_id' => $entityId,
                    'stock_id' => 1,
                    'qty' => 0,
                    'is_in_stock' => 1,
                    'manage_stock' => 0,
                    'use_config_manage_stock' => 0
                ]
            );

            // Commit transaction
            $connection->commit();
        } catch (\Exception $e) {
            // Rollback on any error
            $connection->rollBack();
            $this->logger->error('Failed to create product - transaction rolled back', [
                'sku' => $sku,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing product
     *
     * @param string $sku
     * @param TrackInterface $track
     * @param ShowInterface $show
     * @param string $artistName
     * @return void
     */
    private function updateProduct(
        string $sku,
        TrackInterface $track,
        ShowInterface $show,
        string $artistName
    ): void {
        $entityId = $this->existingSkus[$sku];

        if ($entityId > 0) {
            $this->setProductAttributes($entityId, $track, $show, $artistName);
        }
    }

    /**
     * Set product attributes using direct SQL
     *
     * @param int $entityId
     * @param TrackInterface $track
     * @param ShowInterface $show
     * @param string $artistName
     * @return void
     */
    private function setProductAttributes(
        int $entityId,
        TrackInterface $track,
        ShowInterface $show,
        string $artistName
    ): void {
        // Generate product name
        $name = sprintf(
            '%s %s %s %s',
            $artistName,
            $track->getTitle(),
            $show->getYear() ?? '',
            $show->getVenue() ?? ''
        );

        // Varchar attributes
        $varcharAttributes = [
            'name' => trim($name),
            'url_key' => $track->generateUrlKey(),
            'title' => $track->getTitle(),
            'length' => $track->getLength(),
            'identifier' => $show->getIdentifier(),
            'show_name' => $show->getTitle(),
            'dir' => $show->getDir(),
            'server_one' => $show->getServerOne() ?? 'not stored',
            'server_two' => $show->getServerTwo() ?? 'not stored',
            'notes' => $show->getNotes() ?? 'not stored',
            'lineage' => $show->getLineage() ?? 'not stored',
            'guid' => $show->getGuid(),
            // Extended track attributes
            'track_md5' => $track->getMd5(),
            'track_acoustid' => $track->getAcoustid(),
            // New track-level fields
            'track_original_file' => $track->getOriginal(),
            'track_album' => $track->getAlbum(),
            // Extended show attributes
            'show_uploader' => $show->getUploader(),
            // New show-level fields (duplicated on every track)
            'show_runtime' => $show->getRuntime(),
            // Formerly select/dropdown attributes — now varchar
            'show_year' => $show->getYear() ?: null,
            'show_venue' => $show->getVenue() ?: null,
            'show_taper' => $show->getTaper() ?: null,
            'show_transferer' => $show->getTransferer() ?: null,
            'show_location' => $show->getCoverage() ?: null,
            'archive_collection' => $artistName ?: null,
        ];

        // SEO Meta Fields
        $trackTitle = $track->getTitle() ?? 'Untitled Track';
        $showYear = $show->getYear() ?? 'Live';
        $showVenue = $show->getVenue() ?? 'Unknown Venue';
        $showDate = $show->getDate() ?? $showYear;

        $metaTitle = sprintf(
            '%s - %s (%s at %s) | 8pm.me',
            $trackTitle,
            $artistName,
            $showYear,
            $showVenue
        );

        $metaDescription = sprintf(
            'Listen to %s performed by %s on %s at %s. High-quality live concert recording - free streaming.',
            $trackTitle,
            $artistName,
            $showDate,
            $showVenue
        );

        $varcharAttributes['meta_title'] = $this->truncateToLength($metaTitle, 70);
        $varcharAttributes['meta_description'] = $this->truncateToLength($metaDescription, 160);

        // meta_keyword uses text backend type, will be saved separately
        $metaKeyword = implode(', ', array_filter([
            $artistName,
            $trackTitle,
            $showVenue,
            $showYear,
            'live concert',
            'free streaming'
        ]));

        // Build song URL and multi-quality song_urls
        $songUrlsJson = null;
        if ($show->getServerOne() && $show->getDir()) {
            $basename = pathinfo($track->getName(), PATHINFO_FILENAME);
            $formatTracksByBasename = $show->getFormatTracksByBasename();
            $formatVariants = $formatTracksByBasename[$basename] ?? [];

            if (!empty($formatVariants)) {
                // Build multi-quality URLs from all format variants
                $qualityUrls = $this->buildQualityUrlsFromVariants(
                    $formatVariants,
                    $show->getServerOne(),
                    $show->getDir()
                );
                if (!empty($qualityUrls)) {
                    $songUrlsJson = json_encode($qualityUrls, JSON_UNESCAPED_SLASHES);
                    // Set legacy song_url to best available MP3, falling back to FLAC
                    $varcharAttributes['song_url'] = $this->pickBestSongUrl($qualityUrls);
                }
            }

            // Fallback: if no format variants, use FLAC URL
            if (!isset($varcharAttributes['song_url'])) {
                $filename = $basename . '.flac';
                $varcharAttributes['song_url'] = $this->config->buildStreamingUrl(
                    $show->getServerOne(),
                    $show->getDir(),
                    $filename
                );
            }
        }

        foreach ($varcharAttributes as $code => $value) {
            if ($value !== null) {
                $this->saveAttribute($entityId, $code, $value, 'varchar');
            }
        }

        // Int attributes (status, visibility)
        $this->saveAttribute($entityId, 'status', Status::STATUS_ENABLED, 'int');
        $this->saveAttribute($entityId, 'visibility', Visibility::VISIBILITY_BOTH, 'int');

        // Decimal attributes (price)
        $this->saveAttribute($entityId, 'price', 0.0, 'decimal');

        // Extended int attributes
        if ($show->getFilesCount() !== null) {
            $this->saveAttribute($entityId, 'show_files_count', $show->getFilesCount(), 'int');
        }
        if ($show->getItemSize() !== null) {
            $this->saveAttribute($entityId, 'show_total_size', $show->getItemSize(), 'int');
        }

        // Extended datetime attributes
        if ($show->getCreatedTimestamp()) {
            $this->saveAttribute(
                $entityId,
                'show_created_date',
                date('Y-m-d H:i:s', $show->getCreatedTimestamp()),
                'datetime'
            );
        }
        if ($show->getLastUpdatedTimestamp()) {
            $this->saveAttribute(
                $entityId,
                'show_last_updated',
                date('Y-m-d H:i:s', $show->getLastUpdatedTimestamp()),
                'datetime'
            );
        }

        // New datetime attributes
        if ($show->getAddedDate()) {
            $this->saveAttribute($entityId, 'show_added_date', $show->getAddedDate(), 'datetime');
        }
        if ($show->getPublicDate()) {
            $this->saveAttribute($entityId, 'show_public_date', $show->getPublicDate(), 'datetime');
        }

        // Recording restriction and classification attributes
        $isStreamable = !$show->isAccessRestricted();
        $this->saveAttribute($entityId, 'is_streamable', $isStreamable ? 1 : 0, 'int');

        if (!$isStreamable) {
            $this->saveAttribute($entityId, 'access_restriction', 'stream_only', 'varchar');
        }

        $recordingType = $this->recordingTypeDetector->detect(
            $show->getSource(),
            $show->getLineage(),
            $show->getSubjectTags()
        );
        $this->saveAttribute($entityId, 'recording_type', $recordingType, 'varchar');

        $identifier = $show->getIdentifier();
        if ($identifier) {
            $this->saveAttribute($entityId, 'archive_detail_url', 'https://archive.org/details/' . $identifier, 'varchar');
        }

        $licenseUrl = $show->getLicenseUrl();
        if ($licenseUrl) {
            $this->saveAttribute($entityId, 'archive_license_url', $licenseUrl, 'varchar');
        }

        // Text attributes (description, meta_keyword, show_subject, song_urls)
        if ($show->getDescription()) {
            $this->saveAttribute($entityId, 'description', $show->getDescription(), 'text');
        }
        $this->saveAttribute($entityId, 'meta_keyword', $metaKeyword, 'text');

        // New text attribute
        if ($show->getSubject()) {
            $this->saveAttribute($entityId, 'show_subject', $show->getSubject(), 'text');
        }

        // Multi-quality song URLs JSON
        if ($songUrlsJson) {
            $this->saveAttribute($entityId, 'song_urls', $songUrlsJson, 'text');
        }
    }

    /**
     * Build quality URLs from format variant tracks
     *
     * @param TrackInterface[] $variants
     * @param string $server
     * @param string $dir
     * @return array
     */
    private function buildQualityUrlsFromVariants(array $variants, string $server, string $dir): array
    {
        $qualityUrls = [];

        foreach ($variants as $variant) {
            $ext = strtolower(pathinfo($variant->getName(), PATHINFO_EXTENSION));
            $url = $this->config->buildStreamingUrl($server, $dir, $variant->getName());

            $fileSize = $variant->getFileSize();
            $length = $variant->getLength();

            $tier = $this->determineQualityTierFromFile($ext, $fileSize, $length);
            $bitrate = $this->estimateBitrateFromFile($ext, $fileSize, $length);

            if (!isset($qualityUrls[$tier])) {
                $qualityUrls[$tier] = [
                    'url' => $url,
                    'format' => $ext,
                    'bitrate' => $bitrate,
                    'size_mb' => $fileSize ? round($fileSize / 1024 / 1024, 1) : null,
                ];
            }
        }

        return $qualityUrls;
    }

    /**
     * Determine quality tier based on format and file size
     */
    private function determineQualityTierFromFile(string $ext, ?int $fileSize, ?string $length): string
    {
        if ($ext === 'flac') {
            return 'high';
        }

        if ($ext === 'mp3' && $fileSize) {
            $seconds = $this->parseLengthToSeconds($length);
            $minutes = $seconds > 0 ? $seconds / 60 : 3;
            $mbPerMinute = ($fileSize / 1024 / 1024) / $minutes;
            // Archive.org VBR MP3s are typically 160-220kbps (~1.2-1.7 MB/min)
            return $mbPerMinute >= 1 ? 'medium' : 'low';
        }

        return 'medium';
    }

    /**
     * Estimate bitrate string from file metadata
     */
    private function estimateBitrateFromFile(string $ext, ?int $fileSize, ?string $length): string
    {
        if ($ext === 'flac') {
            return 'lossless';
        }

        $seconds = $this->parseLengthToSeconds($length);
        if ($fileSize && $seconds > 0) {
            $kbps = (int) (($fileSize * 8) / ($seconds * 1000));
            if ($kbps >= 280) return '320k';
            if ($kbps >= 200) return '256k';
            if ($kbps >= 160) return '192k';
            return '128k';
        }

        return $ext === 'mp3' ? '256k' : '192k';
    }

    /**
     * Parse length string to seconds (handles "376.49" and "06:16" formats)
     */
    private function parseLengthToSeconds(?string $length): float
    {
        if ($length === null) {
            return 0;
        }
        if (str_contains($length, ':')) {
            $parts = explode(':', $length);
            if (count($parts) === 2) {
                return (float) $parts[0] * 60 + (float) $parts[1];
            }
            if (count($parts) === 3) {
                return (float) $parts[0] * 3600 + (float) $parts[1] * 60 + (float) $parts[2];
            }
        }
        return is_numeric($length) ? (float) $length : 0;
    }

    /**
     * Pick best song URL: prefer medium MP3, then low, then high (FLAC)
     */
    private function pickBestSongUrl(array $qualityUrls): ?string
    {
        if (isset($qualityUrls['medium'])) {
            return $qualityUrls['medium']['url'];
        }
        if (isset($qualityUrls['low'])) {
            return $qualityUrls['low']['url'];
        }
        if (isset($qualityUrls['high'])) {
            return $qualityUrls['high']['url'];
        }
        return null;
    }

    /**
     * Truncate string to maximum length without breaking words
     *
     * @param string $text
     * @param int $maxLength
     * @return string
     */
    private function truncateToLength(string $text, int $maxLength): string
    {
        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }
        $truncated = mb_substr($text, 0, $maxLength);
        $lastSpace = mb_strrpos($truncated, ' ');
        if ($lastSpace !== false && $lastSpace > $maxLength * 0.75) {
            return mb_substr($truncated, 0, $lastSpace) . '...';
        }
        return $truncated . '...';
    }

    /**
     * Save a single attribute value
     *
     * @param int $entityId
     * @param string $attributeCode
     * @param mixed $value
     * @param string $backendType
     * @return void
     */
    private function saveAttribute(int $entityId, string $attributeCode, $value, string $backendType): void
    {
        static $attributeCache = [];

        // Get attribute ID
        if (!isset($attributeCache[$attributeCode])) {
            $connection = $this->resourceConnection->getConnection();
            $select = $connection->select()
                ->from($this->resourceConnection->getTableName('eav_attribute'), ['attribute_id'])
                ->where('attribute_code = ?', $attributeCode)
                ->where('entity_type_id = ?', 4); // Product entity type

            $attributeCache[$attributeCode] = (int) $connection->fetchOne($select);
        }

        $attributeId = $attributeCache[$attributeCode];

        if (!$attributeId) {
            return;
        }

        $table = $this->resourceConnection->getTableName('catalog_product_entity_' . $backendType);
        $connection = $this->resourceConnection->getConnection();

        // Upsert
        $connection->insertOnDuplicate(
            $table,
            [
                'attribute_id' => $attributeId,
                'store_id' => 0,
                'entity_id' => $entityId,
                'value' => $value
            ],
            ['value']
        );
    }
}
