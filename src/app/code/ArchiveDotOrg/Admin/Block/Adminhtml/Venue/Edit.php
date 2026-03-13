<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Admin\Block\Adminhtml\Venue;

use ArchiveDotOrg\Admin\Model\VenueRepository;
use Magento\Backend\Block\Template;
use Magento\Backend\Block\Template\Context;

class Edit extends Template
{
    private VenueRepository $venueRepository;

    public function __construct(
        Context $context,
        VenueRepository $venueRepository,
        array $data = []
    ) {
        $this->venueRepository = $venueRepository;
        parent::__construct($context, $data);
    }

    public function getVenue(): ?\ArchiveDotOrg\Admin\Model\Venue
    {
        $venueId = (int) $this->getRequest()->getParam('venue_id');
        if ($venueId) {
            try {
                return $this->venueRepository->getById($venueId);
            } catch (\Exception $e) {
                return null;
            }
        }
        return null;
    }

    public function getSaveUrl(): string
    {
        return $this->getUrl('*/*/save');
    }

    public function getBackUrl(): string
    {
        return $this->getUrl('*/*/');
    }
}
