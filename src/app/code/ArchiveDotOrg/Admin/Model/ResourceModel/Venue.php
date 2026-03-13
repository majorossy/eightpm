<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Admin\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;

class Venue extends AbstractDb
{
    protected function _construct(): void
    {
        $this->_init('archivedotorg_venue', 'venue_id');
    }
}
