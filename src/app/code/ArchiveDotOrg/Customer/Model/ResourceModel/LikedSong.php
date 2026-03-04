<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;

class LikedSong extends AbstractDb
{
    protected function _construct(): void
    {
        $this->_init('archivedotorg_liked_song', 'entity_id');
    }
}
