<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use Magento\Framework\Model\AbstractModel;
use ArchiveDotOrg\Customer\Model\ResourceModel\LikedSong as LikedSongResource;

class LikedSong extends AbstractModel
{
    protected $_eventPrefix = 'archivedotorg_liked_song';

    protected function _construct(): void
    {
        $this->_init(LikedSongResource::class);
    }
}
