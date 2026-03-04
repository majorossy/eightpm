<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use Magento\Framework\Model\AbstractModel;
use ArchiveDotOrg\Customer\Model\ResourceModel\MiniDiscSong as MiniDiscSongResource;

class MiniDiscSong extends AbstractModel
{
    protected $_eventPrefix = 'archivedotorg_minidisc_song';

    protected function _construct(): void
    {
        $this->_init(MiniDiscSongResource::class);
    }
}
