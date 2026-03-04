<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use Magento\Framework\Model\AbstractModel;
use ArchiveDotOrg\Customer\Model\ResourceModel\FollowedAlbum as FollowedAlbumResource;

class FollowedAlbum extends AbstractModel
{
    protected $_eventPrefix = 'archivedotorg_followed_album';

    protected function _construct(): void
    {
        $this->_init(FollowedAlbumResource::class);
    }
}
