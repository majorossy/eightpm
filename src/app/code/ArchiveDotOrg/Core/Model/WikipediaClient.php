<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Serialize\Serializer\Json;
use ArchiveDotOrg\Core\Logger\Logger;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Exception\GuzzleException;

/**
 * Enhanced Wikipedia client with improved album matching
 *
 * Wikipedia REST API: https://en.wikipedia.org/api/rest_v1/
 * MediaWiki Search API: https://www.mediawiki.org/wiki/API:Search
 */
class WikipediaClient
{
    private const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/api/rest_v1';
    private const WIKIPEDIA_SEARCH_BASE = 'https://en.wikipedia.org/w/api.php';
    private const USER_AGENT = 'ArchiveDotOrg-Magento/2.0 (chris.majorossy@example.com)';

    private Json $jsonSerializer;
    private Logger $logger;
    private GuzzleClient $httpClient;

    public function __construct(
        Json $jsonSerializer,
        Logger $logger
    ) {
        $this->jsonSerializer = $jsonSerializer;
        $this->logger = $logger;
        $this->httpClient = new GuzzleClient([
            'timeout' => 30,
            'allow_redirects' => true,
            'headers' => [
                'User-Agent' => self::USER_AGENT
            ]
        ]);
    }

    /**
     * Get artwork URL for an album from Wikipedia with improved matching
     *
     * @param string $artistName Artist name
     * @param string $albumTitle Album title
     * @return string|null Artwork URL or null if not found
     */
    public function getAlbumArtwork(string $artistName, string $albumTitle): ?string
    {
        try {
            // Try direct title lookups first (fast)
            $titleVariations = $this->generateTitleVariations($artistName, $albumTitle);

            foreach ($titleVariations as $pageTitle) {
                $artworkUrl = $this->getPageArtwork($pageTitle);
                if ($artworkUrl !== null) {
                    $this->logger->debug("Found Wikipedia artwork via direct lookup: $pageTitle");
                    return $artworkUrl;
                }
            }

            // Fallback to search (slower but catches more)
            $searchResult = $this->searchAlbumPage($artistName, $albumTitle);
            if ($searchResult !== null) {
                $artworkUrl = $this->getPageArtwork($searchResult);
                if ($artworkUrl !== null) {
                    $this->logger->debug("Found Wikipedia artwork via search: $searchResult");
                    return $artworkUrl;
                }
            }

            // Try artist discography page as last resort
            $discographyUrl = $this->searchDiscographyPage($artistName, $albumTitle);
            if ($discographyUrl !== null) {
                $this->logger->debug("Found via discography: $discographyUrl");
                return $discographyUrl;
            }

            $this->logger->debug("No Wikipedia artwork found for: $artistName - $albumTitle");
            return null;

        } catch (\Exception $e) {
            $this->logger->error("Wikipedia API error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get artwork from a specific Wikipedia page
     *
     * @param string $pageTitle Wikipedia page title
     * @return string|null Artwork URL or null
     */
    private function getPageArtwork(string $pageTitle): ?string
    {
        try {
            $url = sprintf(
                '%s/page/summary/%s',
                self::WIKIPEDIA_API_BASE,
                rawurlencode($pageTitle)
            );

            $response = $this->httpClient->get($url);
            $data = $this->jsonSerializer->unserialize($response->getBody()->getContents());

            // Check for thumbnail or original image
            if (isset($data['thumbnail']['source'])) {
                return $data['thumbnail']['source'];
            }

            if (isset($data['originalimage']['source'])) {
                return $data['originalimage']['source'];
            }

            return null;

        } catch (GuzzleException $e) {
            // 404 is expected for non-existent pages
            if ($e->getCode() === 404) {
                return null;
            }
            return null;
        }
    }

    /**
     * Search for album page on Wikipedia with multiple strategies
     *
     * @param string $artistName Artist name
     * @param string $albumTitle Album title
     * @return string|null Page title or null
     */
    private function searchAlbumPage(string $artistName, string $albumTitle): ?string
    {
        // Try multiple search queries
        $searchQueries = [
            // Most specific first
            $albumTitle . ' ' . $artistName . ' album',
            $albumTitle . ' album ' . $artistName,
            $artistName . ' ' . $albumTitle . ' album',
            $albumTitle . ' ' . $artistName,
            // Fallback for single-word albums
            $this->cleanTitle($albumTitle) . ' ' . $artistName . ' music',
        ];

        foreach ($searchQueries as $searchQuery) {
            $result = $this->performSearch($searchQuery);
            if ($result !== null) {
                return $result;
            }
        }

        return null;
    }

    /**
     * Perform Wikipedia search
     *
     * @param string $searchQuery Search query
     * @return string|null Page title or null
     */
    private function performSearch(string $searchQuery): ?string
    {
        try {
            $url = sprintf(
                '%s?action=opensearch&search=%s&limit=5&namespace=0&format=json',
                self::WIKIPEDIA_SEARCH_BASE,
                urlencode($searchQuery)
            );

            $response = $this->httpClient->get($url);
            $data = $this->jsonSerializer->unserialize($response->getBody()->getContents());

            // OpenSearch returns: [query, [titles], [descriptions], [urls]]
            if (isset($data[1]) && !empty($data[1])) {
                foreach ($data[1] as $index => $title) {
                    $description = $data[2][$index] ?? '';

                    // Check if description mentions "album" or "studio album"
                    if (stripos($description, 'album') !== false) {
                        return $title;
                    }
                }

                // If no description match, try first result if it looks relevant
                $firstTitle = $data[1][0];
                if (stripos($firstTitle, 'album') !== false ||
                    stripos($firstTitle, 'discography') !== false) {
                    return $firstTitle;
                }
            }

            return null;

        } catch (GuzzleException $e) {
            return null;
        }
    }

    /**
     * Search artist's discography page for album artwork
     *
     * @param string $artistName Artist name
     * @param string $albumTitle Album title
     * @return string|null Artwork URL or null
     */
    private function searchDiscographyPage(string $artistName, string $albumTitle): ?string
    {
        try {
            // Try to find the artist's discography page
            $discographyVariations = [
                $artistName . ' discography',
                $artistName . ' (band) discography',
                $artistName,
            ];

            foreach ($discographyVariations as $pageTitle) {
                $result = $this->performSearch($pageTitle);
                if ($result !== null) {
                    // Found a discography page, but we can't extract individual album art from it
                    // This is a limitation - would need HTML parsing
                    return null;
                }
            }

            return null;

        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Generate comprehensive title variations for an album
     *
     * @param string $artistName Artist name
     * @param string $albumTitle Album title
     * @return array Array of possible page titles
     */
    private function generateTitleVariations(string $artistName, string $albumTitle): array
    {
        $cleanTitle = $this->cleanTitle($albumTitle);
        $cleanArtist = $this->cleanArtistName($artistName);

        $variations = [
            // Standard Wikipedia patterns
            $cleanTitle . ' (album)',
            $cleanTitle . ' (' . $cleanArtist . ' album)',
            $cleanTitle . ' (The ' . $cleanArtist . ' album)',

            // Album title variations
            $cleanTitle,
            $albumTitle, // Original with potential year/disambiguation

            // Artist-first patterns
            $cleanArtist . ' – ' . $cleanTitle,
            $cleanArtist . ' - ' . $cleanTitle,

            // For single-word albums or ambiguous titles
            $cleanTitle . ' (' . $cleanArtist . ')',

            // With common prefixes removed
            $this->removeCommonPrefixes($cleanTitle) . ' (album)',
            $this->removeCommonPrefixes($cleanTitle) . ' (' . $cleanArtist . ' album)',
        ];

        // Remove duplicates and empty strings
        return array_values(array_filter(array_unique($variations)));
    }

    /**
     * Clean album title for Wikipedia lookup
     *
     * @param string $title Album title
     * @return string Cleaned title
     */
    private function cleanTitle(string $title): string
    {
        // Remove parenthetical disambiguation at end
        $title = preg_replace('/\s*\([^)]*\)$/', '', $title);

        // Remove year at end (e.g., "Album 2020")
        $title = preg_replace('/\s+\d{4}$/', '', $title);

        // Trim whitespace
        $title = trim($title);

        return $title;
    }

    /**
     * Clean artist name for Wikipedia lookup
     *
     * @param string $artistName Artist name
     * @return string Cleaned artist name
     */
    private function cleanArtistName(string $artistName): string
    {
        $name = trim($artistName);

        // Remove "The" prefix for variations (will be added back as needed)
        // But keep the original for first attempts

        return $name;
    }

    /**
     * Remove common prefixes that might prevent Wikipedia matches
     *
     * @param string $title Album title
     * @return string Title without common prefixes
     */
    private function removeCommonPrefixes(string $title): string
    {
        $prefixes = ['The ', 'A ', 'An '];

        foreach ($prefixes as $prefix) {
            if (stripos($title, $prefix) === 0) {
                return substr($title, strlen($prefix));
            }
        }

        return $title;
    }

    /**
     * Get album release year from Wikipedia infobox
     *
     * @param string $artistName Artist name
     * @param string $albumTitle Album title
     * @return int|null Release year or null if not found
     */
    public function getAlbumReleaseYear(string $artistName, string $albumTitle): ?int
    {
        try {
            // Try direct title lookups first
            $titleVariations = $this->generateTitleVariations($artistName, $albumTitle);
            $pageTitle = null;

            foreach ($titleVariations as $variation) {
                if ($this->pageExists($variation)) {
                    $pageTitle = $variation;
                    break;
                }
            }

            // Fallback to search
            if ($pageTitle === null) {
                $pageTitle = $this->searchAlbumPage($artistName, $albumTitle);
            }

            if ($pageTitle === null) {
                return null;
            }

            // Fetch page HTML and parse infobox for "Released" field
            $url = sprintf(
                '%s?action=parse&page=%s&prop=text&format=json',
                self::WIKIPEDIA_SEARCH_BASE,
                rawurlencode($pageTitle)
            );

            $response = $this->httpClient->get($url);
            $data = $this->jsonSerializer->unserialize($response->getBody()->getContents());

            if (!isset($data['parse']['text']['*'])) {
                return null;
            }

            $html = $data['parse']['text']['*'];
            return $this->parseReleaseYear($html);

        } catch (\Exception $e) {
            $this->logger->debug("Error fetching release year for $artistName - $albumTitle: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Parse release year from album infobox HTML
     *
     * @param string $html Wikipedia page HTML
     * @return int|null Release year or null
     */
    private function parseReleaseYear(string $html): ?int
    {
        $dom = new \DOMDocument();
        @$dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        $xpath = new \DOMXPath($dom);

        $infoboxNode = $xpath->query("//table[contains(@class, 'infobox')]")->item(0);
        if (!$infoboxNode) {
            return null;
        }

        $rows = $xpath->query(".//tr", $infoboxNode);
        foreach ($rows as $row) {
            $header = $xpath->query(".//th", $row)->item(0);
            $data = $xpath->query(".//td", $row)->item(0);

            if ($header && $data) {
                $key = strtolower(trim($header->textContent));
                if ($key === 'released') {
                    $text = trim($data->textContent);
                    // Extract 4-digit year from the Released field
                    if (preg_match('/\b(19|20)\d{2}\b/', $text, $matches)) {
                        return (int)$matches[0];
                    }
                }
            }
        }

        return null;
    }

    /**
     * Download artwork image data
     *
     * @param string $imageUrl Image URL from Wikipedia
     * @return string|null Image binary data or null
     */
    public function downloadImage(string $imageUrl): ?string
    {
        try {
            $response = $this->httpClient->get($imageUrl);
            return $response->getBody()->getContents();
        } catch (GuzzleException $e) {
            $this->logger->error("Wikipedia image download failed: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get artist summary data from Wikipedia REST API
     *
     * @param string $artistName Artist name
     * @return array|null Artist data or null if not found
     */
    public function getArtistSummary(string $artistName): ?array
    {
        try {
            // Try artist name variations to handle disambiguation
            $pageTitle = $this->findArtistPage($artistName);
            if ($pageTitle === null) {
                $this->logger->debug("No Wikipedia page found for artist: $artistName");
                return null;
            }

            $url = sprintf(
                '%s/page/summary/%s',
                self::WIKIPEDIA_API_BASE,
                rawurlencode($pageTitle)
            );

            $response = $this->httpClient->get($url);
            $data = $this->jsonSerializer->unserialize($response->getBody()->getContents());

            return [
                'bio' => $data['extract'] ?? null,
                'thumbnail' => $data['thumbnail']['source'] ?? null,
                'page_title' => $data['title'] ?? null,
                'page_url' => $data['content_urls']['desktop']['page'] ?? null,
            ];

        } catch (GuzzleException $e) {
            if ($e->getCode() !== 404) {
                $this->logger->error("Wikipedia REST API error: " . $e->getMessage());
            }
            return null;
        } catch (\Exception $e) {
            $this->logger->error("Error fetching artist summary: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get artist infobox data by parsing Wikipedia page HTML
     *
     * @param string $artistName Artist name
     * @return array Associative array of infobox fields
     */
    public function getArtistInfobox(string $artistName): array
    {
        try {
            $pageTitle = $this->findArtistPage($artistName);
            if ($pageTitle === null) {
                return [];
            }

            // Get HTML content from Parse API
            $url = sprintf(
                '%s?action=parse&page=%s&prop=text&format=json',
                self::WIKIPEDIA_SEARCH_BASE,
                rawurlencode($pageTitle)
            );

            $response = $this->httpClient->get($url);
            $data = $this->jsonSerializer->unserialize($response->getBody()->getContents());

            if (!isset($data['parse']['text']['*'])) {
                return [];
            }

            $html = $data['parse']['text']['*'];
            return $this->parseInfobox($html);

        } catch (\Exception $e) {
            $this->logger->error("Error fetching artist infobox: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Find the correct Wikipedia page for an artist (handles disambiguation)
     *
     * @param string $artistName Artist name
     * @return string|null Page title or null
     */
    private function findArtistPage(string $artistName): ?string
    {
        $variations = [
            $artistName . ' (band)',
            $artistName . ' (musician)',
            $artistName,
            'The ' . $artistName,
        ];

        foreach ($variations as $variation) {
            // Try direct page lookup first (fast)
            if ($this->pageExists($variation)) {
                return $variation;
            }
        }

        // Fallback to search
        $searchResult = $this->performSearch($artistName . ' band music');
        if ($searchResult !== null) {
            return $searchResult;
        }

        return null;
    }

    /**
     * Check if a Wikipedia page exists
     *
     * @param string $pageTitle Page title
     * @return bool True if page exists
     */
    private function pageExists(string $pageTitle): bool
    {
        try {
            $url = sprintf(
                '%s/page/summary/%s',
                self::WIKIPEDIA_API_BASE,
                rawurlencode($pageTitle)
            );

            $response = $this->httpClient->get($url);
            return $response->getStatusCode() === 200;

        } catch (GuzzleException $e) {
            return false;
        }
    }

    /**
     * Parse infobox HTML to extract structured data
     *
     * @param string $html Wikipedia page HTML
     * @return array Associative array of infobox fields
     */
    private function parseInfobox(string $html): array
    {
        $infobox = [];

        // Use DOMDocument to parse HTML
        $dom = new \DOMDocument();
        @$dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        $xpath = new \DOMXPath($dom);

        // Find infobox table
        $infoboxNode = $xpath->query("//table[contains(@class, 'infobox')]")->item(0);
        if (!$infoboxNode) {
            return [];
        }

        // Extract rows from infobox
        $rows = $xpath->query(".//tr", $infoboxNode);
        foreach ($rows as $row) {
            $header = $xpath->query(".//th", $row)->item(0);
            $data = $xpath->query(".//td", $row)->item(0);

            if ($header && $data) {
                $key = strtolower(trim($header->textContent));
                $value = trim($data->textContent);

                // Map Wikipedia infobox fields to our attributes
                switch ($key) {
                    case 'origin':
                        $infobox['origin'] = $this->cleanInfoboxValue($value);
                        break;
                    case 'years active':
                        $infobox['years_active'] = $this->cleanInfoboxValue($value);
                        break;
                    case 'genres':
                    case 'genre':
                        $infobox['genres'] = $this->extractGenresFromCell($data);
                        break;
                    case 'website':
                        $infobox['website'] = $this->extractWebsiteUrl($data);
                        break;
                }
            }
        }

        return $infobox;
    }

    /**
     * Clean infobox value by removing citations, line breaks, etc.
     *
     * @param string $value Raw infobox value
     * @return string Cleaned value
     */
    private function cleanInfoboxValue(string $value): string
    {
        // Strip all HTML tags
        $value = strip_tags($value);

        // Remove citation references [1], [2], etc.
        $value = preg_replace('/\[\d+\]/', '', $value);

        // Replace line breaks with commas for multi-value fields
        $value = preg_replace('/\s*\n\s*/', ', ', $value);

        // Remove extra whitespace
        $value = preg_replace('/\s+/', ' ', $value);

        // Decode HTML entities
        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim($value);
    }

    /**
     * Extract website URL from infobox data cell
     *
     * @param \DOMElement $dataCell Data cell element
     * @return string|null Website URL or null
     */
    private function extractWebsiteUrl(\DOMElement $dataCell): ?string
    {
        $xpath = new \DOMXPath($dataCell->ownerDocument);
        $links = $xpath->query(".//a[@href]", $dataCell);

        foreach ($links as $link) {
            $href = $link->getAttribute('href');
            // Filter out Wikipedia internal links
            if (strpos($href, 'http') === 0 && strpos($href, 'wikipedia.org') === false) {
                return $href;
            }
        }

        return null;
    }

    /**
     * Extract clean genre text from infobox data cell
     *
     * @param \DOMElement $dataCell Data cell element
     * @return string Comma-separated genres
     */
    private function extractGenresFromCell(\DOMElement $dataCell): string
    {
        $xpath = new \DOMXPath($dataCell->ownerDocument);
        $genres = [];

        // Try to find genre links (most common pattern)
        $links = $xpath->query(".//a", $dataCell);
        if ($links->length > 0) {
            foreach ($links as $link) {
                $genre = trim($link->textContent);
                // Remove citation marks [1], [2], etc.
                $genre = preg_replace('/\[\d+\]/', '', $genre);
                $genre = trim($genre);
                if (!empty($genre) && strlen($genre) > 1) {
                    $genres[] = $genre;
                }
            }
        }

        // Fallback: extract from list items
        if (empty($genres)) {
            $listItems = $xpath->query(".//li", $dataCell);
            foreach ($listItems as $item) {
                $genre = trim(strip_tags($item->textContent));
                $genre = preg_replace('/\[\d+\]/', '', $genre);
                $genre = trim($genre);
                if (!empty($genre)) {
                    $genres[] = $genre;
                }
            }
        }

        // Final fallback: clean the full text content
        if (empty($genres)) {
            $text = $this->cleanInfoboxValue($dataCell->textContent);
            $genres = array_map('trim', explode(',', $text));
        }

        // Filter out empty and duplicate genres
        $genres = array_unique(array_filter($genres));

        return implode(', ', $genres);
    }
}
