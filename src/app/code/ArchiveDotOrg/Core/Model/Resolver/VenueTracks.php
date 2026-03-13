<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\App\ResourceConnection;

class VenueTracks implements ResolverInterface
{
    private ResourceConnection $resourceConnection;

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
        $venueId = $value['venue_id'] ?? null;
        if (!$venueId) {
            return ['items' => [], 'total_count' => 0, 'page_info' => null];
        }

        $pageSize = max(1, min((int)($args['pageSize'] ?? 50), 200));
        $currentPage = max(1, (int)($args['currentPage'] ?? 1));
        $sortBy = $args['sortBy'] ?? 'DATE';
        $sortDir = strtoupper($args['sortDir'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';

        $connection = $this->resourceConnection->getConnection();

        // Get venue raw names from alias table
        $aliasTable = $connection->getTableName('archivedotorg_venue_alias');
        $rawNames = $connection->fetchCol(
            $connection->select()->from($aliasTable, ['raw_name'])->where('venue_id = ?', $venueId)
        );

        if (empty($rawNames)) {
            return ['items' => [], 'total_count' => 0, 'page_info' => null];
        }

        $eavAttr = $connection->getTableName('eav_attribute');
        $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');
        $cpeTable = $connection->getTableName('catalog_product_entity');
        $cpeDatetimeTable = $connection->getTableName('catalog_product_entity_datetime');
        $cpeTextTable = $connection->getTableName('catalog_product_entity_text');
        $cpeIntTable = $connection->getTableName('catalog_product_entity_int');

        // Load all needed attribute IDs in one query
        // Actual attribute codes: title (not song_title), length (not song_duration),
        // song_urls (text JSON, not separate high/medium/low), song_url (varchar fallback)
        $attrCodes = [
            'show_venue', 'identifier', 'show_date', 'show_name', 'archive_collection',
            'title', 'length', 'song_url', 'song_urls',
            'recording_type', 'archive_avg_rating', 'archive_downloads', 'is_streamable',
            'show_location', 'show_taper', 'lineage',
        ];
        $attrRows = $connection->fetchPairs(
            $connection->select()
                ->from($eavAttr, ['attribute_code', 'attribute_id'])
                ->where('attribute_code IN (?)', $attrCodes)
                ->where('entity_type_id = ?', 4)
        );

        $venueAttrId = (int)($attrRows['show_venue'] ?? 0);
        if (!$venueAttrId) {
            return ['items' => [], 'total_count' => 0, 'page_info' => null];
        }

        $identAttrId    = (int)($attrRows['identifier'] ?? 0);
        $sdateAttrId    = (int)($attrRows['show_date'] ?? 0);
        $snameAttrId    = (int)($attrRows['show_name'] ?? 0);
        $collAttrId     = (int)($attrRows['archive_collection'] ?? 0);
        $titleAttrId    = (int)($attrRows['title'] ?? 0);
        $lengthAttrId   = (int)($attrRows['length'] ?? 0);
        $songUrlAttrId  = (int)($attrRows['song_url'] ?? 0);
        $songUrlsAttrId = (int)($attrRows['song_urls'] ?? 0);
        $rtypeAttrId    = (int)($attrRows['recording_type'] ?? 0);
        $ratingAttrId   = (int)($attrRows['archive_avg_rating'] ?? 0);
        $dlsAttrId      = (int)($attrRows['archive_downloads'] ?? 0);
        $streamAttrId   = (int)($attrRows['is_streamable'] ?? 0);
        $slocAttrId     = (int)($attrRows['show_location'] ?? 0);
        $taperAttrId    = (int)($attrRows['show_taper'] ?? 0);
        $lineageAttrId  = (int)($attrRows['lineage'] ?? 0);

        // Build main query
        $select = $connection->select()
            ->from(['venue_v' => $cpeVarcharTable], [])
            ->join(['cpe' => $cpeTable], 'venue_v.entity_id = cpe.entity_id', [
                'entity_id' => 'cpe.entity_id',
                'sku' => 'cpe.sku',
            ])
            ->where('venue_v.attribute_id = ?', $venueAttrId)
            ->where('venue_v.store_id = ?', 0)
            ->where('venue_v.value IN (?)', $rawNames);

        // Varchar joins
        $varcharJoins = [
            'ident'    => $identAttrId,
            'sname'    => $snameAttrId,
            'coll'     => $collAttrId,
            'ttl'      => $titleAttrId,
            'len'      => $lengthAttrId,
            'surl'     => $songUrlAttrId,
            'rtype'    => $rtypeAttrId,
            'rating'   => $ratingAttrId,
            'sloc'     => $slocAttrId,
            'taper'    => $taperAttrId,
        ];

        foreach ($varcharJoins as $alias => $attrId) {
            if ($attrId) {
                $select->joinLeft(
                    [$alias => $cpeVarcharTable],
                    "{$alias}.entity_id = cpe.entity_id AND {$alias}.attribute_id = {$attrId} AND {$alias}.store_id = 0",
                    []
                );
            }
        }

        // Datetime join for show_date
        if ($sdateAttrId) {
            $select->joinLeft(
                ['sdate' => $cpeDatetimeTable],
                "sdate.entity_id = cpe.entity_id AND sdate.attribute_id = {$sdateAttrId} AND sdate.store_id = 0",
                []
            );
        }

        // Int joins for archive_downloads and is_streamable
        if ($dlsAttrId) {
            $select->joinLeft(
                ['dls' => $cpeIntTable],
                "dls.entity_id = cpe.entity_id AND dls.attribute_id = {$dlsAttrId} AND dls.store_id = 0",
                []
            );
        }
        if ($streamAttrId) {
            $select->joinLeft(
                ['stream' => $cpeIntTable],
                "stream.entity_id = cpe.entity_id AND stream.attribute_id = {$streamAttrId} AND stream.store_id = 0",
                []
            );
        }

        // Text joins for lineage and song_urls (JSON)
        if ($lineageAttrId) {
            $select->joinLeft(
                ['lin' => $cpeTextTable],
                "lin.entity_id = cpe.entity_id AND lin.attribute_id = {$lineageAttrId} AND lin.store_id = 0",
                []
            );
        }
        if ($songUrlsAttrId) {
            $select->joinLeft(
                ['surls' => $cpeTextTable],
                "surls.entity_id = cpe.entity_id AND surls.attribute_id = {$songUrlsAttrId} AND surls.store_id = 0",
                []
            );
        }

        // Select columns
        $select->columns([
            'name'               => $titleAttrId
                ? new \Zend_Db_Expr('COALESCE(ttl.value, cpe.sku)')
                : new \Zend_Db_Expr('cpe.sku'),
            'song_title'         => $titleAttrId ? 'ttl.value' : new \Zend_Db_Expr('NULL'),
            'song_duration'      => $lengthAttrId ? 'len.value' : new \Zend_Db_Expr('NULL'),
            'song_url'           => $songUrlAttrId ? 'surl.value' : new \Zend_Db_Expr('NULL'),
            'song_urls_json'     => $songUrlsAttrId ? 'surls.value' : new \Zend_Db_Expr('NULL'),
            'show_date'          => $sdateAttrId ? new \Zend_Db_Expr('DATE(sdate.value)') : new \Zend_Db_Expr('NULL'),
            'show_name'          => $snameAttrId ? 'sname.value' : new \Zend_Db_Expr('NULL'),
            'identifier'         => $identAttrId ? 'ident.value' : new \Zend_Db_Expr('NULL'),
            'artist_name'        => $collAttrId ? 'coll.value' : new \Zend_Db_Expr('NULL'),
            'recording_type'     => $rtypeAttrId ? 'rtype.value' : new \Zend_Db_Expr('NULL'),
            'archive_avg_rating' => $ratingAttrId ? 'rating.value' : new \Zend_Db_Expr('NULL'),
            'archive_downloads'  => $dlsAttrId ? 'dls.value' : new \Zend_Db_Expr('NULL'),
            'is_streamable'      => $streamAttrId ? 'stream.value' : new \Zend_Db_Expr('NULL'),
            'show_venue'         => 'venue_v.value',
            'show_location'      => $slocAttrId ? 'sloc.value' : new \Zend_Db_Expr('NULL'),
            'show_taper'         => $taperAttrId ? 'taper.value' : new \Zend_Db_Expr('NULL'),
            'lineage'            => $lineageAttrId ? 'lin.value' : new \Zend_Db_Expr('NULL'),
        ]);

        // Sorting
        $sortMap = [
            'DATE'      => $sdateAttrId ? 'sdate.value' : 'cpe.entity_id',
            'TITLE'     => $titleAttrId ? 'ttl.value' : 'cpe.sku',
            'ARTIST'    => $collAttrId ? 'coll.value' : 'cpe.entity_id',
            'RATING'    => $ratingAttrId ? 'rating.value' : 'cpe.entity_id',
            'DOWNLOADS' => $dlsAttrId ? 'dls.value' : 'cpe.entity_id',
        ];
        $sortColumn = $sortMap[$sortBy] ?? $sortMap['DATE'];
        $select->order("{$sortColumn} {$sortDir}");

        // Count query
        $countSelect = $connection->select()
            ->from(['venue_v' => $cpeVarcharTable], [])
            ->join(['cpe' => $cpeTable], 'venue_v.entity_id = cpe.entity_id', [])
            ->columns(['total' => new \Zend_Db_Expr('COUNT(DISTINCT cpe.entity_id)')])
            ->where('venue_v.attribute_id = ?', $venueAttrId)
            ->where('venue_v.store_id = ?', 0)
            ->where('venue_v.value IN (?)', $rawNames);

        $totalCount = (int)$connection->fetchOne($countSelect);

        // Pagination
        $select->limitPage($currentPage, $pageSize);

        $rows = $connection->fetchAll($select);

        // Get artist slugs
        $artistSlugs = $this->getArtistSlugs($connection, array_unique(array_filter(array_column($rows, 'artist_name'))));

        $items = [];
        foreach ($rows as $row) {
            $artistName = $row['artist_name'] ?? 'Unknown';

            // Parse song_urls JSON for quality URLs, fall back to song_url
            $urlHigh = null;
            $urlMedium = null;
            $urlLow = null;
            $songUrlsJson = $row['song_urls_json'] ?? null;
            if ($songUrlsJson) {
                $qualityUrls = json_decode($songUrlsJson, true);
                if (is_array($qualityUrls)) {
                    $urlHigh = $qualityUrls['high']['url'] ?? null;
                    $urlMedium = $qualityUrls['medium']['url'] ?? null;
                    $urlLow = $qualityUrls['low']['url'] ?? null;
                }
            }
            // Fallback: use legacy song_url for high if no JSON
            $legacyUrl = $row['song_url'] ?? null;
            if (!$urlHigh && $legacyUrl) {
                $urlHigh = $legacyUrl;
            }

            $items[] = [
                'uid'                => base64_encode((string)$row['entity_id']),
                'sku'                => $row['sku'],
                'name'               => $row['name'] ?: $row['sku'],
                'song_title'         => $row['song_title'] ?? null,
                'song_duration'      => $row['song_duration'] ? (int)$row['song_duration'] : null,
                'song_url_high'      => $urlHigh,
                'song_url_medium'    => $urlMedium,
                'song_url_low'       => $urlLow,
                'show_date'          => $row['show_date'] ?? null,
                'show_name'          => $row['show_name'] ?? null,
                'identifier'         => $row['identifier'] ?? null,
                'artist_name'        => $artistName,
                'artist_slug'        => $artistSlugs[$artistName] ?? '',
                'recording_type'     => $row['recording_type'] ?? null,
                'archive_avg_rating' => $row['archive_avg_rating'] ?? null,
                'archive_downloads'  => $row['archive_downloads'] !== null ? (int)$row['archive_downloads'] : null,
                'is_streamable'      => $row['is_streamable'] !== null ? (bool)$row['is_streamable'] : true,
                'show_venue'         => $row['show_venue'] ?? null,
                'show_location'      => $row['show_location'] ?? null,
                'show_taper'         => $row['show_taper'] ?? null,
                'lineage'            => $row['lineage'] ?? null,
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

    private function getArtistSlugs($connection, array $artistNames): array
    {
        if (empty($artistNames)) {
            return [];
        }

        $catVarcharTable = $connection->getTableName('catalog_category_entity_varchar');
        $eavAttr = $connection->getTableName('eav_attribute');

        $nameAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'name')
                ->where('entity_type_id = ?', 3)
        );

        $urlKeyAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'url_key')
                ->where('entity_type_id = ?', 3)
        );

        if (!$nameAttrId || !$urlKeyAttrId) {
            return [];
        }

        $select = $connection->select()
            ->from(['cat_name' => $catVarcharTable], ['name' => 'cat_name.value'])
            ->join(
                ['cat_url' => $catVarcharTable],
                "cat_url.entity_id = cat_name.entity_id AND cat_url.attribute_id = {$urlKeyAttrId} AND cat_url.store_id = 0",
                ['slug' => 'cat_url.value']
            )
            ->where('cat_name.attribute_id = ?', $nameAttrId)
            ->where('cat_name.store_id = ?', 0)
            ->where('cat_name.value IN (?)', $artistNames);

        $rows = $connection->fetchAll($select);
        $slugs = [];
        foreach ($rows as $row) {
            $slugs[$row['name']] = $row['slug'];
        }

        return $slugs;
    }
}
