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
 * Add Recording Restriction Attributes Data Patch
 *
 * Creates product attributes for copyright restriction and recording classification:
 * - is_streamable: Whether the recording can be streamed
 * - recording_type: SBD, AUD, MX, FM, WEBCAST, or UNKNOWN
 * - archive_detail_url: Archive.org detail page URL
 * - archive_license_url: Creative Commons license URL
 * - access_restriction: Access restriction type (e.g., stream_only)
 */
class AddRecordingRestrictionAttributes implements DataPatchInterface, PatchRevertableInterface
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

        // is_streamable - boolean flag (default 1 = streamable)
        if (!$eavSetup->getAttributeId(Product::ENTITY, 'is_streamable')) {
            $eavSetup->addAttribute(
                Product::ENTITY,
                'is_streamable',
                [
                    'type' => 'int',
                    'label' => 'Is Streamable',
                    'input' => 'boolean',
                    'group' => 'Product Details',
                    'sort_order' => 80,
                    'default' => '1',
                    'source' => \Magento\Eav\Model\Entity\Attribute\Source\Boolean::class,
                    'backend' => '',
                    'frontend' => '',
                    'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
                    'required' => false,
                    'unique' => false,
                    'used_in_product_listing' => true,
                    'searchable' => false,
                    'filterable' => true,
                    'comparable' => false,
                    'is_used_in_grid' => true,
                    'is_visible_in_grid' => false,
                    'is_filterable_in_grid' => true,
                    'visible' => true,
                    'is_html_allowed_on_frontend' => false,
                    'visible_on_front' => false
                ]
            );
        }

        // recording_type - SBD, AUD, MX, FM, WEBCAST, UNKNOWN
        if (!$eavSetup->getAttributeId(Product::ENTITY, 'recording_type')) {
            $eavSetup->addAttribute(
                Product::ENTITY,
                'recording_type',
                [
                    'type' => 'varchar',
                    'label' => 'Recording Type',
                    'input' => 'text',
                    'group' => 'Product Details',
                    'sort_order' => 81,
                    'default' => null,
                    'source' => '',
                    'backend' => '',
                    'frontend' => '',
                    'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
                    'required' => false,
                    'unique' => false,
                    'used_in_product_listing' => true,
                    'searchable' => false,
                    'filterable' => true,
                    'comparable' => false,
                    'is_used_in_grid' => true,
                    'is_visible_in_grid' => false,
                    'is_filterable_in_grid' => true,
                    'visible' => true,
                    'is_html_allowed_on_frontend' => false,
                    'visible_on_front' => true
                ]
            );
        }

        // archive_detail_url - link to Archive.org detail page
        if (!$eavSetup->getAttributeId(Product::ENTITY, 'archive_detail_url')) {
            $eavSetup->addAttribute(
                Product::ENTITY,
                'archive_detail_url',
                [
                    'type' => 'varchar',
                    'label' => 'Archive.org Detail URL',
                    'input' => 'text',
                    'group' => 'Product Details',
                    'sort_order' => 82,
                    'default' => null,
                    'source' => '',
                    'backend' => '',
                    'frontend' => '',
                    'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
                    'required' => false,
                    'unique' => false,
                    'used_in_product_listing' => false,
                    'searchable' => false,
                    'filterable' => false,
                    'comparable' => false,
                    'is_used_in_grid' => false,
                    'is_visible_in_grid' => false,
                    'is_filterable_in_grid' => false,
                    'visible' => true,
                    'is_html_allowed_on_frontend' => false,
                    'visible_on_front' => false
                ]
            );
        }

        // archive_license_url - Creative Commons license URL
        if (!$eavSetup->getAttributeId(Product::ENTITY, 'archive_license_url')) {
            $eavSetup->addAttribute(
                Product::ENTITY,
                'archive_license_url',
                [
                    'type' => 'varchar',
                    'label' => 'Archive.org License URL',
                    'input' => 'text',
                    'group' => 'Product Details',
                    'sort_order' => 83,
                    'default' => null,
                    'source' => '',
                    'backend' => '',
                    'frontend' => '',
                    'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
                    'required' => false,
                    'unique' => false,
                    'used_in_product_listing' => false,
                    'searchable' => false,
                    'filterable' => false,
                    'comparable' => false,
                    'is_used_in_grid' => false,
                    'is_visible_in_grid' => false,
                    'is_filterable_in_grid' => false,
                    'visible' => true,
                    'is_html_allowed_on_frontend' => false,
                    'visible_on_front' => false
                ]
            );
        }

        // access_restriction - e.g., "stream_only"
        if (!$eavSetup->getAttributeId(Product::ENTITY, 'access_restriction')) {
            $eavSetup->addAttribute(
                Product::ENTITY,
                'access_restriction',
                [
                    'type' => 'varchar',
                    'label' => 'Access Restriction',
                    'input' => 'text',
                    'group' => 'Product Details',
                    'sort_order' => 84,
                    'default' => null,
                    'source' => '',
                    'backend' => '',
                    'frontend' => '',
                    'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
                    'required' => false,
                    'unique' => false,
                    'used_in_product_listing' => true,
                    'searchable' => false,
                    'filterable' => true,
                    'comparable' => false,
                    'is_used_in_grid' => true,
                    'is_visible_in_grid' => false,
                    'is_filterable_in_grid' => true,
                    'visible' => true,
                    'is_html_allowed_on_frontend' => false,
                    'visible_on_front' => false
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

        $eavSetup->removeAttribute(Product::ENTITY, 'is_streamable');
        $eavSetup->removeAttribute(Product::ENTITY, 'recording_type');
        $eavSetup->removeAttribute(Product::ENTITY, 'archive_detail_url');
        $eavSetup->removeAttribute(Product::ENTITY, 'archive_license_url');
        $eavSetup->removeAttribute(Product::ENTITY, 'access_restriction');
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
