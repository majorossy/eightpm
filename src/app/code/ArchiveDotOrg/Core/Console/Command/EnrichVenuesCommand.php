<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use Magento\Framework\App\ResourceConnection;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Enrich venues missing city/state by cross-referencing product show_location data.
 *
 * For each venue without city/state, finds all products with that venue name that
 * DO have show_location, groups by location, and only assigns when one location
 * dominates (configurable threshold, default 90%).
 */
class EnrichVenuesCommand extends BaseLoggedCommand
{
    private const OPTION_APPLY = 'apply';
    private const OPTION_THRESHOLD = 'threshold';

    public function __construct(
        ResourceConnection $resourceConnection,
        LoggerInterface $logger,
        string $name = null
    ) {
        $this->resourceConnection = $resourceConnection;
        $this->logger = $logger;
        parent::__construct($name);
    }

    protected function configure(): void
    {
        $this->setName('archive:venue:enrich')
            ->setDescription('Enrich venues missing city/state from product show_location data')
            ->addOption(
                self::OPTION_APPLY,
                null,
                InputOption::VALUE_NONE,
                'Actually write changes (default is dry run)'
            )
            ->addOption(
                self::OPTION_THRESHOLD,
                't',
                InputOption::VALUE_REQUIRED,
                'Minimum % agreement to assign a location (default: 90)',
                '90'
            );
    }

    protected function doExecute(InputInterface $input, OutputInterface $output, string $correlationId): int
    {
        $apply = (bool) $input->getOption(self::OPTION_APPLY);
        $threshold = (int) $input->getOption(self::OPTION_THRESHOLD);

        if ($threshold < 50 || $threshold > 100) {
            $output->writeln('<error>Threshold must be between 50 and 100</error>');
            return Command::FAILURE;
        }

        if (!$apply) {
            $output->writeln('<comment>DRY RUN — use --apply to write changes</comment>');
        }
        $output->writeln(sprintf('<info>Confidence threshold: %d%%</info>', $threshold));

        $connection = $this->resourceConnection->getConnection();

        // Get attribute IDs
        $eavAttr = $this->resourceConnection->getTableName('eav_attribute');
        $venueAttrId = (int) $connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_venue')
                ->where('entity_type_id = ?', 4)
        );
        $locationAttrId = (int) $connection->fetchOne(
            $connection->select()->from($eavAttr, ['attribute_id'])
                ->where('attribute_code = ?', 'show_location')
                ->where('entity_type_id = ?', 4)
        );

        if (!$venueAttrId || !$locationAttrId) {
            $output->writeln('<error>Could not find show_venue or show_location attribute</error>');
            return Command::FAILURE;
        }

        // Step 1: Find venues missing city/state, with their aliases
        $venueTable = $this->resourceConnection->getTableName('archivedotorg_venue');
        $aliasTable = $this->resourceConnection->getTableName('archivedotorg_venue_alias');

        $missingVenues = $connection->fetchAll(
            $connection->select()
                ->from(['v' => $venueTable], ['venue_id', 'normalized_name'])
                ->where("v.city IS NULL OR v.city = ''")
        );

        $output->writeln(sprintf('<info>Found %d venues missing city/state</info>', count($missingVenues)));

        if (empty($missingVenues)) {
            $output->writeln('<info>Nothing to do!</info>');
            return Command::SUCCESS;
        }

        // Build venue_id → [raw_names] lookup
        $allVenueIds = array_column($missingVenues, 'venue_id');
        $aliasRows = $connection->fetchAll(
            $connection->select()
                ->from($aliasTable, ['venue_id', 'raw_name'])
                ->where('venue_id IN (?)', $allVenueIds)
        );

        $venueAliases = [];
        foreach ($aliasRows as $row) {
            $venueAliases[(int) $row['venue_id']][] = $row['raw_name'];
        }

        // Step 2: For each missing venue, query product locations via aliases
        $cpeVarchar = $this->resourceConnection->getTableName('catalog_product_entity_varchar');
        $enriched = 0;
        $skipped = 0;
        $noData = 0;
        $skippedDetails = [];

        foreach ($missingVenues as $venue) {
            if (!$this->shouldContinue()) {
                break;
            }

            $venueId = (int) $venue['venue_id'];
            $venueName = $venue['normalized_name'];
            $rawNames = $venueAliases[$venueId] ?? [$venueName];

            // Find all show_location values for products with this venue
            $select = $connection->select()
                ->from(['venue_v' => $cpeVarchar], [])
                ->join(
                    ['loc_v' => $cpeVarchar],
                    "loc_v.entity_id = venue_v.entity_id AND loc_v.attribute_id = {$locationAttrId} AND loc_v.store_id = 0",
                    []
                )
                ->columns([
                    'location' => 'loc_v.value',
                    'cnt' => new \Zend_Db_Expr('COUNT(*)'),
                ])
                ->where('venue_v.attribute_id = ?', $venueAttrId)
                ->where('venue_v.store_id = ?', 0)
                ->where('venue_v.value IN (?)', $rawNames)
                ->where('loc_v.value IS NOT NULL')
                ->where("loc_v.value != ''")
                ->group('loc_v.value')
                ->order('cnt DESC');

            $locationRows = $connection->fetchAll($select);

            if (empty($locationRows)) {
                $noData++;
                continue;
            }

            // Normalize and merge location variants (e.g. "Nebraska" → "NE")
            $normalized = [];
            foreach ($locationRows as $row) {
                $key = $this->normalizeLocation($row['location']);
                if ($key === '') {
                    continue;
                }
                if (!isset($normalized[$key])) {
                    $normalized[$key] = ['count' => 0, 'raw' => $row['location']];
                }
                $normalized[$key]['count'] += (int) $row['cnt'];
            }

            if (empty($normalized)) {
                $noData++;
                continue;
            }

            // Sort by count descending
            uasort($normalized, fn($a, $b) => $b['count'] <=> $a['count']);

            $totalCount = 0;
            foreach ($normalized as $entry) {
                $totalCount += $entry['count'];
            }

            $topKey = array_key_first($normalized);
            $topEntry = $normalized[$topKey];
            $percentage = ($totalCount > 0) ? round(($topEntry['count'] / $totalCount) * 100, 1) : 0;

            if ($percentage >= $threshold) {
                // Confident — parse city/state from the normalized key
                $parts = array_map('trim', explode(',', $topKey));
                $city = $parts[0] ?? '';
                $state = $parts[1] ?? '';

                if ($city === '') {
                    $noData++;
                    continue;
                }

                if ($apply) {
                    $connection->update(
                        $venueTable,
                        ['city' => $city, 'state' => $state],
                        ['venue_id = ?' => $venueId]
                    );
                }

                $enriched++;
                $output->writeln(sprintf(
                    '  <info>✓</info> %s → %s, %s  (%d/%d = %.0f%%)',
                    $venueName,
                    $city,
                    $state,
                    $topEntry['count'],
                    $totalCount,
                    $percentage
                ));
            } else {
                // Ambiguous — skip and report
                $skipped++;
                $locSummary = [];
                foreach (array_slice(array_values($normalized), 0, 3) as $entry) {
                    $pct = round(($entry['count'] / $totalCount) * 100, 0);
                    $locSummary[] = sprintf('%s ×%d (%d%%)', $entry['raw'], $entry['count'], $pct);
                }
                $skippedDetails[] = sprintf('  %s: %s', $venueName, implode(' | ', $locSummary));
                $output->writeln(sprintf(
                    '  <comment>⊘</comment> %s — ambiguous: %s',
                    $venueName,
                    implode(' | ', $locSummary)
                ));
            }
        }

        // Summary
        $output->writeln('');
        $output->writeln('<info>=== Summary ===</info>');
        $output->writeln(sprintf('  Venues missing city/state: %d', count($missingVenues)));
        $output->writeln(sprintf('  Enriched (≥%d%% confidence): %d', $threshold, $enriched));
        $output->writeln(sprintf('  Skipped (ambiguous):         %d', $skipped));
        $output->writeln(sprintf('  No location data:            %d', $noData));

        if (!$apply && $enriched > 0) {
            $output->writeln('');
            $output->writeln(sprintf('<comment>Run with --apply to write %d changes</comment>', $enriched));
        }

        $this->updateProgress($correlationId, count($missingVenues), $enriched);

        return Command::SUCCESS;
    }

    /**
     * Normalize a "City, State" string so variants like "Omaha, Nebraska" and
     * "Omaha, NE" merge into the same key: "Omaha, NE".
     */
    private function normalizeLocation(string $location): string
    {
        $location = trim($location);
        if ($location === '') {
            return '';
        }

        // Strip trailing periods ("Nashville, TN." → "Nashville, TN")
        $location = rtrim($location, '.');

        // Handle missing comma: "Seattle WA" → "Seattle, WA"
        if (strpos($location, ',') === false && preg_match('/^(.+)\s+([A-Z]{2})$/', $location, $m)) {
            $location = $m[1] . ', ' . $m[2];
        }

        $parts = array_map('trim', explode(',', $location, 2));
        $city = $parts[0] ?? '';
        $state = $parts[1] ?? '';

        // Strip trailing period from state too
        $state = rtrim(trim($state), '.');

        // Normalize full state name → abbreviation
        $stateUpper = strtolower($state);
        $state = self::STATE_MAP[$stateUpper] ?? $state;

        if ($city === '') {
            return '';
        }

        return $state !== '' ? "$city, $state" : $city;
    }

    private const STATE_MAP = [
        'alabama' => 'AL', 'alaska' => 'AK', 'arizona' => 'AZ', 'arkansas' => 'AR',
        'california' => 'CA', 'colorado' => 'CO', 'connecticut' => 'CT', 'delaware' => 'DE',
        'florida' => 'FL', 'georgia' => 'GA', 'hawaii' => 'HI', 'idaho' => 'ID',
        'illinois' => 'IL', 'indiana' => 'IN', 'iowa' => 'IA', 'kansas' => 'KS',
        'kentucky' => 'KY', 'louisiana' => 'LA', 'maine' => 'ME', 'maryland' => 'MD',
        'massachusetts' => 'MA', 'michigan' => 'MI', 'minnesota' => 'MN', 'mississippi' => 'MS',
        'missouri' => 'MO', 'montana' => 'MT', 'nebraska' => 'NE', 'nevada' => 'NV',
        'new hampshire' => 'NH', 'new jersey' => 'NJ', 'new mexico' => 'NM', 'new york' => 'NY',
        'north carolina' => 'NC', 'north dakota' => 'ND', 'ohio' => 'OH', 'oklahoma' => 'OK',
        'oregon' => 'OR', 'pennsylvania' => 'PA', 'rhode island' => 'RI', 'south carolina' => 'SC',
        'south dakota' => 'SD', 'tennessee' => 'TN', 'texas' => 'TX', 'utah' => 'UT',
        'vermont' => 'VT', 'virginia' => 'VA', 'washington' => 'WA', 'west virginia' => 'WV',
        'wisconsin' => 'WI', 'wyoming' => 'WY', 'district of columbia' => 'DC',
        // Common short forms
        'al' => 'AL', 'ak' => 'AK', 'az' => 'AZ', 'ar' => 'AR', 'ca' => 'CA',
        'co' => 'CO', 'ct' => 'CT', 'de' => 'DE', 'fl' => 'FL', 'ga' => 'GA',
        'hi' => 'HI', 'id' => 'ID', 'il' => 'IL', 'in' => 'IN', 'ia' => 'IA',
        'ks' => 'KS', 'ky' => 'KY', 'la' => 'LA', 'me' => 'ME', 'md' => 'MD',
        'ma' => 'MA', 'mi' => 'MI', 'mn' => 'MN', 'ms' => 'MS', 'mo' => 'MO',
        'mt' => 'MT', 'ne' => 'NE', 'nv' => 'NV', 'nh' => 'NH', 'nj' => 'NJ',
        'nm' => 'NM', 'ny' => 'NY', 'nc' => 'NC', 'nd' => 'ND', 'oh' => 'OH',
        'ok' => 'OK', 'or' => 'OR', 'pa' => 'PA', 'ri' => 'RI', 'sc' => 'SC',
        'sd' => 'SD', 'tn' => 'TN', 'tx' => 'TX', 'ut' => 'UT', 'vt' => 'VT',
        'va' => 'VA', 'wa' => 'WA', 'wv' => 'WV', 'wi' => 'WI', 'wy' => 'WY',
        'dc' => 'DC', 'd.c.' => 'DC',
    ];
}
