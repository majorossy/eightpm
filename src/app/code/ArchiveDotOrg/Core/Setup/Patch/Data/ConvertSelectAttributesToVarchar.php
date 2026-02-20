<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Setup\Patch\Data;

use Magento\Catalog\Model\Product;
use Magento\Eav\Setup\EavSetup;
use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

/**
 * Convert select (int) attributes to varchar (text) attributes
 *
 * These 10 attributes were incorrectly created as `select` type with int backend,
 * requiring expensive EAV option table joins for every query. Since this project
 * is headless and uses no Magento layered navigation, the select type provides
 * no benefit — only overhead and broken GraphQL responses.
 *
 * Converting to varchar eliminates the eav_attribute_option_value join entirely
 * and fixes GraphQL returning option IDs instead of human-readable values.
 */
class ConvertSelectAttributesToVarchar implements DataPatchInterface
{
    /**
     * Attributes to convert from select (int) to text (varchar)
     */
    private const ATTRIBUTES_TO_CONVERT = [
        'show_year',
        'show_venue',
        'show_taper',
        'show_transferer',
        'show_location',
        'archive_collection',
        'collection',
        'album',
        'album_track',
        'artist',
    ];

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

        foreach (self::ATTRIBUTES_TO_CONVERT as $attributeCode) {
            $attributeId = $eavSetup->getAttributeId(Product::ENTITY, $attributeCode);
            if (!$attributeId) {
                continue;
            }

            $eavSetup->updateAttribute(Product::ENTITY, $attributeCode, 'backend_type', 'varchar');
            $eavSetup->updateAttribute(Product::ENTITY, $attributeCode, 'frontend_input', 'text');
            $eavSetup->updateAttribute(Product::ENTITY, $attributeCode, 'source_model', '');
        }

        return $this;
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
