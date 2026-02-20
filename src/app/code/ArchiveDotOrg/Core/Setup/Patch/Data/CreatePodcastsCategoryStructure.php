<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Setup\Patch\Data;

use Magento\Catalog\Api\CategoryRepositoryInterface;
use Magento\Catalog\Model\CategoryFactory;
use Magento\Catalog\Model\ResourceModel\Category\CollectionFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Store\Model\StoreManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * Create Podcasts Root Category Structure Data Patch
 *
 * Creates the "Podcasts" root category (ID 49) under Default Category (ID 2).
 * This mirrors the pattern from CreateCategoryStructure.php:681 used for Artists category.
 */
class CreatePodcastsCategoryStructure implements DataPatchInterface
{
    private ModuleDataSetupInterface $moduleDataSetup;
    private CategoryFactory $categoryFactory;
    private CategoryRepositoryInterface $categoryRepository;
    private CollectionFactory $categoryCollectionFactory;
    private StoreManagerInterface $storeManager;
    private LoggerInterface $logger;

    public function __construct(
        ModuleDataSetupInterface $moduleDataSetup,
        CategoryFactory $categoryFactory,
        CategoryRepositoryInterface $categoryRepository,
        CollectionFactory $categoryCollectionFactory,
        StoreManagerInterface $storeManager,
        LoggerInterface $logger
    ) {
        $this->moduleDataSetup = $moduleDataSetup;
        $this->categoryFactory = $categoryFactory;
        $this->categoryRepository = $categoryRepository;
        $this->categoryCollectionFactory = $categoryCollectionFactory;
        $this->storeManager = $storeManager;
        $this->logger = $logger;
    }

    /**
     * @inheritDoc
     */
    public function apply(): self
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        try {
            // Ensure Podcasts root category exists
            $this->ensurePodcastsRoot();
        } catch (\Exception $e) {
            $this->logger->error('Failed to create Podcasts category structure: ' . $e->getMessage());
            throw $e;
        }

        $this->moduleDataSetup->getConnection()->endSetup();

        return $this;
    }

    /**
     * Ensure the Podcasts root category (ID 49) exists
     */
    private function ensurePodcastsRoot(): int
    {
        // Check if category with expected name exists under Default Category (2)
        $collection = $this->categoryCollectionFactory->create();
        $collection->addAttributeToFilter('name', 'Podcasts');
        $collection->addFieldToFilter('parent_id', 2);
        $collection->setPageSize(1);

        if ($collection->getSize() > 0) {
            $category = $collection->getFirstItem();
            $this->logger->info(sprintf('Podcasts root category already exists (ID: %d)', $category->getId()));
            return (int) $category->getId();
        }

        // Create Podcasts category
        $category = $this->categoryFactory->create();
        $category->setName('Podcasts');
        $category->setUrlKey('podcasts');
        $category->setParentId(2);
        $category->setIsActive(true);
        $category->setIncludeInMenu(true);
        $category->setPath('1/2');

        $this->categoryRepository->save($category);
        $this->logger->info(sprintf('Created Podcasts root category (ID: %d)', $category->getId()));

        return (int) $category->getId();
    }

    /**
     * @inheritDoc
     */
    public static function getDependencies(): array
    {
        // Depends on CreateCategoryStructure to establish pattern
        return [
            CreateCategoryStructure::class,
        ];
    }

    /**
     * @inheritDoc
     */
    public function getAliases(): array
    {
        return [];
    }
}
