<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Admin\Controller\Adminhtml\Venue;

use ArchiveDotOrg\Admin\Model\VenueRepository;
use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;

class Edit extends Action
{
    public const ADMIN_RESOURCE = 'ArchiveDotOrg_Admin::venues';

    public function __construct(
        Context $context,
        private readonly PageFactory $resultPageFactory,
        private readonly VenueRepository $venueRepository
    ) {
        parent::__construct($context);
    }

    public function execute()
    {
        $venueId = (int) $this->getRequest()->getParam('venue_id');
        try {
            $venue = $this->venueRepository->getById($venueId);
        } catch (\Exception $e) {
            $this->messageManager->addErrorMessage(__('This venue no longer exists.'));
            return $this->resultRedirectFactory->create()->setPath('*/*/');
        }

        $resultPage = $this->resultPageFactory->create();
        $resultPage->setActiveMenu('ArchiveDotOrg_Admin::venues');
        $resultPage->getConfig()->getTitle()->prepend(__('Edit Venue: %1', $venue->getNormalizedName()));
        return $resultPage;
    }
}
