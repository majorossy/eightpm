<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\FollowedArtistRepositoryInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class FollowArtist implements ResolverInterface
{
    private FollowedArtistRepositoryInterface $followedArtistRepository;

    public function __construct(FollowedArtistRepositoryInterface $followedArtistRepository)
    {
        $this->followedArtistRepository = $followedArtistRepository;
    }

    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
    {
        if (false === $context->getExtensionAttributes()->getIsCustomer()) {
            throw new GraphQlAuthorizationException(__('The current customer isn\'t authorized.'));
        }

        $customerId = (int)$context->getUserId();
        $artistSlug = $args['artist_slug'] ?? '';

        try {
            $this->followedArtistRepository->save($customerId, ['artist_slug' => $artistSlug]);
            return ['success' => true, 'user_errors' => []];
        } catch (\Exception $e) {
            return ['success' => false, 'user_errors' => [['message' => $e->getMessage(), 'path' => ['artist_slug']]]];
        }
    }
}
