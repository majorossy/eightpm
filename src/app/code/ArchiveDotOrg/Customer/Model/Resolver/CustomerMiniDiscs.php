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
        return $this->miniDiscRepository->getByCustomerId($customerId);
    }
}
