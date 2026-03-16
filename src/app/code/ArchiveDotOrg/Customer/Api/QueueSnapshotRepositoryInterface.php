<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Api;

interface QueueSnapshotRepositoryInterface
{
    public function getByCustomerId(int $customerId): ?array;

    public function save(int $customerId, array $data): \ArchiveDotOrg\Customer\Model\QueueSnapshot;
}
