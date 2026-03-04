<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model\ResourceModel\FollowedArtist;

use ArchiveDotOrg\Customer\Model\FollowedArtist;
use ArchiveDotOrg\Customer\Model\ResourceModel\FollowedArtist as FollowedArtistResource;
use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'entity_id';
    protected $_eventPrefix = 'archivedotorg_followed_artist_collection';

    protected function _construct(): void
    {
        $this->_init(FollowedArtist::class, FollowedArtistResource::class);
    }
}
