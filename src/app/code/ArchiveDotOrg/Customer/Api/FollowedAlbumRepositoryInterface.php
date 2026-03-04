<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Api;

interface FollowedAlbumRepositoryInterface
{
    public function getByCustomerId(int $customerId): array;

    public function save(int $customerId, array $data): \ArchiveDotOrg\Customer\Model\FollowedAlbum;

    public function deleteByKey(int $customerId, string $artistSlug, string $albumTitle): bool;
}
