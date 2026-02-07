<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for venues(search, city, state) GraphQL query
 */
class Venues implements ResolverInterface
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
        $search = $args['search'] ?? null;
        $city = $args['city'] ?? null;
        $state = $args['state'] ?? null;
        $pageSize = max(1, min((int)($args['pageSize'] ?? 20), 100));
        $currentPage = max(1, (int)($args['currentPage'] ?? 1));

        $connection = $this->resourceConnection->getConnection();
        $tableName = $connection->getTableName('archivedotorg_venue');

        // Count query
        $countSelect = $connection->select()
            ->from($tableName, ['COUNT(*)']);

        // Data query
        $dataSelect = $connection->select()
            ->from($tableName)
            ->order('total_shows DESC')
            ->limitPage($currentPage, $pageSize);

        if ($search) {
            $searchLike = '%' . $search . '%';
            $countSelect->where('normalized_name LIKE ?', $searchLike);
            $dataSelect->where('normalized_name LIKE ?', $searchLike);
        }

        if ($city) {
            $countSelect->where('city = ?', $city);
            $dataSelect->where('city = ?', $city);
        }

        if ($state) {
            $countSelect->where('state = ?', $state);
            $dataSelect->where('state = ?', $state);
        }

        $totalCount = (int)$connection->fetchOne($countSelect);
        $venues = $connection->fetchAll($dataSelect);

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
}
