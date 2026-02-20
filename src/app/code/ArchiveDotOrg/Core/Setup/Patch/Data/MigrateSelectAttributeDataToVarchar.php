<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Setup\Patch\Data;

use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

/**
 * Migrate existing select attribute data from int table to varchar table
 *
 * Runs after ConvertSelectAttributesToVarchar which changes the attribute metadata.
 * This patch moves the actual product attribute values:
 *   catalog_product_entity_int (option ID) → catalog_product_entity_varchar (label text)
 *
 * Also cleans up now-orphaned rows in eav_attribute_option and eav_attribute_option_value.
 *
 * This patch is idempotent: re-running it is safe because the source int table
 * rows are deleted on first run, making subsequent runs no-ops.
 */
class MigrateSelectAttributeDataToVarchar implements DataPatchInterface
{
    /**
     * Product entity type ID (catalog_product_entity)
     */
    private const PRODUCT_ENTITY_TYPE_ID = 4;

    /**
     * Attributes whose data needs to be migrated from int to varchar
     */
    private const ATTRIBUTES_TO_MIGRATE = [
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

    /**
     * @param ModuleDataSetupInterface $moduleDataSetup
     */
    public function __construct(ModuleDataSetupInterface $moduleDataSetup)
    {
        $this->moduleDataSetup = $moduleDataSetup;
    }

    /**
     * @inheritDoc
     */
    public function apply(): self
    {
        $connection = $this->moduleDataSetup->getConnection();

        $eavAttrTable = $this->moduleDataSetup->getTable('eav_attribute');
        $cpeIntTable = $this->moduleDataSetup->getTable('catalog_product_entity_int');
        $cpeVarcharTable = $this->moduleDataSetup->getTable('catalog_product_entity_varchar');
        $optionTable = $this->moduleDataSetup->getTable('eav_attribute_option');
        $optionValueTable = $this->moduleDataSetup->getTable('eav_attribute_option_value');

        foreach (self::ATTRIBUTES_TO_MIGRATE as $attributeCode) {
            // Get attribute ID
            $attributeId = (int) $connection->fetchOne(
                $connection->select()
                    ->from($eavAttrTable, ['attribute_id'])
                    ->where('attribute_code = ?', $attributeCode)
                    ->where('entity_type_id = ?', self::PRODUCT_ENTITY_TYPE_ID)
            );

            if (!$attributeId) {
                continue;
            }

            // Step 1: Copy data from int table to varchar table.
            // Join with option_value table (store_id=0 = default/admin label) to get
            // the human-readable text for each stored option ID.
            $connection->query(
                "INSERT INTO {$cpeVarcharTable} (attribute_id, store_id, entity_id, value)
                SELECT i.attribute_id, i.store_id, i.entity_id, ov.value
                FROM {$cpeIntTable} i
                INNER JOIN {$optionValueTable} ov
                    ON ov.option_id = i.value AND ov.store_id = 0
                WHERE i.attribute_id = ?
                ON DUPLICATE KEY UPDATE value = VALUES(value)",
                [$attributeId]
            );

            // Step 2: Delete migrated rows from int table
            $connection->delete($cpeIntTable, [
                'attribute_id = ?' => $attributeId,
            ]);

            // Step 3: Delete option values for this attribute
            $connection->query(
                "DELETE ov FROM {$optionValueTable} ov
                INNER JOIN {$optionTable} o ON o.option_id = ov.option_id
                WHERE o.attribute_id = ?",
                [$attributeId]
            );

            // Step 4: Delete option rows for this attribute
            $connection->delete($optionTable, [
                'attribute_id = ?' => $attributeId,
            ]);
        }

        return $this;
    }

    /**
     * @inheritDoc
     */
    public static function getDependencies(): array
    {
        return [ConvertSelectAttributesToVarchar::class];
    }

    /**
     * @inheritDoc
     */
    public function getAliases(): array
    {
        return [];
    }
}
