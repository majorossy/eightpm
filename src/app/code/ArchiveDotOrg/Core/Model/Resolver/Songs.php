<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for songs() GraphQL query
 *
 * Queries the category tree directly:
 *   Level 3: Artist (is_artist=1)
 *   Level 4: Album (is_album=1)
 *   Level 5: Song (is_song=1)
 *
 * Deduplicates songs that appear on multiple albums within the same artist
 * by grouping on (song_name, artist_id) and picking the best album artwork.
 * Version count is the max across duplicate categories (they share the same products).
 */
class Songs implements ResolverInterface
{
    private ResourceConnection $resourceConnection;

    /** @var array<string, int> Cached EAV attribute IDs */
    private array $attributeIds = [];

    public function __construct(ResourceConnection $resourceConnection)
    {
        $this->resourceConnection = $resourceConnection;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $artistSlug = $args['artistSlug'] ?? null;
        $search = $args['search'] ?? null;
        $sortBy = $args['sortBy'] ?? 'VERSION_COUNT';
        $sortDir = strtoupper($args['sortDir'] ?? 'DESC');
        $pageSize = max(1, min((int)($args['pageSize'] ?? 20), 100));
        $currentPage = max(1, (int)($args['currentPage'] ?? 1));

        if (!in_array($sortDir, ['ASC', 'DESC'])) {
            $sortDir = 'DESC';
        }

        $connection = $this->resourceConnection->getConnection();
        $this->loadAttributeIds($connection);

        $catTable = $connection->getTableName('catalog_category_entity');
        $catIntTable = $connection->getTableName('catalog_category_entity_int');
        $catVarcharTable = $connection->getTableName('catalog_category_entity_varchar');
        $catProductTable = $connection->getTableName('catalog_category_product');
        $studioAlbumsTable = $connection->getTableName('archivedotorg_studio_albums');

        // EAV join conditions
        $isSongJoin = sprintf(
            'is_song.entity_id = song.entity_id AND is_song.attribute_id = %d AND is_song.store_id = 0 AND is_song.value = 1',
            $this->attributeIds['is_song']
        );
        $songNameJoin = sprintf(
            'song_name.entity_id = song.entity_id AND song_name.attribute_id = %d AND song_name.store_id = 0',
            $this->attributeIds['name']
        );
        $songUrlKeyJoin = sprintf(
            'song_url.entity_id = song.entity_id AND song_url.attribute_id = %d AND song_url.store_id = 0',
            $this->attributeIds['url_key']
        );
        $songTrackNumJoin = sprintf(
            'song_track.entity_id = song.entity_id AND song_track.attribute_id = %d AND song_track.store_id = 0',
            $this->attributeIds['song_track_number']
        );
        $albumNameJoin = sprintf(
            'album_name.entity_id = album.entity_id AND album_name.attribute_id = %d AND album_name.store_id = 0',
            $this->attributeIds['name']
        );
        $albumUrlKeyJoin = sprintf(
            'album_url.entity_id = album.entity_id AND album_url.attribute_id = %d AND album_url.store_id = 0',
            $this->attributeIds['url_key']
        );
        $artistNameJoin = sprintf(
            'artist_name.entity_id = artist.entity_id AND artist_name.attribute_id = %d AND artist_name.store_id = 0',
            $this->attributeIds['name']
        );
        $artistUrlKeyJoin = sprintf(
            'artist_url.entity_id = artist.entity_id AND artist_url.attribute_id = %d AND artist_url.store_id = 0',
            $this->attributeIds['url_key']
        );

        // Base WHERE conditions applied to both count and data queries
        $baseConditions = function ($select) use ($artistSlug, $search, $catVarcharTable) {
            $select->where('song.level = 5')
                ->where('song_name.value IS NOT NULL')
                ->where("song_name.value != ''");

            if ($artistSlug) {
                $artistUrlFilterJoin = sprintf(
                    'artist_url_f.entity_id = artist.entity_id AND artist_url_f.attribute_id = %d AND artist_url_f.store_id = 0',
                    $this->attributeIds['url_key']
                );
                $select->joinLeft(['artist_url_f' => $catVarcharTable], $artistUrlFilterJoin, []);
                $select->where('artist_url_f.value = ?', $artistSlug);
            }

            if ($search) {
                $select->where('song_name.value LIKE ?', '%' . $search . '%');
            }
        };

        // ── Count query (deduplicated) ──
        $countSelect = $connection->select()
            ->from(['song' => $catTable], [])
            ->join(['is_song' => $catIntTable], $isSongJoin, [])
            ->join(['song_name' => $catVarcharTable], $songNameJoin, [])
            ->join(['album' => $catTable], 'album.entity_id = song.parent_id AND album.level = 4', [])
            ->join(['artist' => $catTable], 'artist.entity_id = album.parent_id AND artist.level = 3', []);

        $baseConditions($countSelect);

        // Count distinct song names per artist
        $countSelect->columns([
            'cnt' => new \Zend_Db_Expr('COUNT(DISTINCT CONCAT(song_name.value, \'||\', artist.entity_id))')
        ]);

        // ── Data query (deduplicated via GROUP BY) ──
        $versionCountExpr = new \Zend_Db_Expr(sprintf(
            'MAX((SELECT COUNT(*) FROM %s AS cp WHERE cp.category_id = song.entity_id))',
            $catProductTable
        ));

        $dataSelect = $connection->select()
            ->from(['song' => $catTable], ['category_id' => 'MIN(song.entity_id)'])
            ->join(['is_song' => $catIntTable], $isSongJoin, [])
            ->join(['song_name' => $catVarcharTable], $songNameJoin, ['title' => 'song_name.value'])
            ->joinLeft(['song_url' => $catVarcharTable], $songUrlKeyJoin, ['url_key' => 'MIN(song_url.value)'])
            ->joinLeft(['song_track' => $catIntTable], $songTrackNumJoin, [])
            ->join(['album' => $catTable], 'album.entity_id = song.parent_id AND album.level = 4', [])
            ->join(['album_name' => $catVarcharTable], $albumNameJoin, [])
            ->joinLeft(['album_url' => $catVarcharTable], $albumUrlKeyJoin, [])
            ->join(['artist' => $catTable], 'artist.entity_id = album.parent_id AND artist.level = 3', [])
            ->join(['artist_name' => $catVarcharTable], $artistNameJoin, ['artist_name' => 'artist_name.value'])
            ->joinLeft(['artist_url' => $catVarcharTable], $artistUrlKeyJoin, ['artist_slug' => 'artist_url.value'])
            // Artwork: direct join to studio albums table (no EAV)
            ->joinLeft(
                ['sa' => $studioAlbumsTable],
                'sa.category_id = album.entity_id',
                []
            )
            ->columns([
                'version_count' => $versionCountExpr,
                // Track number stored as raw int value in EAV int table
                'track_number' => new \Zend_Db_Expr('MIN(song_track.value)'),
                // Pick the first non-null artwork and album name
                'album_artwork_url' => new \Zend_Db_Expr('MAX(sa.artwork_url)'),
                'album_name' => new \Zend_Db_Expr('MIN(album_name.value)'),
                'album_slug' => new \Zend_Db_Expr('MIN(album_url.value)'),
            ]);

        $baseConditions($dataSelect);

        // GROUP BY song name + artist to deduplicate
        $dataSelect->group(['song_name.value', 'artist.entity_id']);

        // ── Sorting ──
        switch ($sortBy) {
            case 'TITLE':
                $dataSelect->order("song_name.value $sortDir");
                break;
            case 'ALBUM':
                // Sort by album name, then track number within album
                $dataSelect->order("album_name $sortDir");
                $dataSelect->order("track_number ASC");
                break;
            case 'ARTIST':
                $dataSelect->order("artist_name $sortDir");
                $dataSelect->order("song_name.value ASC");
                break;
            default:
                $dataSelect->order("version_count $sortDir");
        }

        $dataSelect->limitPage($currentPage, $pageSize);

        // ── Execute ──
        $totalCount = (int)$connection->fetchOne($countSelect);
        $rows = $connection->fetchAll($dataSelect);

        $items = [];
        foreach ($rows as $row) {
            $items[] = [
                'category_id' => (int)$row['category_id'],
                'title' => $row['title'],
                'url_key' => $row['url_key'] ?? '',
                'track_number' => $row['track_number'] ? (int)$row['track_number'] : null,
                'version_count' => (int)$row['version_count'],
                'album_name' => $row['album_name'] ?? '',
                'album_slug' => $row['album_slug'] ?? '',
                'album_artwork_url' => $row['album_artwork_url'],
                'artist_name' => $row['artist_name'],
                'artist_slug' => $row['artist_slug'] ?? '',
            ];
        }

        $totalPages = $pageSize > 0 ? (int)ceil($totalCount / $pageSize) : 0;

        return [
            'items' => $items,
            'total_count' => $totalCount,
            'page_info' => [
                'page_size' => $pageSize,
                'current_page' => $currentPage,
                'total_pages' => $totalPages,
            ],
        ];
    }

    private function loadAttributeIds(\Magento\Framework\DB\Adapter\AdapterInterface $connection): void
    {
        if (!empty($this->attributeIds)) {
            return;
        }

        $eavTable = $connection->getTableName('eav_attribute');
        $select = $connection->select()
            ->from($eavTable, ['attribute_code', 'attribute_id'])
            ->where('entity_type_id = 3')
            ->where('attribute_code IN (?)', ['is_song', 'name', 'url_key', 'song_track_number']);

        $rows = $connection->fetchPairs($select);
        $this->attributeIds = array_map('intval', $rows);
    }
}
