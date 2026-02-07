<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for Venue.artists field - returns artists who played at a venue
 */
class VenueArtists implements ResolverInterface
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
            return [];
        }

        $connection = $this->resourceConnection->getConnection();

        // Get venue's raw names from alias table
        $aliasTable = $connection->getTableName('archivedotorg_venue_alias');
        $rawNames = $connection->fetchCol(
            $connection->select()->from($aliasTable, ['raw_name'])->where('venue_id = ?', $venueId)
        );

        if (empty($rawNames)) {
            return [];
        }

        $eavAttr = $connection->getTableName('eav_attribute');

        // Get show_venue attribute ID
        $venueAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_venue')
                ->where('entity_type_id = ?', 4)
        );

        // Get archive_collection attribute ID
        $collectionAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'archive_collection')
                ->where('entity_type_id = ?', 4)
        );

        // Get identifier attribute ID (to count distinct shows, not tracks)
        $identifierAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'identifier')
                ->where('entity_type_id = ?', 4)
        );

        if (!$venueAttrId || !$collectionAttrId) {
            return [];
        }

        // Find matching venue option IDs
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
            return [];
        }

        // Query products at this venue, grouped by artist (archive_collection)
        $cpeIntTable = $connection->getTableName('catalog_product_entity_int');
        $cpeTable = $connection->getTableName('catalog_product_entity');
        $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');

        $select = $connection->select()
            ->from(['venue_val' => $cpeIntTable], [])
            ->join(['cpe' => $cpeTable], 'venue_val.entity_id = cpe.entity_id', [])
            ->join(
                ['coll' => $cpeIntTable],
                "coll.entity_id = cpe.entity_id AND coll.attribute_id = {$collectionAttrId} AND coll.store_id = 0",
                []
            )
            ->join(
                ['coll_val' => $optionValueTable],
                'coll.value = coll_val.option_id AND coll_val.store_id = 0',
                ['artist_name' => 'coll_val.value']
            )
            ->joinLeft(
                ['ident' => $cpeVarcharTable],
                "ident.entity_id = cpe.entity_id AND ident.attribute_id = {$identifierAttrId} AND ident.store_id = 0",
                []
            )
            ->columns(['show_count' => new \Zend_Db_Expr('COUNT(DISTINCT ident.value)')])
            ->where('venue_val.attribute_id = ?', $venueAttrId)
            ->where('venue_val.store_id = ?', 0)
            ->where('venue_val.value IN (?)', $optionIds)
            ->group('coll_val.value')
            ->order('show_count DESC');

        $artists = $connection->fetchAll($select);

        // Get artist URL slugs
        $artistNames = array_column($artists, 'artist_name');
        $artistSlugs = $this->getArtistSlugs($connection, $artistNames);

        $items = [];
        foreach ($artists as $artist) {
            $name = $artist['artist_name'];
            $items[] = [
                'name' => $name,
                'slug' => $artistSlugs[$name] ?? '',
                'show_count' => (int)$artist['show_count'],
            ];
        }

        return $items;
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
