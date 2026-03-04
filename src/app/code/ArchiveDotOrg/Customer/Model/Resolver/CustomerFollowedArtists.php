<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\FollowedArtistRepositoryInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class CustomerFollowedArtists implements ResolverInterface
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
        $items = $this->followedArtistRepository->getByCustomerId($customerId);

        // Return just the slugs as String array
        return array_map(fn($item) => $item['artist_slug'], $items);
    }
}
