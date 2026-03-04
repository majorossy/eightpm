<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\MiniDiscRepositoryInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class SaveMiniDisc implements ResolverInterface
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
        $input = $args['input'] ?? [];

        try {
            $miniDisc = $this->miniDiscRepository->save($customerId, $input);
            $data = $miniDisc->getData();

            // Reload songs for the response
            $allDiscs = $this->miniDiscRepository->getByCustomerId($customerId);
            foreach ($allDiscs as $disc) {
                if ((int)$disc['entity_id'] === (int)$miniDisc->getId()) {
                    $data['songs'] = $disc['songs'] ?? [];
                    break;
                }
            }

            return [
                'minidisc' => $data,
                'user_errors' => [],
            ];
        } catch (\Exception $e) {
            return [
                'minidisc' => null,
                'user_errors' => [['message' => $e->getMessage(), 'path' => ['input']]],
            ];
        }
    }
}
