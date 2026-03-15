<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\App\Config\ScopeConfigInterface;
use ArchiveDotOrg\Core\Logger\Logger;

/**
 * Mutation resolver: remove artwork lock so auto-update can resume
 */
class RemoveArtworkOverride implements ResolverInterface
{
    private ResourceConnection $resourceConnection;
    private Logger $logger;
    private ScopeConfigInterface $scopeConfig;

    public function __construct(
        ResourceConnection $resourceConnection,
        Logger $logger,
        ScopeConfigInterface $scopeConfig
    ) {
        $this->resourceConnection = $resourceConnection;
        $this->logger = $logger;
        $this->scopeConfig = $scopeConfig;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $apiKey = $args['api_key'] ?? '';
        $configuredKey = $this->scopeConfig->getValue('archivedotorg/security/artwork_api_key');
        if (empty($configuredKey) || !hash_equals($configuredKey, $apiKey)) {
            throw new GraphQlAuthorizationException(__('Invalid or missing API key.'));
        }

        $categoryId = (int)($args['category_id'] ?? 0);
        $type = $args['type'] ?? '';

        if (!in_array($type, ['album_artwork', 'band_image'], true)) {
            throw new GraphQlInputException(
                __('Invalid type. Must be "album_artwork" or "band_image".')
            );
        }

        if ($categoryId <= 0) {
            throw new GraphQlInputException(__('Invalid category_id.'));
        }

        $connection = $this->resourceConnection->getConnection();

        try {
            // Delete from overrides table
            $overrideTable = $connection->getTableName('archivedotorg_artwork_overrides');
            $connection->delete($overrideTable, ['category_id = ?' => $categoryId]);

            if ($type === 'album_artwork') {
                // Unlock in studio_albums table (does NOT clear the URL)
                $studioTable = $connection->getTableName('archivedotorg_studio_albums');
                $connection->update(
                    $studioTable,
                    ['is_locked' => 0],
                    ['category_id = ?' => $categoryId]
                );
            }

            $this->logger->info("Artwork override removed for category $categoryId ($type)");

            return [
                'success' => true,
                'artwork_url' => null,
                'is_locked' => false,
                'message' => 'Artwork unlocked. Auto-update can now overwrite this image.',
            ];
        } catch (\Exception $e) {
            $this->logger->error("Failed to remove artwork override for category $categoryId: " . $e->getMessage());
            return [
                'success' => false,
                'artwork_url' => null,
                'is_locked' => false,
                'message' => 'An internal error occurred while removing the artwork override.',
            ];
        }
    }
}
