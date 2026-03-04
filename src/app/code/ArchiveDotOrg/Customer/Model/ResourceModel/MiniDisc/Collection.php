<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\ResourceModel\MiniDisc;

use ArchiveDotOrg\Customer\Model\MiniDisc;
use ArchiveDotOrg\Customer\Model\ResourceModel\MiniDisc as MiniDiscResource;
use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'entity_id';
    protected $_eventPrefix = 'archivedotorg_minidisc_collection';

    protected function _construct(): void
    {
        $this->_init(MiniDisc::class, MiniDiscResource::class);
    }
}
