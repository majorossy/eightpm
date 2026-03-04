<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\ResourceModel\Cassette;

use ArchiveDotOrg\Customer\Model\Cassette;
use ArchiveDotOrg\Customer\Model\ResourceModel\Cassette as CassetteResource;
use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'entity_id';
    protected $_eventPrefix = 'archivedotorg_cassette_collection';

    protected function _construct(): void
    {
        $this->_init(Cassette::class, CassetteResource::class);
    }
}
