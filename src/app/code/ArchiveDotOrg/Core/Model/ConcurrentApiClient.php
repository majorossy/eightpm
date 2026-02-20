<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use ArchiveDotOrg\Core\Api\Data\ShowInterface;
use ArchiveDotOrg\Core\Api\Data\ShowInterfaceFactory;
use ArchiveDotOrg\Core\Api\Data\TrackInterfaceFactory;
use ArchiveDotOrg\Core\Logger\Logger;
use ArchiveDotOrg\Core\Model\Cache\ApiResponseCache;
use Magento\Framework\Serialize\Serializer\Json;

/**
 * Concurrent API Client
 *
 * Uses cURL multi-handle for parallel fetching of show metadata.
 * Significantly improves import speed by fetching multiple shows simultaneously.
 */
class ConcurrentApiClient
{
    private Config $config;
    private Json $jsonSerializer;
    private Logger $logger;
    private ShowInterfaceFactory $showFactory;
    private TrackInterfaceFactory $trackFactory;
    private ApiResponseCache $apiCache;

    /**
     * @param Config $config
     * @param Json $jsonSerializer
     * @param Logger $logger
     * @param ShowInterfaceFactory $showFactory
     * @param TrackInterfaceFactory $trackFactory
     * @param ApiResponseCache $apiCache
     */
    public function __construct(
        Config $config,
        Json $jsonSerializer,
        Logger $logger,
        ShowInterfaceFactory $showFactory,
        TrackInterfaceFactory $trackFactory,
        ApiResponseCache $apiCache
    ) {
        $this->config = $config;
        $this->jsonSerializer = $jsonSerializer;
        $this->logger = $logger;
        $this->showFactory = $showFactory;
        $this->trackFactory = $trackFactory;
        $this->apiCache = $apiCache;
    }

    /**
     * Fetch metadata for multiple shows concurrently
     *
     * @param array $identifiers Array of Archive.org identifiers
     * @return array<string, ShowInterface|null> Map of identifier => ShowInterface (or null on failure)
     */
    public function fetchShowMetadataBatch(array $identifiers): array
    {
        $results = [];
        $toFetch = [];

        // First, check cache for each identifier
        foreach ($identifiers as $identifier) {
            $cached = $this->apiCache->get($identifier, 'metadata');
            if ($cached !== null) {
                $results[$identifier] = $this->parseShowResponse($cached, $identifier);
            } else {
                $toFetch[] = $identifier;
            }
        }

        // If all were cached, return early
        if (empty($toFetch)) {
            $this->logger->debug('All show metadata fetched from cache', [
                'count' => count($identifiers)
            ]);
            return $results;
        }

        // Fetch uncached identifiers concurrently with conservative rate limiting
        $concurrency = $this->config->getConcurrency();
        $timeout = $this->config->getTimeout();
        $rateLimitMs = $this->config->getRateLimitMs();

        $multiHandle = curl_multi_init();
        $handles = [];
        $batchIndex = 0;
        $rateLimited429 = false;

        // Process in chunks of $concurrency
        foreach (array_chunk($toFetch, $concurrency) as $batch) {
            // Add delay between batches for rate limiting
            if ($batchIndex > 0) {
                // If we got a 429, use longer backoff
                $delayMs = $rateLimited429 ? 5000 : $rateLimitMs;
                $this->logger->debug('Pausing between concurrent batches', [
                    'delay_ms' => $delayMs,
                    'batch_index' => $batchIndex,
                    'rate_limited' => $rateLimited429
                ]);
                usleep($delayMs * 1000);
                $rateLimited429 = false; // Reset for this batch
            }
            $batchIndex++;

            // Add staggered delays WITHIN each batch to avoid burst requests
            foreach ($batch as $index => $identifier) {
                // Delay between each request start within the batch
                if ($index > 0) {
                    usleep($rateLimitMs * 1000);
                }

                $url = $this->config->buildMetadataUrl($identifier);

                $ch = curl_init();
                curl_setopt_array($ch, [
                    CURLOPT_URL => $url,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT => $timeout,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_HTTPHEADER => [
                        'Accept: application/json',
                        'User-Agent: ArchiveDotOrg-Magento/2.0 (Concurrent Fetcher; respectful rate limiting)'
                    ],
                ]);

                curl_multi_add_handle($multiHandle, $ch);
                $handles[$identifier] = $ch;
            }

            // Execute batch
            $active = null;
            do {
                $status = curl_multi_exec($multiHandle, $active);
                if ($active) {
                    curl_multi_select($multiHandle);
                }
            } while ($active && $status === CURLM_OK);

            // Collect results from this batch
            foreach ($batch as $identifier) {
                $ch = $handles[$identifier];
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $body = curl_multi_getcontent($ch);

                // Handle 429 Too Many Requests
                if ($httpCode === 429) {
                    $this->logger->warning('Rate limited by Archive.org (HTTP 429)', [
                        'identifier' => $identifier,
                        'url' => $this->config->buildMetadataUrl($identifier)
                    ]);
                    $results[$identifier] = null;
                    $rateLimited429 = true;
                    // Don't cache, mark for potential retry later
                    curl_multi_remove_handle($multiHandle, $ch);
                    curl_close($ch);
                    continue;
                }

                if ($httpCode === 200 && $body) {
                    try {
                        $data = $this->jsonSerializer->unserialize($body);
                        if (is_array($data)) {
                            // Cache the response
                            $this->apiCache->save($identifier, $data);
                            $results[$identifier] = $this->parseShowResponse($data, $identifier);
                        } else {
                            $results[$identifier] = null;
                            $this->logger->logApiError(
                                $this->config->buildMetadataUrl($identifier),
                                'Invalid JSON response'
                            );
                        }
                    } catch (\Exception $e) {
                        $results[$identifier] = null;
                        $this->logger->logApiError(
                            $this->config->buildMetadataUrl($identifier),
                            'Parse error: ' . $e->getMessage()
                        );
                    }
                } else {
                    $results[$identifier] = null;
                    $this->logger->logApiError(
                        $this->config->buildMetadataUrl($identifier),
                        'HTTP error',
                        $httpCode
                    );
                }

                curl_multi_remove_handle($multiHandle, $ch);
                curl_close($ch);
            }

            $handles = [];

            // Extra safety: if we got rate limited, add a longer pause before next batch
            if ($rateLimited429) {
                $this->logger->warning('Applying 5-second backoff after 429 response');
                sleep(5);
            }
        }

        curl_multi_close($multiHandle);

        $this->logger->debug('Concurrent metadata fetch completed', [
            'total' => count($identifiers),
            'cached' => count($identifiers) - count($toFetch),
            'fetched' => count($toFetch),
            'successful' => count(array_filter($results))
        ]);

        return $results;
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
        $show->setPubDate($this->extractValue($metadata, 'publicdate'));
        $show->setGuid('https://archive.org/details/' . $identifier);
        $show->setCoverage($this->extractValue($metadata, 'coverage'));

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
        $audioFormat = $this->config->getAudioFormat();
        $tracks = [];

        if (isset($data['files']) && is_array($data['files'])) {
            foreach ($data['files'] as $file) {
                $fileData = is_array($file) ? $file : (array) $file;
                $name = $fileData['name'] ?? '';

                if (!str_ends_with($name, '.' . $audioFormat)) {
                    continue;
                }

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

}
