<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\MiniDiscRepositoryInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class DeleteMiniDisc implements ResolverInterface
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
        $clientId = $args['client_id'] ?? '';

        try {
            $this->miniDiscRepository->deleteByClientId($customerId, $clientId);
            return ['success' => true, 'user_errors' => []];
        } catch (\Exception $e) {
            return ['success' => false, 'user_errors' => [['message' => $e->getMessage(), 'path' => ['client_id']]]];
        }
    }
}
