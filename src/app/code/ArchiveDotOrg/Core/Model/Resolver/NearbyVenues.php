<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for Venue.nearby_venues field - Haversine distance query
 */
class NearbyVenues implements ResolverInterface
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
        $lat = $value['latitude'] ?? null;
        $lon = $value['longitude'] ?? null;

        if (!$venueId || $lat === null || $lon === null) {
            return [];
        }

        $radiusMiles = (float)($args['radius_miles'] ?? 50);
        $radiusMiles = max(1, min($radiusMiles, 500));

        $connection = $this->resourceConnection->getConnection();
        $tableName = $connection->getTableName('archivedotorg_venue');

        // Haversine formula: 3959 = Earth's radius in miles
        $haversine = new \Zend_Db_Expr(sprintf(
            '3959 * ACOS(COS(RADIANS(%s)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(%s)) + SIN(RADIANS(%s)) * SIN(RADIANS(latitude)))',
            $connection->quote($lat),
            $connection->quote($lon),
            $connection->quote($lat)
        ));

        $select = $connection->select()
            ->from($tableName)
            ->columns(['distance' => $haversine])
            ->where('venue_id != ?', $venueId)
            ->where('latitude IS NOT NULL')
            ->where('longitude IS NOT NULL')
            ->having('distance <= ?', $radiusMiles)
            ->order('distance ASC')
            ->limit(10);

        $venues = $connection->fetchAll($select);

        $items = [];
        foreach ($venues as $venue) {
            $items[] = [
                'venue_id' => (int)$venue['venue_id'],
                'slug' => $venue['slug'],
                'normalized_name' => $venue['normalized_name'],
                'city' => $venue['city'],
                'state' => $venue['state'],
                'country' => $venue['country'],
                'latitude' => $venue['latitude'] !== null ? (float)$venue['latitude'] : null,
                'longitude' => $venue['longitude'] !== null ? (float)$venue['longitude'] : null,
                'total_shows' => (int)$venue['total_shows'],
                'total_artists' => (int)$venue['total_artists'],
                'total_tracks' => (int)$venue['total_tracks'],
                'first_show_date' => $venue['first_show_date'],
                'last_show_date' => $venue['last_show_date'],
            ];
        }

        return $items;
    }
}
