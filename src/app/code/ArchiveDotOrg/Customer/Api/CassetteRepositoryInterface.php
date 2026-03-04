<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Api;

interface CassetteRepositoryInterface
{
    public function getByCustomerId(int $customerId): array;

    public function save(int $customerId, array $data): \ArchiveDotOrg\Customer\Model\Cassette;

    public function deleteByClientId(int $customerId, string $clientId): bool;
}
