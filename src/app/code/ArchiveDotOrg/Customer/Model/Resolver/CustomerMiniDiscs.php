<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\MiniDiscRepositoryInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class CustomerMiniDiscs implements ResolverInterface
{
    private MiniDiscRepositoryInterface $miniDiscRepository;

    public function __construct(MiniDiscRepositoryInterface $miniDiscRepository)
    {
        $this->miniDiscRepository = $miniDiscRepository;
    }

    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
    {
        if (false === $context->getExtensionAttributes()->getIsCustomer()) {
            throw new GraphQlAuthorizationException(__('The current customer isn\'t authorized.'));
        }

        $customerId = (int)$context->getUserId();
        $pageSize = max(1, min((int)($args['pageSize'] ?? 50), 200));
        $currentPage = max(1, (int)($args['currentPage'] ?? 1));

        $items = $this->miniDiscRepository->getByCustomerId($customerId, $pageSize, $currentPage);
        $totalCount = $this->miniDiscRepository->getCountByCustomerId($customerId);
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
