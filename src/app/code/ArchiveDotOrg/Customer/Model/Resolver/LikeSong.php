<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\LikedSongRepositoryInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class LikeSong implements ResolverInterface
{
    private LikedSongRepositoryInterface $likedSongRepository;

    public function __construct(LikedSongRepositoryInterface $likedSongRepository)
    {
        $this->likedSongRepository = $likedSongRepository;
    }

    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
    {
        if (false === $context->getExtensionAttributes()->getIsCustomer()) {
            throw new GraphQlAuthorizationException(__('The current customer isn\'t authorized.'));
        }

        $customerId = (int)$context->getUserId();
        $input = $args['input'] ?? [];

        try {
            $likedSong = $this->likedSongRepository->save($customerId, $input);
            return [
                'song' => $likedSong->getData(),
                'user_errors' => [],
            ];
        } catch (\Exception $e) {
            return [
                'song' => null,
                'user_errors' => [['message' => $e->getMessage(), 'path' => ['input']]],
            ];
        }
    }
}
