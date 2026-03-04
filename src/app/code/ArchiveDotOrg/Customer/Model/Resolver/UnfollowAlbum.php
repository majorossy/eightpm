<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\FollowedAlbumRepositoryInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class UnfollowAlbum implements ResolverInterface
{
    private FollowedAlbumRepositoryInterface $followedAlbumRepository;

    public function __construct(FollowedAlbumRepositoryInterface $followedAlbumRepository)
    {
        $this->followedAlbumRepository = $followedAlbumRepository;
    }

    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
    {
        if (false === $context->getExtensionAttributes()->getIsCustomer()) {
            throw new GraphQlAuthorizationException(__('The current customer isn\'t authorized.'));
        }

        $customerId = (int)$context->getUserId();
        $input = $args['input'] ?? [];

        try {
            $this->followedAlbumRepository->deleteByKey(
                $customerId,
                $input['artist_slug'] ?? '',
                $input['album_title'] ?? ''
            );
            return ['success' => true, 'user_errors' => []];
        } catch (\Exception $e) {
            return ['success' => false, 'user_errors' => [['message' => $e->getMessage(), 'path' => ['input']]]];
        }
    }
}
