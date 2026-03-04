<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\CassetteRepositoryInterface;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class SyncCassettes implements ResolverInterface
{
    private const MAX_BATCH_SIZE = 50;

    private CassetteRepositoryInterface $cassetteRepository;
    private ResourceConnection $resourceConnection;

    public function __construct(
        CassetteRepositoryInterface $cassetteRepository,
        ResourceConnection $resourceConnection
    ) {
        $this->cassetteRepository = $cassetteRepository;
        $this->resourceConnection = $resourceConnection;
    }

    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
    {
        if (false === $context->getExtensionAttributes()->getIsCustomer()) {
            throw new GraphQlAuthorizationException(__('The current customer isn\'t authorized.'));
        }

        $customerId = (int)$context->getUserId();
        $items = $args['input'] ?? [];

        if (count($items) > self::MAX_BATCH_SIZE) {
            throw new GraphQlInputException(
                __('Maximum batch size is %1 cassettes.', self::MAX_BATCH_SIZE)
            );
        }

        $connection = $this->resourceConnection->getConnection();
        $syncedCount = 0;
        $errors = [];

        $connection->beginTransaction();
        try {
            foreach ($items as $item) {
                try {
                    $this->cassetteRepository->save($customerId, $item);
                    $syncedCount++;
                } catch (\Exception $e) {
                    $errors[] = ['message' => $e->getMessage(), 'path' => ['input', $item['client_id'] ?? '']];
                }
            }
            $connection->commit();
        } catch (\Exception $e) {
            $connection->rollBack();
            return [
                'success' => false,
                'synced_count' => 0,
                'user_errors' => [['message' => $e->getMessage(), 'path' => ['input']]],
            ];
        }

        return [
            'success' => empty($errors),
            'synced_count' => $syncedCount,
            'user_errors' => $errors,
        ];
    }
}
