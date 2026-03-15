<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use ArchiveDotOrg\Core\Api\ArtistConfigLoaderInterface;
use ArchiveDotOrg\Core\Exception\ConfigurationException;
use Magento\Catalog\Api\CategoryRepositoryInterface;
use Magento\Catalog\Api\Data\CategoryInterfaceFactory;
use Magento\Catalog\Model\Category;
use Magento\Catalog\Model\ResourceModel\Category\CollectionFactory as CategoryCollectionFactory;
use Magento\Framework\Exception\LocalizedException;
use Magento\Store\Model\StoreManagerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Psr\Log\LoggerInterface;

/**
 * CLI command to setup artist categories from YAML configuration.
 *
 * Usage:
 *   bin/magento archive:setup lettuce
 *   bin/magento archive:setup lettuce --dry-run
 *   bin/magento archive:setup --all
 */
class SetupArtistCommand extends Command
{
    private const ARGUMENT_ARTIST = 'artist';
    private const OPTION_ALL = 'all';
    private const OPTION_DRY_RUN = 'dry-run';

    private int $categoriesCreated = 0;
    private int $categoriesSkipped = 0;

    /**
     * @param ArtistConfigLoaderInterface $configLoader
     * @param CategoryRepositoryInterface $categoryRepository
     * @param CategoryInterfaceFactory $categoryFactory
     * @param CategoryCollectionFactory $categoryCollectionFactory
     * @param StoreManagerInterface $storeManager
     * @param LoggerInterface $logger
     * @param string|null $name
     */
    public function __construct(
        private readonly ArtistConfigLoaderInterface $configLoader,
        private readonly CategoryRepositoryInterface $categoryRepository,
        private readonly CategoryInterfaceFactory $categoryFactory,
        private readonly CategoryCollectionFactory $categoryCollectionFactory,
        private readonly StoreManagerInterface $storeManager,
        private readonly LoggerInterface $logger,
        ?string $name = null
    ) {
        parent::__construct($name);
    }

    /**
     * @inheritDoc
     */
    protected function configure(): void
    {
        $this->setName('archive:setup')
            ->setDescription('Setup artist categories from YAML configuration')
            ->addArgument(
                self::ARGUMENT_ARTIST,
                InputArgument::OPTIONAL,
                'Artist key to setup (e.g., lettuce, phish)'
            )
            ->addOption(
                self::OPTION_ALL,
                null,
                InputOption::VALUE_NONE,
                'Setup all artist configurations'
            )
            ->addOption(
                self::OPTION_DRY_RUN,
                null,
                InputOption::VALUE_NONE,
                'Show what would be created without making changes'
            );

        parent::configure();
    }

    /**
     * @inheritDoc
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $artistKey = $input->getArgument(self::ARGUMENT_ARTIST);
        $setupAll = $input->getOption(self::OPTION_ALL);
        $dryRun = $input->getOption(self::OPTION_DRY_RUN);

        if ($dryRun) {
            $output->writeln('<comment>DRY RUN MODE - No changes will be made</comment>');
            $output->writeln('');
        }

        if ($setupAll) {
            return $this->setupAll($output, $dryRun);
        }

        if (empty($artistKey)) {
            $output->writeln('<error>Either provide an artist key or use --all flag</error>');
            $output->writeln('Usage: bin/magento archive:setup <artist> OR archive:setup --all');
            return Command::FAILURE;
        }

        return $this->setupSingle($artistKey, $output, $dryRun);
    }

    /**
     * Setup all artist configurations.
     *
     * @param OutputInterface $output
     * @param bool $dryRun
     * @return int
     */
    private function setupAll(OutputInterface $output, bool $dryRun): int
    {
        $artists = $this->configLoader->getAvailableArtists();

        if (empty($artists)) {
            $output->writeln('<comment>No artist configuration files found</comment>');
            return Command::SUCCESS;
        }

        $output->writeln(sprintf('<info>Setting up %d artists...</info>', count($artists)));
        $output->writeln('');

        $failed = [];

        foreach ($artists as $artistKey) {
            $result = $this->setupSingle($artistKey, $output, $dryRun);

            if ($result !== Command::SUCCESS) {
                $failed[] = $artistKey;
            }
        }

        $output->writeln('');
        $output->writeln(str_repeat('=', 60));
        $output->writeln(sprintf(
            '<info>Created: %d categories, Skipped: %d categories</info>',
            $this->categoriesCreated,
            $this->categoriesSkipped
        ));

        if (!empty($failed)) {
            $output->writeln(sprintf('<error>Failed: %s</error>', implode(', ', $failed)));
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Setup a single artist configuration.
     *
     * @param string $artistKey
     * @param OutputInterface $output
     * @param bool $dryRun
     * @return int
     */
    private function setupSingle(string $artistKey, OutputInterface $output, bool $dryRun): int
    {
        $output->writeln(sprintf('<info>Setting up %s...</info>', $artistKey));

        try {
            // Load and validate configuration
            $config = $this->configLoader->load($artistKey);

            if (empty($config['artist'])) {
                throw new ConfigurationException(__('Missing artist section in configuration'));
            }

            $artistConfig = $config['artist'];
            $albums = $config['albums'] ?? [];

            // Get Artists container category ID
            $artistsContainerId = $this->getArtistsContainerId();

            // Build custom attributes from YAML config
            $customAttributes = [];
            if (!empty($artistConfig['short_name'])) {
                $customAttributes['band_short_name'] = $artistConfig['short_name'];
            }

            // 1. Create/find artist category
            $artistCategory = $this->findOrCreateCategory(
                $artistConfig['name'],
                $artistConfig['url_key'] ?? $artistKey,
                $artistsContainerId,
                $output,
                $dryRun,
                '  ',
                $customAttributes
            );

            if (!$artistCategory) {
                $output->writeln('<error>Failed to create artist category</error>');
                return Command::FAILURE;
            }

            $artistCategoryId = (int)$artistCategory->getId();

            // 2. Create album categories (if any)
            if (!empty($albums)) {
                $output->writeln(sprintf('  Creating %d album categories...', count($albums)));

                foreach ($albums as $album) {
                    $this->findOrCreateCategory(
                        $album['name'],
                        $album['url_key'] ?? $album['key'],
                        $artistCategoryId,
                        $output,
                        $dryRun,
                        '    '
                    );
                }
            }

            $output->writeln('');

            return Command::SUCCESS;

        } catch (ConfigurationException $e) {
            $output->writeln(sprintf('<error>Configuration Error: %s</error>', $e->getMessage()));
            return Command::FAILURE;
        } catch (\Exception $e) {
            $output->writeln(sprintf('<error>Error: %s</error>', $e->getMessage()));
            $this->logger->error('Setup failed for ' . $artistKey, ['exception' => $e]);
            return Command::FAILURE;
        }
    }

    /**
     * Find existing category or create new one.
     *
     * @param string $name
     * @param string $urlKey
     * @param int $parentId
     * @param OutputInterface $output
     * @param bool $dryRun
     * @param string $indent
     * @return Category|null
     * @throws LocalizedException
     */
    private function findOrCreateCategory(
        string $name,
        string $urlKey,
        int $parentId,
        OutputInterface $output,
        bool $dryRun,
        string $indent = '  ',
        array $customAttributes = []
    ): ?Category {
        // Check if category already exists
        $collection = $this->categoryCollectionFactory->create();
        $collection->addAttributeToFilter('url_key', $urlKey)
                   ->addAttributeToFilter('parent_id', $parentId)
                   ->setPageSize(1);

        if ($collection->getSize() > 0) {
            $category = $collection->getFirstItem();

            // Update custom attributes if values differ
            $updated = false;
            foreach ($customAttributes as $attrCode => $attrValue) {
                if ($category->getData($attrCode) !== $attrValue) {
                    $category->setData($attrCode, $attrValue);
                    $updated = true;
                }
            }

            if ($updated && !$dryRun) {
                $this->categoryRepository->save($category);
                $output->writeln($indent . '<info>↻ Updated attributes: ' . $name . '</info>');
            } else {
                $this->categoriesSkipped++;
                $output->writeln($indent . '<comment>⊘ Skipped (exists): ' . $name . '</comment>');
            }

            return $category;
        }

        // Create new category
        if ($dryRun) {
            $output->writeln($indent . '<info>+ Would create: ' . $name . '</info>');
            return null;
        }

        /** @var Category $category */
        $category = $this->categoryFactory->create();
        $category->setName($name)
                 ->setUrlKey($urlKey)
                 ->setParentId($parentId)
                 ->setIsActive(true)
                 ->setIncludeInMenu(true)
                 ->setAttributeSetId($category->getDefaultAttributeSetId());

        foreach ($customAttributes as $attrCode => $attrValue) {
            $category->setData($attrCode, $attrValue);
        }

        $category = $this->categoryRepository->save($category);
        $this->categoriesCreated++;

        $output->writeln($indent . '<info>✓ Created: ' . $name . '</info>');

        return $category;
    }

    /**
     * Get or create the Artists container category.
     *
     * Finds the "Artists" category under the root category (Level 2).
     * Creates it if it doesn't exist.
     *
     * @return int Category ID of the Artists container
     * @throws LocalizedException
     */
    private function getArtistsContainerId(): int
    {
        $rootCategoryId = (int)$this->storeManager->getStore()->getRootCategoryId();

        // Try to find existing "Artists" category
        $collection = $this->categoryCollectionFactory->create();
        $collection->addAttributeToFilter('url_key', 'artists')
                   ->addAttributeToFilter('parent_id', $rootCategoryId)
                   ->setPageSize(1);

        $artistsCategory = $collection->getFirstItem();

        if ($artistsCategory->getId()) {
            return (int)$artistsCategory->getId();
        }

        // Create "Artists" container if it doesn't exist
        /** @var Category $artistsCategory */
        $artistsCategory = $this->categoryFactory->create();
        $artistsCategory->setName('Artists')
                        ->setUrlKey('artists')
                        ->setParentId($rootCategoryId)
                        ->setIsActive(true)
                        ->setIncludeInMenu(true)
                        ->setIsAnchor(true)
                        ->setAttributeSetId($artistsCategory->getDefaultAttributeSetId());

        $artistsCategory = $this->categoryRepository->save($artistsCategory);

        return (int)$artistsCategory->getId();
    }
}
