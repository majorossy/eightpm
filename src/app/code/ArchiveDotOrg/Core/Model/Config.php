<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;

/**
 * Configuration wrapper for Archive.org module settings
 */
class Config
{
    private const XML_PATH_ENABLED = 'archivedotorg/general/enabled';
    private const XML_PATH_DEBUG = 'archivedotorg/general/debug';
    private const XML_PATH_BASE_URL = 'archivedotorg/api/base_url';
    private const XML_PATH_TIMEOUT = 'archivedotorg/api/timeout';
    private const XML_PATH_RETRY_ATTEMPTS = 'archivedotorg/api/retry_attempts';
    private const XML_PATH_RETRY_DELAY = 'archivedotorg/api/retry_delay';
    private const XML_PATH_BATCH_SIZE = 'archivedotorg/import/batch_size';
    private const XML_PATH_AUDIO_FORMAT = 'archivedotorg/import/audio_format';
    private const XML_PATH_IMPORT_IMAGES = 'archivedotorg/import/import_images';
    private const XML_PATH_ARTIST_MAPPINGS = 'archivedotorg/mappings/artist_mappings';
    private const XML_PATH_CRON_ENABLED = 'archivedotorg/cron/enabled';
    private const XML_PATH_CRON_SCHEDULE = 'archivedotorg/cron/schedule';
    private const XML_PATH_ATTRIBUTE_SET_ID = 'archivedotorg/import/attribute_set_id';
    private const XML_PATH_DEFAULT_WEBSITE_ID = 'archivedotorg/import/default_website_id';

    // API optimization settings
    private const XML_PATH_PAGE_SIZE = 'archivedotorg/api/page_size';
    private const XML_PATH_RATE_LIMIT_MS = 'archivedotorg/api/rate_limit_ms';
    private const XML_PATH_CACHE_ENABLED = 'archivedotorg/api/cache_enabled';
    private const XML_PATH_CACHE_TTL = 'archivedotorg/api/cache_ttl';
    private const XML_PATH_CONCURRENCY = 'archivedotorg/api/concurrency';
    private const XML_PATH_CIRCUIT_THRESHOLD = 'archivedotorg/api/circuit_threshold';
    private const XML_PATH_CIRCUIT_RESET_SEC = 'archivedotorg/api/circuit_reset_sec';

    private ScopeConfigInterface $scopeConfig;

    /**
     * @param ScopeConfigInterface $scopeConfig
     */
    public function __construct(ScopeConfigInterface $scopeConfig)
    {
        $this->scopeConfig = $scopeConfig;
    }

    /**
     * Check if module is enabled
     *
     * @return bool
     */
    public function isEnabled(): bool
    {
        return $this->scopeConfig->isSetFlag(
            self::XML_PATH_ENABLED,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Check if debug mode is enabled
     *
     * @return bool
     */
    public function isDebugEnabled(): bool
    {
        return $this->scopeConfig->isSetFlag(
            self::XML_PATH_DEBUG,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Get Archive.org base URL
     *
     * @return string
     */
    public function getBaseUrl(): string
    {
        return (string) $this->scopeConfig->getValue(
            self::XML_PATH_BASE_URL,
            ScopeInterface::SCOPE_STORE
        ) ?: 'https://archive.org';
    }

    /**
     * Get API timeout in seconds
     *
     * @return int
     */
    public function getTimeout(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_TIMEOUT,
            ScopeInterface::SCOPE_STORE
        ) ?: 30;
    }

    /**
     * Get number of retry attempts for failed API calls
     *
     * @return int
     */
    public function getRetryAttempts(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_RETRY_ATTEMPTS,
            ScopeInterface::SCOPE_STORE
        ) ?: 3;
    }

    /**
     * Get delay between retries in milliseconds
     *
     * @return int
     */
    public function getRetryDelay(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_RETRY_DELAY,
            ScopeInterface::SCOPE_STORE
        ) ?: 1000;
    }

    /**
     * Get batch size for processing
     *
     * @return int
     */
    public function getBatchSize(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_BATCH_SIZE,
            ScopeInterface::SCOPE_STORE
        ) ?: 100;
    }

    /**
     * Get preferred audio format
     *
     * @return string
     */
    public function getAudioFormat(): string
    {
        return (string) $this->scopeConfig->getValue(
            self::XML_PATH_AUDIO_FORMAT,
            ScopeInterface::SCOPE_STORE
        ) ?: 'flac';
    }

    /**
     * Check if images should be imported
     *
     * @return bool
     */
    public function shouldImportImages(): bool
    {
        return $this->scopeConfig->isSetFlag(
            self::XML_PATH_IMPORT_IMAGES,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Get artist to collection mappings
     *
     * @return array
     */
    public function getArtistMappings(): array
    {
        $value = $this->scopeConfig->getValue(
            self::XML_PATH_ARTIST_MAPPINGS,
            ScopeInterface::SCOPE_STORE
        );

        if (empty($value)) {
            return [];
        }

        // Handle serialized array from admin config
        if (is_string($value)) {
            try {
                $decoded = json_decode($value, true);
                return is_array($decoded) ? $decoded : [];
            } catch (\Exception $e) {
                return [];
            }
        }

        return is_array($value) ? $value : [];
    }

    /**
     * Get collection ID for an artist name
     *
     * @param string $artistName
     * @return string|null
     */
    public function getCollectionIdForArtist(string $artistName): ?string
    {
        $mappings = $this->getArtistMappings();

        foreach ($mappings as $mapping) {
            if (isset($mapping['artist_name']) && $mapping['artist_name'] === $artistName) {
                return $mapping['collection_id'] ?? null;
            }
        }

        return null;
    }

    /**
     * Check if cron is enabled
     *
     * @return bool
     */
    public function isCronEnabled(): bool
    {
        return $this->scopeConfig->isSetFlag(
            self::XML_PATH_CRON_ENABLED,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Get cron schedule expression
     *
     * @return string
     */
    public function getCronSchedule(): string
    {
        return (string) $this->scopeConfig->getValue(
            self::XML_PATH_CRON_SCHEDULE,
            ScopeInterface::SCOPE_STORE
        ) ?: '0 2 * * *';
    }

    /**
     * Get product attribute set ID
     *
     * @return int
     */
    public function getAttributeSetId(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_ATTRIBUTE_SET_ID,
            ScopeInterface::SCOPE_STORE
        ) ?: 9;
    }

    /**
     * Get default website ID
     *
     * @return int
     */
    public function getDefaultWebsiteId(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_DEFAULT_WEBSITE_ID,
            ScopeInterface::SCOPE_STORE
        ) ?: 1;
    }

    /**
     * Get API page size for identifier fetching
     *
     * @return int
     */
    public function getPageSize(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_PAGE_SIZE,
            ScopeInterface::SCOPE_STORE
        ) ?: 500;
    }

    /**
     * Get rate limit delay in milliseconds
     *
     * @return int
     */
    public function getRateLimitMs(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_RATE_LIMIT_MS,
            ScopeInterface::SCOPE_STORE
        ) ?: 100;
    }

    /**
     * Check if API response caching is enabled
     *
     * @return bool
     */
    public function isCacheEnabled(): bool
    {
        $value = $this->scopeConfig->getValue(
            self::XML_PATH_CACHE_ENABLED,
            ScopeInterface::SCOPE_STORE
        );
        // Default to true if not set
        return $value === null ? true : (bool) $value;
    }

    /**
     * Get cache TTL in seconds
     *
     * @return int
     */
    public function getCacheTtl(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_CACHE_TTL,
            ScopeInterface::SCOPE_STORE
        ) ?: 86400; // 24 hours default
    }

    /**
     * Get max concurrent API requests
     *
     * @return int
     */
    public function getConcurrency(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_CONCURRENCY,
            ScopeInterface::SCOPE_STORE
        ) ?: 5;
    }

    /**
     * Get circuit breaker failure threshold
     *
     * @return int
     */
    public function getCircuitThreshold(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_CIRCUIT_THRESHOLD,
            ScopeInterface::SCOPE_STORE
        ) ?: 5;
    }

    /**
     * Get circuit breaker reset timeout in seconds
     *
     * @return int
     */
    public function getCircuitResetSeconds(): int
    {
        return (int) $this->scopeConfig->getValue(
            self::XML_PATH_CIRCUIT_RESET_SEC,
            ScopeInterface::SCOPE_STORE
        ) ?: 30;
    }

    /**
     * Build search URL for a collection
     *
     * @param string $collectionId
     * @param int $rows
     * @return string
     * @deprecated Use buildPaginatedSearchUrl() for efficient server-side pagination
     */
    public function buildSearchUrl(string $collectionId, int $rows = 999999): string
    {
        return sprintf(
            '%s/advancedsearch.php?q=Collection%%3A%s&fl[]=identifier&sort[]=&sort[]=&sort[]=&rows=%d&page=1&output=json',
            $this->getBaseUrl(),
            urlencode($collectionId),
            $rows
        );
    }

    /**
     * Build paginated search URL for a collection
     *
     * Uses Archive.org's native pagination to fetch only the requested page of results,
     * avoiding the need to download all identifiers and slice in PHP.
     *
     * @param string $collectionId
     * @param int $rows Number of results per page (max 10000)
     * @param int $page Page number (1-indexed)
     * @return string
     */
    public function buildPaginatedSearchUrl(string $collectionId, int $rows, int $page = 1): string
    {
        // Archive.org API limits rows to 10000 per request
        $rows = min($rows, 10000);
        $page = max(1, $page);

        return sprintf(
            '%s/advancedsearch.php?q=Collection%%3A%s&fl[]=identifier&sort[]=&sort[]=&sort[]=&rows=%d&page=%d&output=json',
            $this->getBaseUrl(),
            urlencode($collectionId),
            $rows,
            $page
        );
    }

    /**
     * Build metadata URL for an identifier
     *
     * @param string $identifier
     * @return string
     */
    public function buildMetadataUrl(string $identifier): string
    {
        return sprintf('%s/metadata/%s', $this->getBaseUrl(), urlencode($identifier));
    }

    /**
     * Build streaming URL for a track
     *
     * @param string $server
     * @param string $dir
     * @param string $filename
     * @return string
     */
    public function buildStreamingUrl(string $server, string $dir, string $filename): string
    {
        return sprintf('https://%s%s/%s', $server, $dir, $filename);
    }

    // ==================== Performance Settings ====================

    /**
     * Get download batch size
     *
     * @return int
     */
    public function getDownloadBatchSize(): int
    {
        return (int) $this->scopeConfig->getValue(
            'archivedotorg/performance/download_batch_size',
            ScopeInterface::SCOPE_STORE
        ) ?: 100;
    }

    /**
     * Get populate batch size
     *
     * @return int
     */
    public function getPopulateBatchSize(): int
    {
        return (int) $this->scopeConfig->getValue(
            'archivedotorg/performance/populate_batch_size',
            ScopeInterface::SCOPE_STORE
        ) ?: 500;
    }

    /**
     * Get API delay in milliseconds
     *
     * @return int
     */
    public function getApiDelayMs(): int
    {
        return (int) $this->scopeConfig->getValue(
            'archivedotorg/performance/api_delay_ms',
            ScopeInterface::SCOPE_STORE
        ) ?: 750;
    }

    /**
     * Get progress save interval
     *
     * @return int
     */
    public function getProgressSaveInterval(): int
    {
        return (int) $this->scopeConfig->getValue(
            'archivedotorg/performance/progress_save_interval',
            ScopeInterface::SCOPE_STORE
        ) ?: 10;
    }

    // ==================== Matching Settings ====================

    /**
     * Check if hybrid matching is enabled
     *
     * @return bool
     */
    public function useHybridMatching(): bool
    {
        return $this->scopeConfig->isSetFlag(
            'archivedotorg/matching/use_hybrid_matching',
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Get fuzzy candidate limit
     *
     * @return int
     */
    public function getFuzzyCandidateLimit(): int
    {
        return (int) $this->scopeConfig->getValue(
            'archivedotorg/matching/fuzzy_candidate_limit',
            ScopeInterface::SCOPE_STORE
        ) ?: 5;
    }

    /**
     * Get minimum fuzzy score threshold
     *
     * @return int
     */
    public function getMinFuzzyScore(): int
    {
        return (int) $this->scopeConfig->getValue(
            'archivedotorg/matching/min_fuzzy_score',
            ScopeInterface::SCOPE_STORE
        ) ?: 80;
    }
}
