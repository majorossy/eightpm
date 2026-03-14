<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Api;

interface LikedSongRepositoryInterface
{
    public function getByCustomerId(int $customerId, int $pageSize = 0, int $currentPage = 1): array;

    public function getCountByCustomerId(int $customerId): int;

    public function save(int $customerId, array $data): \ArchiveDotOrg\Customer\Model\LikedSong;

    public function deleteBySongId(int $customerId, string $songId): bool;
}
