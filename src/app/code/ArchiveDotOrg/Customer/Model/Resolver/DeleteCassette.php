<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\CassetteRepositoryInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class DeleteCassette implements ResolverInterface
{
    private CassetteRepositoryInterface $cassetteRepository;

    public function __construct(CassetteRepositoryInterface $cassetteRepository)
    {
        $this->cassetteRepository = $cassetteRepository;
    }

    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
    {
        if (false === $context->getExtensionAttributes()->getIsCustomer()) {
            throw new GraphQlAuthorizationException(__('The current customer isn\'t authorized.'));
        }

        $customerId = (int)$context->getUserId();
        $clientId = $args['client_id'] ?? '';

        try {
            $this->cassetteRepository->deleteByClientId($customerId, $clientId);
            return ['success' => true, 'user_errors' => []];
        } catch (\Exception $e) {
            return ['success' => false, 'user_errors' => [['message' => $e->getMessage(), 'path' => ['client_id']]]];
        }
    }
}
