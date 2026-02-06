<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use ArchiveDotOrg\Core\Api\AttributeOptionManagerInterface;
use ArchiveDotOrg\Core\Api\Data\ShowInterface;
use ArchiveDotOrg\Core\Api\Data\TrackInterface;
use ArchiveDotOrg\Core\Api\TrackImporterInterface;
use ArchiveDotOrg\Core\Logger\Logger;
use Magento\Catalog\Api\Data\ProductInterfaceFactory;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Model\Product;
use Magento\Catalog\Model\Product\Attribute\Source\Status;
use Magento\Catalog\Model\Product\Type;
use Magento\Catalog\Model\Product\Visibility;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;

/**
 * Track Importer Implementation
 *
 * Creates and updates Magento products from Archive.org track data.
 * Uses proper dependency injection instead of ObjectManager.
 *
 * SKU Format (Fix #6):
 * ---------------------
 * Archive.org products use SHA1 hash of file path as SKU for uniqueness.
 * Format: archive-{sha1_hash}
 *
 * Example: archive-a1b2c3d4e5f6...
 *
 * The SHA1 hash is generated from the full Archive.org file path including:
 * - Show identifier (e.g., "gd1977-05-08.sbd.miller.32601")
 * - File name (e.g., "gd1977-05-08d1t01.flac")
 *
 * This ensures:
 * - Uniqueness: Each track has a unique SKU regardless of title collisions
 * - Stability: SKU doesn't change if metadata updates
 * - Traceability: Can map back to original Archive.org file
 *
 * See: TrackInterface::generateSku() for implementation details
 */
class TrackImporter implements TrackImporterInterface
{
    private ProductRepositoryInterface $productRepository;
    private ProductInterfaceFactory $productFactory;
    private AttributeOptionManagerInterface $attributeOptionManager;
    private RecordingTypeDetector $recordingTypeDetector;
    private Config $config;
    private Logger $logger;

    /**
     * @param ProductRepositoryInterface $productRepository
     * @param ProductInterfaceFactory $productFactory
     * @param AttributeOptionManagerInterface $attributeOptionManager
     * @param RecordingTypeDetector $recordingTypeDetector
     * @param Config $config
     * @param Logger $logger
     */
    public function __construct(
        ProductRepositoryInterface $productRepository,
        ProductInterfaceFactory $productFactory,
        AttributeOptionManagerInterface $attributeOptionManager,
        RecordingTypeDetector $recordingTypeDetector,
        Config $config,
        Logger $logger
    ) {
        $this->productRepository = $productRepository;
        $this->productFactory = $productFactory;
        $this->attributeOptionManager = $attributeOptionManager;
        $this->recordingTypeDetector = $recordingTypeDetector;
        $this->config = $config;
        $this->logger = $logger;
    }

    /**
     * @inheritDoc
     */
    public function importTrack(
        TrackInterface $track,
        ShowInterface $show,
        string $artistName,
        ?int $existingProductId = null,
        array $formatTracks = []
    ): int {
        $sku = $track->generateSku();

        if (empty($sku)) {
            throw new LocalizedException(
                __('Cannot import track without SHA1 hash: %1', $track->getTitle())
            );
        }

        // Only look up product ID if not provided (optimization for bulk imports)
        if ($existingProductId === null) {
            $existingProductId = $this->getProductIdBySku($sku);
        }
        $isUpdate = $existingProductId !== null;

        try {
            if ($isUpdate) {
                // Get product with store_id = 0 (admin/global scope) to ensure attributes save globally
                $product = $this->productRepository->getById($existingProductId, false, 0);
            } else {
                /** @var Product $product */
                $product = $this->productFactory->create();
                $this->initializeNewProduct($product, $sku);
            }

            // Ensure store_id is set to 0 for global scope attributes
            $product->setStoreId(0);

            // Set product data from track and show
            $this->setProductData($product, $track, $show, $artistName, $formatTracks);

            // Save the product
            $savedProduct = $this->productRepository->save($product);

            // Log appropriately based on whether this was create or update
            if ($isUpdate) {
                $this->logger->debug("Updated product: {$sku} - {$track->getTitle()}");
            } else {
                $this->logger->logTrackCreated($sku, $track->getTitle());
            }

            return (int) $savedProduct->getId();
        } catch (\Exception $e) {
            $previousError = $e->getPrevious() ? $e->getPrevious()->getMessage() : 'none';
            $this->logger->logImportError('Failed to import track', [
                'sku' => $sku,
                'title' => $track->getTitle(),
                'error' => $e->getMessage(),
                'previous' => $previousError,
                'trace' => $e->getTraceAsString()
            ]);
            throw new LocalizedException(
                __('Failed to import track %1: %2', $sku, $e->getMessage()),
                $e
            );
        }
    }

    /**
     * @inheritDoc
     */
    public function importShowTracks(ShowInterface $show, string $artistName): array
    {
        $result = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'product_ids' => []
        ];

        $tracks = $show->getTracks();

        // Group tracks by base filename to collect all quality variations
        $tracksByBasename = $this->groupTracksByBasename($tracks);

        foreach ($tracksByBasename as $basename => $formatTracks) {
            try {
                // Use the first track for SKU generation and metadata
                $primaryTrack = $formatTracks[0];
                $sku = $primaryTrack->generateSku();

                if (empty($sku)) {
                    $result['skipped']++;
                    continue;
                }

                // Get product ID once and pass to importTrack to avoid double query
                $existingProductId = $this->getProductIdBySku($sku);
                $isUpdate = $existingProductId !== null;

                // Pass all format tracks to build multi-quality URLs
                $productId = $this->importTrack($primaryTrack, $show, $artistName, $existingProductId, $formatTracks);
                $result['product_ids'][] = $productId;

                if ($isUpdate) {
                    $result['updated']++;
                } else {
                    $result['created']++;
                }
            } catch (\Exception $e) {
                $this->logger->logImportError('Track import failed', [
                    'show' => $show->getIdentifier(),
                    'track' => $primaryTrack->getTitle() ?? $basename,
                    'error' => $e->getMessage()
                ]);
                $result['skipped']++;
            }
        }

        return $result;
    }

    /**
     * @inheritDoc
     */
    public function productExists(string $sku): bool
    {
        return $this->getProductIdBySku($sku) !== null;
    }

    /**
     * @inheritDoc
     */
    public function getProductIdBySku(string $sku): ?int
    {
        try {
            $product = $this->productRepository->get($sku);
            return (int) $product->getId();
        } catch (NoSuchEntityException $e) {
            return null;
        }
    }

    /**
     * Initialize a new product with default values
     *
     * @param Product $product
     * @param string $sku
     * @return void
     */
    private function initializeNewProduct(Product $product, string $sku): void
    {
        $product->setSku($sku);
        $product->setTypeId(Type::TYPE_VIRTUAL);
        $product->setAttributeSetId($this->config->getAttributeSetId());
        $product->setStatus(Status::STATUS_ENABLED);
        $product->setVisibility(Visibility::VISIBILITY_BOTH);
        $product->setPrice(0);
        $product->setWebsiteIds([$this->config->getDefaultWebsiteId()]);
        $product->setStoreId(0);

        // Stock data for virtual product
        $product->setStockData([
            'use_config_manage_stock' => 0,
            'manage_stock' => 0,
            'is_in_stock' => 1
        ]);
    }

    /**
     * Set product data from track and show
     *
     * @param Product $product
     * @param TrackInterface $track
     * @param ShowInterface $show
     * @param string $artistName
     * @param array $formatTracks
     * @return void
     * @throws LocalizedException
     */
    private function setProductData(
        Product $product,
        TrackInterface $track,
        ShowInterface $show,
        string $artistName,
        array $formatTracks = []
    ): void {
        // Generate name: Artist Title Year Venue
        $name = sprintf(
            '%s %s %s %s',
            $artistName,
            $track->getTitle(),
            $show->getYear() ?? '',
            $show->getVenue() ?? ''
        );
        $product->setName(trim($name));

        // URL key
        $product->setUrlKey($track->generateUrlKey());

        // Description
        $product->setDescription($show->getDescription() ?? '');

        // Track-specific attributes
        $product->setData('title', $track->getTitle());
        $product->setData('length', $this->formatTrackLength($track->getLength()));
        $product->setData('album_track', $track->getTrackNumber());
        $product->setData('show_source', $show->getSource());

        // Extended track attributes
        $product->setData('track_md5', $track->getMd5());
        $product->setData('track_acoustid', $track->getAcoustid());
        $product->setData('track_bitrate', $track->getBitrate());

        // Show-specific attributes
        $product->setData('identifier', $show->getIdentifier());
        $product->setData('show_name', $show->getTitle());
        $product->setData('dir', $show->getDir());
        $product->setData('server_one', $show->getServerOne() ?? 'not stored');
        $product->setData('server_two', $show->getServerTwo() ?? 'not stored');
        $product->setData('notes', $show->getNotes() ?? 'not stored');
        $product->setData('lineage', $show->getLineage() ?? 'not stored');
        $product->setData('show_date', $show->getDate());
        $product->setData('pub_date', $show->getPubDate());
        $product->setData('guid', $show->getGuid());

        // Extended show attributes
        $product->setData('show_files_count', $show->getFilesCount());
        $product->setData('show_total_size', $show->getItemSize());
        $product->setData('show_uploader', $show->getUploader());

        // Convert timestamps to datetime format for Magento
        if ($show->getCreatedTimestamp()) {
            $product->setData('show_created_date', date('Y-m-d H:i:s', $show->getCreatedTimestamp()));
        }
        if ($show->getLastUpdatedTimestamp()) {
            $product->setData('show_last_updated', date('Y-m-d H:i:s', $show->getLastUpdatedTimestamp()));
        }

        // Recording restriction and classification attributes
        $isStreamable = !$show->isAccessRestricted();
        $product->setData('is_streamable', $isStreamable ? 1 : 0);

        if (!$isStreamable) {
            $product->setData('access_restriction', 'stream_only');
        }

        $recordingType = $this->recordingTypeDetector->detect(
            $show->getSource(),
            $show->getLineage(),
            $show->getSubjectTags()
        );
        $product->setData('recording_type', $recordingType);

        $identifier = $show->getIdentifier();
        if ($identifier) {
            $product->setData('archive_detail_url', 'https://archive.org/details/' . $identifier);
        }

        $licenseUrl = $show->getLicenseUrl();
        if ($licenseUrl) {
            $product->setData('archive_license_url', $licenseUrl);
        }

        // Build multi-quality song URLs
        if ($show->getServerOne() && $show->getDir()) {
            if (!empty($formatTracks)) {
                // Build JSON with all available quality URLs
                $qualityUrls = $this->buildMultiQualityUrls($formatTracks, $show);
                $product->setData('song_urls', json_encode($qualityUrls, JSON_UNESCAPED_SLASHES));

                // Keep legacy song_url for backward compatibility (use highest quality)
                if (isset($qualityUrls['high'])) {
                    $product->setData('song_url', $qualityUrls['high']['url']);
                } elseif (isset($qualityUrls['medium'])) {
                    $product->setData('song_url', $qualityUrls['medium']['url']);
                } elseif (isset($qualityUrls['low'])) {
                    $product->setData('song_url', $qualityUrls['low']['url']);
                }
            } else {
                // Fallback for single track (backward compatibility)
                $filename = $this->getFilenameWithoutExtension($track->getName()) . '.' . $track->getFormat();
                $songUrl = $this->config->buildStreamingUrl(
                    $show->getServerOne(),
                    $show->getDir(),
                    $filename
                );
                $product->setData('song_url', $songUrl);
            }
        }

        // Dropdown attributes (using AttributeOptionManager)
        $this->setDropdownAttribute($product, 'show_year', $show->getYear());
        $this->setDropdownAttribute($product, 'show_venue', $show->getVenue());
        $this->setDropdownAttribute($product, 'show_taper', $show->getTaper());
        $this->setDropdownAttribute($product, 'show_transferer', $show->getTransferer());
        $this->setDropdownAttribute($product, 'show_location', $show->getCoverage());
        $this->setDropdownAttribute($product, 'archive_collection', $artistName);

        // Archive.org rating attributes
        $avgRating = $show->getAvgRating();
        if ($avgRating !== null) {
            $product->setData('archive_avg_rating', $avgRating);
        }
        $product->setData('archive_num_reviews', $show->getNumReviews() ?? 0);

        // SEO Meta Fields with null safety
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

        $metaKeyword = implode(', ', array_filter([
            $artistName,
            $trackTitle,
            $showVenue,
            $showYear,
            'live concert',
            'free streaming'
        ]));

        // Use magic setters for proper EAV attribute handling
        $product->setMetaTitle($this->truncateToLength($metaTitle, 70));
        $product->setMetaDescription($this->truncateToLength($metaDescription, 160));
        $product->setMetaKeyword($metaKeyword);
    }

    /**
     * Set a dropdown attribute value
     *
     * @param Product $product
     * @param string $attributeCode
     * @param string|null $value
     * @return void
     */
    private function setDropdownAttribute(Product $product, string $attributeCode, ?string $value): void
    {
        if ($value === null || trim($value) === '') {
            return;
        }

        try {
            $optionId = $this->attributeOptionManager->getOrCreateOptionId($attributeCode, $value);
            $product->setData($attributeCode, $optionId);
        } catch (\Exception $e) {
            $this->logger->debug('Failed to set dropdown attribute', [
                'attribute' => $attributeCode,
                'value' => $value,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get filename without extension
     *
     * @param string $filename
     * @return string
     */
    private function getFilenameWithoutExtension(string $filename): string
    {
        $pos = strrpos($filename, '.');
        if ($pos === false) {
            return $filename;
        }

        return substr($filename, 0, $pos);
    }

    /**
     * Format track length from seconds to MM:SS or H:MM:SS
     *
     * @param string|null $seconds
     * @return string|null
     */
    private function formatTrackLength(?string $seconds): ?string
    {
        if ($seconds === null || !is_numeric($seconds)) {
            return $seconds;
        }

        $totalSeconds = (int) floor((float) $seconds);
        $hours = (int) floor($totalSeconds / 3600);
        $minutes = (int) floor(($totalSeconds % 3600) / 60);
        $secs = $totalSeconds % 60;

        if ($hours > 0) {
            return sprintf('%d:%02d:%02d', $hours, $minutes, $secs);
        }

        return sprintf('%d:%02d', $minutes, $secs);
    }

    /**
     * Group tracks by base filename (without extension)
     *
     * @param TrackInterface[] $tracks
     * @return array<string, TrackInterface[]>
     */
    private function groupTracksByBasename(array $tracks): array
    {
        $grouped = [];

        foreach ($tracks as $track) {
            $basename = $this->getFilenameWithoutExtension($track->getName());
            if (!isset($grouped[$basename])) {
                $grouped[$basename] = [];
            }
            $grouped[$basename][] = $track;
        }

        return $grouped;
    }

    /**
     * Build multi-quality URLs from format tracks
     *
     * @param TrackInterface[] $formatTracks
     * @param ShowInterface $show
     * @return array
     */
    private function buildMultiQualityUrls(array $formatTracks, ShowInterface $show): array
    {
        $qualityUrls = [];

        foreach ($formatTracks as $track) {
            $format = $track->getFormat();
            $filename = $track->getName();

            $url = $this->config->buildStreamingUrl(
                $show->getServerOne(),
                $show->getDir(),
                $filename
            );

            $quality = $this->determineQualityTier($format, $track->getFileSize());

            $qualityUrls[$quality] = [
                'url' => $url,
                'format' => $format,
                'bitrate' => $this->estimateBitrate($format, $track->getFileSize(), $track->getLength()),
                'size_mb' => $track->getFileSize() ? round($track->getFileSize() / 1024 / 1024, 1) : null
            ];
        }

        return $qualityUrls;
    }

    /**
     * Determine quality tier based on format and file size
     *
     * @param string $format
     * @param int|null $fileSize
     * @return string
     */
    private function determineQualityTier(string $format, ?int $fileSize): string
    {
        // FLAC is always high quality
        if ($format === 'flac') {
            return 'high';
        }

        // For MP3, estimate bitrate from file size
        // Rough estimate: 320kbps ~= 10MB per 3-min track, 128kbps ~= 4MB
        if ($format === 'mp3' && $fileSize) {
            $mbPerMinute = ($fileSize / 1024 / 1024) / 3; // Assume ~3 min tracks
            return $mbPerMinute >= 3 ? 'medium' : 'low';
        }

        // Default to medium for OGG and unknown
        return 'medium';
    }

    /**
     * Estimate bitrate based on format, file size, and length
     *
     * @param string $format
     * @param int|null $fileSize
     * @param string|null $length
     * @return string
     */
    private function estimateBitrate(string $format, ?int $fileSize, ?string $length): string
    {
        if ($format === 'flac') {
            return 'lossless';
        }

        if ($fileSize && $length && is_numeric($length)) {
            // Calculate kbps: (fileSize in bytes * 8) / (length in seconds * 1000)
            $kbps = (int) (($fileSize * 8) / ((float) $length * 1000));

            // Round to common bitrates
            if ($kbps >= 280) {
                return '320k';
            } elseif ($kbps >= 200) {
                return '256k';
            } elseif ($kbps >= 160) {
                return '192k';
            } else {
                return '128k';
            }
        }

        // Default estimates based on format
        return $format === 'mp3' ? '256k' : '192k';
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

        // Only break at space if it's not too far back (>75% of max length)
        if ($lastSpace !== false && $lastSpace > $maxLength * 0.75) {
            return mb_substr($truncated, 0, $lastSpace) . '...';
        }

        return $truncated . '...';
    }
}
