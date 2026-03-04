<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use Magento\Framework\Model\AbstractModel;
use ArchiveDotOrg\Customer\Model\ResourceModel\MiniDisc as MiniDiscResource;

class MiniDisc extends AbstractModel
{
    protected $_eventPrefix = 'archivedotorg_minidisc';

    protected function _construct(): void
    {
        $this->_init(MiniDiscResource::class);
    }
}
