<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use ArchiveDotOrg\Core\Api\AlbumArtworkServiceInterface;
use ArchiveDotOrg\Core\Logger\Logger;
use Magento\Framework\Filesystem\DirectoryList;
use Magento\Framework\App\ResourceConnection;
use Magento\Catalog\Api\CategoryRepositoryInterface;

/**
 * Album artwork service using Wikipedia
 */
class AlbumArtworkService implements AlbumArtworkServiceInterface
{
    private const CACHE_DIR = 'archivedotorg/artwork';

    private MusicBrainzClient $musicBrainzClient;
    private WikipediaClient $wikipediaClient;
    private Logger $logger;
    private DirectoryList $directoryList;
    private ResourceConnection $resourceConnection;
    private CategoryRepositoryInterface $categoryRepository;
    private string $varDir;

    public function __construct(
        MusicBrainzClient $musicBrainzClient,
        WikipediaClient $wikipediaClient,
        Logger $logger,
        DirectoryList $directoryList,
        ResourceConnection $resourceConnection,
        CategoryRepositoryInterface $categoryRepository
    ) {
        $this->musicBrainzClient = $musicBrainzClient;
        $this->wikipediaClient = $wikipediaClient;
        $this->logger = $logger;
        $this->directoryList = $directoryList;
        $this->resourceConnection = $resourceConnection;
        $this->categoryRepository = $categoryRepository;
        $this->varDir = $directoryList->getPath('var');
    }

    /**
     * @inheritDoc
     */
    public function getArtworkUrl(string $artistName, string $albumTitle, int $size = 500): ?string
    {
        // Get artwork from Wikipedia
        $artworkUrl = $this->wikipediaClient->getAlbumArtwork($artistName, $albumTitle);

        if ($artworkUrl !== null) {
            $this->logger->debug("Found Wikipedia artwork for $artistName - $albumTitle: $artworkUrl");
            return $artworkUrl;
        }

        $this->logger->debug("No Wikipedia artwork available for: $artistName - $albumTitle");
        return null;
    }

    /**
     * @inheritDoc
     */
    public function getArtistAlbums(string $artistName, int $limit = 50): array
    {
        $releases = $this->musicBrainzClient->getArtistReleases($artistName, $limit);
        $albums = [];

        foreach ($releases as $release) {
            $mbid = $release['id'] ?? null;
            $title = $release['title'] ?? null;
            $date = $release['date'] ?? null;

            if ($mbid === null || $title === null) {
                continue;
            }

            // Extract year from date
            $year = null;
            if ($date !== null && preg_match('/^(\d{4})/', $date, $matches)) {
                $year = (int)$matches[1];
            }

            // Try to get artwork URL from Wikipedia
            $artworkUrl = $this->wikipediaClient->getAlbumArtwork($artistName, $title);

            $albums[] = [
                'title' => $title,
                'year' => $year,
                'artwork_url' => $artworkUrl,
                'musicbrainz_id' => $mbid,
                'release_date' => $date
            ];
        }

        // Filter to only albums with artwork
        $albums = array_filter($albums, fn($album) => $album['artwork_url'] !== null);

        // Sort by year descending
        usort($albums, fn($a, $b) => ($b['year'] ?? 0) <=> ($a['year'] ?? 0));

        return $albums;
    }

    /**
     * @inheritDoc
     */
    public function downloadArtwork(string $artistName, string $albumTitle): ?string
    {
        $this->ensureCacheDir();

        // Check if already cached
        $cachedPath = $this->getCacheFilePath($artistName, $albumTitle);
        if (file_exists($cachedPath)) {
            return $cachedPath;
        }

        // Get artwork URL from Wikipedia
        $artworkUrl = $this->wikipediaClient->getAlbumArtwork($artistName, $albumTitle);

        if ($artworkUrl === null) {
            return null;
        }

        // Download the image
        $imageData = $this->wikipediaClient->downloadImage($artworkUrl);
        if ($imageData !== null) {
            file_put_contents($cachedPath, $imageData);
            $this->logger->info("Downloaded Wikipedia artwork for $artistName - $albumTitle to $cachedPath");
            return $cachedPath;
        }

        return null;
    }

    /**
     * @inheritDoc
     */
    public function isCached(string $artistName, string $albumTitle): bool
    {
        return file_exists($this->getCacheFilePath($artistName, $albumTitle));
    }

    /**
     * Get cache file path for an album
     */
    private function getCacheFilePath(string $artistName, string $albumTitle): string
    {
        $filename = $this->sanitizeFilename($artistName . '_' . $albumTitle) . '.jpg';
        return $this->varDir . '/' . self::CACHE_DIR . '/' . $filename;
    }

    /**
     * Sanitize filename for safe filesystem usage
     */
    private function sanitizeFilename(string $filename): string
    {
        // Remove special characters, keep alphanumeric, dash, underscore
        $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $filename);
        // Remove consecutive underscores
        $filename = preg_replace('/_+/', '_', $filename);
        // Trim underscores from edges
        return trim($filename, '_');
    }

    /**
     * Ensure cache directory exists
     */
    private function ensureCacheDir(): void
    {
        $cacheDir = $this->varDir . '/' . self::CACHE_DIR;
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
    }

    /**
     * Get albums from Magento categories for an artist
     *
     * @param string|null $artistName Artist name (null = all artists)
     * @return array Array of [artist_name, album_name, category_id]
     */
    public function getAlbumsFromCategories(?string $artistName = null): array
    {
        $connection = $this->resourceConnection->getConnection();

        $select = $connection->select()
            ->from(['c' => 'catalog_category_entity'], ['entity_id', 'parent_id'])
            ->joinInner(
                ['cv' => 'catalog_category_entity_varchar'],
                'c.entity_id = cv.entity_id AND cv.store_id = 0',
                ['album_name' => 'value']
            )
            ->joinInner(
                ['attr' => 'eav_attribute'],
                'cv.attribute_id = attr.attribute_id AND attr.attribute_code = "name" AND attr.entity_type_id = 3',
                []
            )
            ->joinInner(
                ['parent' => 'catalog_category_entity'],
                'c.parent_id = parent.entity_id',
                []
            )
            ->joinInner(
                ['pcv' => 'catalog_category_entity_varchar'],
                'parent.entity_id = pcv.entity_id AND pcv.store_id = 0',
                ['artist_name' => 'value']
            )
            ->joinInner(
                ['pattr' => 'eav_attribute'],
                'pcv.attribute_id = pattr.attribute_id AND pattr.attribute_code = "name" AND pattr.entity_type_id = 3',
                []
            )
            ->joinLeft(
                ['cat_album' => 'catalog_category_entity_int'],
                'c.entity_id = cat_album.entity_id',
                []
            )
            ->joinLeft(
                ['album_attr' => 'eav_attribute'],
                'cat_album.attribute_id = album_attr.attribute_id AND album_attr.attribute_code = "is_album" AND album_attr.entity_type_id = 3',
                []
            )
            ->where('cat_album.value = 1')
            ->order(['pcv.value ASC', 'cv.value ASC']);

        if ($artistName !== null) {
            $select->where('pcv.value = ?', $artistName);
        }

        return $connection->fetchAll($select);
    }

    /**
     * Get albums without artwork
     *
     * @param int $limit Maximum albums to return (0 = no limit)
     * @return array Array of albums without artwork
     */
    public function getAlbumsWithoutArtwork(int $limit = 0): array
    {
        $connection = $this->resourceConnection->getConnection();

        $select = $connection->select()
            ->from(['c' => 'catalog_category_entity'], ['entity_id', 'parent_id'])
            ->joinInner(
                ['cv' => 'catalog_category_entity_varchar'],
                'c.entity_id = cv.entity_id AND cv.store_id = 0',
                ['album_name' => 'value']
            )
            ->joinInner(
                ['attr' => 'eav_attribute'],
                'cv.attribute_id = attr.attribute_id AND attr.attribute_code = "name" AND attr.entity_type_id = 3',
                []
            )
            ->joinInner(
                ['parent' => 'catalog_category_entity'],
                'c.parent_id = parent.entity_id',
                []
            )
            ->joinInner(
                ['pcv' => 'catalog_category_entity_varchar'],
                'parent.entity_id = pcv.entity_id AND pcv.store_id = 0',
                ['artist_name' => 'value']
            )
            ->joinInner(
                ['pattr' => 'eav_attribute'],
                'pcv.attribute_id = pattr.attribute_id AND pattr.attribute_code = "name" AND pattr.entity_type_id = 3',
                []
            )
            ->joinInner(
                ['cat_album' => 'catalog_category_entity_int'],
                'c.entity_id = cat_album.entity_id',
                []
            )
            ->joinInner(
                ['album_attr' => 'eav_attribute'],
                'cat_album.attribute_id = album_attr.attribute_id AND album_attr.attribute_code = "is_album" AND album_attr.entity_type_id = 3',
                []
            )
            ->joinLeft(
                ['artwork' => 'catalog_category_entity_varchar'],
                'c.entity_id = artwork.entity_id AND artwork.attribute_id = (SELECT attribute_id FROM eav_attribute WHERE attribute_code = "wikipedia_artwork_url" AND entity_type_id = 3)',
                []
            )
            ->where('cat_album.value = 1')
            ->where('(artwork.value IS NULL OR artwork.value = "")')
            ->order(['pcv.value ASC', 'cv.value ASC']);

        if ($limit > 0) {
            $select->limit($limit);
        }

        return $connection->fetchAll($select);
    }

    /**
     * Enrich a single album with Wikipedia artwork
     *
     * @param string $artistName Artist name
     * @param string $albumTitle Album title
     * @param int $categoryId Category ID
     * @return array Result with 'found' and 'url' keys
     */
    public function enrichSingleAlbum(string $artistName, string $albumTitle, int $categoryId): array
    {
        $connection = $this->resourceConnection->getConnection();
        $tableName = $connection->getTableName('archivedotorg_studio_albums');

        // Skip locked albums
        $isLocked = $connection->fetchOne(
            $connection->select()->from($tableName, ['is_locked'])
                ->where('artist_name = ?', $artistName)
                ->where('album_title = ?', $albumTitle)
        );
        if ($isLocked) {
            return ['found' => false, 'url' => null, 'skipped' => true];
        }

        // Get artwork URL from Wikipedia
        $artworkUrl = $this->wikipediaClient->getAlbumArtwork($artistName, $albumTitle);

        if ($artworkUrl === null) {
            return ['found' => false, 'url' => null];
        }

        // Check if already exists in studio_albums table
        $exists = $connection->fetchOne(
            $connection->select()
                ->from($tableName, ['entity_id'])
                ->where('artist_name = ?', $artistName)
                ->where('album_title = ?', $albumTitle)
        );

        if ($exists) {
            // Update existing record
            $connection->update(
                $tableName,
                ['artwork_url' => $artworkUrl, 'updated_at' => date('Y-m-d H:i:s')],
                [
                    'artist_name = ?' => $artistName,
                    'album_title = ?' => $albumTitle
                ]
            );
        } else {
            // Insert new record
            $connection->insert($tableName, [
                'artist_name' => $artistName,
                'album_title' => $albumTitle,
                'artwork_url' => $artworkUrl,
                'category_id' => $categoryId,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
        }

        // Update category attribute
        try {
            $category = $this->categoryRepository->get($categoryId);
            $category->setCustomAttribute('wikipedia_artwork_url', $artworkUrl);
            $this->categoryRepository->save($category);
        } catch (\Exception $e) {
            $this->logger->error("Failed to update category $categoryId: " . $e->getMessage());
        }

        $this->logger->info("Enriched $artistName - $albumTitle with artwork: $artworkUrl");

        return ['found' => true, 'url' => $artworkUrl];
    }

    /**
     * Enrich albums with Wikipedia artwork URLs and store in database
     *
     * @param string|null $artistName Artist name (null = all artists)
     * @param int $limit Maximum albums to process
     * @return array Statistics [processed, found, stored, errors]
     */
    public function enrichAlbumsWithArtwork(?string $artistName = null, int $limit = 100): array
    {
        $albums = $this->getAlbumsFromCategories($artistName);

        if ($limit > 0) {
            $albums = array_slice($albums, 0, $limit);
        }

        $stats = [
            'processed' => 0,
            'found' => 0,
            'stored' => 0,
            'skipped' => 0,
            'errors' => 0
        ];

        $connection = $this->resourceConnection->getConnection();
        $tableName = $connection->getTableName('archivedotorg_studio_albums');

        // Pre-fetch locked category IDs to skip
        $lockedIds = $connection->fetchCol(
            $connection->select()->from($tableName, ['category_id'])->where('is_locked = 1')
        );

        foreach ($albums as $album) {
            $artist = $album['artist_name'];
            $title = $album['album_name'];
            $stats['processed']++;

            // Skip locked albums
            if (in_array($album['entity_id'], $lockedIds)) {
                $stats['skipped']++;
                $this->logger->debug("Skipping locked album: $artist - $title");
                continue;
            }

            try {
                // Get artwork URL from Wikipedia
                $artworkUrl = $this->wikipediaClient->getAlbumArtwork($artist, $title);

                if ($artworkUrl !== null) {
                    $stats['found']++;

                    // Check if already exists
                    $exists = $connection->fetchOne(
                        $connection->select()
                            ->from($tableName, ['entity_id'])
                            ->where('artist_name = ?', $artist)
                            ->where('album_title = ?', $title)
                    );

                    if ($exists) {
                        // Update existing record
                        $connection->update(
                            $tableName,
                            ['artwork_url' => $artworkUrl, 'updated_at' => date('Y-m-d H:i:s')],
                            [
                                'artist_name = ?' => $artist,
                                'album_title = ?' => $title
                            ]
                        );
                    } else {
                        // Insert new record
                        $connection->insert($tableName, [
                            'artist_name' => $artist,
                            'album_title' => $title,
                            'artwork_url' => $artworkUrl,
                            'category_id' => $album['entity_id'],
                            'created_at' => date('Y-m-d H:i:s'),
                            'updated_at' => date('Y-m-d H:i:s')
                        ]);
                    }

                    $stats['stored']++;
                    $this->logger->debug("Stored Wikipedia artwork for $artist - $title");
                } else {
                    $this->logger->debug("No Wikipedia artwork found for $artist - $title");
                }

            } catch (\Exception $e) {
                $stats['errors']++;
                $this->logger->error("Error processing $artist - $title: " . $e->getMessage());
            }
        }

        return $stats;
    }
}
