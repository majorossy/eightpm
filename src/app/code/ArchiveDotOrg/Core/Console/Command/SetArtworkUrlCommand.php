<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Magento\Framework\App\ResourceConnection;
use Magento\Catalog\Api\CategoryRepositoryInterface;
use ArchiveDotOrg\Core\Logger\Logger;

/**
 * Manually set artwork URL for an album category
 */
class SetArtworkUrlCommand extends Command
{
    private const ARG_CATEGORY_ID = 'category-id';
    private const ARG_ARTWORK_URL = 'artwork-url';
    private const OPTION_NOTES = 'notes';
    private const OPTION_LIST = 'list-missing';

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
        $this->setName('archive:artwork:set-url')
            ->setDescription('Manually set Wikipedia artwork URL for an album category')
            ->addArgument(
                self::ARG_CATEGORY_ID,
                InputArgument::OPTIONAL,
                'Category ID of the album'
            )
            ->addArgument(
                self::ARG_ARTWORK_URL,
                InputArgument::OPTIONAL,
                'Wikipedia artwork URL (or "none" to clear)'
            )
            ->addOption(
                self::OPTION_NOTES,
                null,
                InputOption::VALUE_OPTIONAL,
                'Notes about this override'
            )
            ->addOption(
                self::OPTION_LIST,
                'l',
                InputOption::VALUE_NONE,
                'List albums with missing or no artwork'
            );

        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        if ($input->getOption(self::OPTION_LIST)) {
            return $this->listMissingArtwork($output);
        }

        $categoryId = $input->getArgument(self::ARG_CATEGORY_ID);
        $artworkUrl = $input->getArgument(self::ARG_ARTWORK_URL);

        if (!$categoryId || !$artworkUrl) {
            $output->writeln('<error>Please provide both category-id and artwork-url, or use --list-missing</error>');
            $output->writeln('');
            $output->writeln('<info>Usage:</info>');
            $output->writeln('  Set artwork:  bin/magento archive:artwork:set-url 1234 "https://url"');
            $output->writeln('  Clear artwork: bin/magento archive:artwork:set-url 1234 none');
            $output->writeln('  List missing:  bin/magento archive:artwork:set-url --list-missing');
            return Command::FAILURE;
        }

        return $this->setArtworkUrl(
            (int)$categoryId,
            $artworkUrl,
            $input->getOption(self::OPTION_NOTES),
            $output
        );
    }

    private function setArtworkUrl(
        int $categoryId,
        string $artworkUrl,
        ?string $notes,
        OutputInterface $output
    ): int {
        $connection = $this->resourceConnection->getConnection();

        try {
            // Get category info
            $category = $this->categoryRepository->get($categoryId);
            $artistName = $this->getParentCategoryName($categoryId);

            $output->writeln("<info>Category:</info> {$category->getName()} (ID: $categoryId)");
            $output->writeln("<info>Artist:</info> $artistName");

            // Clear artwork
            if (strtolower($artworkUrl) === 'none') {
                // Remove from overrides
                $connection->delete(
                    $connection->getTableName('archivedotorg_artwork_overrides'),
                    ['category_id = ?' => $categoryId]
                );

                // Clear category attribute
                $category->setCustomAttribute('wikipedia_artwork_url', null);
                $this->categoryRepository->save($category);

                $output->writeln('<info>Artwork cleared successfully</info>');
                return Command::SUCCESS;
            }

            // Validate URL
            if (!filter_var($artworkUrl, FILTER_VALIDATE_URL)) {
                $output->writeln('<error>Invalid URL format</error>');
                return Command::FAILURE;
            }

            // Check if locked by debug page override — CLI cannot overwrite locked images
            $studioTable = $connection->getTableName('archivedotorg_studio_albums');
            $isLocked = $connection->fetchOne(
                $connection->select()->from($studioTable, ['is_locked'])
                    ->where('category_id = ?', $categoryId)
            );
            if ($isLocked) {
                $output->writeln('<error>This album is locked (edited from debug/images page). Unlock it there first.</error>');
                return Command::FAILURE;
            }

            // Save override
            $overrideTable = $connection->getTableName('archivedotorg_artwork_overrides');
            $connection->insertOnDuplicate(
                $overrideTable,
                [
                    'category_id' => $categoryId,
                    'artist_name' => $artistName,
                    'album_name' => $category->getName(),
                    'artwork_url' => $artworkUrl,
                    'source' => 'manual',
                    'notes' => $notes,
                ],
                ['artwork_url', 'notes', 'updated_at']
            );

            // Update category attribute
            $category->setCustomAttribute('wikipedia_artwork_url', $artworkUrl);
            $this->categoryRepository->save($category);

            $output->writeln('<info>Artwork URL set successfully!</info>');
            $output->writeln("<comment>URL:</comment> $artworkUrl");

            $this->logger->info("Manual artwork set for category $categoryId: $artworkUrl");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $output->writeln('<error>Error: ' . $e->getMessage() . '</error>');
            $this->logger->error("Failed to set artwork for category $categoryId: " . $e->getMessage());
            return Command::FAILURE;
        }
    }

    private function listMissingArtwork(OutputInterface $output): int
    {
        $connection = $this->resourceConnection->getConnection();

        // Get all album categories
        $select = $connection->select()
            ->from(['c' => 'catalog_category_entity'], ['entity_id', 'parent_id'])
            ->joinInner(
                ['cv' => 'catalog_category_entity_varchar'],
                'c.entity_id = cv.entity_id AND cv.store_id = 0',
                ['album_name' => 'value']
            )
            ->joinInner(
                ['attr' => 'eav_attribute'],
                'cv.attribute_id = attr.attribute_id AND attr.attribute_code = "name" AND attr.entity_type_id = 3',
                []
            )
            ->joinInner(
                ['parent' => 'catalog_category_entity'],
                'c.parent_id = parent.entity_id',
                []
            )
            ->joinInner(
                ['pcv' => 'catalog_category_entity_varchar'],
                'parent.entity_id = pcv.entity_id AND pcv.store_id = 0',
                ['artist_name' => 'value']
            )
            ->joinInner(
                ['pattr' => 'eav_attribute'],
                'pcv.attribute_id = pattr.attribute_id AND pattr.attribute_code = "name" AND pattr.entity_type_id = 3',
                []
            )
            ->joinLeft(
                ['cat_album' => 'catalog_category_entity_int'],
                'c.entity_id = cat_album.entity_id',
                []
            )
            ->joinLeft(
                ['album_attr' => 'eav_attribute'],
                'cat_album.attribute_id = album_attr.attribute_id AND album_attr.attribute_code = "is_album" AND album_attr.entity_type_id = 3',
                []
            )
            ->joinLeft(
                ['artwork' => 'catalog_category_entity_varchar'],
                'c.entity_id = artwork.entity_id',
                ['artwork_url' => 'value']
            )
            ->joinLeft(
                ['artwork_attr' => 'eav_attribute'],
                'artwork.attribute_id = artwork_attr.attribute_id AND artwork_attr.attribute_code = "wikipedia_artwork_url" AND artwork_attr.entity_type_id = 3',
                []
            )
            ->where('cat_album.value = 1')
            ->where('(artwork.value IS NULL OR artwork.value = "")')
            ->order(['pcv.value ASC', 'cv.value ASC']);

        $missing = $connection->fetchAll($select);

        if (empty($missing)) {
            $output->writeln('<info>All albums have artwork! 🎉</info>');
            return Command::SUCCESS;
        }

        $output->writeln(sprintf('<comment>Found %d albums missing artwork:</comment>', count($missing)));
        $output->writeln('');

        foreach ($missing as $album) {
            $output->writeln(sprintf(
                '<info>%s</info> - <comment>%s</comment> (ID: %d)',
                $album['artist_name'],
                $album['album_name'],
                $album['entity_id']
            ));
        }

        $output->writeln('');
        $output->writeln('<info>To set artwork:</info>');
        $output->writeln('  bin/magento archive:artwork:set-url <category-id> "<wikipedia-url>"');
        $output->writeln('');
        $output->writeln('<info>Example:</info>');
        $output->writeln('  bin/magento archive:artwork:set-url 1234 "https://upload.wikimedia.org/wikipedia/en/a/ab/Album.jpg"');

        return Command::SUCCESS;
    }

    private function getParentCategoryName(int $categoryId): string
    {
        $connection = $this->resourceConnection->getConnection();

        $select = $connection->select()
            ->from(['c' => 'catalog_category_entity'], ['parent_id'])
            ->where('c.entity_id = ?', $categoryId);

        $parentId = $connection->fetchOne($select);

        if (!$parentId) {
            return 'Unknown';
        }

        $select = $connection->select()
            ->from(['cv' => 'catalog_category_entity_varchar'], ['value'])
            ->joinInner(
                ['attr' => 'eav_attribute'],
                'cv.attribute_id = attr.attribute_id AND attr.attribute_code = "name" AND attr.entity_type_id = 3',
                []
            )
            ->where('cv.entity_id = ?', $parentId)
            ->where('cv.store_id = 0');

        return (string)$connection->fetchOne($select);
    }
}
