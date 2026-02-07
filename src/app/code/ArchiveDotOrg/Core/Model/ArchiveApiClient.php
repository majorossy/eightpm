<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use ArchiveDotOrg\Core\Api\ArchiveApiClientInterface;
use ArchiveDotOrg\Core\Api\Data\ShowInterface;
use ArchiveDotOrg\Core\Api\Data\ShowInterfaceFactory;
use ArchiveDotOrg\Core\Api\Data\TrackInterface;
use ArchiveDotOrg\Core\Api\Data\TrackInterfaceFactory;
use ArchiveDotOrg\Core\Logger\Logger;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\HTTP\Client\Curl;
use Magento\Framework\Serialize\Serializer\Json;

/**
 * Archive.org API Client Implementation
 *
 * Uses Magento's HTTP client with retry logic and proper error handling
 */
class ArchiveApiClient implements ArchiveApiClientInterface
{
    private Config $config;
    private Curl $httpClient;
    private Json $jsonSerializer;
    private Logger $logger;
    private ShowInterfaceFactory $showFactory;
    private TrackInterfaceFactory $trackFactory;

    /**
     * @var int API call counter for tracking/debugging
     */
    private static int $apiCallCount = 0;

    /**
     * @var int Cache hit counter for tracking/debugging
     */
    private static int $cacheHitCount = 0;

    /**
     * Circuit breaker settings
     */
    private const CIRCUIT_BREAKER_THRESHOLD = 5;
    private const CIRCUIT_BREAKER_RESET_TIME = 300; // 5 minutes

    /**
     * @var int Consecutive failure count
     */
    private int $failureCount = 0;

    /**
     * @var int|null Timestamp when circuit breaker opened
     */
    private ?int $circuitOpenedAt = null;

    /**
     * @param Config $config
     * @param Curl $httpClient
     * @param Json $jsonSerializer
     * @param Logger $logger
     * @param ShowInterfaceFactory $showFactory
     * @param TrackInterfaceFactory $trackFactory
     */
    public function __construct(
        Config $config,
        Curl $httpClient,
        Json $jsonSerializer,
        Logger $logger,
        ShowInterfaceFactory $showFactory,
        TrackInterfaceFactory $trackFactory
    ) {
        $this->config = $config;
        $this->httpClient = $httpClient;
        $this->jsonSerializer = $jsonSerializer;
        $this->logger = $logger;
        $this->showFactory = $showFactory;
        $this->trackFactory = $trackFactory;
    }

    /**
     * Reset API call and cache hit counters
     */
    public static function resetCounters(): void
    {
        self::$apiCallCount = 0;
        self::$cacheHitCount = 0;
    }

    /**
     * Get the number of API calls made since last reset
     */
    public static function getApiCallCount(): int
    {
        return self::$apiCallCount;
    }

    /**
     * Get the number of cache hits since last reset
     */
    public static function getCacheHitCount(): int
    {
        return self::$cacheHitCount;
    }

    /**
     * @inheritDoc
     */
    public function fetchCollectionIdentifiers(
        string $collectionId,
        ?int $limit = null,
        ?int $offset = null
    ): array {
        $url = $this->config->buildSearchUrl($collectionId, $limit ?? 999999);

        $response = $this->executeWithRetry($url);
        $data = $this->parseJsonResponse($response);

        if (!isset($data['response']['docs'])) {
            throw new LocalizedException(
                __('Invalid response format from Archive.org search API')
            );
        }

        $identifiers = [];
        foreach ($data['response']['docs'] as $doc) {
            if (isset($doc['identifier'])) {
                $identifiers[] = $doc['identifier'];
            }
        }

        // Apply offset and limit
        if ($offset !== null && $offset > 0) {
            $identifiers = array_slice($identifiers, $offset);
        }

        if ($limit !== null && $limit > 0) {
            $identifiers = array_slice($identifiers, 0, $limit);
        }

        $this->logger->debug('Fetched collection identifiers', [
            'collection' => $collectionId,
            'count' => count($identifiers),
            'limit' => $limit,
            'offset' => $offset
        ]);

        return $identifiers;
    }

    /**
     * @inheritDoc
     */
    public function fetchShowMetadata(string $identifier): ShowInterface
    {
        $url = $this->config->buildMetadataUrl($identifier);

        $response = $this->executeWithRetry($url);
        $data = $this->parseJsonResponse($response);

        return $this->parseShowResponse($data, $identifier);
    }

    /**
     * @inheritDoc
     */
    public function testConnection(): bool
    {
        try {
            $url = $this->config->getBaseUrl() . '/metadata/test';
            $this->httpClient->setTimeout($this->config->getTimeout());
            $this->httpClient->setOption(CURLOPT_FOLLOWLOCATION, true);
            $this->httpClient->get($url);

            // Even a 404 means the server is responding
            return $this->httpClient->getStatus() < 500;
        } catch (\Exception $e) {
            $this->logger->logApiError($this->config->getBaseUrl(), $e->getMessage());
            return false;
        }
    }

    /**
     * @inheritDoc
     */
    public function getCollectionCount(string $collectionId): int
    {
        $url = sprintf(
            '%s/advancedsearch.php?q=Collection%%3A%s&fl[]=identifier&rows=0&output=json',
            $this->config->getBaseUrl(),
            urlencode($collectionId)
        );

        $response = $this->executeWithRetry($url);
        $data = $this->parseJsonResponse($response);

        return (int) ($data['response']['numFound'] ?? 0);
    }

    /**
     * @inheritDoc
     */
    public function fetchBatchStats(array $identifiers): array
    {
        if (empty($identifiers)) {
            return [];
        }

        // Build the query: identifier:("id1" OR "id2" OR ...)
        $escapedIds = array_map(function ($id) {
            // Escape special characters and wrap in quotes
            $escaped = str_replace(['\\', '"'], ['\\\\', '\\"'], $id);
            return '"' . $escaped . '"';
        }, $identifiers);

        $query = 'identifier:(' . implode(' OR ', $escapedIds) . ')';

        // Build URL with fields we need
        // Note: Archive.org uses 'week' and 'month' for weekly/monthly downloads
        $url = sprintf(
            '%s/advancedsearch.php?q=%s&fl[]=identifier&fl[]=avg_rating&fl[]=num_reviews&fl[]=downloads&fl[]=week&fl[]=month&fl[]=publicdate&fl[]=addeddate&fl[]=runtime&rows=%d&output=json',
            $this->config->getBaseUrl(),
            urlencode($query),
            count($identifiers)
        );

        $this->logger->debug('Batch stats fetch', [
            'identifier_count' => count($identifiers),
            'url_length' => strlen($url),
        ]);

        $response = $this->executeWithRetry($url);
        $data = $this->parseJsonResponse($response);

        $stats = [];
        foreach ($data['response']['docs'] ?? [] as $doc) {
            $identifier = $doc['identifier'] ?? null;
            if ($identifier === null) {
                continue;
            }

            $stats[$identifier] = [
                'avg_rating' => isset($doc['avg_rating']) ? (float) $doc['avg_rating'] : null,
                'num_reviews' => isset($doc['num_reviews']) ? (int) $doc['num_reviews'] : null,
                'downloads' => isset($doc['downloads']) ? (int) $doc['downloads'] : null,
                'downloads_week' => isset($doc['week']) ? (int) $doc['week'] : null,
                'downloads_month' => isset($doc['month']) ? (int) $doc['month'] : null,
                'pub_date' => $doc['publicdate'] ?? null,
                'added_date' => $doc['addeddate'] ?? null,
                'runtime' => $doc['runtime'] ?? null,
            ];
        }

        $this->logger->debug('Batch stats fetched', [
            'requested' => count($identifiers),
            'returned' => count($stats),
        ]);

        return $stats;
    }

    /**
     * Execute HTTP request with retry logic and circuit breaker
     *
     * @param string $url
     * @return string
     * @throws LocalizedException
     */
    private function executeWithRetry(string $url): string
    {
        // Check circuit breaker before making request
        if ($this->isCircuitOpen()) {
            throw new LocalizedException(
                __('Circuit breaker open - too many API failures. Try again in 5 minutes.')
            );
        }

        $attempts = $this->config->getRetryAttempts();
        $delay = $this->config->getRetryDelay();
        $lastException = null;

        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            try {
                $this->httpClient->setTimeout($this->config->getTimeout());
                $this->httpClient->setOption(CURLOPT_FOLLOWLOCATION, true);
                $this->httpClient->setHeaders([
                    'User-Agent' => 'ArchiveDotOrg-Magento/2.0',
                    'Accept' => 'application/json'
                ]);

                $this->httpClient->get($url);

                $status = $this->httpClient->getStatus();
                $body = $this->httpClient->getBody();

                if ($status === 200) {
                    self::$apiCallCount++;
                    // Reset failure count on success
                    $this->failureCount = 0;
                    return $body;
                }

                // Retry on 5xx errors
                if ($status >= 500) {
                    throw new LocalizedException(
                        __('Server error: HTTP %1', $status)
                    );
                }

                // Don't retry on 4xx errors
                if ($status >= 400) {
                    $this->logger->logApiError($url, 'Client error', $status);
                    throw new LocalizedException(
                        __('API error: HTTP %1', $status)
                    );
                }

                // Reset on success
                $this->failureCount = 0;
                return $body;
            } catch (LocalizedException $e) {
                $lastException = $e;

                if ($attempt < $attempts) {
                    $this->logger->debug('API retry', [
                        'attempt' => $attempt,
                        'url' => $url,
                        'error' => $e->getMessage()
                    ]);

                    // Exponential backoff
                    usleep($delay * 1000 * $attempt);
                }
            } catch (\Exception $e) {
                $lastException = new LocalizedException(
                    __('API request failed: %1', $e->getMessage()),
                    $e
                );

                if ($attempt < $attempts) {
                    usleep($delay * 1000 * $attempt);
                }
            }
        }

        // All retries failed - increment failure count
        $this->failureCount++;

        // Open circuit breaker if threshold reached
        if ($this->failureCount >= self::CIRCUIT_BREAKER_THRESHOLD) {
            $this->circuitOpenedAt = time();
            $this->logger->error('Circuit breaker opened - too many API failures', [
                'failures' => $this->failureCount,
                'url' => $url
            ]);
        }

        $this->logger->logApiError($url, $lastException?->getMessage() ?? 'Unknown error');

        throw $lastException ?? new LocalizedException(
            __('API request failed after %1 attempts', $attempts)
        );
    }

    /**
     * Check if circuit breaker is open
     *
     * @return bool True if circuit is open (requests should be blocked)
     */
    private function isCircuitOpen(): bool
    {
        if ($this->circuitOpenedAt === null) {
            return false;
        }

        // Reset circuit after timeout
        if (time() - $this->circuitOpenedAt > self::CIRCUIT_BREAKER_RESET_TIME) {
            $this->circuitOpenedAt = null;
            $this->failureCount = 0;
            $this->logger->info('Circuit breaker reset after timeout');
            return false;
        }

        return true;
    }

    /**
     * Parse JSON response
     *
     * @param string $response
     * @return array
     * @throws LocalizedException
     */
    private function parseJsonResponse(string $response): array
    {
        try {
            $data = $this->jsonSerializer->unserialize($response);

            if (!is_array($data)) {
                throw new LocalizedException(__('Invalid JSON response'));
            }

            return $data;
        } catch (\Exception $e) {
            throw new LocalizedException(
                __('Failed to parse API response: %1', $e->getMessage()),
                $e
            );
        }
    }

    /**
     * Parse show metadata response into ShowInterface
     *
     * @param array $data
     * @param string $identifier
     * @return ShowInterface
     */
    private function parseShowResponse(array $data, string $identifier): ShowInterface
    {
        /** @var ShowInterface $show */
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

        // Extract new show-level fields
        $show->setPubDate($this->extractValue($metadata, 'publicdate'));
        $show->setGuid('https://archive.org/details/' . $identifier);
        $show->setRuntime($this->extractValue($metadata, 'runtime'));
        $show->setAddedDate($this->extractValue($metadata, 'addeddate'));
        $show->setPublicDate($this->extractValue($metadata, 'publicdate'));

        // Extract full subject tags
        $subject = $metadata['subject'] ?? [];
        if (is_string($subject)) {
            $subject = [$subject];
        }
        $show->setSubjectTags($subject);
        $show->setSubject(implode('; ', $subject));

        // Parse ratings and reviews from top-level reviews array
        $reviews = $data['reviews'] ?? [];
        $numReviews = count($reviews);
        $show->setNumReviews($numReviews);

        if ($numReviews > 0) {
            $totalStars = 0;
            foreach ($reviews as $review) {
                $totalStars += (int) ($review['stars'] ?? 0);
            }
            $avgRating = round($totalStars / $numReviews, 1);
            $show->setAvgRating($avgRating);
        } else {
            $show->setAvgRating(null);
        }

        // Parse tracks from files
        $tracks = [];

        // Collect all audio formats instead of filtering to one
        $supportedFormats = ['flac', 'mp3', 'ogg'];

        if (isset($data['files']) && is_array($data['files'])) {
            foreach ($data['files'] as $file) {
                // Handle both object and array formats
                $fileData = is_array($file) ? $file : (array) $file;

                $name = $fileData['name'] ?? '';

                // Only include audio files with supported formats
                $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                if (!in_array($extension, $supportedFormats)) {
                    continue;
                }

                // Skip files without a title
                if (empty($fileData['title'])) {
                    continue;
                }

                /** @var TrackInterface $track */
                $track = $this->trackFactory->create();
                $track->setName($name);
                $track->setTitle($fileData['title']);
                $track->setTrackNumber(isset($fileData['track']) ? (int) $fileData['track'] : null);
                $track->setLength($fileData['length'] ?? null);
                $track->setSha1($fileData['sha1'] ?? null);
                $track->setFormat($extension);  // Store actual file format
                $track->setSource($fileData['source'] ?? null);
                $track->setFileSize(isset($fileData['size']) ? (int) $fileData['size'] : null);

                // Extract new track-level fields
                $track->setOriginal($fileData['original'] ?? null);
                $track->setAlbum($fileData['album'] ?? null);

                $tracks[] = $track;
            }
        }

        $show->setTracks($tracks);

        return $show;
    }

    /**
     * Extract a value from metadata (handles arrays)
     *
     * @param array $metadata
     * @param string $key
     * @return string|null
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
     *
     * @param string $haystack
     * @param string $needle
     * @return bool
     */
    private function endsWith(string $haystack, string $needle): bool
    {
        $length = strlen($needle);
        if ($length === 0) {
            return true;
        }

        return substr($haystack, -$length) === $needle;
    }
}
