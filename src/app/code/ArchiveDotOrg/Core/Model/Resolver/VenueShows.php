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

        // Get the venue's raw names from alias table to match against show_venue options
        $aliasTable = $connection->getTableName('archivedotorg_venue_alias');
        $rawNames = $connection->fetchCol(
            $connection->select()->from($aliasTable, ['raw_name'])->where('venue_id = ?', $venueId)
        );

        if (empty($rawNames)) {
            return ['items' => [], 'total_count' => 0, 'page_info' => null];
        }

        // Get show_venue attribute ID
        $eavAttr = $connection->getTableName('eav_attribute');
        $venueAttrId = (int)$connection->fetchOne(
            $connection->select()
                ->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_venue')
                ->where('entity_type_id = ?', 4)
        );

        if (!$venueAttrId) {
            return ['items' => [], 'total_count' => 0, 'page_info' => null];
        }

        // Find matching option IDs from eav_attribute_option_value
        $optionValueTable = $connection->getTableName('eav_attribute_option_value');
        $optionTable = $connection->getTableName('eav_attribute_option');

        $optionIds = $connection->fetchCol(
            $connection->select()
                ->from(['eaov' => $optionValueTable], ['eaov.option_id'])
                ->join(['eao' => $optionTable], 'eaov.option_id = eao.option_id', [])
                ->where('eao.attribute_id = ?', $venueAttrId)
                ->where('eaov.store_id = ?', 0)
                ->where('eaov.value IN (?)', $rawNames)
        );

        if (empty($optionIds)) {
            return ['items' => [], 'total_count' => 0, 'page_info' => null];
        }

        // Get products at this venue grouped by show identifier
        $cpeIntTable = $connection->getTableName('catalog_product_entity_int');
        $cpeTable = $connection->getTableName('catalog_product_entity');
        $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');
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

        // Get archive_collection attribute ID (int/select)
        $collectionAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'archive_collection')
                ->where('entity_type_id = ?', 4)
        );

        // Build the main query: group products by identifier to get shows
        // Note: show_date uses datetime table, others use varchar/int as appropriate
        $showsSelect = $connection->select()
            ->from(['cpei' => $cpeIntTable], [])
            ->join(['cpe' => $cpeTable], 'cpei.entity_id = cpe.entity_id', [])
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
                ['coll' => $cpeIntTable],
                "coll.entity_id = cpe.entity_id AND coll.attribute_id = {$collectionAttrId} AND coll.store_id = 0",
                []
            )
            ->joinLeft(
                ['coll_val' => $optionValueTable],
                'coll.value = coll_val.option_id AND coll_val.store_id = 0',
                ['artist_name' => 'coll_val.value']
            )
            ->columns(['track_count' => new \Zend_Db_Expr('COUNT(DISTINCT cpe.entity_id)')])
            ->where('cpei.attribute_id = ?', $venueAttrId)
            ->where('cpei.store_id = ?', 0)
            ->where('cpei.value IN (?)', $optionIds)
            ->group('ident.value')
            ->order('sdate.value DESC');

        // Count total distinct shows
        $countSelect = $connection->select()
            ->from(['cpei' => $cpeIntTable], [])
            ->join(['cpe' => $cpeTable], 'cpei.entity_id = cpe.entity_id', [])
            ->joinLeft(
                ['ident' => $cpeVarcharTable],
                "ident.entity_id = cpe.entity_id AND ident.attribute_id = {$identifierAttrId} AND ident.store_id = 0",
                []
            )
            ->columns(['total' => new \Zend_Db_Expr('COUNT(DISTINCT ident.value)')])
            ->where('cpei.attribute_id = ?', $venueAttrId)
            ->where('cpei.store_id = ?', 0)
            ->where('cpei.value IN (?)', $optionIds);

        $totalCount = (int)$connection->fetchOne($countSelect);

        // Apply pagination
        $showsSelect->limitPage($currentPage, $pageSize);

        $shows = $connection->fetchAll($showsSelect);

        // Get artist URL keys for slug
        $artistSlugs = $this->getArtistSlugs($connection, array_unique(array_column($shows, 'artist_name')));

        $items = [];
        foreach ($shows as $show) {
            $artistName = $show['artist_name'] ?? 'Unknown';
            $items[] = [
                'identifier' => $show['identifier'] ?? '',
                'name' => $show['show_name'] ?? $show['identifier'] ?? '',
                'show_date' => $show['show_date'] ?? null,
                'artist_name' => $artistName,
                'artist_slug' => $artistSlugs[$artistName] ?? '',
                'track_count' => (int)$show['track_count'],
                'recording_types' => [],
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
