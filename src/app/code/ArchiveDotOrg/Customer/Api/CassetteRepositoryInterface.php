<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Api;

interface CassetteRepositoryInterface
{
    public function getByCustomerId(int $customerId, int $pageSize = 0, int $currentPage = 1): array;

    public function getCountByCustomerId(int $customerId): int;

    public function save(int $customerId, array $data): \ArchiveDotOrg\Customer\Model\Cassette;

    public function deleteByClientId(int $customerId, string $clientId): bool;

    public function togglePublic(int $customerId, string $clientId, bool $isPublic): \ArchiveDotOrg\Customer\Model\Cassette;

    public function getPublicByAlbum(string $albumIdentifier, int $pageSize = 20, ?int $excludeCustomerId = null): array;

    public function getPublicCountByAlbum(string $albumIdentifier, ?int $excludeCustomerId = null): int;
}
