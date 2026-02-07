<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Exception\GraphQlNoSuchEntityException;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for venue(slug) GraphQL query
 */
class Venue implements ResolverInterface
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
        $slug = $args['slug'] ?? null;
        if (!$slug) {
            throw new GraphQlInputException(__('Venue slug is required'));
        }

        $connection = $this->resourceConnection->getConnection();
        $tableName = $connection->getTableName('archivedotorg_venue');

        $select = $connection->select()
            ->from($tableName)
            ->where('slug = ?', $slug)
            ->limit(1);

        $venue = $connection->fetchRow($select);

        if (!$venue) {
            throw new GraphQlNoSuchEntityException(__('Venue with slug "%1" not found', $slug));
        }

        return [
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
}
