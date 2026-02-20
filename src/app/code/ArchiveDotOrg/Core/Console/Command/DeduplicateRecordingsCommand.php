<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use ArchiveDotOrg\Core\Api\MetadataDownloaderInterface;
use ArchiveDotOrg\Core\Model\Config;
use ArchiveDotOrg\Core\Model\RecordingTypeDetector;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Framework\App\Area;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\App\State;
use Magento\Framework\Registry;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ConfirmationQuestion;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Deduplicate recordings — keep the best recording per (artist, show date).
 *
 * archive:import:shows imported ALL recordings from Archive.org (multiple
 * recordings per show date per artist), while archive:download only selected
 * the best one per date. This command identifies duplicate recordings and
 * deletes the lower-quality ones, keeping only the best per artist+date.
 */
class DeduplicateRecordingsCommand extends BaseLoggedCommand
{
    private MetadataDownloaderInterface $metadataDownloader;
    private ProductRepositoryInterface $productRepository;
    private Config $config;
    private State $state;
    private Registry $registry;

    /** Recording type priority (lower = better) */
    private const TYPE_PRIORITY = [
        RecordingTypeDetector::TYPE_SOUNDBOARD => 1,
        RecordingTypeDetector::TYPE_MATRIX => 2,
        RecordingTypeDetector::TYPE_FM_BROADCAST => 3,
        RecordingTypeDetector::TYPE_WEBCAST => 4,
        RecordingTypeDetector::TYPE_AUDIENCE => 5,
        RecordingTypeDetector::TYPE_UNKNOWN => 6,
    ];

    public function __construct(
        MetadataDownloaderInterface $metadataDownloader,
        ProductRepositoryInterface $productRepository,
        Config $config,
        State $state,
        Registry $registry,
        LoggerInterface $logger,
        ResourceConnection $resourceConnection,
        ?string $name = null
    ) {
        $this->metadataDownloader = $metadataDownloader;
        $this->productRepository = $productRepository;
        $this->config = $config;
        $this->state = $state;
        $this->registry = $registry;
        $this->logger = $logger;
        $this->resourceConnection = $resourceConnection;
        parent::__construct($name);
    }

    protected function configure(): void
    {
        $this->setName('archive:dedup:recordings')
            ->setDescription('Deduplicate recordings — keep the best recording per artist + show date')
            ->addOption(
                'dry-run',
                'd',
                InputOption::VALUE_NONE,
                'Show what would be deleted without deleting'
            )
            ->addOption(
                'artist',
                'a',
                InputOption::VALUE_OPTIONAL,
                'Filter to a single artist (e.g., "Railroad Earth")'
            )
            ->addOption(
                'batch-size',
                'b',
                InputOption::VALUE_OPTIONAL,
                'Products per deletion batch',
                100
            )
            ->addOption(
                'force',
                'f',
                InputOption::VALUE_NONE,
                'Skip confirmation prompt'
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
        $artistFilter = $input->getOption('artist');
        $batchSize = (int) $input->getOption('batch-size');
        $force = $input->getOption('force');

        if ($batchSize <= 0 || $batchSize > 1000) {
            $io->error('--batch-size must be between 1 and 1000.');
            return Command::FAILURE;
        }

        $io->title('Deduplicate Recordings');

        if ($dryRun) {
            $io->note('DRY RUN MODE - No products will be deleted');
        }

        if ($artistFilter) {
            $this->setCurrentArtist($artistFilter);
            $io->text("Filtering by artist: $artistFilter");
        }

        // Phase 1: Fetch all recordings grouped by identifier
        $io->section('Phase 1: Scanning recordings...');
        $recordings = $this->fetchAllRecordings($artistFilter);

        if (empty($recordings)) {
            $io->warning('No recordings found.');
            return Command::SUCCESS;
        }

        $io->text(sprintf('Found %s unique recordings', number_format(count($recordings))));

        // Phase 2: Group by (collection, date) and rank
        $io->section('Phase 2: Grouping by artist + date and ranking...');
        $groups = $this->groupByArtistDate($recordings);

        $totalRecordings = count($recordings);
        $uniquePairs = count($groups);
        $duplicateGroups = 0;
        $losers = [];
        $winReasons = [];

        foreach ($groups as $key => $group) {
            if (count($group) <= 1) {
                continue;
            }

            $duplicateGroups++;

            // Rank recordings within the group
            usort($group, [$this, 'compareRecordings']);

            // First element is the winner, rest are losers
            $winner = $group[0];
            $reason = $this->getWinReason($winner);

            if (!isset($winReasons[$reason])) {
                $winReasons[$reason] = 0;
            }
            $winReasons[$reason]++;

            for ($i = 1; $i < count($group); $i++) {
                $losers[] = $group[$i];
            }
        }

        $loserIdentifiers = array_column($losers, 'identifier');
        $duplicateRecordingCount = count($loserIdentifiers);

        // Phase 2b: Count products that will be deleted
        $productsToDelete = 0;
        if (!empty($loserIdentifiers)) {
            $productsToDelete = $this->countProductsByIdentifiers($loserIdentifiers);
        }

        // Count by artist
        $byArtist = [];
        foreach ($losers as $loser) {
            $artistLabel = $loser['collection_label'] ?? 'Unknown';
            if (!isset($byArtist[$artistLabel])) {
                $byArtist[$artistLabel] = ['recordings' => 0, 'tracks' => 0];
            }
            $byArtist[$artistLabel]['recordings']++;
            $byArtist[$artistLabel]['tracks'] += (int) ($loser['track_count'] ?? 0);
        }

        // Display summary
        $io->section('Deduplication Analysis');

        $io->table(['Metric', 'Count'], [
            ['Total recordings', number_format($totalRecordings)],
            ['Unique (artist, date) pairs', number_format($uniquePairs)],
            ['Pairs with duplicates', number_format($duplicateGroups)],
            ['Duplicate recordings to remove', number_format($duplicateRecordingCount)],
            ['Products to delete', number_format($productsToDelete)],
        ]);

        if (!empty($byArtist)) {
            arsort($byArtist);
            $io->text('<info>By artist:</info>');
            $artistRows = [];
            foreach (array_slice($byArtist, 0, 20, true) as $artist => $counts) {
                $artistRows[] = [$artist, number_format($counts['recordings']), number_format($counts['tracks'])];
            }
            $io->table(['Artist', 'Extra Recordings', 'Products'], $artistRows);

            if (count($byArtist) > 20) {
                $io->text(sprintf('  ... and %d more artists', count($byArtist) - 20));
            }
        }

        if (!empty($winReasons)) {
            arsort($winReasons);
            $io->text('<info>Winners selected by:</info>');
            foreach ($winReasons as $reason => $count) {
                $io->text(sprintf('  %s: %s', $reason, number_format($count)));
            }
        }

        if ($productsToDelete === 0) {
            $io->success('No duplicate recordings found. Nothing to delete.');
            return Command::SUCCESS;
        }

        if ($dryRun) {
            // Show some sample duplicates
            $io->section('Sample Duplicates (first 10 groups)');
            $sampleCount = 0;

            foreach ($groups as $key => $group) {
                if (count($group) <= 1) {
                    continue;
                }
                if ($sampleCount >= 10) {
                    break;
                }

                usort($group, [$this, 'compareRecordings']);

                $io->text(sprintf('<info>%s</info>', $key));
                foreach ($group as $i => $rec) {
                    $prefix = $i === 0 ? '  KEEP  ' : '  DELETE';
                    $type = $rec['recording_type'] ?? 'NULL';
                    $hasMeta = $rec['has_metadata'] ? 'meta' : 'no-meta';
                    $io->text(sprintf(
                        '%s %s [%s, %s, %d tracks, rating=%s, downloads=%s]',
                        $prefix,
                        $rec['identifier'],
                        $type,
                        $hasMeta,
                        $rec['track_count'],
                        $rec['avg_rating'] ?? 'NULL',
                        $rec['downloads'] ?? '0'
                    ));
                }

                $sampleCount++;
            }

            $io->newLine();
            $io->note(sprintf(
                'Dry run complete. Would delete %s recordings (%s products). Run without --dry-run to apply.',
                number_format($duplicateRecordingCount),
                number_format($productsToDelete)
            ));

            $this->updateProgress($correlationId, $totalRecordings, 0);
            return Command::SUCCESS;
        }

        // Confirmation
        if (!$force) {
            $helper = $this->getHelper('question');
            $question = new ConfirmationQuestion(
                sprintf(
                    '<question>Delete %s duplicate recordings (%s products)? This cannot be undone. [y/N]</question> ',
                    number_format($duplicateRecordingCount),
                    number_format($productsToDelete)
                ),
                false
            );

            if (!$helper->ask($input, $output, $question)) {
                $io->warning('Operation cancelled.');
                return Command::SUCCESS;
            }
        }

        // Phase 3: Delete losing recordings' products
        $io->section('Phase 3: Deleting duplicate products...');

        // Enable isSecureArea for product deletion
        $this->registry->register('isSecureArea', true, true);

        $deletedProducts = 0;
        $errorCount = 0;
        $errors = [];

        $progressBar = new ProgressBar($output, $productsToDelete);
        $progressBar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %message%');
        $progressBar->setMessage('Starting...');
        $progressBar->start();

        // Process loser identifiers in batches
        $identifierBatches = array_chunk($loserIdentifiers, $batchSize);
        $batchNum = 0;

        foreach ($identifierBatches as $identifierBatch) {
            if (!$this->shouldContinue()) {
                $io->warning('Stopped by user signal.');
                break;
            }

            $batchNum++;
            $progressBar->setMessage(sprintf('Batch %d/%d...', $batchNum, count($identifierBatches)));

            // Get entity IDs for this batch of identifiers
            $entityIds = $this->getEntityIdsByIdentifiers($identifierBatch);

            foreach ($entityIds as $entityId) {
                if (!$this->shouldContinue()) {
                    break;
                }

                try {
                    $product = $this->productRepository->getById($entityId);
                    $this->productRepository->delete($product);
                    $deletedProducts++;
                    $progressBar->advance();
                } catch (\Exception $e) {
                    $errorCount++;
                    if (count($errors) < 20) {
                        $errors[] = [
                            'entity_id' => $entityId,
                            'error' => $e->getMessage(),
                        ];
                    }
                    $progressBar->advance();
                }
            }

            gc_collect_cycles();
        }

        $progressBar->finish();
        $output->writeln('');

        // Phase 4: Clean orphaned URL rewrites
        $io->section('Phase 4: Cleaning orphaned URL rewrites...');
        $orphanedCount = $this->cleanOrphanedUrlRewrites();
        $io->text(sprintf('Removed %s orphaned URL rewrites', number_format($orphanedCount)));

        // Update progress
        $this->updateProgress($correlationId, $totalRecordings, $deletedProducts);

        // Results
        $io->section('Results');

        $io->table(['Metric', 'Count'], [
            ['Recordings removed', number_format($duplicateRecordingCount)],
            ['Products deleted', number_format($deletedProducts)],
            ['URL rewrites removed', number_format($orphanedCount)],
            ['Errors', number_format($errorCount)],
        ]);

        if (!empty($errors)) {
            $io->section('Errors (first 10)');
            foreach (array_slice($errors, 0, 10) as $error) {
                $io->text(sprintf(
                    '<error>Entity %d</error>: %s',
                    $error['entity_id'],
                    $error['error']
                ));
            }
        }

        $io->newLine();
        $io->text('<comment>Next steps:</comment>');
        $io->text('  1. bin/magento archive:backfill:recording-data --force');
        $io->text('  2. bin/fix-index');
        $io->text('  3. bin/magento cache:flush');
        $io->text('  4. bin/magento indexer:reindex');

        if ($errorCount > 0) {
            $io->warning(sprintf(
                'Deduplication completed with %d errors. %s products deleted.',
                $errorCount,
                number_format($deletedProducts)
            ));
            return Command::FAILURE;
        }

        $io->success(sprintf(
            'Deduplication complete. Removed %s duplicate recordings (%s products).',
            number_format($duplicateRecordingCount),
            number_format($deletedProducts)
        ));

        return Command::SUCCESS;
    }

    /**
     * Fetch all recordings with ranking data via direct SQL.
     *
     * Returns one row per unique identifier with aggregate stats.
     */
    private function fetchAllRecordings(?string $artistFilter): array
    {
        $connection = $this->resourceConnection->getConnection();

        $identifierAttrId = $this->getAttributeId('identifier');
        $collectionAttrId = $this->getAttributeId('archive_collection');
        $recordingTypeAttrId = $this->getAttributeId('recording_type');
        $avgRatingAttrId = $this->getAttributeId('archive_avg_rating');
        $numReviewsAttrId = $this->getAttributeId('archive_num_reviews');
        $downloadsAttrId = $this->getAttributeId('archive_downloads');

        if (!$identifierAttrId) {
            return [];
        }

        $select = $connection->select()
            ->from(
                ['cpe' => $this->resourceConnection->getTableName('catalog_product_entity')],
                [
                    'track_count' => new \Zend_Db_Expr('COUNT(cpe.entity_id)'),
                    'min_entity_id' => new \Zend_Db_Expr('MIN(cpe.entity_id)'),
                ]
            )
            ->join(
                ['iv' => $this->resourceConnection->getTableName('catalog_product_entity_varchar')],
                sprintf(
                    'cpe.entity_id = iv.entity_id AND iv.attribute_id = %d AND iv.store_id = 0',
                    $identifierAttrId
                ),
                ['identifier' => 'value']
            )
            ->where('iv.value IS NOT NULL')
            ->where('iv.value != ?', '')
            ->group('iv.value');

        // Join archive_collection (varchar — stored as plain text, not dropdown option IDs)
        if ($collectionAttrId) {
            $select->joinLeft(
                ['ac' => $this->resourceConnection->getTableName('catalog_product_entity_varchar')],
                sprintf(
                    'cpe.entity_id = ac.entity_id AND ac.attribute_id = %d AND ac.store_id = 0',
                    $collectionAttrId
                ),
                ['collection_label' => new \Zend_Db_Expr('MAX(ac.value)')]
            );

            // Filter by artist if specified (case-insensitive)
            if ($artistFilter) {
                $select->where('LOWER(ac.value) = LOWER(?)', $artistFilter);
            }
        }

        // Join recording_type
        if ($recordingTypeAttrId) {
            $select->joinLeft(
                ['rt' => $this->resourceConnection->getTableName('catalog_product_entity_varchar')],
                sprintf(
                    'cpe.entity_id = rt.entity_id AND rt.attribute_id = %d AND rt.store_id = 0',
                    $recordingTypeAttrId
                ),
                ['recording_type' => new \Zend_Db_Expr('MAX(rt.value)')]
            );
        }

        // Join avg_rating (decimal backend type)
        if ($avgRatingAttrId) {
            $select->joinLeft(
                ['ar' => $this->resourceConnection->getTableName('catalog_product_entity_decimal')],
                sprintf(
                    'cpe.entity_id = ar.entity_id AND ar.attribute_id = %d AND ar.store_id = 0',
                    $avgRatingAttrId
                ),
                ['avg_rating' => new \Zend_Db_Expr('MAX(ar.value)')]
            );
        }

        // Join num_reviews
        if ($numReviewsAttrId) {
            $select->joinLeft(
                ['anr' => $this->resourceConnection->getTableName('catalog_product_entity_int')],
                sprintf(
                    'cpe.entity_id = anr.entity_id AND anr.attribute_id = %d AND anr.store_id = 0',
                    $numReviewsAttrId
                ),
                ['num_reviews' => new \Zend_Db_Expr('MAX(COALESCE(anr.value, 0))')]
            );
        }

        // Join downloads
        if ($downloadsAttrId) {
            $select->joinLeft(
                ['ad' => $this->resourceConnection->getTableName('catalog_product_entity_int')],
                sprintf(
                    'cpe.entity_id = ad.entity_id AND ad.attribute_id = %d AND ad.store_id = 0',
                    $downloadsAttrId
                ),
                ['downloads' => new \Zend_Db_Expr('MAX(COALESCE(ad.value, 0))')]
            );
        }

        $rows = $connection->fetchAll($select);

        // Enrich with metadata check
        foreach ($rows as &$row) {
            $row['has_metadata'] = $this->metadataDownloader->isCached($row['identifier']);
            // collection_label comes directly from SQL; default to 'Unknown' if null
            if (empty($row['collection_label'])) {
                $row['collection_label'] = 'Unknown';
            }
        }
        unset($row);

        return $rows;
    }

    /**
     * Group recordings by (collection_id, show_date) extracted from identifier.
     *
     * @return array<string, array> Keyed by "collection_label | YYYY-MM-DD"
     */
    private function groupByArtistDate(array $recordings): array
    {
        $groups = [];

        foreach ($recordings as $recording) {
            $date = $this->extractDateFromIdentifier($recording['identifier']);
            if ($date === null) {
                // Can't determine date — don't touch this recording
                continue;
            }

            $collectionId = $recording['collection_id'] ?? 0;
            $collectionLabel = $recording['collection_label'] ?? 'Unknown';
            $key = $collectionLabel . ' | ' . $date;

            if (!isset($groups[$key])) {
                $groups[$key] = [];
            }

            $recording['show_date_extracted'] = $date;
            $groups[$key][] = $recording;
        }

        return $groups;
    }

    /**
     * Compare two recordings for ranking (usort callback).
     * Returns negative if $a is better, positive if $b is better.
     */
    private function compareRecordings(array $a, array $b): int
    {
        // Priority 1: recording_type (SBD > MX > FM > WEBCAST > AUD > UNKNOWN)
        $aTypePriority = self::TYPE_PRIORITY[$a['recording_type'] ?? ''] ?? 99;
        $bTypePriority = self::TYPE_PRIORITY[$b['recording_type'] ?? ''] ?? 99;
        if ($aTypePriority !== $bTypePriority) {
            return $aTypePriority <=> $bTypePriority;
        }

        // Priority 2: Identifier contains 'sbd' (fallback for unclassified)
        $aHasSbd = stripos($a['identifier'] ?? '', 'sbd') !== false;
        $bHasSbd = stripos($b['identifier'] ?? '', 'sbd') !== false;
        if ($aHasSbd !== $bHasSbd) {
            return $bHasSbd <=> $aHasSbd; // true (1) > false (0), so b-a means "has sbd" wins
        }

        // Priority 3: Has metadata JSON on disk (was selected as "best" by archive:download)
        $aHasMeta = $a['has_metadata'] ?? false;
        $bHasMeta = $b['has_metadata'] ?? false;
        if ($aHasMeta !== $bHasMeta) {
            return $bHasMeta <=> $aHasMeta;
        }

        // Priority 4: Higher avg_rating
        $aRating = (float) ($a['avg_rating'] ?? 0);
        $bRating = (float) ($b['avg_rating'] ?? 0);
        if ($aRating != $bRating) {
            return $bRating <=> $aRating;
        }

        // Priority 5: Higher num_reviews
        $aReviews = (int) ($a['num_reviews'] ?? 0);
        $bReviews = (int) ($b['num_reviews'] ?? 0);
        if ($aReviews != $bReviews) {
            return $bReviews <=> $aReviews;
        }

        // Priority 6: Higher downloads
        $aDownloads = (int) ($a['downloads'] ?? 0);
        $bDownloads = (int) ($b['downloads'] ?? 0);
        if ($aDownloads != $bDownloads) {
            return $bDownloads <=> $aDownloads;
        }

        // Priority 7: More tracks (more complete recording)
        $aTracks = (int) ($a['track_count'] ?? 0);
        $bTracks = (int) ($b['track_count'] ?? 0);
        if ($aTracks != $bTracks) {
            return $bTracks <=> $aTracks;
        }

        // Tie-breaker: Lower entity_id (older = likely from download path)
        return (int) ($a['min_entity_id'] ?? 0) <=> (int) ($b['min_entity_id'] ?? 0);
    }

    /**
     * Determine the primary reason the winner won.
     */
    private function getWinReason(array $winner): string
    {
        $type = $winner['recording_type'] ?? '';

        if ($type === RecordingTypeDetector::TYPE_SOUNDBOARD) {
            return 'SBD recording type';
        }

        if ($type === RecordingTypeDetector::TYPE_MATRIX) {
            return 'MX recording type';
        }

        if (stripos($winner['identifier'] ?? '', 'sbd') !== false) {
            return 'Identifier contains sbd';
        }

        if ($winner['has_metadata'] ?? false) {
            return 'Has metadata on disk';
        }

        if ((float) ($winner['avg_rating'] ?? 0) > 0) {
            return 'Higher avg rating';
        }

        if ((int) ($winner['num_reviews'] ?? 0) > 0) {
            return 'More reviews';
        }

        if ((int) ($winner['downloads'] ?? 0) > 0) {
            return 'More downloads';
        }

        if ((int) ($winner['track_count'] ?? 0) > 0) {
            return 'More tracks';
        }

        return 'Lowest entity_id (oldest)';
    }

    /**
     * Extract YYYY-MM-DD date from an Archive.org identifier.
     */
    private function extractDateFromIdentifier(string $identifier): ?string
    {
        if (preg_match('/(\d{4}-\d{2}-\d{2})/', $identifier, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Count all products belonging to a set of identifiers.
     */
    private function countProductsByIdentifiers(array $identifiers): int
    {
        $connection = $this->resourceConnection->getConnection();
        $identifierAttrId = $this->getAttributeId('identifier');

        if (!$identifierAttrId) {
            return 0;
        }

        // Count in batches to avoid huge IN clauses
        $total = 0;
        foreach (array_chunk($identifiers, 500) as $chunk) {
            $select = $connection->select()
                ->from(
                    ['iv' => $this->resourceConnection->getTableName('catalog_product_entity_varchar')],
                    [new \Zend_Db_Expr('COUNT(*)')]
                )
                ->where('iv.attribute_id = ?', $identifierAttrId)
                ->where('iv.store_id = 0')
                ->where('iv.value IN (?)', $chunk);

            $total += (int) $connection->fetchOne($select);
        }

        return $total;
    }

    /**
     * Get entity IDs for products belonging to a set of identifiers.
     */
    private function getEntityIdsByIdentifiers(array $identifiers): array
    {
        $connection = $this->resourceConnection->getConnection();
        $identifierAttrId = $this->getAttributeId('identifier');

        if (!$identifierAttrId) {
            return [];
        }

        $select = $connection->select()
            ->from(
                ['iv' => $this->resourceConnection->getTableName('catalog_product_entity_varchar')],
                ['entity_id']
            )
            ->where('iv.attribute_id = ?', $identifierAttrId)
            ->where('iv.store_id = 0')
            ->where('iv.value IN (?)', $identifiers);

        return $connection->fetchCol($select);
    }

    /**
     * Clean up orphaned URL rewrites (rewrites for deleted products).
     */
    private function cleanOrphanedUrlRewrites(): int
    {
        $connection = $this->resourceConnection->getConnection();
        $urlRewriteTable = $this->resourceConnection->getTableName('url_rewrite');
        $productTable = $this->resourceConnection->getTableName('catalog_product_entity');

        $query = $connection->deleteFromSelect(
            $connection->select()
                ->from($urlRewriteTable, 'url_rewrite_id')
                ->where('entity_type = ?', 'product')
                ->where(
                    'entity_id NOT IN (?)',
                    $connection->select()->from($productTable, 'entity_id')
                ),
            $urlRewriteTable
        );

        return $connection->query($query)->rowCount();
    }

    /**
     * Get EAV attribute ID by code.
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
     * Get option ID for an attribute value label (e.g., "Railroad Earth" -> 42).
     */
    private function getOptionIdForLabel(int $attributeId, string $label): ?int
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
            ->where('eaov.value = ?', $label)
            ->where('eaov.store_id = ?', 0)
            ->limit(1);

        $result = $connection->fetchOne($select);
        return $result ? (int) $result : null;
    }

    /**
     * Get all collection option_id => label mappings.
     */
    private function getCollectionLabels(int $attributeId): array
    {
        $connection = $this->resourceConnection->getConnection();

        $select = $connection->select()
            ->from(
                ['eaov' => $this->resourceConnection->getTableName('eav_attribute_option_value')],
                ['option_id', 'value']
            )
            ->join(
                ['eao' => $this->resourceConnection->getTableName('eav_attribute_option')],
                'eaov.option_id = eao.option_id',
                []
            )
            ->where('eao.attribute_id = ?', $attributeId)
            ->where('eaov.store_id = ?', 0);

        $rows = $connection->fetchAll($select);
        $labels = [];
        foreach ($rows as $row) {
            $labels[(int) $row['option_id']] = $row['value'];
        }

        return $labels;
    }

    /**
     * Override: this command should update artist stats on completion.
     */
    protected function shouldUpdateArtistStats(): bool
    {
        return false;
    }
}
