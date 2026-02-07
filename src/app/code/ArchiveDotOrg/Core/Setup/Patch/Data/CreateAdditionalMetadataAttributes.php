<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Setup\Patch\Data;

use Magento\Eav\Setup\EavSetup;
use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Catalog\Model\Product;

/**
 * Create additional metadata attributes for Archive.org products
 *
 * Adds missing show-level and track-level attributes:
 * - show_runtime: Total show duration (e.g., "165:40")
 * - show_added_date: When uploaded to Archive.org
 * - show_public_date: When made public on Archive.org
 * - show_subject: Full subject tags string (e.g., "americana; newgrass; Horn O'Plenty 2017")
 * - track_original_file: Original source file for derivatives (links MP3 back to FLAC)
 * - track_album: Album name from file metadata
 */
class CreateAdditionalMetadataAttributes implements DataPatchInterface
{
    private EavSetupFactory $eavSetupFactory;
    private ModuleDataSetupInterface $moduleDataSetup;

    public function __construct(
        EavSetupFactory $eavSetupFactory,
        ModuleDataSetupInterface $moduleDataSetup
    ) {
        $this->eavSetupFactory = $eavSetupFactory;
        $this->moduleDataSetup = $moduleDataSetup;
    }

    /**
     * @inheritDoc
     */
    public function apply()
    {
        $eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);

        // Show runtime (total duration) - show-level field saved to every track product
        $eavSetup->addAttribute(
            Product::ENTITY,
            'show_runtime',
            [
                'type' => 'varchar',
                'label' => 'Show Runtime (Total Duration)',
                'input' => 'text',
                'required' => false,
                'sort_order' => 201,
                'global' => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
                'group' => 'Archive.org Import',
                'is_used_in_grid' => true,
                'is_visible_in_grid' => false,
                'is_filterable_in_grid' => false,
                'used_in_product_listing' => true,
                'note' => 'Total show duration (e.g., "165:40") - duplicated on all tracks from this show'
            ]
        );

        // Show added date (when uploaded to Archive.org) - show-level field saved to every track product
        $eavSetup->addAttribute(
            Product::ENTITY,
            'show_added_date',
            [
                'type' => 'datetime',
                'label' => 'Show Added Date',
                'input' => 'date',
                'required' => false,
                'sort_order' => 202,
                'global' => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
                'group' => 'Archive.org Import',
                'is_used_in_grid' => true,
                'is_visible_in_grid' => false,
                'is_filterable_in_grid' => true,
                'used_in_product_listing' => true,
                'note' => 'When the show was uploaded to Archive.org - duplicated on all tracks from this show'
            ]
        );

        // Show public date (when made public on Archive.org) - show-level field saved to every track product
        $eavSetup->addAttribute(
            Product::ENTITY,
            'show_public_date',
            [
                'type' => 'datetime',
                'label' => 'Show Public Date',
                'input' => 'date',
                'required' => false,
                'sort_order' => 203,
                'global' => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
                'group' => 'Archive.org Import',
                'is_used_in_grid' => true,
                'is_visible_in_grid' => false,
                'is_filterable_in_grid' => true,
                'used_in_product_listing' => true,
                'note' => 'When the show was made public on Archive.org - duplicated on all tracks from this show'
            ]
        );

        // Show subject (genre/event tags) - show-level field saved to every track product
        $eavSetup->addAttribute(
            Product::ENTITY,
            'show_subject',
            [
                'type' => 'text',
                'label' => 'Show Subject Tags',
                'input' => 'textarea',
                'required' => false,
                'sort_order' => 204,
                'global' => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
                'group' => 'Archive.org Import',
                'is_used_in_grid' => false,
                'is_visible_in_grid' => false,
                'is_filterable_in_grid' => false,
                'used_in_product_listing' => true,
                'note' => 'Genre/event tags from Archive.org (e.g., "americana; newgrass; Horn O\'Plenty 2017") - duplicated on all tracks from this show'
            ]
        );

        // Track original file (for derivatives)
        $eavSetup->addAttribute(
            Product::ENTITY,
            'track_original_file',
            [
                'type' => 'varchar',
                'label' => 'Original Source File',
                'input' => 'text',
                'required' => false,
                'sort_order' => 205,
                'global' => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
                'group' => 'Archive.org Import',
                'is_used_in_grid' => false,
                'is_visible_in_grid' => false,
                'is_filterable_in_grid' => false,
                'used_in_product_listing' => false,
                'note' => 'Original FLAC file for MP3 derivatives'
            ]
        );

        // Track album (file-level metadata)
        $eavSetup->addAttribute(
            Product::ENTITY,
            'track_album',
            [
                'type' => 'varchar',
                'label' => 'Track Album',
                'input' => 'text',
                'required' => false,
                'sort_order' => 206,
                'global' => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
                'group' => 'Archive.org Import',
                'is_used_in_grid' => false,
                'is_visible_in_grid' => false,
                'is_filterable_in_grid' => false,
                'used_in_product_listing' => false,
                'note' => 'Album name from file metadata'
            ]
        );

        return $this;
    }

    /**
     * @inheritDoc
     */
    public static function getDependencies()
    {
        return [
            CreateProductAttributes::class,
        ];
    }

    /**
     * @inheritDoc
     */
    public function getAliases()
    {
        return [];
    }
}
