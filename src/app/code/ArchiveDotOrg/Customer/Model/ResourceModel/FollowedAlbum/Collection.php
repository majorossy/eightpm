<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\ResourceModel\FollowedAlbum;

use ArchiveDotOrg\Customer\Model\FollowedAlbum;
use ArchiveDotOrg\Customer\Model\ResourceModel\FollowedAlbum as FollowedAlbumResource;
use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'entity_id';
    protected $_eventPrefix = 'archivedotorg_followed_album_collection';

    protected function _construct(): void
    {
        $this->_init(FollowedAlbum::class, FollowedAlbumResource::class);
    }
}
