<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Admin\Controller\Adminhtml\Venue;

use ArchiveDotOrg\Admin\Model\VenueRepository;
use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;

class Save extends Action
{
    public const ADMIN_RESOURCE = 'ArchiveDotOrg_Admin::venues';

    public function __construct(
        Context $context,
        private readonly VenueRepository $venueRepository
    ) {
        parent::__construct($context);
    }

    public function execute()
    {
        $data = $this->getRequest()->getPostValue();
        if (!$data) {
            return $this->resultRedirectFactory->create()->setPath('*/*/');
        }

        $venueId = (int) ($data['venue_id'] ?? 0);
        try {
            $venue = $this->venueRepository->getById($venueId);
            $venue->setNormalizedName($data['normalized_name'] ?? $venue->getNormalizedName());
            $venue->setSlug($data['slug'] ?? $venue->getSlug());
            $venue->setCity($data['city'] ?? $venue->getCity());
            $venue->setState($data['state'] ?? $venue->getState());
            $venue->setCountry($data['country'] ?? $venue->getCountry());
            if (isset($data['latitude'])) {
                $venue->setData('latitude', $data['latitude'] ?: null);
            }
            if (isset($data['longitude'])) {
                $venue->setData('longitude', $data['longitude'] ?: null);
            }
            $this->venueRepository->save($venue);
            $this->messageManager->addSuccessMessage(__('Venue saved successfully.'));
        } catch (\Exception $e) {
            $this->messageManager->addErrorMessage(__('Could not save venue: %1', $e->getMessage()));
        }

        return $this->resultRedirectFactory->create()->setPath('*/*/');
    }
}
