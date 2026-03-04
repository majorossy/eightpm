<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Api;

interface FollowedArtistRepositoryInterface
{
    public function getByCustomerId(int $customerId): array;

    public function save(int $customerId, array $data): \ArchiveDotOrg\Customer\Model\FollowedArtist;

    public function deleteBySlug(int $customerId, string $artistSlug): bool;
}
