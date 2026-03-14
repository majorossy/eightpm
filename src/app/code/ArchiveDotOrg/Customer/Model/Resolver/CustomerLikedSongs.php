<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\LikedSongRepositoryInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class CustomerLikedSongs implements ResolverInterface
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
        $pageSize = max(1, min((int)($args['pageSize'] ?? 100), 10000));
        $currentPage = max(1, (int)($args['currentPage'] ?? 1));

        $items = $this->likedSongRepository->getByCustomerId($customerId, $pageSize, $currentPage);
        $totalCount = $this->likedSongRepository->getCountByCustomerId($customerId);
        $totalPages = $pageSize > 0 ? (int)ceil($totalCount / $pageSize) : 0;

        return [
            'items' => $items,
            'total_count' => $totalCount,
            'page_info' => [
                'page_size' => $pageSize,
                'current_page' => $currentPage,
                'total_pages' => $totalPages,
            ],
        ];
    }
}
