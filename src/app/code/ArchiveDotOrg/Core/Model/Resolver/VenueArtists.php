<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for Venue.artists field - returns artists who played at a venue.
 * Uses varchar tables (show_venue and archive_collection migrated from int).
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

        // Get attribute IDs — all varchar after migration
        $attrCodes = ['show_venue', 'archive_collection', 'identifier'];
        $attrRows = $connection->fetchPairs(
            $connection->select()
                ->from($eavAttr, ['attribute_code', 'attribute_id'])
                ->where('attribute_code IN (?)', $attrCodes)
                ->where('entity_type_id = ?', 4)
        );

        $venueAttrId = (int)($attrRows['show_venue'] ?? 0);
        $collectionAttrId = (int)($attrRows['archive_collection'] ?? 0);
        $identifierAttrId = (int)($attrRows['identifier'] ?? 0);

        if (!$venueAttrId || !$collectionAttrId) {
            return [];
        }

        $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');
        $cpeTable = $connection->getTableName('catalog_product_entity');

        // Query products at this venue, grouped by artist (archive_collection varchar value)
        $select = $connection->select()
            ->from(['venue_v' => $cpeVarcharTable], [])
            ->join(['cpe' => $cpeTable], 'venue_v.entity_id = cpe.entity_id', [])
            ->join(
                ['coll' => $cpeVarcharTable],
                "coll.entity_id = cpe.entity_id AND coll.attribute_id = {$collectionAttrId} AND coll.store_id = 0",
                ['artist_name' => 'coll.value']
            )
            ->where('venue_v.attribute_id = ?', $venueAttrId)
            ->where('venue_v.store_id = ?', 0)
            ->where('venue_v.value IN (?)', $rawNames);

        // Count distinct shows (identifiers) per artist
        if ($identifierAttrId) {
            $select->joinLeft(
                ['ident' => $cpeVarcharTable],
                "ident.entity_id = cpe.entity_id AND ident.attribute_id = {$identifierAttrId} AND ident.store_id = 0",
                []
            );
            $select->columns(['show_count' => new \Zend_Db_Expr('COUNT(DISTINCT ident.value)')]);
        } else {
            $select->columns(['show_count' => new \Zend_Db_Expr('COUNT(DISTINCT cpe.entity_id)')]);
        }

        $select->group('coll.value')
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
