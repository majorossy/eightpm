<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\ResourceModel\QueueSnapshot;

use ArchiveDotOrg\Customer\Model\QueueSnapshot;
use ArchiveDotOrg\Customer\Model\ResourceModel\QueueSnapshot as QueueSnapshotResource;
use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'entity_id';
    protected $_eventPrefix = 'archivedotorg_queue_snapshot_collection';

    protected function _construct(): void
    {
        $this->_init(QueueSnapshot::class, QueueSnapshotResource::class);
    }
}
