<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\Resolver;

use ArchiveDotOrg\Customer\Api\CassetteRepositoryInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class SharedCassettes implements ResolverInterface
{
    private CassetteRepositoryInterface $cassetteRepository;

    public function __construct(CassetteRepositoryInterface $cassetteRepository)
    {
        $this->cassetteRepository = $cassetteRepository;
    }

    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
    {
        $albumIdentifier = $args['album_identifier'] ?? '';
        $pageSize = max(1, min((int)($args['pageSize'] ?? 20), 50));

        // If authenticated, exclude caller's own cassettes
        $excludeCustomerId = null;
        try {
            if ($context->getExtensionAttributes()->getIsCustomer()) {
                $excludeCustomerId = (int)$context->getUserId();
            }
        } catch (\Exception $e) {
            // Not authenticated — that's fine for a public query
        }

        $items = $this->cassetteRepository->getPublicByAlbum($albumIdentifier, $pageSize, $excludeCustomerId);
        $totalCount = $this->cassetteRepository->getPublicCountByAlbum($albumIdentifier, $excludeCustomerId);

        return [
            'items' => $items,
            'total_count' => $totalCount,
        ];
    }
}
