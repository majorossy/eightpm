<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for Venue.shows field - returns shows at a specific venue
 */
class VenueShows implements ResolverInterface
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

        $connection = $this->resourceConnection->getConnection();

        // Get the venue's raw names from alias table to match against show_venue values
        $aliasTable = $connection->getTableName('archivedotorg_venue_alias');
        $rawNames = $connection->fetchCol(
            $connection->select()->from($aliasTable, ['raw_name'])->where('venue_id = ?', $venueId)
        );

        if (empty($rawNames)) {
            return ['items' => [], 'total_count' => 0, 'page_info' => null];
        }

        $eavAttr = $connection->getTableName('eav_attribute');

        // Get show_venue attribute ID (varchar backend after migration)
        $venueAttrId = (int)$connection->fetchOne(
            $connection->select()
                ->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_venue')
                ->where('entity_type_id = ?', 4)
        );

        if (!$venueAttrId) {
            return ['items' => [], 'total_count' => 0, 'page_info' => null];
        }

        $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');
        $cpeTable = $connection->getTableName('catalog_product_entity');
        $cpeDatetimeTable = $connection->getTableName('catalog_product_entity_datetime');

        // Get identifier attribute ID (varchar)
        $identifierAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'identifier')
                ->where('entity_type_id = ?', 4)
        );

        // Get show_date attribute ID (datetime backend type)
        $showDateAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_date')
                ->where('entity_type_id = ?', 4)
        );

        // Get show_name attribute ID (varchar)
        $showNameAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_name')
                ->where('entity_type_id = ?', 4)
        );

        // Get archive_collection attribute ID (varchar after migration)
        $collectionAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'archive_collection')
                ->where('entity_type_id = ?', 4)
        );

        // Build the main query using varchar table directly for show_venue.
        // No longer needs eav_attribute_option_value join — values are stored as text.
        $showsSelect = $connection->select()
            ->from(['venue_v' => $cpeVarcharTable], [])
            ->join(['cpe' => $cpeTable], 'venue_v.entity_id = cpe.entity_id', [])
            ->joinLeft(
                ['ident' => $cpeVarcharTable],
                "ident.entity_id = cpe.entity_id AND ident.attribute_id = {$identifierAttrId} AND ident.store_id = 0",
                ['identifier' => 'ident.value']
            )
            ->joinLeft(
                ['sdate' => $cpeDatetimeTable],
                "sdate.entity_id = cpe.entity_id AND sdate.attribute_id = {$showDateAttrId} AND sdate.store_id = 0",
                ['show_date' => new \Zend_Db_Expr('DATE(sdate.value)')]
            )
            ->joinLeft(
                ['sname' => $cpeVarcharTable],
                "sname.entity_id = cpe.entity_id AND sname.attribute_id = {$showNameAttrId} AND sname.store_id = 0",
                ['show_name' => 'sname.value']
            )
            ->joinLeft(
                ['coll' => $cpeVarcharTable],
                "coll.entity_id = cpe.entity_id AND coll.attribute_id = {$collectionAttrId} AND coll.store_id = 0",
                ['artist_name' => 'coll.value']
            )
            ->columns(['track_count' => new \Zend_Db_Expr('COUNT(DISTINCT cpe.entity_id)')])
            ->where('venue_v.attribute_id = ?', $venueAttrId)
            ->where('venue_v.store_id = ?', 0)
            ->where('venue_v.value IN (?)', $rawNames)
            ->group('ident.value')
            ->order('sdate.value DESC');

        // Count total distinct shows
        $countSelect = $connection->select()
            ->from(['venue_v' => $cpeVarcharTable], [])
            ->join(['cpe' => $cpeTable], 'venue_v.entity_id = cpe.entity_id', [])
            ->joinLeft(
                ['ident' => $cpeVarcharTable],
                "ident.entity_id = cpe.entity_id AND ident.attribute_id = {$identifierAttrId} AND ident.store_id = 0",
                []
            )
            ->columns(['total' => new \Zend_Db_Expr('COUNT(DISTINCT ident.value)')])
            ->where('venue_v.attribute_id = ?', $venueAttrId)
            ->where('venue_v.store_id = ?', 0)
            ->where('venue_v.value IN (?)', $rawNames);

        $totalCount = (int)$connection->fetchOne($countSelect);

        // Apply pagination
        $showsSelect->limitPage($currentPage, $pageSize);

        $shows = $connection->fetchAll($showsSelect);

        // Get artist URL keys for slug
        $artistSlugs = $this->getArtistSlugs($connection, array_unique(array_column($shows, 'artist_name')));

        // Batch-query recording_type for all show identifiers
        $recTypeMap = $this->getRecordingTypes($connection, array_filter(array_column($shows, 'identifier')));

        $items = [];
        foreach ($shows as $show) {
            $artistName = $show['artist_name'] ?? 'Unknown';
            $identifier = $show['identifier'] ?? '';
            $items[] = [
                'identifier' => $identifier,
                'name' => $show['show_name'] ?? $identifier,
                'show_date' => $show['show_date'] ?? null,
                'artist_name' => $artistName,
                'artist_slug' => $artistSlugs[$artistName] ?? '',
                'track_count' => (int)$show['track_count'],
                'recording_types' => $recTypeMap[$identifier] ?? [],
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

    private function getRecordingTypes($connection, array $identifiers): array
    {
        if (empty($identifiers)) {
            return [];
        }

        $eavAttr = $connection->getTableName('eav_attribute');
        $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');

        $identifierAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'identifier')
                ->where('entity_type_id = ?', 4)
        );

        $recTypeAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'recording_type')
                ->where('entity_type_id = ?', 4)
        );

        if (!$identifierAttrId || !$recTypeAttrId) {
            return [];
        }

        $select = $connection->select()
            ->from(['ident' => $cpeVarcharTable], ['identifier' => 'ident.value'])
            ->join(
                ['rtype' => $cpeVarcharTable],
                "rtype.entity_id = ident.entity_id AND rtype.attribute_id = {$recTypeAttrId} AND rtype.store_id = 0",
                ['recording_type' => 'rtype.value']
            )
            ->where('ident.attribute_id = ?', $identifierAttrId)
            ->where('ident.store_id = ?', 0)
            ->where('ident.value IN (?)', $identifiers)
            ->group(['ident.value', 'rtype.value']);

        $rows = $connection->fetchAll($select);

        $map = [];
        foreach ($rows as $row) {
            $id = $row['identifier'];
            $type = $row['recording_type'];
            if ($type && !in_array($type, $map[$id] ?? [], true)) {
                $map[$id][] = $type;
            }
        }

        return $map;
    }

    private function getArtistSlugs($connection, array $artistNames): array
    {
        if (empty($artistNames)) {
            return [];
        }

        $catTable = $connection->getTableName('catalog_category_entity');
        $catVarcharTable = $connection->getTableName('catalog_category_entity_varchar');
        $eavAttr = $connection->getTableName('eav_attribute');

        // Get the 'name' attribute ID for categories (entity_type_id = 3)
        $nameAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'name')
                ->where('entity_type_id = ?', 3)
        );

        // Get url_key attribute ID for categories
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
