<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use Magento\Framework\Model\AbstractModel;
use ArchiveDotOrg\Customer\Model\ResourceModel\Cassette as CassetteResource;

class Cassette extends AbstractModel
{
    protected $_eventPrefix = 'archivedotorg_cassette';

    protected function _construct(): void
    {
        $this->_init(CassetteResource::class);
    }
}
