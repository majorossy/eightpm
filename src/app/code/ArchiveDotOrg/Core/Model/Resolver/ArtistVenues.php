<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for CategoryInterface.artist_venues field
 * Returns venue counts for an artist (used in venue word cloud)
 */
class ArtistVenues implements ResolverInterface
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
        // This resolves on CategoryInterface - get the category ID
        $categoryId = $value['id'] ?? null;
        if (!$categoryId) {
            return [];
        }

        $connection = $this->resourceConnection->getConnection();
        $eavAttr = $connection->getTableName('eav_attribute');

        // Get show_venue attribute ID (product attribute, entity_type_id = 4)
        $venueAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_venue')
                ->where('entity_type_id = ?', 4)
        );

        if (!$venueAttrId) {
            return [];
        }

        // Get products in this category from the category-product index
        $catProdTable = $connection->getTableName('catalog_category_product');
        $cpeIntTable = $connection->getTableName('catalog_product_entity_int');
        $optionValueTable = $connection->getTableName('eav_attribute_option_value');
        $venueTable = $connection->getTableName('archivedotorg_venue');
        $aliasTable = $connection->getTableName('archivedotorg_venue_alias');

        // Query: get venue option values for products in this category, count recordings
        $select = $connection->select()
            ->from(['ccp' => $catProdTable], [])
            ->join(
                ['cpei' => $cpeIntTable],
                "cpei.entity_id = ccp.product_id AND cpei.attribute_id = {$venueAttrId} AND cpei.store_id = 0",
                []
            )
            ->join(
                ['eaov' => $optionValueTable],
                'cpei.value = eaov.option_id AND eaov.store_id = 0',
                ['venue_name' => 'eaov.value']
            )
            ->joinLeft(
                ['va' => $aliasTable],
                'va.raw_name = eaov.value',
                []
            )
            ->joinLeft(
                ['v' => $venueTable],
                'va.venue_id = v.venue_id',
                [
                    'venue_slug' => 'v.slug',
                    'city' => 'v.city',
                    'state' => 'v.state',
                ]
            )
            ->columns(['recording_count' => new \Zend_Db_Expr('COUNT(*)')])
            ->where('ccp.category_id = ?', $categoryId)
            ->group('eaov.value')
            ->order('recording_count DESC')
            ->limit(50);

        $venueData = $connection->fetchAll($select);

        $items = [];
        foreach ($venueData as $row) {
            $items[] = [
                'venue_name' => $row['venue_name'],
                'venue_slug' => $row['venue_slug'] ?? '',
                'recording_count' => (int)$row['recording_count'],
                'city' => $row['city'] ?? null,
                'state' => $row['state'] ?? null,
            ];
        }

        return $items;
    }
}
