<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\Filesystem\DirectoryList;

/**
 * CLI command to discover venues from imported products and populate venue tables
 */
class DiscoverVenuesCommand extends Command
{
    private ResourceConnection $resourceConnection;
    private DirectoryList $directoryList;

    public function __construct(
        ResourceConnection $resourceConnection,
        DirectoryList $directoryList,
        string $name = null
    ) {
        parent::__construct($name);
        $this->resourceConnection = $resourceConnection;
        $this->directoryList = $directoryList;
    }

    protected function configure()
    {
        $this->setName('archive:discover:venues')
            ->setDescription('Discover venues from imported products and populate venue tables')
            ->addOption(
                'dry-run',
                null,
                InputOption::VALUE_NONE,
                'Preview what would be discovered without saving'
            )
            ->addOption(
                'force',
                'f',
                InputOption::VALUE_NONE,
                'Clear existing venue data before discovering'
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $dryRun = $input->getOption('dry-run');
        $force = $input->getOption('force');

        if ($dryRun) {
            $output->writeln('<comment>DRY RUN MODE - No data will be saved</comment>');
        }

        $connection = $this->resourceConnection->getConnection();

        // Load known venues database
        $knownVenues = $this->loadVenueDatabase($output);
        $output->writeln(sprintf('<info>Loaded %d known venues from database</info>', count($knownVenues)));

        // Clear existing data if --force
        if ($force && !$dryRun) {
            $output->writeln('<comment>Clearing existing venue data...</comment>');
            $connection->delete($connection->getTableName('archivedotorg_venue_alias'));
            $connection->delete($connection->getTableName('archivedotorg_venue'));
        }

        // Step 1: Get all distinct show_venue values from products (varchar table)
        $output->writeln('<info>Querying distinct venue names from products...</info>');
        $venueData = $this->getDistinctVenues($connection);
        $output->writeln(sprintf('Found %d distinct venue values', count($venueData)));

        if (empty($venueData)) {
            $output->writeln('<comment>No venues found in imported products</comment>');
            return Command::SUCCESS;
        }

        // Step 2: Get show_location data for each venue
        $output->writeln('<info>Fetching location data for venues...</info>');
        $venueLocations = $this->getVenueLocations($connection, $venueData);

        // Step 3: Normalize and deduplicate venues
        $output->writeln('<info>Normalizing and deduplicating venues...</info>');
        $normalizedVenues = $this->normalizeVenues($venueData, $venueLocations, $knownVenues);
        $output->writeln(sprintf('Normalized to %d unique venues', count($normalizedVenues)));

        // Step 4: Count shows/artists/tracks per venue
        $output->writeln('<info>Counting shows, artists, and tracks per venue...</info>');
        $venueCounts = $this->getVenueCounts($connection, $venueData);

        // Step 5: Insert venues
        if ($dryRun) {
            $output->writeln('');
            $output->writeln('<info>=== Venues to be created ===</info>');
            $venuesWithCounts = 0;
            foreach ($normalizedVenues as $slug => $venue) {
                // Aggregate counts from all venue_names belonging to this slug
                $totalShows = 0;
                $totalArtists = 0;
                $totalTracks = 0;
                foreach ($venue['venue_names'] as $venueName) {
                    if (isset($venueCounts[$venueName])) {
                        $c = $venueCounts[$venueName];
                        $totalTracks += (int)$c['tracks'];
                        $totalShows += (int)$c['shows'];
                        $totalArtists = max($totalArtists, (int)$c['artists']);
                    }
                }
                if ($totalShows > 0) {
                    $venuesWithCounts++;
                }
                // Only show top venues in dry run to avoid massive output
                if ($venuesWithCounts <= 50 || $totalShows >= 10) {
                    $output->writeln(sprintf(
                        '  %s (%s, %s) - %d shows, %d artists, %d tracks [%d aliases]',
                        $venue['normalized_name'],
                        $venue['city'] ?? '?',
                        $venue['state'] ?? '?',
                        $totalShows,
                        $totalArtists,
                        $totalTracks,
                        count($venue['aliases'])
                    ));
                }
            }
            $output->writeln(sprintf('<info>Total: %d venues, %d with show data</info>', count($normalizedVenues), $venuesWithCounts));
        } else {
            $output->writeln('<info>Inserting venues into database...</info>');
            $inserted = $this->insertVenues($connection, $normalizedVenues, $venueCounts, $output);
            $output->writeln(sprintf('<info>Inserted %d venues</info>', $inserted));
        }

        $output->writeln('<info>Done!</info>');
        return Command::SUCCESS;
    }

    private function loadVenueDatabase(OutputInterface $output): array
    {
        // Try multiple paths: module dir first, then Magento root
        $modulePath = dirname(__DIR__, 2) . '/data/venue-database.json';
        $rootPath = $this->directoryList->getRoot() . '/data/venue-database.json';
        $jsonPath = file_exists($modulePath) ? $modulePath : $rootPath;

        if (!file_exists($jsonPath)) {
            $output->writeln('<comment>Warning: venue-database.json not found at ' . $modulePath . ' or ' . $rootPath . '</comment>');
            return [];
        }

        $json = file_get_contents($jsonPath);
        $data = json_decode($json, true);
        if (!is_array($data)) {
            $output->writeln('<comment>Warning: Failed to parse venue-database.json</comment>');
            return [];
        }

        // Build a lookup by alias for quick matching
        $lookup = [];
        foreach ($data as $slug => $venue) {
            foreach ($venue['aliases'] as $alias) {
                $lookup[strtolower(trim($alias))] = [
                    'slug' => $slug,
                    'name' => $venue['name'],
                    'city' => $venue['city'],
                    'state' => $venue['state'],
                    'country' => $venue['country'],
                    'lat' => $venue['lat'],
                    'lon' => $venue['lon'],
                ];
            }
        }

        return $lookup;
    }

    /**
     * Get all distinct show_venue values and their product counts.
     * Queries catalog_product_entity_varchar directly (show_venue is now varchar).
     */
    private function getDistinctVenues($connection): array
    {
        $eavAttr = $connection->getTableName('eav_attribute');
        $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');

        $venueAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_venue')
                ->where('entity_type_id = ?', 4)
        );

        if (!$venueAttrId) {
            return [];
        }

        $select = $connection->select()
            ->from(['cpev' => $cpeVarcharTable], [
                'venue_name' => 'cpev.value',
                'product_count' => new \Zend_Db_Expr('COUNT(DISTINCT cpev.entity_id)'),
            ])
            ->where('cpev.attribute_id = ?', $venueAttrId)
            ->where('cpev.store_id = ?', 0)
            ->where('cpev.value IS NOT NULL')
            ->where('cpev.value != ?', '')
            ->group('cpev.value')
            ->order('product_count DESC');

        return $connection->fetchAll($select);
    }

    /**
     * Get show_location values associated with each venue name.
     * Both show_venue and show_location are now varchar — query directly.
     */
    private function getVenueLocations($connection, array $venueData): array
    {
        $eavAttr = $connection->getTableName('eav_attribute');
        $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');

        $venueAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_venue')
                ->where('entity_type_id = ?', 4)
        );

        $locationAttrId = (int)$connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_location')
                ->where('entity_type_id = ?', 4)
        );

        if (!$venueAttrId || !$locationAttrId) {
            return [];
        }

        $venueNames = array_column($venueData, 'venue_name');
        if (empty($venueNames)) {
            return [];
        }

        $select = $connection->select()
            ->from(['venue_v' => $cpeVarcharTable], ['venue_name' => 'venue_v.value'])
            ->join(
                ['loc_v' => $cpeVarcharTable],
                "loc_v.entity_id = venue_v.entity_id AND loc_v.attribute_id = {$locationAttrId} AND loc_v.store_id = 0",
                ['location' => 'loc_v.value']
            )
            ->columns(['cnt' => new \Zend_Db_Expr('COUNT(*)')])
            ->where('venue_v.attribute_id = ?', $venueAttrId)
            ->where('venue_v.store_id = ?', 0)
            ->where('venue_v.value IN (?)', $venueNames)
            ->group(['venue_v.value', 'loc_v.value'])
            ->order('cnt DESC');

        $rows = $connection->fetchAll($select);

        // Take the most common location for each venue name
        $locations = [];
        foreach ($rows as $row) {
            $venueName = $row['venue_name'];
            if (!isset($locations[$venueName])) {
                $locations[$venueName] = $row['location'];
            }
        }

        return $locations;
    }

    /**
     * Normalize venue names, match against known venues, and deduplicate.
     * Uses 'venue_names' instead of 'option_ids' as the grouping key.
     */
    private function normalizeVenues(array $venueData, array $venueLocations, array $knownVenues): array
    {
        $normalized = [];

        foreach ($venueData as $venue) {
            $rawName = $venue['venue_name'];
            $normalizedLower = strtolower(trim($rawName));

            // Strip embedded dates like "2019-08-31" or "(08/31/2019)"
            $normalizedLower = preg_replace('/\d{4}-\d{2}-\d{2}/', '', $normalizedLower);
            $normalizedLower = preg_replace('/\(\d{2}\/\d{2}\/\d{4}\)/', '', $normalizedLower);
            $normalizedLower = trim($normalizedLower);

            // Check if this matches a known venue
            $knownMatch = null;
            if (isset($knownVenues[$normalizedLower])) {
                $knownMatch = $knownVenues[$normalizedLower];
            } else {
                // Try partial matching
                foreach ($knownVenues as $alias => $known) {
                    if (strlen($alias) >= 4 && strpos($normalizedLower, $alias) !== false) {
                        $knownMatch = $known;
                        break;
                    }
                }
            }

            if ($knownMatch) {
                $slug = $knownMatch['slug'];
                if (!isset($normalized[$slug])) {
                    $normalized[$slug] = [
                        'normalized_name' => $knownMatch['name'],
                        'city' => $knownMatch['city'],
                        'state' => $knownMatch['state'],
                        'country' => $knownMatch['country'],
                        'latitude' => $knownMatch['lat'],
                        'longitude' => $knownMatch['lon'],
                        'aliases' => [],
                        'venue_names' => [],
                    ];
                }
                if (!in_array($rawName, $normalized[$slug]['aliases'])) {
                    $normalized[$slug]['aliases'][] = $rawName;
                }
                if (!in_array($rawName, $normalized[$slug]['venue_names'])) {
                    $normalized[$slug]['venue_names'][] = $rawName;
                }
            } else {
                // Unknown venue: generate slug from name
                $slug = $this->generateSlug($rawName);

                if (!isset($normalized[$slug])) {
                    // Parse location from venue_name key (locations keyed by venue name)
                    $location = $venueLocations[$rawName] ?? null;
                    $city = null;
                    $state = null;
                    if ($location) {
                        $parts = explode(',', $location);
                        $city = trim($parts[0] ?? '');
                        $state = trim($parts[1] ?? '');
                    }

                    $normalized[$slug] = [
                        'normalized_name' => trim($rawName),
                        'city' => $city,
                        'state' => $state,
                        'country' => 'US',
                        'latitude' => null,
                        'longitude' => null,
                        'aliases' => [],
                        'venue_names' => [],
                    ];
                }
                if (!in_array($rawName, $normalized[$slug]['aliases'])) {
                    $normalized[$slug]['aliases'][] = $rawName;
                }
                if (!in_array($rawName, $normalized[$slug]['venue_names'])) {
                    $normalized[$slug]['venue_names'][] = $rawName;
                }
            }
        }

        return $normalized;
    }

    /**
     * Count shows, artists, and tracks per venue name.
     * All attributes (show_venue, archive_collection, identifier) now use varchar table.
     */
    private function getVenueCounts($connection, array $venueData): array
    {
        $eavAttr = $connection->getTableName('eav_attribute');
        $cpeVarcharTable = $connection->getTableName('catalog_product_entity_varchar');
        $cpeDatetimeTable = $connection->getTableName('catalog_product_entity_datetime');

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

        // archive_collection is now varchar
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
            return [];
        }

        $venueNames = array_column($venueData, 'venue_name');
        if (empty($venueNames)) {
            return [];
        }

        $select = $connection->select()
            ->from(['venue_v' => $cpeVarcharTable], ['venue_name' => 'venue_v.value'])
            ->joinLeft(
                ['ident' => $cpeVarcharTable],
                "ident.entity_id = venue_v.entity_id AND ident.attribute_id = {$identifierAttrId} AND ident.store_id = 0",
                []
            )
            ->joinLeft(
                ['coll' => $cpeVarcharTable],
                "coll.entity_id = venue_v.entity_id AND coll.attribute_id = {$collectionAttrId} AND coll.store_id = 0",
                []
            )
            ->joinLeft(
                ['sdate' => $cpeDatetimeTable],
                "sdate.entity_id = venue_v.entity_id AND sdate.attribute_id = {$showDateAttrId} AND sdate.store_id = 0",
                []
            )
            ->columns([
                'tracks' => new \Zend_Db_Expr('COUNT(DISTINCT venue_v.entity_id)'),
                'shows' => new \Zend_Db_Expr('COUNT(DISTINCT ident.value)'),
                'artists' => new \Zend_Db_Expr('COUNT(DISTINCT coll.value)'),
                'first_show' => new \Zend_Db_Expr('MIN(sdate.value)'),
                'last_show' => new \Zend_Db_Expr('MAX(sdate.value)'),
            ])
            ->where('venue_v.attribute_id = ?', $venueAttrId)
            ->where('venue_v.store_id = ?', 0)
            ->where('venue_v.value IN (?)', $venueNames)
            ->group('venue_v.value');

        $rows = $connection->fetchAll($select);

        // Build lookup by venue_name
        $countsByVenueName = [];
        foreach ($rows as $row) {
            $countsByVenueName[$row['venue_name']] = $row;
        }

        return $countsByVenueName;
    }

    /**
     * Insert venues and aliases into database
     */
    private function insertVenues($connection, array $normalizedVenues, array $countsByVenueName, OutputInterface $output): int
    {
        $venueTable = $connection->getTableName('archivedotorg_venue');
        $aliasTable = $connection->getTableName('archivedotorg_venue_alias');
        $inserted = 0;

        foreach ($normalizedVenues as $slug => $venue) {
            // Aggregate counts from all venue_names belonging to this slug
            $totalShows = 0;
            $totalArtists = 0;
            $totalTracks = 0;
            $firstShow = null;
            $lastShow = null;

            foreach ($venue['venue_names'] as $venueName) {
                if (isset($countsByVenueName[$venueName])) {
                    $c = $countsByVenueName[$venueName];
                    $totalTracks += (int)$c['tracks'];
                    $totalShows += (int)$c['shows'];
                    // Artists is approximate since we're summing distinct per venue_name
                    $totalArtists = max($totalArtists, (int)$c['artists']);
                    if ($c['first_show'] && (!$firstShow || $c['first_show'] < $firstShow)) {
                        $firstShow = $c['first_show'];
                    }
                    if ($c['last_show'] && (!$lastShow || $c['last_show'] > $lastShow)) {
                        $lastShow = $c['last_show'];
                    }
                }
            }

            try {
                $connection->insertOnDuplicate($venueTable, [
                    'slug' => $slug,
                    'normalized_name' => $venue['normalized_name'],
                    'city' => $venue['city'],
                    'state' => $venue['state'],
                    'country' => $venue['country'],
                    'latitude' => $venue['latitude'],
                    'longitude' => $venue['longitude'],
                    'total_shows' => $totalShows,
                    'total_artists' => $totalArtists,
                    'total_tracks' => $totalTracks,
                    'first_show_date' => $firstShow,
                    'last_show_date' => $lastShow,
                ], [
                    'normalized_name', 'city', 'state', 'country',
                    'latitude', 'longitude', 'total_shows', 'total_artists',
                    'total_tracks', 'first_show_date', 'last_show_date',
                ]);

                // Get venue_id
                $venueId = (int)$connection->fetchOne(
                    $connection->select()->from($venueTable, ['venue_id'])->where('slug = ?', $slug)
                );

                // Insert aliases
                foreach ($venue['aliases'] as $alias) {
                    $connection->insertOnDuplicate($aliasTable, [
                        'venue_id' => $venueId,
                        'raw_name' => $alias,
                    ], ['venue_id']);
                }

                $inserted++;
                $output->writeln(sprintf(
                    '  [%d] %s (%s, %s) - %d shows, %d aliases',
                    $inserted,
                    $venue['normalized_name'],
                    $venue['city'] ?? '?',
                    $venue['state'] ?? '?',
                    $totalShows,
                    count($venue['aliases'])
                ));
            } catch (\Exception $e) {
                $output->writeln(sprintf(
                    '<error>  Failed to insert %s: %s</error>',
                    $slug,
                    $e->getMessage()
                ));
            }
        }

        return $inserted;
    }

    private function generateSlug(string $name): string
    {
        $slug = strtolower(trim($name));
        // Remove dates
        $slug = preg_replace('/\d{4}-\d{2}-\d{2}/', '', $slug);
        // Replace non-alphanumeric with hyphens
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        // Remove leading/trailing hyphens
        $slug = trim($slug, '-');
        // Collapse multiple hyphens
        $slug = preg_replace('/-+/', '-', $slug);

        return $slug ?: 'unknown-venue';
    }
}
