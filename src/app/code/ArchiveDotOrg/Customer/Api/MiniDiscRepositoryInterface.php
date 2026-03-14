<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Api;

interface MiniDiscRepositoryInterface
{
    public function getByCustomerId(int $customerId, int $pageSize = 0, int $currentPage = 1): array;

    public function getCountByCustomerId(int $customerId): int;

    public function save(int $customerId, array $data): \ArchiveDotOrg\Customer\Model\MiniDisc;

    public function deleteByClientId(int $customerId, string $clientId): bool;
}
