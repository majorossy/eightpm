<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use ArchiveDotOrg\Core\Api\MetadataDownloaderInterface;
use ArchiveDotOrg\Core\Model\Config;
use ArchiveDotOrg\Core\Model\RecordingTypeDetector;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\App\State;
use Magento\Framework\App\Area;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Backfill existing products with recording restriction and classification data.
 *
 * Reads cached metadata JSON files to populate:
 * - is_streamable, access_restriction (from access-restricted-item + collection)
 * - recording_type (from source/lineage/subject via RecordingTypeDetector)
 * - archive_detail_url (from identifier)
 * - archive_license_url (from licenseurl)
 */
class BackfillRecordingDataCommand extends BaseLoggedCommand
{
    private MetadataDownloaderInterface $metadataDownloader;
    private RecordingTypeDetector $recordingTypeDetector;
    private Config $config;
    private State $state;

    public function __construct(
        MetadataDownloaderInterface $metadataDownloader,
        RecordingTypeDetector $recordingTypeDetector,
        Config $config,
        State $state,
        LoggerInterface $logger,
        ResourceConnection $resourceConnection,
        ?string $name = null
    ) {
        $this->metadataDownloader = $metadataDownloader;
        $this->recordingTypeDetector = $recordingTypeDetector;
        $this->config = $config;
        $this->state = $state;
        $this->logger = $logger;
        $this->resourceConnection = $resourceConnection;
        parent::__construct($name);
    }

    protected function configure(): void
    {
        $this->setName('archive:backfill:recording-data')
            ->setDescription('Backfill existing products with recording type, restriction, and license data')
            ->addOption(
                'dry-run',
                'd',
                InputOption::VALUE_NONE,
                'Show what would be updated without saving'
            )
            ->addOption(
                'limit',
                'l',
                InputOption::VALUE_OPTIONAL,
                'Maximum number of products to process',
                null
            )
            ->addOption(
                'artist',
                'a',
                InputOption::VALUE_OPTIONAL,
                'Only backfill products for a specific artist/collection',
                null
            )
            ->addOption(
                'force',
                'f',
                InputOption::VALUE_NONE,
                'Update even if attributes are already set'
            );
    }

    protected function doExecute(
        InputInterface $input,
        OutputInterface $output,
        string $correlationId
    ): int {
        $io = new SymfonyStyle($input, $output);

        try {
            $this->state->setAreaCode(Area::AREA_ADMINHTML);
        } catch (\Exception $e) {
            // Already set
        }

        $dryRun = $input->getOption('dry-run');
        $limit = $input->getOption('limit') ? (int) $input->getOption('limit') : null;
        $artistFilter = $input->getOption('artist');
        $force = $input->getOption('force');

        if ($limit !== null && $limit <= 0) {
            $io->error('Limit must be a positive integer');
            return Command::FAILURE;
        }

        $io->title('Backfill Recording Restriction & Classification Data');

        if ($dryRun) {
            $io->note('DRY RUN MODE - No products will be updated');
        }

        // Resolve collection filter if artist specified
        $collectionFilter = null;
        if ($artistFilter) {
            $collectionFilter = $this->resolveCollectionId($artistFilter);
            if ($collectionFilter) {
                $io->text("Filtering by artist: $artistFilter (collection: $collectionFilter)");
            } else {
                $io->text("Filtering by artist: $artistFilter (no collection mapping found, using as-is)");
            }
        }

        // Get products with identifiers
        $io->section('Scanning products...');

        $products = $this->getProductsWithIdentifiers($collectionFilter, $artistFilter, $limit);

        if (empty($products)) {
            $io->warning('No products found with archive identifiers.');
            return Command::SUCCESS;
        }

        $io->text(sprintf('Found %s products with archive identifiers', number_format(count($products))));

        // Group products by show identifier for efficient metadata lookup
        $productsByIdentifier = [];
        foreach ($products as $product) {
            $identifier = $product['identifier'];
            if (!isset($productsByIdentifier[$identifier])) {
                $productsByIdentifier[$identifier] = [];
            }
            $productsByIdentifier[$identifier][] = $product;
        }

        $io->text(sprintf('Spanning %s unique shows', number_format(count($productsByIdentifier))));

        // Process products
        $stats = [
            'products_scanned' => count($products),
            'products_updated' => 0,
            'products_skipped' => 0,
            'metadata_found' => 0,
            'metadata_missing' => 0,
            'recording_types' => [],
            'streamable' => 0,
            'restricted' => 0,
            'licenses_found' => 0,
        ];

        $batchSize = 500;
        $processed = 0;

        foreach ($productsByIdentifier as $identifier => $identifierProducts) {
            if (!$this->shouldContinue()) {
                $io->warning('Stopped by user signal.');
                break;
            }

            // Look up cached metadata
            $metadata = $this->metadataDownloader->getCachedMetadata($identifier);

            if ($metadata === null) {
                $stats['metadata_missing']++;
                $stats['products_skipped'] += count($identifierProducts);
                continue;
            }

            $stats['metadata_found']++;

            // Extract restriction data from metadata
            $metadataFields = $metadata['metadata'] ?? [];

            $accessRestricted = isset($metadataFields['access-restricted-item'])
                && $metadataFields['access-restricted-item'] === 'true';

            $collectionArray = $metadataFields['collection'] ?? [];
            if (is_string($collectionArray)) {
                $collectionArray = [$collectionArray];
            }
            $isStreamOnly = in_array('stream_only', $collectionArray, true);
            $isRestricted = $accessRestricted && $isStreamOnly;

            $isStreamable = !$isRestricted;

            // License URL
            $licenseUrl = $metadataFields['licenseurl'] ?? null;

            // Subject tags
            $subject = $metadataFields['subject'] ?? [];
            if (is_string($subject)) {
                $subject = [$subject];
            }

            // Source and lineage for recording type
            $source = $this->extractValue($metadataFields, 'source');
            $lineage = $this->extractValue($metadataFields, 'lineage');

            $recordingType = $this->recordingTypeDetector->detect($source, $lineage, $subject);

            // Archive detail URL
            $archiveDetailUrl = 'https://archive.org/details/' . $identifier;

            // Track stats
            if ($isStreamable) {
                $stats['streamable'] += count($identifierProducts);
            } else {
                $stats['restricted'] += count($identifierProducts);
            }

            if ($licenseUrl) {
                $stats['licenses_found']++;
            }

            if (!isset($stats['recording_types'][$recordingType])) {
                $stats['recording_types'][$recordingType] = 0;
            }
            $stats['recording_types'][$recordingType] += count($identifierProducts);

            // Update products
            foreach ($identifierProducts as $productData) {
                $entityId = (int) $productData['entity_id'];

                // Skip if already set and not forcing
                if (!$force && !empty($productData['recording_type'])) {
                    $stats['products_skipped']++;
                    $processed++;
                    continue;
                }

                if (!$dryRun) {
                    $this->saveAttribute($entityId, 'is_streamable', $isStreamable ? 1 : 0, 'int');
                    $this->saveAttribute($entityId, 'recording_type', $recordingType, 'varchar');
                    $this->saveAttribute($entityId, 'archive_detail_url', $archiveDetailUrl, 'varchar');

                    if (!$isStreamable) {
                        $this->saveAttribute($entityId, 'access_restriction', 'stream_only', 'varchar');
                    }

                    if ($licenseUrl) {
                        $this->saveAttribute($entityId, 'archive_license_url', $licenseUrl, 'varchar');
                    }
                }

                $stats['products_updated']++;
                $processed++;
            }

            // Periodic progress output
            if ($processed % $batchSize === 0 && $processed > 0) {
                $io->text(sprintf(
                    '  Processed %s / %s products...',
                    number_format($processed),
                    number_format(count($products))
                ));
                gc_collect_cycles();
            }
        }

        // Update command progress
        $this->updateProgress($correlationId, count($products), $stats['products_updated']);

        // Display results
        $io->newLine();
        $io->section('Results');

        // Recording type breakdown
        $io->text('<info>Recording Type Classification:</info>');
        arsort($stats['recording_types']);
        $totalProducts = count($products);
        foreach ($stats['recording_types'] as $type => $count) {
            $pct = $totalProducts > 0 ? ($count / $totalProducts) * 100 : 0;
            $io->text(sprintf('  %s: %s (%.1f%%)', $type, number_format($count), $pct));
        }

        $io->newLine();
        $io->text('<info>Access Restrictions:</info>');
        $io->text(sprintf('  Streamable: %s (%.1f%%)',
            number_format($stats['streamable']),
            $totalProducts > 0 ? ($stats['streamable'] / $totalProducts) * 100 : 0
        ));
        $io->text(sprintf('  Stream-only (unavailable): %s (%.1f%%)',
            number_format($stats['restricted']),
            $totalProducts > 0 ? ($stats['restricted'] / $totalProducts) * 100 : 0
        ));

        $io->newLine();
        $io->text(sprintf('Licenses found: %s', number_format($stats['licenses_found'])));
        $io->text(sprintf('Metadata found: %s / %s shows',
            number_format($stats['metadata_found']),
            number_format($stats['metadata_found'] + $stats['metadata_missing'])
        ));

        $io->newLine();
        $io->table(
            ['Metric', 'Count'],
            [
                ['Products scanned', number_format($stats['products_scanned'])],
                ['Products updated', number_format($stats['products_updated'])],
                ['Products skipped', number_format($stats['products_skipped'])],
                ['Metadata missing', number_format($stats['metadata_missing'])],
            ]
        );

        if ($dryRun) {
            $io->note('Dry run complete. Run without --dry-run to apply changes.');
        } else {
            $io->success(sprintf('Backfill complete. Updated %s products.', number_format($stats['products_updated'])));
        }

        return Command::SUCCESS;
    }

    /**
     * Get products that have archive identifiers set
     *
     * @param string|null $collectionFilter Collection ID filter
     * @param string|null $artistFilter Artist name filter
     * @param int|null $limit Max products
     * @return array
     */
    private function getProductsWithIdentifiers(
        ?string $collectionFilter,
        ?string $artistFilter,
        ?int $limit
    ): array {
        $connection = $this->resourceConnection->getConnection();

        // Get attribute IDs
        $identifierAttrId = $this->getAttributeId('identifier');
        $recordingTypeAttrId = $this->getAttributeId('recording_type');
        $archiveCollectionAttrId = $this->getAttributeId('archive_collection');

        if (!$identifierAttrId) {
            return [];
        }

        // Build query: join product entity with identifier varchar attribute
        $select = $connection->select()
            ->from(
                ['cpe' => $this->resourceConnection->getTableName('catalog_product_entity')],
                ['entity_id', 'sku']
            )
            ->join(
                ['identifier_attr' => $this->resourceConnection->getTableName('catalog_product_entity_varchar')],
                'cpe.entity_id = identifier_attr.entity_id AND identifier_attr.attribute_id = ' . (int)$identifierAttrId . ' AND identifier_attr.store_id = 0',
                ['identifier' => 'value']
            )
            ->where('identifier_attr.value IS NOT NULL')
            ->where('identifier_attr.value != ?', '');

        // Left join recording_type to check if already set
        if ($recordingTypeAttrId) {
            $select->joinLeft(
                ['rt_attr' => $this->resourceConnection->getTableName('catalog_product_entity_varchar')],
                'cpe.entity_id = rt_attr.entity_id AND rt_attr.attribute_id = ' . (int)$recordingTypeAttrId . ' AND rt_attr.store_id = 0',
                ['recording_type' => 'value']
            );
        }

        // Filter by collection/artist if specified
        if ($collectionFilter && $archiveCollectionAttrId) {
            // Get option ID for this collection
            $optionId = $this->getOptionIdForValue($archiveCollectionAttrId, $collectionFilter);
            if ($optionId) {
                $select->join(
                    ['ac_attr' => $this->resourceConnection->getTableName('catalog_product_entity_int')],
                    'cpe.entity_id = ac_attr.entity_id AND ac_attr.attribute_id = ' . (int)$archiveCollectionAttrId . ' AND ac_attr.store_id = 0',
                    []
                )->where('ac_attr.value = ?', $optionId);
            }
        } elseif ($artistFilter && $archiveCollectionAttrId) {
            // Try matching by artist name via option label
            $optionId = $this->getOptionIdForValue($archiveCollectionAttrId, $artistFilter);
            if ($optionId) {
                $select->join(
                    ['ac_attr' => $this->resourceConnection->getTableName('catalog_product_entity_int')],
                    'cpe.entity_id = ac_attr.entity_id AND ac_attr.attribute_id = ' . (int)$archiveCollectionAttrId . ' AND ac_attr.store_id = 0',
                    []
                )->where('ac_attr.value = ?', $optionId);
            }
        }

        if ($limit !== null) {
            $select->limit($limit);
        }

        return $connection->fetchAll($select);
    }

    /**
     * Get EAV attribute ID by code
     */
    private function getAttributeId(string $attributeCode): ?int
    {
        static $cache = [];

        if (isset($cache[$attributeCode])) {
            return $cache[$attributeCode];
        }

        $connection = $this->resourceConnection->getConnection();
        $select = $connection->select()
            ->from($this->resourceConnection->getTableName('eav_attribute'), ['attribute_id'])
            ->where('attribute_code = ?', $attributeCode)
            ->where('entity_type_id = ?', 4); // Product entity type

        $id = $connection->fetchOne($select);
        $cache[$attributeCode] = $id ? (int) $id : null;

        return $cache[$attributeCode];
    }

    /**
     * Get option ID for an attribute value label
     */
    private function getOptionIdForValue(int $attributeId, string $value): ?int
    {
        $connection = $this->resourceConnection->getConnection();

        $select = $connection->select()
            ->from(
                ['eaov' => $this->resourceConnection->getTableName('eav_attribute_option_value')],
                ['option_id']
            )
            ->join(
                ['eao' => $this->resourceConnection->getTableName('eav_attribute_option')],
                'eaov.option_id = eao.option_id',
                []
            )
            ->where('eao.attribute_id = ?', $attributeId)
            ->where('eaov.value = ?', $value)
            ->where('eaov.store_id = ?', 0)
            ->limit(1);

        $result = $connection->fetchOne($select);
        return $result ? (int) $result : null;
    }

    /**
     * Save a single product attribute value via direct SQL
     */
    private function saveAttribute(int $entityId, string $attributeCode, $value, string $backendType): void
    {
        static $attributeCache = [];

        if (!isset($attributeCache[$attributeCode])) {
            $attributeCache[$attributeCode] = $this->getAttributeId($attributeCode);
        }

        $attributeId = $attributeCache[$attributeCode];

        if (!$attributeId) {
            return;
        }

        $table = $this->resourceConnection->getTableName('catalog_product_entity_' . $backendType);
        $connection = $this->resourceConnection->getConnection();

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
     * Resolve artist name to collection ID from config
     */
    private function resolveCollectionId(string $artistInput): ?string
    {
        $artistMappings = $this->config->getArtistMappings();

        foreach ($artistMappings as $mapping) {
            $name = $mapping['artist_name'] ?? '';
            $collection = $mapping['collection_id'] ?? '';

            if (strcasecmp($name, $artistInput) === 0) {
                return $collection;
            }

            $urlKey = strtolower(str_replace(' ', '-', $name));
            if (strcasecmp($urlKey, $artistInput) === 0) {
                return $collection;
            }
        }

        return null;
    }
}
