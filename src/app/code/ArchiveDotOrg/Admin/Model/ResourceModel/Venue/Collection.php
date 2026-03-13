<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Admin\Model\ResourceModel\Venue;

use ArchiveDotOrg\Admin\Model\Venue;
use ArchiveDotOrg\Admin\Model\ResourceModel\Venue as VenueResource;
use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'venue_id';

    protected function _construct(): void
    {
        $this->_init(Venue::class, VenueResource::class);
    }
}
