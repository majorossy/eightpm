<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Setup\Patch\Schema;

use Magento\Framework\Setup\Patch\SchemaPatchInterface;
use Magento\Framework\Setup\SchemaSetupInterface;
use Magento\Framework\DB\Ddl\Table;
use Magento\Framework\DB\Adapter\AdapterInterface;

/**
 * Create venue and venue alias tables for venue pages feature
 */
class AddVenueTable implements SchemaPatchInterface
{
    private SchemaSetupInterface $schemaSetup;

    public function __construct(SchemaSetupInterface $schemaSetup)
    {
        $this->schemaSetup = $schemaSetup;
    }

    public static function getDependencies(): array
    {
        return [];
    }

    public function getAliases(): array
    {
        return [];
    }

    public function apply(): void
    {
        $this->schemaSetup->startSetup();

        $connection = $this->schemaSetup->getConnection();

        $this->createVenueTable($connection);
        $this->createVenueAliasTable($connection);

        $this->schemaSetup->endSetup();
    }

    private function createVenueTable($connection): void
    {
        $tableName = $this->schemaSetup->getTable('archivedotorg_venue');

        if ($connection->isTableExists($tableName)) {
            return;
        }

        $table = $connection->newTable($tableName)
            ->addColumn(
                'venue_id',
                Table::TYPE_INTEGER,
                null,
                ['identity' => true, 'unsigned' => true, 'nullable' => false, 'primary' => true],
                'Venue ID'
            )
            ->addColumn(
                'slug',
                Table::TYPE_TEXT,
                255,
                ['nullable' => false],
                'URL Slug'
            )
            ->addColumn(
                'normalized_name',
                Table::TYPE_TEXT,
                255,
                ['nullable' => false],
                'Normalized Venue Name'
            )
            ->addColumn(
                'city',
                Table::TYPE_TEXT,
                100,
                ['nullable' => true],
                'City'
            )
            ->addColumn(
                'state',
                Table::TYPE_TEXT,
                50,
                ['nullable' => true],
                'State'
            )
            ->addColumn(
                'country',
                Table::TYPE_TEXT,
                2,
                ['nullable' => false, 'default' => 'US'],
                'Country Code'
            )
            ->addColumn(
                'latitude',
                Table::TYPE_DECIMAL,
                '10,8',
                ['nullable' => true],
                'Latitude'
            )
            ->addColumn(
                'longitude',
                Table::TYPE_DECIMAL,
                '11,8',
                ['nullable' => true],
                'Longitude'
            )
            ->addColumn(
                'total_shows',
                Table::TYPE_INTEGER,
                null,
                ['unsigned' => true, 'nullable' => false, 'default' => 0],
                'Total Shows'
            )
            ->addColumn(
                'total_artists',
                Table::TYPE_INTEGER,
                null,
                ['unsigned' => true, 'nullable' => false, 'default' => 0],
                'Total Artists'
            )
            ->addColumn(
                'total_tracks',
                Table::TYPE_INTEGER,
                null,
                ['unsigned' => true, 'nullable' => false, 'default' => 0],
                'Total Tracks'
            )
            ->addColumn(
                'first_show_date',
                Table::TYPE_DATE,
                null,
                ['nullable' => true],
                'First Show Date'
            )
            ->addColumn(
                'last_show_date',
                Table::TYPE_DATE,
                null,
                ['nullable' => true],
                'Last Show Date'
            )
            ->addColumn(
                'created_at',
                Table::TYPE_TIMESTAMP,
                null,
                ['nullable' => false, 'default' => Table::TIMESTAMP_INIT],
                'Created At'
            )
            ->addColumn(
                'updated_at',
                Table::TYPE_TIMESTAMP,
                null,
                ['nullable' => false, 'default' => Table::TIMESTAMP_INIT_UPDATE],
                'Updated At'
            )
            ->addIndex(
                $this->schemaSetup->getIdxName($tableName, ['slug'], AdapterInterface::INDEX_TYPE_UNIQUE),
                ['slug'],
                ['type' => AdapterInterface::INDEX_TYPE_UNIQUE]
            )
            ->addIndex(
                $this->schemaSetup->getIdxName($tableName, ['city', 'state']),
                ['city', 'state']
            )
            ->addIndex(
                $this->schemaSetup->getIdxName($tableName, ['latitude', 'longitude']),
                ['latitude', 'longitude']
            )
            ->setComment('Archive.org Venue Table');

        $connection->createTable($table);
    }

    private function createVenueAliasTable($connection): void
    {
        $tableName = $this->schemaSetup->getTable('archivedotorg_venue_alias');
        $venueTableName = $this->schemaSetup->getTable('archivedotorg_venue');

        if ($connection->isTableExists($tableName)) {
            return;
        }

        $table = $connection->newTable($tableName)
            ->addColumn(
                'alias_id',
                Table::TYPE_INTEGER,
                null,
                ['identity' => true, 'unsigned' => true, 'nullable' => false, 'primary' => true],
                'Alias ID'
            )
            ->addColumn(
                'venue_id',
                Table::TYPE_INTEGER,
                null,
                ['unsigned' => true, 'nullable' => false],
                'Venue ID'
            )
            ->addColumn(
                'raw_name',
                Table::TYPE_TEXT,
                255,
                ['nullable' => false],
                'Raw Venue Name'
            )
            ->addIndex(
                $this->schemaSetup->getIdxName($tableName, ['raw_name']),
                ['raw_name']
            )
            ->addForeignKey(
                $this->schemaSetup->getFkName($tableName, 'venue_id', $venueTableName, 'venue_id'),
                'venue_id',
                $venueTableName,
                'venue_id',
                Table::ACTION_CASCADE
            )
            ->setComment('Archive.org Venue Alias Table');

        $connection->createTable($table);
    }
}
