<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Setup\Patch\Data;

use Magento\Catalog\Model\Category;
use Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface;
use Magento\Eav\Setup\EavSetup;
use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class AddBandShortNameAttribute implements DataPatchInterface
{
    private ModuleDataSetupInterface $moduleDataSetup;
    private EavSetupFactory $eavSetupFactory;

    public function __construct(
        ModuleDataSetupInterface $moduleDataSetup,
        EavSetupFactory $eavSetupFactory
    ) {
        $this->moduleDataSetup = $moduleDataSetup;
        $this->eavSetupFactory = $eavSetupFactory;
    }

    public function apply()
    {
        $eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);

        $eavSetup->addAttribute(
            Category::ENTITY,
            'band_short_name',
            [
                'type' => 'varchar',
                'label' => 'Band Short Name',
                'input' => 'text',
                'required' => false,
                'sort_order' => 95,
                'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
                'group' => 'Band Information',
                'note' => 'Short abbreviation code (e.g., GD, RRE, SCI)',
            ]
        );

        return $this;
    }

    public static function getDependencies()
    {
        return [AddArtistBandDataAttributes::class];
    }

    public function getAliases()
    {
        return [];
    }
}
