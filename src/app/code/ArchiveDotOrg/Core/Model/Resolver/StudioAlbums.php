<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for studioAlbums GraphQL query
 */
class StudioAlbums implements ResolverInterface
{
    private ResourceConnection $resourceConnection;

    public function __construct(
        ResourceConnection $resourceConnection
    ) {
        $this->resourceConnection = $resourceConnection;
    }

    /**
     * @inheritDoc
     */
    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $artistName = $args['artistName'] ?? null;

        $connection = $this->resourceConnection->getConnection();
        $tableName = $connection->getTableName('archivedotorg_studio_albums');

        $categoryTable = $connection->getTableName('catalog_category_entity');

        $select = $connection->select()
            ->from(['sa' => $tableName])
            ->joinLeft(
                ['c' => $categoryTable],
                'sa.category_id = c.entity_id',
                ['track_count' => 'children_count']
            )
            ->where('sa.artwork_url IS NOT NULL')
            ->order('sa.release_year DESC');

        if ($artistName !== null) {
            $select->where('sa.artist_name = ?', $artistName);
        }

        $albums = $connection->fetchAll($select);

        // Convert to GraphQL output format
        $items = [];
        foreach ($albums as $album) {
            $items[] = [
                'entity_id' => (int)$album['entity_id'],
                'artist_name' => $album['artist_name'],
                'album_title' => $album['album_title'],
                'release_year' => $album['release_year'] ? (int)$album['release_year'] : null,
                'release_date' => $album['release_date'],
                'musicbrainz_id' => $album['musicbrainz_id'],
                'artwork_url' => $album['artwork_url'],
                'category_id' => $album['category_id'] ? (int)$album['category_id'] : null,
                'track_count' => $album['track_count'] ? (int)$album['track_count'] : null,
                'is_locked' => (bool)($album['is_locked'] ?? false),
            ];
        }

        return [
            'items' => $items,
            'total_count' => count($items)
        ];
    }
}
