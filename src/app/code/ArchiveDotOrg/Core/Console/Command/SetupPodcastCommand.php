<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use ArchiveDotOrg\Core\Api\PodcastConfigLoaderInterface;
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
 * CLI command to setup podcast categories from YAML configuration.
 *
 * Usage:
 *   bin/magento podcast:setup joe-rogan-experience
 *   bin/magento podcast:setup joe-rogan-experience --dry-run
 *   bin/magento podcast:setup --all
 */
class SetupPodcastCommand extends Command
{
    private const ARGUMENT_PODCAST = 'podcast';
    private const OPTION_ALL = 'all';
    private const OPTION_DRY_RUN = 'dry-run';

    private int $categoriesCreated = 0;
    private int $categoriesSkipped = 0;

    /**
     * @param PodcastConfigLoaderInterface $configLoader
     * @param CategoryRepositoryInterface $categoryRepository
     * @param CategoryInterfaceFactory $categoryFactory
     * @param CategoryCollectionFactory $categoryCollectionFactory
     * @param StoreManagerInterface $storeManager
     * @param LoggerInterface $logger
     * @param string|null $name
     */
    public function __construct(
        private readonly PodcastConfigLoaderInterface $configLoader,
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
        $this->setName('podcast:setup')
            ->setDescription('Setup podcast categories from YAML configuration')
            ->addArgument(
                self::ARGUMENT_PODCAST,
                InputArgument::OPTIONAL,
                'Podcast key to setup (e.g., joe-rogan-experience)'
            )
            ->addOption(
                self::OPTION_ALL,
                null,
                InputOption::VALUE_NONE,
                'Setup all podcast configurations'
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
        $podcastKey = $input->getArgument(self::ARGUMENT_PODCAST);
        $setupAll = $input->getOption(self::OPTION_ALL);
        $dryRun = $input->getOption(self::OPTION_DRY_RUN);

        if ($dryRun) {
            $output->writeln('<comment>DRY RUN MODE - No changes will be made</comment>');
            $output->writeln('');
        }

        if ($setupAll) {
            return $this->setupAll($output, $dryRun);
        }

        if (empty($podcastKey)) {
            $output->writeln('<error>Either provide a podcast key or use --all flag</error>');
            $output->writeln('Usage: bin/magento podcast:setup <podcast> OR podcast:setup --all');
            return Command::FAILURE;
        }

        return $this->setupSingle($podcastKey, $output, $dryRun);
    }

    /**
     * Setup all podcast configurations.
     *
     * @param OutputInterface $output
     * @param bool $dryRun
     * @return int
     */
    private function setupAll(OutputInterface $output, bool $dryRun): int
    {
        $podcasts = $this->configLoader->getAvailablePodcasts();

        if (empty($podcasts)) {
            $output->writeln('<comment>No podcast configuration files found</comment>');
            return Command::SUCCESS;
        }

        $output->writeln(sprintf('<info>Setting up %d podcasts...</info>', count($podcasts)));
        $output->writeln('');

        $failed = [];

        foreach ($podcasts as $podcastKey) {
            $result = $this->setupSingle($podcastKey, $output, $dryRun);

            if ($result !== Command::SUCCESS) {
                $failed[] = $podcastKey;
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
     * Setup a single podcast configuration.
     *
     * @param string $podcastKey
     * @param OutputInterface $output
     * @param bool $dryRun
     * @return int
     */
    private function setupSingle(string $podcastKey, OutputInterface $output, bool $dryRun): int
    {
        $output->writeln(sprintf('<info>Setting up %s...</info>', $podcastKey));

        try {
            // Load and validate configuration
            $config = $this->configLoader->load($podcastKey);

            if (empty($config['podcast'])) {
                throw new ConfigurationException(__('Missing podcast section in configuration'));
            }

            $podcastConfig = $config['podcast'];

            // Get Podcasts container category ID
            $podcastsContainerId = $this->getPodcastsContainerId();

            // Create/find podcast category
            $podcastCategory = $this->findOrCreateCategory(
                $podcastConfig['name'],
                $podcastConfig['url_key'] ?? $podcastKey,
                $podcastsContainerId,
                $output,
                $dryRun,
                $podcastConfig
            );

            if (!$podcastCategory) {
                $output->writeln('<error>Failed to create podcast category</error>');
                return Command::FAILURE;
            }

            $output->writeln('');

            return Command::SUCCESS;

        } catch (ConfigurationException $e) {
            $output->writeln(sprintf('<error>Configuration Error: %s</error>', $e->getMessage()));
            return Command::FAILURE;
        } catch (\Exception $e) {
            $output->writeln(sprintf('<error>Error: %s</error>', $e->getMessage()));
            $this->logger->error('Setup failed for ' . $podcastKey, ['exception' => $e]);
            return Command::FAILURE;
        }
    }

    /**
     * Find existing category or create new one with podcast attributes.
     *
     * @param string $name
     * @param string $urlKey
     * @param int $parentId
     * @param OutputInterface $output
     * @param bool $dryRun
     * @param array $podcastConfig
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
        array $podcastConfig = [],
        string $indent = '  '
    ): ?Category {
        // Check if category already exists
        $collection = $this->categoryCollectionFactory->create();
        $collection->addAttributeToFilter('url_key', $urlKey)
                   ->addAttributeToFilter('parent_id', $parentId)
                   ->setPageSize(1);

        if ($collection->getSize() > 0) {
            $this->categoriesSkipped++;
            $output->writeln($indent . '<comment>⊘ Skipped (exists): ' . $name . '</comment>');

            // Update attributes on existing category if not dry run
            if (!$dryRun && !empty($podcastConfig)) {
                $category = $collection->getFirstItem();
                $this->updatePodcastAttributes($category, $podcastConfig);
                $output->writeln($indent . '<info>  ✓ Updated attributes</info>');
            }

            return $collection->getFirstItem();
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

        // Set podcast-specific attributes
        $category->setData('is_podcast', 1);
        $this->updatePodcastAttributes($category, $podcastConfig);

        $category = $this->categoryRepository->save($category);
        $this->categoriesCreated++;

        $output->writeln($indent . '<info>✓ Created: ' . $name . '</info>');

        return $category;
    }

    /**
     * Update podcast-specific category attributes from YAML config.
     *
     * @param Category $category
     * @param array $config
     * @return void
     */
    private function updatePodcastAttributes(Category $category, array $config): void
    {
        // Map YAML fields to category attributes
        $attributeMap = [
            'description' => 'band_extended_bio',
            'image_url' => 'band_image_url',
            'genres' => 'band_genres',
            'official_website' => 'band_official_website',
            'spotify_url' => 'podcast_spotify_url',
            'apple_url' => 'podcast_apple_url',
            'youtube_url' => 'podcast_youtube_url',
            'rss_feed' => 'podcast_rss_feed',
            'facebook' => 'band_facebook',
            'instagram' => 'band_instagram',
            'twitter' => 'band_twitter',
        ];

        foreach ($attributeMap as $yamlKey => $attributeCode) {
            if (!empty($config[$yamlKey])) {
                $category->setData($attributeCode, $config[$yamlKey]);
            }
        }

        // Save if category already has an ID (updating existing)
        if ($category->getId()) {
            try {
                $this->categoryRepository->save($category);
            } catch (\Exception $e) {
                $this->logger->error('Failed to update podcast attributes: ' . $e->getMessage());
            }
        }
    }

    /**
     * Get or create the Podcasts container category.
     *
     * Finds the "Podcasts" category under the root category (Level 2).
     * Creates it if it doesn't exist.
     *
     * @return int Category ID of the Podcasts container
     * @throws LocalizedException
     */
    private function getPodcastsContainerId(): int
    {
        $rootCategoryId = (int)$this->storeManager->getStore()->getRootCategoryId();

        // Try to find existing "Podcasts" category
        $collection = $this->categoryCollectionFactory->create();
        $collection->addAttributeToFilter('url_key', 'podcasts')
                   ->addAttributeToFilter('parent_id', $rootCategoryId)
                   ->setPageSize(1);

        $podcastsCategory = $collection->getFirstItem();

        if ($podcastsCategory->getId()) {
            return (int)$podcastsCategory->getId();
        }

        // Create "Podcasts" container if it doesn't exist
        /** @var Category $podcastsCategory */
        $podcastsCategory = $this->categoryFactory->create();
        $podcastsCategory->setName('Podcasts')
                        ->setUrlKey('podcasts')
                        ->setParentId($rootCategoryId)
                        ->setIsActive(true)
                        ->setIncludeInMenu(true)
                        ->setIsAnchor(true)
                        ->setAttributeSetId($podcastsCategory->getDefaultAttributeSetId());

        $podcastsCategory = $this->categoryRepository->save($podcastsCategory);

        return (int)$podcastsCategory->getId();
    }
}
