<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Magento\Framework\App\ResourceConnection;
use Magento\Catalog\Api\CategoryRepositoryInterface;
use ArchiveDotOrg\Core\Logger\Logger;

/**
 * Update category images with Wikipedia artwork URLs
 */
class UpdateCategoryArtworkCommand extends Command
{
    private const OPTION_DRY_RUN = 'dry-run';

    private ResourceConnection $resourceConnection;
    private CategoryRepositoryInterface $categoryRepository;
    private Logger $logger;

    public function __construct(
        ResourceConnection $resourceConnection,
        CategoryRepositoryInterface $categoryRepository,
        Logger $logger
    ) {
        $this->resourceConnection = $resourceConnection;
        $this->categoryRepository = $categoryRepository;
        $this->logger = $logger;
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->setName('archive:artwork:update')
            ->setDescription('Update album category images with Wikipedia artwork URLs')
            ->addOption(
                self::OPTION_DRY_RUN,
                null,
                InputOption::VALUE_NONE,
                'Preview changes without applying them'
            );

        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $dryRun = $input->getOption(self::OPTION_DRY_RUN);

        if ($dryRun) {
            $output->writeln('<comment>DRY RUN MODE - No changes will be made</comment>');
            $output->writeln('');
        }

        $connection = $this->resourceConnection->getConnection();
        $tableName = $connection->getTableName('archivedotorg_studio_albums');

        // Get all albums with artwork URLs and category IDs (skip locked)
        $select = $connection->select()
            ->from($tableName)
            ->where('artwork_url IS NOT NULL')
            ->where('category_id IS NOT NULL')
            ->where('is_locked = 0 OR is_locked IS NULL');

        $albums = $connection->fetchAll($select);

        if (empty($albums)) {
            $output->writeln('<comment>No albums found with artwork and category IDs</comment>');
            return Command::SUCCESS;
        }

        $output->writeln(sprintf('Found %d albums to process', count($albums)));
        $output->writeln('');

        $updated = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($albums as $album) {
            $categoryId = (int)$album['category_id'];
            $artworkUrl = $album['artwork_url'];
            $artistName = $album['artist_name'];
            $albumTitle = $album['album_title'];

            try {
                $category = $this->categoryRepository->get($categoryId);

                $output->write("Processing: $artistName - $albumTitle (Category ID: $categoryId)...");

                if ($dryRun) {
                    $output->writeln(' <info>[DRY RUN] Would update</info>');
                    $updated++;
                } else {
                    // Set the Wikipedia artwork URL custom attribute
                    $category->setCustomAttribute('wikipedia_artwork_url', $artworkUrl);
                    $this->categoryRepository->save($category);

                    $output->writeln(' <info>Updated</info>');
                    $updated++;
                    $this->logger->info("Updated category $categoryId with artwork: $artworkUrl");
                }

            } catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
                $output->writeln(' <comment>Category not found</comment>');
                $skipped++;
            } catch (\Exception $e) {
                $output->writeln(' <error>Error: ' . $e->getMessage() . '</error>');
                $errors++;
                $this->logger->error("Failed to update category $categoryId: " . $e->getMessage());
            }
        }

        $output->writeln('');
        $output->writeln('<info>Summary:</info>');
        $output->writeln("  Total albums: " . count($albums));
        $output->writeln("  Updated: $updated");
        $output->writeln("  Skipped: $skipped");
        $output->writeln("  Errors: $errors");

        if ($dryRun) {
            $output->writeln('');
            $output->writeln('<comment>This was a dry run. Run without --dry-run to apply changes.</comment>');
        }

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
