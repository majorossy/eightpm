<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use Magento\Framework\Model\AbstractModel;
use ArchiveDotOrg\Customer\Model\ResourceModel\FollowedArtist as FollowedArtistResource;

class FollowedArtist extends AbstractModel
{
    protected $_eventPrefix = 'archivedotorg_followed_artist';

    protected function _construct(): void
    {
        $this->_init(FollowedArtistResource::class);
    }
}
