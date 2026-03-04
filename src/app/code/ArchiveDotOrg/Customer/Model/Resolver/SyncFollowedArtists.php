<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\FollowedArtistRepositoryInterface;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class SyncFollowedArtists implements ResolverInterface
{
    private const MAX_BATCH_SIZE = 100;

    private FollowedArtistRepositoryInterface $followedArtistRepository;
    private ResourceConnection $resourceConnection;

    public function __construct(
        FollowedArtistRepositoryInterface $followedArtistRepository,
        ResourceConnection $resourceConnection
    ) {
        $this->followedArtistRepository = $followedArtistRepository;
        $this->resourceConnection = $resourceConnection;
    }

    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
    {
        if (false === $context->getExtensionAttributes()->getIsCustomer()) {
            throw new GraphQlAuthorizationException(__('The current customer isn\'t authorized.'));
        }

        $customerId = (int)$context->getUserId();
        $slugs = $args['artist_slugs'] ?? [];

        if (count($slugs) > self::MAX_BATCH_SIZE) {
            throw new GraphQlInputException(
                __('Maximum batch size is %1 artists.', self::MAX_BATCH_SIZE)
            );
        }

        $connection = $this->resourceConnection->getConnection();
        $syncedCount = 0;
        $errors = [];

        $connection->beginTransaction();
        try {
            foreach ($slugs as $slug) {
                try {
                    $this->followedArtistRepository->save($customerId, ['artist_slug' => $slug]);
                    $syncedCount++;
                } catch (\Exception $e) {
                    $errors[] = ['message' => $e->getMessage(), 'path' => ['artist_slugs', $slug]];
                }
            }
            $connection->commit();
        } catch (\Exception $e) {
            $connection->rollBack();
            return [
                'success' => false,
                'synced_count' => 0,
                'user_errors' => [['message' => $e->getMessage(), 'path' => ['artist_slugs']]],
            ];
        }

        return [
            'success' => empty($errors),
            'synced_count' => $syncedCount,
            'user_errors' => $errors,
        ];
    }
}
