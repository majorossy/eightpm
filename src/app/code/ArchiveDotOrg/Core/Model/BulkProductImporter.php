<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use ArchiveDotOrg\Core\Api\AttributeOptionManagerInterface;
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
    private AttributeOptionManagerInterface $attributeOptionManager;
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
     * @param AttributeOptionManagerInterface $attributeOptionManager
     * @param RecordingTypeDetector $recordingTypeDetector
     * @param IndexerRegistry $indexerRegistry
     * @param ResourceConnection $resourceConnection
     * @param Config $config
     * @param Logger $logger
     */
    public function __construct(
        ProductResource $productResource,
        ProductCollectionFactory $productCollectionFactory,
        AttributeOptionManagerInterface $attributeOptionManager,
        RecordingTypeDetector $recordingTypeDetector,
        IndexerRegistry $indexerRegistry,
        ResourceConnection $resourceConnection,
        Config $config,
        Logger $logger
    ) {
        $this->productResource = $productResource;
        $this->productCollectionFactory = $productCollectionFactory;
        $this->attributeOptionManager = $attributeOptionManager;
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

        // Pre-fetch attribute option IDs
        $this->prefetchAttributeOptions($shows, $artistName);

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
                $this->attributeOptionManager->clearCache();
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
     * Pre-fetch attribute options
     *
     * @param ShowInterface[] $shows
     * @param string $artistName
     * @return void
     */
    private function prefetchAttributeOptions(array $shows, string $artistName): void
    {
        $years = [];
        $venues = [];
        $tapers = [];

        foreach ($shows as $show) {
            if ($show->getYear()) {
                $years[] = $show->getYear();
            }
            if ($show->getVenue()) {
                $venues[] = $show->getVenue();
            }
            if ($show->getTaper()) {
                $tapers[] = $show->getTaper();
            }
        }

        // Bulk create/fetch options
        if (!empty($years)) {
            $this->attributeOptionManager->bulkGetOrCreateOptionIds('show_year', array_unique($years));
        }
        if (!empty($venues)) {
            $this->attributeOptionManager->bulkGetOrCreateOptionIds('show_venue', array_unique($venues));
        }
        if (!empty($tapers)) {
            $this->attributeOptionManager->bulkGetOrCreateOptionIds('show_taper', array_unique($tapers));
        }

        // Artist collection
        $this->attributeOptionManager->getOrCreateOptionId('archive_collection', $artistName);
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
            // Extended show attributes
            'show_uploader' => $show->getUploader()
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

        // Build song URL
        if ($show->getServerOne() && $show->getDir()) {
            $filename = pathinfo($track->getName(), PATHINFO_FILENAME) . '.flac';
            $varcharAttributes['song_url'] = $this->config->buildStreamingUrl(
                $show->getServerOne(),
                $show->getDir(),
                $filename
            );
        }

        foreach ($varcharAttributes as $code => $value) {
            if ($value !== null) {
                $this->saveAttribute($entityId, $code, $value, 'varchar');
            }
        }

        // Int attributes (status, visibility)
        $this->saveAttribute($entityId, 'status', Status::STATUS_ENABLED, 'int');
        $this->saveAttribute($entityId, 'visibility', Visibility::VISIBILITY_BOTH, 'int');

        // Dropdown attributes
        if ($show->getYear()) {
            $optionId = $this->attributeOptionManager->getOptionId('show_year', $show->getYear());
            if ($optionId) {
                $this->saveAttribute($entityId, 'show_year', $optionId, 'int');
            }
        }

        if ($show->getVenue()) {
            $optionId = $this->attributeOptionManager->getOptionId('show_venue', $show->getVenue());
            if ($optionId) {
                $this->saveAttribute($entityId, 'show_venue', $optionId, 'int');
            }
        }

        if ($show->getTaper()) {
            $optionId = $this->attributeOptionManager->getOptionId('show_taper', $show->getTaper());
            if ($optionId) {
                $this->saveAttribute($entityId, 'show_taper', $optionId, 'int');
            }
        }

        $collectionOptionId = $this->attributeOptionManager->getOptionId('archive_collection', $artistName);
        if ($collectionOptionId) {
            $this->saveAttribute($entityId, 'archive_collection', $collectionOptionId, 'int');
        }

        // Decimal attributes (price)
        $this->saveAttribute($entityId, 'price', 0.0, 'decimal');

        // Extended int attributes
        if ($track->getBitrate() !== null) {
            $this->saveAttribute($entityId, 'track_bitrate', $track->getBitrate(), 'int');
        }
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

        // Text attributes (description, meta_keyword)
        if ($show->getDescription()) {
            $this->saveAttribute($entityId, 'description', $show->getDescription(), 'text');
        }
        $this->saveAttribute($entityId, 'meta_keyword', $metaKeyword, 'text');
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
