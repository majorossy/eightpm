<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use ArchiveDotOrg\Core\Model\VenueMergeService;
use ArchiveDotOrg\Core\Model\VenueMapService;
use Magento\Framework\App\ResourceConnection;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

class MergeVenuesCommand extends BaseLoggedCommand
{
    private VenueMergeService $mergeService;
    private VenueMapService $venueMapService;

    public function __construct(
        VenueMergeService $mergeService,
        VenueMapService $venueMapService,
        ResourceConnection $resourceConnection,
        LoggerInterface $logger,
        ?string $name = null
    ) {
        $this->mergeService = $mergeService;
        $this->venueMapService = $venueMapService;
        $this->resourceConnection = $resourceConnection;
        $this->logger = $logger;
        parent::__construct($name);
    }

    protected function configure(): void
    {
        $this->setName('archive:venue:merge')
            ->setDescription('Merge duplicate venues (same place, different spellings)')
            ->addOption('auto', null, InputOption::VALUE_NONE, 'Auto-merge safe + partial groups (skip conflicts)')
            ->addOption('interactive', 'i', InputOption::VALUE_NONE, 'Step through ambiguous groups for human review')
            ->addOption('force', 'f', InputOption::VALUE_NONE, 'Skip confirmation prompt')
            ->addOption('limit', 'l', InputOption::VALUE_REQUIRED, 'Max groups to process (for testing)')
            ->addOption('dry-run', 'd', InputOption::VALUE_NONE, 'Analyze and report without making changes');
    }

    protected function doExecute(InputInterface $input, OutputInterface $output, string $correlationId): int
    {
        $io = new SymfonyStyle($input, $output);
        $auto = $input->getOption('auto');
        $interactive = $input->getOption('interactive');
        $dryRun = $input->getOption('dry-run');
        $force = $input->getOption('force');
        $limit = $input->getOption('limit') ? (int)$input->getOption('limit') : null;

        // Phase 1: Find duplicate groups
        $io->section('Phase 1: Scanning for duplicate venues...');
        $groups = $this->mergeService->findDuplicateGroups();
        $io->text(sprintf('Found %d duplicate groups', count($groups)));

        if (empty($groups)) {
            $io->success('No duplicate venues found.');
            return Command::SUCCESS;
        }

        // Phase 2: Classify each group
        $io->section('Phase 2: Classifying groups...');
        $classified = ['safe' => [], 'partial' => [], 'conflict' => [], 'ambiguous' => []];
        foreach ($groups as $key => $group) {
            $type = $this->mergeService->classifyGroup($group);
            $classified[$type][] = ['key' => $key, 'venues' => $group];
        }

        // Display summary
        $this->displaySummary($io, $classified);

        // Dry run: show top merges and exit
        if (!$auto && !$interactive) {
            $this->showTopMerges($io, $classified);
            $io->note('Use --auto to execute safe+partial merges, --interactive to review ambiguous cases.');
            return Command::SUCCESS;
        }

        // Phase 3: Execute merges
        if ($auto) {
            return $this->executeAutoMerge($io, $classified, $dryRun, $force, $limit, $correlationId);
        }

        if ($interactive) {
            return $this->executeInteractiveMerge($io, $classified, $dryRun, $correlationId);
        }

        return Command::SUCCESS;
    }

    private function displaySummary(SymfonyStyle $io, array $classified): void
    {
        $safeRemovals = $this->countRemovals($classified['safe']);
        $partialRemovals = $this->countRemovals($classified['partial']);
        $conflictRemovals = $this->countRemovals($classified['conflict']);
        $ambiguousRemovals = $this->countRemovals($classified['ambiguous']);

        $io->section('Duplicate Venue Analysis');
        $io->table(
            ['Classification', 'Groups', 'Venues to Remove', 'Auto-merge?'],
            [
                ['Safe (same city/state)', count($classified['safe']), $safeRemovals, 'YES'],
                ['Partial (some NULL city)', count($classified['partial']), $partialRemovals, 'YES'],
                ['Conflict (different cities)', count($classified['conflict']), $conflictRemovals, 'NEVER'],
                ['Ambiguous (all NULL city)', count($classified['ambiguous']), $ambiguousRemovals, 'Interactive only'],
            ]
        );

        $totalAuto = count($classified['safe']) + count($classified['partial']);
        $totalAutoRemovals = $safeRemovals + $partialRemovals;
        $io->text(sprintf(
            'Auto-mergeable: %d groups (%d venue removals)',
            $totalAuto,
            $totalAutoRemovals
        ));
    }

    private function showTopMerges(SymfonyStyle $io, array $classified): void
    {
        $io->section('Top 20 Merges (by combined shows)');

        $allMergeable = array_merge($classified['safe'], $classified['partial']);

        // Sort by combined total_shows descending
        usort($allMergeable, function ($a, $b) {
            $aShows = array_sum(array_column($a['venues'], 'total_shows'));
            $bShows = array_sum(array_column($b['venues'], 'total_shows'));
            return $bShows <=> $aShows;
        });

        $rows = [];
        foreach (array_slice($allMergeable, 0, 20) as $group) {
            $result = $this->mergeService->pickWinner($group['venues']);
            $winner = $result['winner'];
            $losers = $result['losers'];

            $loserNames = array_map(fn($l) => sprintf(
                '%s (%d)',
                $l['normalized_name'],
                $l['total_shows'] ?? 0
            ), $losers);

            $totalShows = array_sum(array_column($group['venues'], 'total_shows'));
            $city = $winner['city'] ? ($winner['city'] . ', ' . ($winner['state'] ?? '')) : '?';

            $rows[] = [
                sprintf('%s (%d)', $winner['normalized_name'], $winner['total_shows'] ?? 0),
                implode(' + ', $loserNames),
                $city,
                $totalShows,
            ];
        }

        $io->table(['Winner', 'Merging Into It', 'City', 'Combined Shows'], $rows);
    }

    private function executeAutoMerge(
        SymfonyStyle $io,
        array $classified,
        bool $dryRun,
        bool $force,
        ?int $limit,
        string $correlationId
    ): int {
        $mergeable = array_merge($classified['safe'], $classified['partial']);

        if (empty($mergeable)) {
            $io->success('No safe/partial groups to merge.');
            return Command::SUCCESS;
        }

        if ($limit) {
            $mergeable = array_slice($mergeable, 0, $limit);
        }

        $totalRemovals = $this->countRemovals($mergeable);

        if ($dryRun) {
            $io->note(sprintf(
                'DRY RUN: Would merge %d groups (%d venue removals). Run without --dry-run to execute.',
                count($mergeable),
                $totalRemovals
            ));
            return Command::SUCCESS;
        }

        if (!$force) {
            $confirm = $io->confirm(sprintf(
                'Merge %d groups (%d venue removals)?',
                count($mergeable),
                $totalRemovals
            ), false);
            if (!$confirm) {
                $io->warning('Aborted.');
                return Command::SUCCESS;
            }
        }

        $io->section(sprintf('Merging %d groups...', count($mergeable)));

        $merged = 0;
        $removed = 0;
        $aliasesMoved = 0;
        $errors = 0;

        foreach ($mergeable as $i => $group) {
            if (!$this->shouldContinue()) {
                $io->warning('Stopped by signal.');
                break;
            }

            $result = $this->mergeService->pickWinner($group['venues']);
            $winner = $result['winner'];
            $losers = $result['losers'];
            $loserIds = array_column($losers, 'venue_id');

            $loserNames = implode(' + ', array_map(fn($l) => $l['normalized_name'], $losers));
            $city = $winner['city'] ? ($winner['city'] . ', ' . ($winner['state'] ?? '')) : '';

            try {
                $stats = $this->mergeService->mergeVenues((int)$winner['venue_id'], array_map('intval', $loserIds));
                $merged++;
                $removed += $stats['losers_removed'];
                $aliasesMoved += $stats['aliases_moved'];

                $io->text(sprintf(
                    '  [%d/%d] %s <- %s %s',
                    $i + 1,
                    count($mergeable),
                    $winner['normalized_name'],
                    $loserNames,
                    $city ? "[$city]" : ''
                ));
            } catch (\Exception $e) {
                $errors++;
                $io->error(sprintf(
                    '  [%d/%d] FAILED %s: %s',
                    $i + 1,
                    count($mergeable),
                    $winner['normalized_name'],
                    $e->getMessage()
                ));
            }
        }

        // Invalidate venue map cache
        $this->venueMapService->invalidate();

        $this->updateProgress($correlationId, $merged, $merged);

        $io->newLine();
        $io->success(sprintf(
            "Merged %d groups: %d venues removed, %d aliases moved, %d errors",
            $merged,
            $removed,
            $aliasesMoved,
            $errors
        ));

        $io->note('Run: bin/magento cache:flush');

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    private function executeInteractiveMerge(
        SymfonyStyle $io,
        array $classified,
        bool $dryRun,
        string $correlationId
    ): int {
        $reviewable = array_merge($classified['ambiguous'], $classified['conflict']);

        if (empty($reviewable)) {
            $io->success('No ambiguous/conflict groups to review.');
            return Command::SUCCESS;
        }

        // Sort by combined shows descending (most important first)
        usort($reviewable, function ($a, $b) {
            return array_sum(array_column($b['venues'], 'total_shows'))
               <=> array_sum(array_column($a['venues'], 'total_shows'));
        });

        $io->section(sprintf('Reviewing %d groups interactively', count($reviewable)));

        $merged = 0;
        $skipped = 0;

        foreach ($reviewable as $i => $group) {
            if (!$this->shouldContinue()) {
                $io->warning('Stopped by signal.');
                break;
            }

            $type = $this->mergeService->classifyGroup($group['venues']);
            $result = $this->mergeService->pickWinner($group['venues']);
            $winner = $result['winner'];
            $losers = $result['losers'];

            $io->newLine();
            $io->text(sprintf(
                '<comment>[Group %d/%d] %s</comment>',
                $i + 1,
                count($reviewable),
                strtoupper($type)
            ));

            // Show all venues in this group
            $rows = [];
            foreach ($group['venues'] as $v) {
                $isWinner = ($v['venue_id'] === $winner['venue_id']);
                $rows[] = [
                    $isWinner ? 'WINNER' : '',
                    $v['venue_id'],
                    $v['normalized_name'],
                    $v['city'] ?: '-',
                    $v['state'] ?: '-',
                    $v['total_shows'] ?? 0,
                ];
            }
            $io->table(['', 'ID', 'Name', 'City', 'State', 'Shows'], $rows);

            if ($type === 'conflict') {
                $io->warning('Different cities detected — these may be different physical venues.');
            }

            $choice = $io->choice('Action', ['Merge', 'Skip', 'Quit'], 'Skip');

            if ($choice === 'Quit') {
                $io->text('Quitting interactive review.');
                break;
            }

            if ($choice === 'Skip') {
                $skipped++;
                continue;
            }

            // Merge
            if ($dryRun) {
                $io->text('  DRY RUN: Would merge.');
                $merged++;
                continue;
            }

            $loserIds = array_column($losers, 'venue_id');
            try {
                $this->mergeService->mergeVenues((int)$winner['venue_id'], array_map('intval', $loserIds));
                $merged++;
                $io->text(sprintf('  Merged into %s (ID %d)', $winner['normalized_name'], $winner['venue_id']));
            } catch (\Exception $e) {
                $io->error('  Merge failed: ' . $e->getMessage());
            }
        }

        if ($merged > 0) {
            $this->venueMapService->invalidate();
        }

        $this->updateProgress($correlationId, $merged + $skipped, $merged);

        $io->newLine();
        $io->success(sprintf('Interactive review complete: %d merged, %d skipped', $merged, $skipped));

        if ($merged > 0) {
            $io->note('Run: bin/magento cache:flush');
        }

        return Command::SUCCESS;
    }

    /**
     * Count total loser venues (removals) in a list of groups
     */
    private function countRemovals(array $groups): int
    {
        $count = 0;
        foreach ($groups as $group) {
            $count += count($group['venues']) - 1; // Each group keeps 1 winner
        }
        return $count;
    }
}
