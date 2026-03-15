<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use Magento\Framework\App\ResourceConnection;

class VenueMergeService
{
    private ResourceConnection $resourceConnection;

    public function __construct(ResourceConnection $resourceConnection)
    {
        $this->resourceConnection = $resourceConnection;
    }

    /**
     * Normalize a venue name for duplicate comparison.
     *
     * Two venues whose normalized keys match are candidates for merging.
     * Order matters: strip "the" before theatre->theater so
     * "the fox theatre" and "fox theater" both become "fox theater".
     */
    public function normalizeForComparison(string $name): string
    {
        $n = mb_strtolower(trim($name));

        // Strip embedded dates (e.g. "2019-08-31", "(08/31/2019)")
        $n = preg_replace('/\d{4}-\d{2}-\d{2}/', '', $n);
        $n = preg_replace('/\(\d{2}\/\d{2}\/\d{4}\)/', '', $n);

        // Strip "the " prefix
        $n = preg_replace('/^the\s+/', '', $n);

        // Normalize theatre/theater variants
        $n = str_replace('amphitheatre', 'amphitheater', $n);
        $n = str_replace('ampitheater', 'amphitheater', $n);
        $n = str_replace('theatre', 'theater', $n);

        // Strip apostrophes (straight + curly) and periods
        $n = str_replace(["'", "\u{2019}", "\u{2018}", "."], '', $n);

        // Collapse whitespace
        $n = preg_replace('/\s+/', ' ', trim($n));

        return $n;
    }

    /**
     * Find all groups of venues that normalize to the same key.
     *
     * @return array<string, array> Keyed by normalized name, each value is array of venue rows
     */
    public function findDuplicateGroups(): array
    {
        $connection = $this->resourceConnection->getConnection();
        $venueTable = $connection->getTableName('archivedotorg_venue');

        $rows = $connection->fetchAll(
            $connection->select()->from($venueTable)
        );

        $groups = [];
        foreach ($rows as $row) {
            $key = $this->normalizeForComparison($row['normalized_name']);
            $groups[$key][] = $row;
        }

        // Only return groups with 2+ venues (actual duplicates)
        return array_filter($groups, fn(array $g) => count($g) > 1);
    }

    /**
     * Classify a group of duplicate candidates by merge safety.
     *
     * @return string 'safe'|'partial'|'conflict'|'ambiguous'
     */
    public function classifyGroup(array $venues): string
    {
        $cities = [];
        $hasNull = false;

        foreach ($venues as $v) {
            $city = trim($v['city'] ?? '');
            $state = trim($v['state'] ?? '');
            if ($city === '') {
                $hasNull = true;
            } else {
                $key = mb_strtolower($city) . '|' . mb_strtolower($state);
                $cities[$key] = true;
            }
        }

        $distinctCities = count($cities);

        if ($distinctCities <= 1 && !$hasNull) {
            return 'safe';      // All share same city/state
        }
        if ($distinctCities <= 1 && $hasNull) {
            return 'partial';   // One city + some NULLs (NULLs inherit)
        }
        if ($distinctCities > 1) {
            return 'conflict';  // Different cities — NEVER auto-merge
        }
        return 'ambiguous';     // All NULL city
    }

    /**
     * Pick the best venue from a group to keep as canonical.
     *
     * Ranking: most shows > has city/state > has lat/lon > Title Case > lowest ID
     *
     * @return array{winner: array, losers: array}
     */
    public function pickWinner(array $venues): array
    {
        usort($venues, function ($a, $b) {
            // 1. More shows
            $diff = ($b['total_shows'] ?? 0) <=> ($a['total_shows'] ?? 0);
            if ($diff !== 0) return $diff;

            // 2. Has city/state
            $aCity = !empty($a['city']);
            $bCity = !empty($b['city']);
            if ($aCity !== $bCity) return $bCity <=> $aCity;

            // 3. Has coordinates
            $aGeo = ($a['latitude'] !== null && $a['latitude'] !== '');
            $bGeo = ($b['latitude'] !== null && $b['latitude'] !== '');
            if ($aGeo !== $bGeo) return $bGeo <=> $aGeo;

            // 4. Title Case name (has uppercase letters)
            $aUpper = preg_match('/[A-Z]/', $a['normalized_name'] ?? '');
            $bUpper = preg_match('/[A-Z]/', $b['normalized_name'] ?? '');
            if ($aUpper !== $bUpper) return $bUpper <=> $aUpper;

            // 5. Lower venue_id (older record)
            return ($a['venue_id'] ?? 0) <=> ($b['venue_id'] ?? 0);
        });

        return [
            'winner' => $venues[0],
            'losers' => array_slice($venues, 1),
        ];
    }

    /**
     * Merge one or more loser venues into a winner.
     *
     * Moves aliases, aggregates stats, fills metadata gaps, deletes losers.
     * Wrapped in a transaction for safety.
     *
     * @return array{winner_id: int, losers_removed: int, aliases_moved: int}
     */
    public function mergeVenues(int $winnerId, array $loserIds): array
    {
        $connection = $this->resourceConnection->getConnection();
        $venueTable = $connection->getTableName('archivedotorg_venue');
        $aliasTable = $connection->getTableName('archivedotorg_venue_alias');

        $connection->beginTransaction();
        try {
            // 1. Move all aliases from losers to winner
            $aliasesMoved = $connection->update(
                $aliasTable,
                ['venue_id' => $winnerId],
                ['venue_id IN (?)' => $loserIds]
            );

            // 2. Aggregate stats from losers
            $loserStats = $connection->fetchRow(
                $connection->select()
                    ->from($venueTable, [
                        'sum_shows' => new \Zend_Db_Expr('COALESCE(SUM(total_shows), 0)'),
                        'sum_tracks' => new \Zend_Db_Expr('COALESCE(SUM(total_tracks), 0)'),
                        'max_artists' => new \Zend_Db_Expr('COALESCE(MAX(total_artists), 0)'),
                        'min_first' => new \Zend_Db_Expr('MIN(first_show_date)'),
                        'max_last' => new \Zend_Db_Expr('MAX(last_show_date)'),
                    ])
                    ->where('venue_id IN (?)', $loserIds)
            );

            $winnerData = $connection->fetchRow(
                $connection->select()->from($venueTable)->where('venue_id = ?', $winnerId)
            );

            $updateData = [
                'total_shows' => ($winnerData['total_shows'] ?? 0) + ($loserStats['sum_shows'] ?? 0),
                'total_tracks' => ($winnerData['total_tracks'] ?? 0) + ($loserStats['sum_tracks'] ?? 0),
                'total_artists' => max($winnerData['total_artists'] ?? 0, $loserStats['max_artists'] ?? 0),
            ];

            // Merge first/last show dates
            $firsts = array_filter([$winnerData['first_show_date'] ?? null, $loserStats['min_first'] ?? null]);
            if ($firsts) {
                $updateData['first_show_date'] = min($firsts);
            }
            $lasts = array_filter([$winnerData['last_show_date'] ?? null, $loserStats['max_last'] ?? null]);
            if ($lasts) {
                $updateData['last_show_date'] = max($lasts);
            }

            // 3. Fill missing winner metadata from losers
            if (empty($winnerData['city'])) {
                $loserWithCity = $connection->fetchRow(
                    $connection->select()->from($venueTable)
                        ->where('venue_id IN (?)', $loserIds)
                        ->where('city IS NOT NULL')
                        ->where("city != ''")
                        ->order('total_shows DESC')
                        ->limit(1)
                );
                if ($loserWithCity) {
                    $updateData['city'] = $loserWithCity['city'];
                    $updateData['state'] = $loserWithCity['state'];
                }
            }

            if (empty($winnerData['latitude'])) {
                $loserWithGeo = $connection->fetchRow(
                    $connection->select()->from($venueTable)
                        ->where('venue_id IN (?)', $loserIds)
                        ->where('latitude IS NOT NULL')
                        ->limit(1)
                );
                if ($loserWithGeo) {
                    $updateData['latitude'] = $loserWithGeo['latitude'];
                    $updateData['longitude'] = $loserWithGeo['longitude'];
                }
            }

            // 4. Update winner
            $connection->update($venueTable, $updateData, ['venue_id = ?' => $winnerId]);

            // 5. Delete losers (aliases already moved in step 1)
            $connection->delete($venueTable, ['venue_id IN (?)' => $loserIds]);

            $connection->commit();

            return [
                'winner_id' => $winnerId,
                'losers_removed' => count($loserIds),
                'aliases_moved' => (int)$aliasesMoved,
            ];
        } catch (\Exception $e) {
            $connection->rollBack();
            throw $e;
        }
    }
}
