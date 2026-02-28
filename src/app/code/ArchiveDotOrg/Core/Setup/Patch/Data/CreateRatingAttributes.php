<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Setup\Patch\Data;

use Magento\Catalog\Model\Product;
use Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface;
use Magento\Eav\Setup\EavSetup;
use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Framework\Setup\Patch\PatchRevertableInterface;

/**
 * Create Rating Attributes Data Patch
 *
 * Creates archive_avg_rating and archive_num_reviews product attributes
 * for storing Archive.org rating/review data.
 *
 * NOTE: AddRatingAttributes patch creates the same attributes. Both patches have
 * idempotent guards (EavSetup skips existing attributes), so running both is safe.
 * Cannot remove either patch — Magento tracks applied patches in the patch_list table.
 */
class CreateRatingAttributes implements DataPatchInterface, PatchRevertableInterface
{
    private ModuleDataSetupInterface $moduleDataSetup;
    private EavSetupFactory $eavSetupFactory;

    /**
     * @param ModuleDataSetupInterface $moduleDataSetup
     * @param EavSetupFactory $eavSetupFactory
     */
    public function __construct(
        ModuleDataSetupInterface $moduleDataSetup,
        EavSetupFactory $eavSetupFactory
    ) {
        $this->moduleDataSetup = $moduleDataSetup;
        $this->eavSetupFactory = $eavSetupFactory;
    }

    /**
     * @inheritDoc
     */
    public function apply(): self
    {
        /** @var EavSetup $eavSetup */
        $eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);

        // Average rating from Archive.org (e.g., "4.5")
        if (!$eavSetup->getAttributeId(Product::ENTITY, 'archive_avg_rating')) {
            $eavSetup->addAttribute(
                Product::ENTITY,
                'archive_avg_rating',
                [
                    'type' => 'varchar',
                    'label' => 'Archive.org Average Rating',
                    'input' => 'text',
                    'group' => 'Product Details',
                    'sort_order' => 40,
                    'default' => null,
                    'source' => '',
                    'backend' => '',
                    'frontend' => '',
                    'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
                    'required' => false,
                    'unique' => false,
                    'used_in_product_listing' => true,
                    'searchable' => false,
                    'filterable' => false,
                    'comparable' => false,
                    'is_used_in_grid' => true,
                    'is_visible_in_grid' => true,
                    'is_filterable_in_grid' => true,
                    'visible' => true,
                    'is_html_allowed_on_frontend' => false,
                    'visible_on_front' => true
                ]
            );
        }

        // Number of reviews from Archive.org
        if (!$eavSetup->getAttributeId(Product::ENTITY, 'archive_num_reviews')) {
            $eavSetup->addAttribute(
                Product::ENTITY,
                'archive_num_reviews',
                [
                    'type' => 'int',
                    'label' => 'Archive.org Number of Reviews',
                    'input' => 'text',
                    'group' => 'Product Details',
                    'sort_order' => 41,
                    'default' => null,
                    'source' => '',
                    'backend' => '',
                    'frontend' => '',
                    'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
                    'required' => false,
                    'unique' => false,
                    'used_in_product_listing' => true,
                    'searchable' => false,
                    'filterable' => false,
                    'comparable' => false,
                    'is_used_in_grid' => true,
                    'is_visible_in_grid' => true,
                    'is_filterable_in_grid' => true,
                    'visible' => true,
                    'is_html_allowed_on_frontend' => false,
                    'visible_on_front' => true
                ]
            );
        }

        return $this;
    }

    /**
     * @inheritDoc
     */
    public function revert(): void
    {
        /** @var EavSetup $eavSetup */
        $eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);

        $eavSetup->removeAttribute(Product::ENTITY, 'archive_avg_rating');
        $eavSetup->removeAttribute(Product::ENTITY, 'archive_num_reviews');
    }

    /**
     * @inheritDoc
     */
    public static function getDependencies(): array
    {
        return [CreateProductAttributes::class];
    }

    /**
     * @inheritDoc
     */
    public function getAliases(): array
    {
        return [];
    }
}
