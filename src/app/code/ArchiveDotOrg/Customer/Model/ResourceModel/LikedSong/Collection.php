<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\ResourceModel\LikedSong;

use ArchiveDotOrg\Customer\Model\LikedSong;
use ArchiveDotOrg\Customer\Model\ResourceModel\LikedSong as LikedSongResource;
use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'entity_id';
    protected $_eventPrefix = 'archivedotorg_liked_song_collection';

    protected function _construct(): void
    {
        $this->_init(LikedSong::class, LikedSongResource::class);
    }
}
