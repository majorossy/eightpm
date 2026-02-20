<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\App\ResourceConnection;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

/**
 * Resolver for song_url_medium field
 */
class SongUrlMedium implements ResolverInterface
{
    private ResourceConnection $resourceConnection;
    private ?int $attributeId = null;

    public function __construct(ResourceConnection $resourceConnection)
    {
        $this->resourceConnection = $resourceConnection;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        if (!isset($value['model'])) {
            return null;
        }

        $product = $value['model'];
        $songUrlsJson = $product->getData('song_urls');

        // Text attributes may not be loaded by the collection; fetch directly
        if (!$songUrlsJson) {
            $songUrlsJson = $this->loadSongUrlsFromDb((int) $product->getId());
        }

        if (!$songUrlsJson) {
            return null;
        }

        $qualityUrls = json_decode($songUrlsJson, true);
        return $qualityUrls['medium']['url'] ?? null;
    }

    private function loadSongUrlsFromDb(int $entityId): ?string
    {
        if (!$entityId) {
            return null;
        }

        $attrId = $this->getSongUrlsAttributeId();
        if (!$attrId) {
            return null;
        }

        $connection = $this->resourceConnection->getConnection();
        $table = $this->resourceConnection->getTableName('catalog_product_entity_text');
        $select = $connection->select()
            ->from($table, ['value'])
            ->where('attribute_id = ?', $attrId)
            ->where('entity_id = ?', $entityId)
            ->where('store_id = 0');

        $result = $connection->fetchOne($select);
        return $result ?: null;
    }

    private function getSongUrlsAttributeId(): ?int
    {
        if ($this->attributeId !== null) {
            return $this->attributeId;
        }

        $connection = $this->resourceConnection->getConnection();
        $table = $this->resourceConnection->getTableName('eav_attribute');
        $select = $connection->select()
            ->from($table, ['attribute_id'])
            ->where('attribute_code = ?', 'song_urls')
            ->where('entity_type_id = ?', 4);

        $id = $connection->fetchOne($select);
        $this->attributeId = $id ? (int) $id : null;
        return $this->attributeId;
    }
}
