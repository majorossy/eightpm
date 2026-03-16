<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use Magento\Framework\Model\AbstractModel;
use ArchiveDotOrg\Customer\Model\ResourceModel\QueueSnapshot as QueueSnapshotResource;

class QueueSnapshot extends AbstractModel
{
    protected $_eventPrefix = 'archivedotorg_queue_snapshot';

    protected function _construct(): void
    {
        $this->_init(QueueSnapshotResource::class);
    }
}
