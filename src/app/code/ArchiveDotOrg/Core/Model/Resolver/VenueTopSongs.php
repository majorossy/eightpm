<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for Venue.top_songs — most frequently played songs at a venue.
 */
class VenueTopSongs implements ResolverInterface
{
    private ResourceConnection $resourceConnection;

    /** Noise titles to exclude from setlist stats */
    private const NOISE_TITLES = [
        'intro', 'banter', 'crowd', 'tuning', 'applause', 'encore break',
        'intermission', 'stage banter', 'crowd noise', 'band introductions',
        'band intros', 'set break', 'sound check', 'soundcheck',
    ];

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

        $limit = max(1, min((int)($args['limit'] ?? 25), 100));
        $connection = $this->resourceConnection->getConnection();

        // Get venue raw names from alias table
        $aliasTable = $connection->getTableName('archivedotorg_venue_alias');
        $rawNames = $connection->fetchCol(
            $connection->select()->from($aliasTable, ['raw_name'])->where('venue_id = ?', $venueId)
        );

        if (empty($rawNames)) {
            return [];
        }

        $eavAttr = $connection->getTableName('eav_attribute');

        // Get attribute IDs
        $attrCodes = ['show_venue', 'title', 'archive_collection', 'show_date'];
        $attrRows = $connection->fetchPairs(
            $connection->select()
                ->from($eavAttr, ['attribute_code', 'attribute_id'])
                ->where('attribute_code IN (?)', $attrCodes)
                ->where('entity_type_id = ?', 4)
        );

        $venueAttrId = (int)($attrRows['show_venue'] ?? 0);
        $titleAttrId = (int)($attrRows['title'] ?? 0);
        $collAttrId = (int)($attrRows['archive_collection'] ?? 0);
        $dateAttrId = (int)($attrRows['show_date'] ?? 0);

        if (!$venueAttrId || !$titleAttrId) {
            return [];
        }

        $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');
        $cpeTable = $connection->getTableName('catalog_product_entity');
        $cpeDatetimeTable = $connection->getTableName('catalog_product_entity_datetime');

        // Build query: join venue + title + collection + date, group by title
        $select = $connection->select()
            ->from(['venue_v' => $cpeVarcharTable], [])
            ->join(['cpe' => $cpeTable], 'venue_v.entity_id = cpe.entity_id', [])
            ->join(
                ['ttl' => $cpeVarcharTable],
                "ttl.entity_id = cpe.entity_id AND ttl.attribute_id = {$titleAttrId} AND ttl.store_id = 0",
                ['song_title' => 'ttl.value']
            )
            ->where('venue_v.attribute_id = ?', $venueAttrId)
            ->where('venue_v.store_id = ?', 0)
            ->where('venue_v.value IN (?)', $rawNames);

        // Exclude noise titles
        $noiseConditions = [];
        foreach (self::NOISE_TITLES as $noise) {
            $noiseConditions[] = $connection->quoteInto('LOWER(ttl.value) = ?', $noise);
        }
        if (!empty($noiseConditions)) {
            $select->where('NOT (' . implode(' OR ', $noiseConditions) . ')');
        }
        // Also exclude empty/null titles
        $select->where('ttl.value IS NOT NULL');
        $select->where("ttl.value != ''");

        // Collection join for artist names
        if ($collAttrId) {
            $select->joinLeft(
                ['coll' => $cpeVarcharTable],
                "coll.entity_id = cpe.entity_id AND coll.attribute_id = {$collAttrId} AND coll.store_id = 0",
                ['artists_csv' => new \Zend_Db_Expr('GROUP_CONCAT(DISTINCT coll.value)')]
            );
        } else {
            $select->columns(['artists_csv' => new \Zend_Db_Expr("''")]);
        }

        // Date join for first/last played
        if ($dateAttrId) {
            $select->joinLeft(
                ['sdate' => $cpeDatetimeTable],
                "sdate.entity_id = cpe.entity_id AND sdate.attribute_id = {$dateAttrId} AND sdate.store_id = 0",
                [
                    'first_played' => new \Zend_Db_Expr('MIN(DATE(sdate.value))'),
                    'last_played' => new \Zend_Db_Expr('MAX(DATE(sdate.value))'),
                ]
            );
        } else {
            $select->columns([
                'first_played' => new \Zend_Db_Expr('NULL'),
                'last_played' => new \Zend_Db_Expr('NULL'),
            ]);
        }

        $select->columns(['play_count' => new \Zend_Db_Expr('COUNT(DISTINCT cpe.entity_id)')]);
        $select->group('ttl.value');
        $select->order('play_count DESC');
        $select->limit($limit);

        $rows = $connection->fetchAll($select);

        $items = [];
        foreach ($rows as $row) {
            $artistsCsv = $row['artists_csv'] ?? '';
            $artists = $artistsCsv ? array_unique(array_filter(explode(',', $artistsCsv))) : [];

            $items[] = [
                'song_title' => $row['song_title'],
                'play_count' => (int)$row['play_count'],
                'artists' => $artists,
                'first_played' => $row['first_played'] ?? null,
                'last_played' => $row['last_played'] ?? null,
            ];
        }

        return $items;
    }
}
