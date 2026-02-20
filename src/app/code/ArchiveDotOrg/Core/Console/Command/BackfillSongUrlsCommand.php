<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use ArchiveDotOrg\Core\Logger\Logger;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\Serialize\Serializer\Json;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Backfill song_urls attribute for existing products from cached metadata JSON.
 *
 * Reads Archive.org metadata files, finds all audio format variants (FLAC, MP3, OGG)
 * for each track, and populates the song_urls JSON attribute via direct SQL.
 */
class BackfillSongUrlsCommand extends Command
{
    private const METADATA_BASE_PATH = '/var/www/html/var/archivedotorg/metadata';
    private const SUPPORTED_FORMATS = ['flac', 'mp3', 'ogg'];

    private ResourceConnection $resourceConnection;
    private Json $jsonSerializer;
    private Logger $logger;

    public function __construct(
        ResourceConnection $resourceConnection,
        Json $jsonSerializer,
        Logger $logger
    ) {
        $this->resourceConnection = $resourceConnection;
        $this->jsonSerializer = $jsonSerializer;
        $this->logger = $logger;
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->setName('archive:backfill:song-urls')
            ->setDescription('Backfill song_urls multi-quality JSON from cached metadata')
            ->addOption('artist', null, InputOption::VALUE_OPTIONAL, 'Process single artist folder name')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Report what would be updated without writing')
            ->addOption('batch-size', null, InputOption::VALUE_OPTIONAL, 'SQL batch size', '500');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $artistFilter = $input->getOption('artist');
        $dryRun = $input->getOption('dry-run');
        $batchSize = (int) $input->getOption('batch-size');

        $output->writeln('<info>Backfill song_urls from cached metadata</info>');
        if ($dryRun) {
            $output->writeln('<comment>DRY RUN - no database changes will be made</comment>');
        }

        // Resolve artist folder name if display name given
        $artistFolders = $this->getArtistFolders($artistFilter);

        if (empty($artistFolders)) {
            $output->writeln('<error>No artist metadata folders found</error>');
            return Command::FAILURE;
        }

        $output->writeln(sprintf('Processing %d artist(s)...', count($artistFolders)));

        // Get song_urls attribute ID once
        $songUrlsAttrId = $this->getAttributeId('song_urls');
        $songUrlAttrId = $this->getAttributeId('song_url');

        if (!$songUrlsAttrId) {
            $output->writeln('<error>song_urls attribute not found in EAV</error>');
            return Command::FAILURE;
        }

        $totalUpdated = 0;
        $totalSkipped = 0;
        $totalNoProduct = 0;

        foreach ($artistFolders as $folder) {
            $output->writeln(sprintf("\n<info>Artist: %s</info>", $folder));
            $metadataPath = self::METADATA_BASE_PATH . '/' . $folder;
            $jsonFiles = glob($metadataPath . '/*.json');

            if (empty($jsonFiles)) {
                $output->writeln('  No metadata files found, skipping');
                continue;
            }

            $output->writeln(sprintf('  %d show metadata files', count($jsonFiles)));

            // Collect all updates for this artist: sha1 => song_urls JSON
            $updates = [];

            foreach ($jsonFiles as $jsonFile) {
                $data = $this->parseMetadataFile($jsonFile);
                if ($data === null) {
                    continue;
                }

                $server = $data['d1'] ?? null;
                $dir = $data['dir'] ?? null;

                if (!$server || !$dir) {
                    continue;
                }

                $files = $data['files'] ?? [];
                $audioByBasename = $this->groupAudioByBasename($files);

                foreach ($audioByBasename as $basename => $formats) {
                    // Find the FLAC file - its sha1 is the product SKU
                    $flacFile = null;
                    foreach ($formats as $f) {
                        if (strtolower(pathinfo($f['name'], PATHINFO_EXTENSION)) === 'flac') {
                            $flacFile = $f;
                            break;
                        }
                    }

                    if (!$flacFile || empty($flacFile['sha1'])) {
                        continue;
                    }

                    $sku = $flacFile['sha1'];
                    $qualityUrls = $this->buildQualityUrls($formats, $server, $dir);

                    if (!empty($qualityUrls)) {
                        $updates[$sku] = $qualityUrls;
                    }
                }
            }

            $output->writeln(sprintf('  %d tracks with multi-quality URLs', count($updates)));

            if (empty($updates)) {
                continue;
            }

            // Batch-lookup entity IDs by SKU
            $skus = array_keys($updates);
            $skuToEntityId = $this->batchLookupSkus($skus, $batchSize);

            $matched = count($skuToEntityId);
            $unmatched = count($skus) - $matched;
            $output->writeln(sprintf('  %d matched products, %d no product found', $matched, $unmatched));
            $totalNoProduct += $unmatched;

            if ($dryRun) {
                $totalUpdated += $matched;
                // Show a sample
                $sample = array_slice($updates, 0, 2, true);
                foreach ($sample as $sha1 => $urls) {
                    $output->writeln(sprintf('  Sample: %s', substr($sha1, 0, 12) . '...'));
                    foreach ($urls as $tier => $info) {
                        $output->writeln(sprintf('    %s: %s (%s)', $tier, basename($info['url']), $info['format']));
                    }
                }
                continue;
            }

            // Batch upsert song_urls and update song_url (legacy)
            $batch = [];
            foreach ($skuToEntityId as $sku => $entityId) {
                $qualityUrls = $updates[$sku];
                $songUrlsJson = json_encode($qualityUrls, JSON_UNESCAPED_SLASHES);

                $batch[] = [
                    'entity_id' => $entityId,
                    'song_urls_json' => $songUrlsJson,
                    'song_url' => $this->pickBestUrl($qualityUrls),
                ];

                if (count($batch) >= $batchSize) {
                    $this->flushBatch($batch, $songUrlsAttrId, $songUrlAttrId);
                    $totalUpdated += count($batch);
                    $batch = [];
                }
            }

            // Flush remaining
            if (!empty($batch)) {
                $this->flushBatch($batch, $songUrlsAttrId, $songUrlAttrId);
                $totalUpdated += count($batch);
            }

            $output->writeln(sprintf('  Updated %d products', $matched));
        }

        $output->writeln(sprintf(
            "\n<info>Done.</info> Updated: %d | Skipped (no product): %d",
            $totalUpdated,
            $totalNoProduct
        ));

        return Command::SUCCESS;
    }

    /**
     * Get artist folder names from metadata directory
     */
    private function getArtistFolders(?string $artistFilter): array
    {
        if ($artistFilter) {
            // Try exact folder name first
            $path = self::METADATA_BASE_PATH . '/' . $artistFilter;
            if (is_dir($path)) {
                return [$artistFilter];
            }

            // Try case-insensitive match by scanning directory
            $all = $this->scanMetadataDir();
            $filterLower = strtolower(str_replace(' ', '', $artistFilter));
            foreach ($all as $folder) {
                if (strtolower($folder) === $filterLower) {
                    return [$folder];
                }
            }

            // Try matching display name (e.g., "Railroad Earth" -> "RailroadEarth")
            $normalized = str_replace(' ', '', $artistFilter);
            if (is_dir(self::METADATA_BASE_PATH . '/' . $normalized)) {
                return [$normalized];
            }

            return [];
        }

        return $this->scanMetadataDir();
    }

    private function scanMetadataDir(): array
    {
        $dirs = glob(self::METADATA_BASE_PATH . '/*', GLOB_ONLYDIR);
        return array_map('basename', $dirs ?: []);
    }

    /**
     * Parse a metadata JSON file
     */
    private function parseMetadataFile(string $path): ?array
    {
        $content = @file_get_contents($path);
        if ($content === false) {
            return null;
        }

        try {
            $data = $this->jsonSerializer->unserialize($content);
            return is_array($data) ? $data : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Group audio files by basename (filename without extension)
     *
     * @return array<string, array[]> basename => [file_data, ...]
     */
    private function groupAudioByBasename(array $files): array
    {
        $grouped = [];

        foreach ($files as $file) {
            $name = $file['name'] ?? '';
            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

            if (!in_array($ext, self::SUPPORTED_FORMATS)) {
                continue;
            }

            $basename = pathinfo($name, PATHINFO_FILENAME);
            $grouped[$basename][] = $file;
        }

        return $grouped;
    }

    /**
     * Build quality URL tiers from format variants
     */
    private function buildQualityUrls(array $formats, string $server, string $dir): array
    {
        $qualityUrls = [];

        foreach ($formats as $file) {
            $name = $file['name'] ?? '';
            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            $url = sprintf('https://%s%s/%s', $server, $dir, $name);

            $fileSize = isset($file['size']) ? (int) $file['size'] : null;
            $length = $file['length'] ?? null;

            $tier = $this->determineQualityTier($ext, $fileSize, $length);
            $bitrate = $this->estimateBitrate($ext, $fileSize, $length);

            // Only keep the first (best) file for each tier
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
     * Determine quality tier based on format and file characteristics
     */
    private function determineQualityTier(string $ext, ?int $fileSize, ?string $length): string
    {
        if ($ext === 'flac') {
            return 'high';
        }

        if ($ext === 'mp3' && $fileSize) {
            // Parse length - could be "376.49" (seconds) or "06:16" (MM:SS)
            $seconds = $this->parseLength($length);
            $minutes = $seconds > 0 ? $seconds / 60 : 3;
            $mbPerMinute = ($fileSize / 1024 / 1024) / $minutes;
            // Archive.org VBR MP3s are typically 160-220kbps (~1.2-1.7 MB/min)
            // Any reasonable-quality MP3 >= 1 MB/min (~128kbps) is "medium"
            return $mbPerMinute >= 1 ? 'medium' : 'low';
        }

        // OGG defaults to medium
        return 'medium';
    }

    /**
     * Estimate bitrate string
     */
    private function estimateBitrate(string $ext, ?int $fileSize, ?string $length): string
    {
        if ($ext === 'flac') {
            return 'lossless';
        }

        $seconds = $this->parseLength($length);

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
     * Parse length that could be seconds ("376.49") or MM:SS ("06:16")
     */
    private function parseLength(?string $length): float
    {
        if ($length === null) {
            return 0;
        }

        // If it contains a colon, it's MM:SS or H:MM:SS
        if (str_contains($length, ':')) {
            $parts = explode(':', $length);
            if (count($parts) === 2) {
                return (float) $parts[0] * 60 + (float) $parts[1];
            }
            if (count($parts) === 3) {
                return (float) $parts[0] * 3600 + (float) $parts[1] * 60 + (float) $parts[2];
            }
        }

        // Otherwise it's seconds as float
        return is_numeric($length) ? (float) $length : 0;
    }

    /**
     * Pick the best URL for legacy song_url (prefer medium MP3, then low, then high FLAC)
     */
    private function pickBestUrl(array $qualityUrls): ?string
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
     * Batch lookup SKU (sha1) -> entity_id
     *
     * @return array<string, int> sku => entity_id
     */
    private function batchLookupSkus(array $skus, int $batchSize): array
    {
        $connection = $this->resourceConnection->getConnection();
        $table = $this->resourceConnection->getTableName('catalog_product_entity');
        $result = [];

        foreach (array_chunk($skus, $batchSize) as $batch) {
            $select = $connection->select()
                ->from($table, ['sku', 'entity_id'])
                ->where('sku IN (?)', $batch);

            foreach ($connection->fetchPairs($select) as $sku => $entityId) {
                $result[$sku] = (int) $entityId;
            }
        }

        return $result;
    }

    /**
     * Get EAV attribute ID by code
     */
    private function getAttributeId(string $attributeCode): ?int
    {
        $connection = $this->resourceConnection->getConnection();
        $select = $connection->select()
            ->from($this->resourceConnection->getTableName('eav_attribute'), ['attribute_id'])
            ->where('attribute_code = ?', $attributeCode)
            ->where('entity_type_id = ?', 4); // catalog_product

        $id = $connection->fetchOne($select);
        return $id ? (int) $id : null;
    }

    /**
     * Flush a batch of updates to the database
     */
    private function flushBatch(array $batch, int $songUrlsAttrId, ?int $songUrlAttrId): void
    {
        $connection = $this->resourceConnection->getConnection();
        $textTable = $this->resourceConnection->getTableName('catalog_product_entity_text');
        $varcharTable = $this->resourceConnection->getTableName('catalog_product_entity_varchar');

        // Upsert song_urls (text attribute)
        foreach ($batch as $item) {
            $connection->insertOnDuplicate(
                $textTable,
                [
                    'attribute_id' => $songUrlsAttrId,
                    'store_id' => 0,
                    'entity_id' => $item['entity_id'],
                    'value' => $item['song_urls_json'],
                ],
                ['value']
            );

            // Also update legacy song_url (varchar) to best available MP3
            if ($songUrlAttrId && $item['song_url']) {
                $connection->insertOnDuplicate(
                    $varcharTable,
                    [
                        'attribute_id' => $songUrlAttrId,
                        'store_id' => 0,
                        'entity_id' => $item['entity_id'],
                        'value' => $item['song_url'],
                    ],
                    ['value']
                );
            }
        }
    }
}
