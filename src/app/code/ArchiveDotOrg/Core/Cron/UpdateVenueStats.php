<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Cron;

use Magento\Framework\App\ResourceConnection;
use Psr\Log\LoggerInterface;

/**
 * Cron job to update venue statistics (total_shows, total_artists, total_tracks, date range)
 */
class UpdateVenueStats
{
    private ResourceConnection $resourceConnection;
    private LoggerInterface $logger;

    public function __construct(
        ResourceConnection $resourceConnection,
        LoggerInterface $logger
    ) {
        $this->resourceConnection = $resourceConnection;
        $this->logger = $logger;
    }

    public function execute(): void
    {
        $this->logger->info('Starting venue stats update');

        try {
            $connection = $this->resourceConnection->getConnection();
            $venueTable = $connection->getTableName('archivedotorg_venue');
            $aliasTable = $connection->getTableName('archivedotorg_venue_alias');
            $eavAttr = $connection->getTableName('eav_attribute');
            $cpeIntTable = $connection->getTableName('catalog_product_entity_int');
            $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');
            $optionValueTable = $connection->getTableName('eav_attribute_option_value');
            $optionTable = $connection->getTableName('eav_attribute_option');

            // Get attribute IDs
            $venueAttrId = (int)$connection->fetchOne(
                $connection->select()->from($eavAttr, ['attribute_id'])
                    ->where('attribute_code = ?', 'show_venue')
                    ->where('entity_type_id = ?', 4)
            );

            $identifierAttrId = (int)$connection->fetchOne(
                $connection->select()->from($eavAttr, ['attribute_id'])
                    ->where('attribute_code = ?', 'identifier')
                    ->where('entity_type_id = ?', 4)
            );

            $collectionAttrId = (int)$connection->fetchOne(
                $connection->select()->from($eavAttr, ['attribute_id'])
                    ->where('attribute_code = ?', 'archive_collection')
                    ->where('entity_type_id = ?', 4)
            );

            $showDateAttrId = (int)$connection->fetchOne(
                $connection->select()->from($eavAttr, ['attribute_id'])
                    ->where('attribute_code = ?', 'show_date')
                    ->where('entity_type_id = ?', 4)
            );

            if (!$venueAttrId) {
                $this->logger->warning('show_venue attribute not found, skipping venue stats update');
                return;
            }

            // Get all venues with their aliases
            $venues = $connection->fetchAll(
                $connection->select()->from($venueTable)
            );

            $updated = 0;
            foreach ($venues as $venue) {
                $venueId = (int)$venue['venue_id'];

                // Get raw names for this venue
                $rawNames = $connection->fetchCol(
                    $connection->select()->from($aliasTable, ['raw_name'])->where('venue_id = ?', $venueId)
                );

                if (empty($rawNames)) {
                    continue;
                }

                // Find matching option IDs
                $optionIds = $connection->fetchCol(
                    $connection->select()
                        ->from(['eaov' => $optionValueTable], ['eaov.option_id'])
                        ->join(['eao' => $optionTable], 'eaov.option_id = eao.option_id', [])
                        ->where('eao.attribute_id = ?', $venueAttrId)
                        ->where('eaov.store_id = ?', 0)
                        ->where('eaov.value IN (?)', $rawNames)
                );

                if (empty($optionIds)) {
                    continue;
                }

                // Calculate stats
                $statsSelect = $connection->select()
                    ->from(['cpei' => $cpeIntTable], [])
                    ->joinLeft(
                        ['ident' => $cpeVarcharTable],
                        "ident.entity_id = cpei.entity_id AND ident.attribute_id = {$identifierAttrId} AND ident.store_id = 0",
                        []
                    )
                    ->joinLeft(
                        ['coll' => $cpeIntTable],
                        "coll.entity_id = cpei.entity_id AND coll.attribute_id = {$collectionAttrId} AND coll.store_id = 0",
                        []
                    )
                    ->joinLeft(
                        ['sdate' => $cpeVarcharTable],
                        "sdate.entity_id = cpei.entity_id AND sdate.attribute_id = {$showDateAttrId} AND sdate.store_id = 0",
                        []
                    )
                    ->columns([
                        'total_tracks' => new \Zend_Db_Expr('COUNT(DISTINCT cpei.entity_id)'),
                        'total_shows' => new \Zend_Db_Expr('COUNT(DISTINCT ident.value)'),
                        'total_artists' => new \Zend_Db_Expr('COUNT(DISTINCT coll.value)'),
                        'first_show_date' => new \Zend_Db_Expr('MIN(sdate.value)'),
                        'last_show_date' => new \Zend_Db_Expr('MAX(sdate.value)'),
                    ])
                    ->where('cpei.attribute_id = ?', $venueAttrId)
                    ->where('cpei.store_id = ?', 0)
                    ->where('cpei.value IN (?)', $optionIds);

                $stats = $connection->fetchRow($statsSelect);

                if ($stats) {
                    $connection->update($venueTable, [
                        'total_shows' => (int)$stats['total_shows'],
                        'total_artists' => (int)$stats['total_artists'],
                        'total_tracks' => (int)$stats['total_tracks'],
                        'first_show_date' => $stats['first_show_date'] ?: null,
                        'last_show_date' => $stats['last_show_date'] ?: null,
                    ], ['venue_id = ?' => $venueId]);
                    $updated++;
                }
            }

            $this->logger->info(sprintf('Venue stats update completed: %d venues updated', $updated));
        } catch (\Exception $e) {
            $this->logger->error('Venue stats update failed: ' . $e->getMessage());
        }
    }
}
