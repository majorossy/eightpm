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
use Magento\Catalog\Api\CategoryRepositoryInterface;
use ArchiveDotOrg\Core\Logger\Logger;

/**
 * Mutation resolver: set a manual artwork override and lock it
 */
class SetArtworkOverride implements ResolverInterface
{
    private ResourceConnection $resourceConnection;
    private CategoryRepositoryInterface $categoryRepository;
    private Logger $logger;
    private ScopeConfigInterface $scopeConfig;

    public function __construct(
        ResourceConnection $resourceConnection,
        CategoryRepositoryInterface $categoryRepository,
        Logger $logger,
        ScopeConfigInterface $scopeConfig
    ) {
        $this->resourceConnection = $resourceConnection;
        $this->categoryRepository = $categoryRepository;
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
        $input = $args['input'] ?? [];

        $apiKey = $input['api_key'] ?? '';
        $configuredKey = $this->scopeConfig->getValue('archivedotorg/security/artwork_api_key');
        if (empty($configuredKey) || !hash_equals($configuredKey, $apiKey)) {
            throw new GraphQlAuthorizationException(__('Invalid or missing API key.'));
        }

        $categoryId = (int)($input['category_id'] ?? 0);
        $artworkUrl = trim($input['artwork_url'] ?? '');
        $type = $input['type'] ?? '';
        $notes = $input['notes'] ?? null;

        // Validate type
        if (!in_array($type, ['album_artwork', 'band_image'], true)) {
            throw new GraphQlInputException(
                __('Invalid type. Must be "album_artwork" or "band_image".')
            );
        }

        // Validate URL
        if (!filter_var($artworkUrl, FILTER_VALIDATE_URL)) {
            throw new GraphQlInputException(__('Invalid artwork URL format.'));
        }

        // Validate category exists
        try {
            $category = $this->categoryRepository->get($categoryId);
        } catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
            throw new GraphQlInputException(__('Category ID %1 not found.', $categoryId));
        }

        $connection = $this->resourceConnection->getConnection();

        try {
            // Get parent category name (artist) for the overrides table
            $parentId = $connection->fetchOne(
                $connection->select()
                    ->from('catalog_category_entity', ['parent_id'])
                    ->where('entity_id = ?', $categoryId)
            );
            $artistName = '';
            if ($parentId) {
                $artistName = (string)$connection->fetchOne(
                    $connection->select()
                        ->from(['cv' => 'catalog_category_entity_varchar'], ['value'])
                        ->joinInner(
                            ['attr' => 'eav_attribute'],
                            'cv.attribute_id = attr.attribute_id AND attr.attribute_code = "name" AND attr.entity_type_id = 3',
                            []
                        )
                        ->where('cv.entity_id = ?', $parentId)
                        ->where('cv.store_id = 0')
                );
            }

            // Upsert into artwork_overrides
            $overrideTable = $connection->getTableName('archivedotorg_artwork_overrides');
            $connection->insertOnDuplicate(
                $overrideTable,
                [
                    'category_id' => $categoryId,
                    'artist_name' => $artistName,
                    'album_name' => $category->getName(),
                    'artwork_url' => $artworkUrl,
                    'source' => 'manual',
                    'notes' => $notes,
                ],
                ['artwork_url', 'notes', 'updated_at']
            );

            if ($type === 'album_artwork') {
                // Lock in studio_albums table
                $studioTable = $connection->getTableName('archivedotorg_studio_albums');
                $connection->update(
                    $studioTable,
                    ['is_locked' => 1],
                    ['category_id = ?' => $categoryId]
                );

                // Update the category wikipedia_artwork_url attribute
                $category->setCustomAttribute('wikipedia_artwork_url', $artworkUrl);
                $this->categoryRepository->save($category);
            } elseif ($type === 'band_image') {
                // Update band_image_url category attribute
                $category->setCustomAttribute('band_image_url', $artworkUrl);
                $this->categoryRepository->save($category);
            }

            $this->logger->info("Artwork override set for category $categoryId ($type): $artworkUrl");

            return [
                'success' => true,
                'artwork_url' => $artworkUrl,
                'is_locked' => true,
                'message' => 'Artwork override saved and locked.',
            ];
        } catch (\Exception $e) {
            $this->logger->error("Failed to set artwork override for category $categoryId: " . $e->getMessage());
            return [
                'success' => false,
                'artwork_url' => null,
                'is_locked' => false,
                'message' => 'An internal error occurred while setting the artwork override.',
            ];
        }
    }
}
