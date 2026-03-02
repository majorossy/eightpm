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
 * Create Lineage-Parsed Recording Equipment Attributes
 *
 * Creates product attributes for structured recording equipment data parsed
 * from Archive.org lineage/source fields:
 * - recording_medium: cassette, dat, minidisc, cd, reel_to_reel, etc.
 * - microphone_model: Schoeps MK4V, AKG 460, etc.
 * - recorder_device: Sound Devices 744T, Tascam DR-680, etc.
 * - preamp_model: Grace m201, Lunatec V2, etc.
 * - ad_converter: Apogee, RME, etc.
 * - editing_software: Audacity, Sound Forge, etc.
 * - final_format: FLAC, SHN, WAV, MP3
 */
class CreateLineageAttributes implements DataPatchInterface, PatchRevertableInterface
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

        $attributes = [
            'recording_medium' => [
                'label' => 'Recording Medium',
                'sort_order' => 90,
                'filterable' => true,
                'used_in_product_listing' => true,
                'is_used_in_grid' => true,
                'is_filterable_in_grid' => true,
            ],
            'microphone_model' => [
                'label' => 'Microphone Model',
                'sort_order' => 91,
            ],
            'recorder_device' => [
                'label' => 'Recorder Device',
                'sort_order' => 92,
            ],
            'preamp_model' => [
                'label' => 'Preamp Model',
                'sort_order' => 93,
            ],
            'ad_converter' => [
                'label' => 'A/D Converter',
                'sort_order' => 94,
            ],
            'editing_software' => [
                'label' => 'Editing Software',
                'sort_order' => 95,
            ],
            'final_format' => [
                'label' => 'Final Format',
                'sort_order' => 96,
                'filterable' => true,
                'used_in_product_listing' => true,
            ],
        ];

        foreach ($attributes as $code => $config) {
            if (!$eavSetup->getAttributeId(Product::ENTITY, $code)) {
                $eavSetup->addAttribute(
                    Product::ENTITY,
                    $code,
                    [
                        'type' => 'varchar',
                        'label' => $config['label'],
                        'input' => 'text',
                        'group' => 'Product Details',
                        'sort_order' => $config['sort_order'],
                        'default' => null,
                        'source' => '',
                        'backend' => '',
                        'frontend' => '',
                        'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
                        'required' => false,
                        'unique' => false,
                        'used_in_product_listing' => $config['used_in_product_listing'] ?? false,
                        'searchable' => false,
                        'filterable' => $config['filterable'] ?? false,
                        'comparable' => false,
                        'is_used_in_grid' => $config['is_used_in_grid'] ?? false,
                        'is_visible_in_grid' => false,
                        'is_filterable_in_grid' => $config['is_filterable_in_grid'] ?? false,
                        'visible' => true,
                        'is_html_allowed_on_frontend' => false,
                        'visible_on_front' => false,
                    ]
                );
            }
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

        $eavSetup->removeAttribute(Product::ENTITY, 'recording_medium');
        $eavSetup->removeAttribute(Product::ENTITY, 'microphone_model');
        $eavSetup->removeAttribute(Product::ENTITY, 'recorder_device');
        $eavSetup->removeAttribute(Product::ENTITY, 'preamp_model');
        $eavSetup->removeAttribute(Product::ENTITY, 'ad_converter');
        $eavSetup->removeAttribute(Product::ENTITY, 'editing_software');
        $eavSetup->removeAttribute(Product::ENTITY, 'final_format');
    }

    /**
     * @inheritDoc
     */
    public static function getDependencies(): array
    {
        return [AddRecordingRestrictionAttributes::class];
    }

    /**
     * @inheritDoc
     */
    public function getAliases(): array
    {
        return [];
    }
}
