<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use Magento\Framework\App\ResourceConnection;

class VenueMapService
{
    private ResourceConnection $resourceConnection;
    private ?array $map = null;

    public function __construct(ResourceConnection $resourceConnection)
    {
        $this->resourceConnection = $resourceConnection;
    }

    /**
     * Resolve a raw venue name to canonical venue info
     *
     * @return array{normalized_name: string, slug: string, city: ?string, state: ?string}|null
     */
    public function resolve(string $rawVenue): ?array
    {
        $this->loadMap();
        $key = mb_strtolower(trim($rawVenue));
        return $this->map[$key] ?? null;
    }

    private function loadMap(): void
    {
        if ($this->map !== null) {
            return;
        }

        $connection = $this->resourceConnection->getConnection();
        $select = $connection->select()
            ->from(
                ['va' => $connection->getTableName('archivedotorg_venue_alias')],
                ['raw_name']
            )
            ->join(
                ['v' => $connection->getTableName('archivedotorg_venue')],
                'va.venue_id = v.venue_id',
                ['normalized_name', 'slug', 'city', 'state']
            );

        $rows = $connection->fetchAll($select);
        $this->map = [];
        foreach ($rows as $row) {
            $key = mb_strtolower(trim($row['raw_name']));
            $this->map[$key] = [
                'normalized_name' => $row['normalized_name'],
                'slug' => $row['slug'],
                'city' => $row['city'],
                'state' => $row['state'],
            ];
        }
    }
}
