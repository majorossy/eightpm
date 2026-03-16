<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use ArchiveDotOrg\Customer\Api\QueueSnapshotRepositoryInterface;
use ArchiveDotOrg\Customer\Model\QueueSnapshotFactory;
use ArchiveDotOrg\Customer\Model\ResourceModel\QueueSnapshot as QueueSnapshotResource;
use ArchiveDotOrg\Customer\Model\ResourceModel\QueueSnapshot\CollectionFactory;

class QueueSnapshotRepository implements QueueSnapshotRepositoryInterface
{
    private const MAX_SNAPSHOT_SIZE = 512000; // 500KB limit for the JSON blob

    private QueueSnapshotFactory $snapshotFactory;
    private QueueSnapshotResource $snapshotResource;
    private CollectionFactory $collectionFactory;

    public function __construct(
        QueueSnapshotFactory $snapshotFactory,
        QueueSnapshotResource $snapshotResource,
        CollectionFactory $collectionFactory
    ) {
        $this->snapshotFactory = $snapshotFactory;
        $this->snapshotResource = $snapshotResource;
        $this->collectionFactory = $collectionFactory;
    }

    public function getByCustomerId(int $customerId): ?array
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $item = $collection->getFirstItem();

        if (!$item->getId()) {
            return null;
        }

        return $item->getData();
    }

    public function save(int $customerId, array $data): QueueSnapshot
    {
        $snapshotData = $data['snapshot_data'] ?? '';
        if (strlen($snapshotData) > self::MAX_SNAPSHOT_SIZE) {
            throw new \InvalidArgumentException(
                sprintf('Queue snapshot exceeds maximum size of %d bytes', self::MAX_SNAPSHOT_SIZE)
            );
        }

        // Singleton per customer — load existing or create new
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $existing = $collection->getFirstItem();

        if ($existing->getId()) {
            $snapshot = $existing;
        } else {
            $snapshot = $this->snapshotFactory->create();
            $snapshot->setData('customer_id', $customerId);
        }

        $snapshot->setData('snapshot_data', $snapshotData);

        if (array_key_exists('saved_at', $data)) {
            $snapshot->setData('saved_at', $data['saved_at']);
        }

        $this->snapshotResource->save($snapshot);
        return $snapshot;
    }
}
