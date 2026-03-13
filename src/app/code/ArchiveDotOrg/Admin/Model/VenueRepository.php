<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Admin\Model;

use ArchiveDotOrg\Admin\Model\ResourceModel\Venue as VenueResource;
use ArchiveDotOrg\Admin\Model\ResourceModel\Venue\CollectionFactory;
use Magento\Framework\Exception\CouldNotDeleteException;
use Magento\Framework\Exception\CouldNotSaveException;
use Magento\Framework\Exception\NoSuchEntityException;

class VenueRepository
{
    public function __construct(
        private readonly VenueFactory $venueFactory,
        private readonly VenueResource $venueResource,
        private readonly CollectionFactory $collectionFactory
    ) {
    }

    public function save(Venue $venue): Venue
    {
        try {
            $this->venueResource->save($venue);
        } catch (\Exception $e) {
            throw new CouldNotSaveException(__('Could not save venue: %1', $e->getMessage()), $e);
        }
        return $venue;
    }

    public function getById(int $venueId): Venue
    {
        $venue = $this->venueFactory->create();
        $this->venueResource->load($venue, $venueId);
        if (!$venue->getId()) {
            throw new NoSuchEntityException(__('Venue with ID "%1" does not exist.', $venueId));
        }
        return $venue;
    }

    public function getBySlug(string $slug): Venue
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('slug', $slug);
        $venue = $collection->getFirstItem();
        if (!$venue->getId()) {
            throw new NoSuchEntityException(__('Venue with slug "%1" does not exist.', $slug));
        }
        return $venue;
    }

    public function delete(Venue $venue): bool
    {
        try {
            $this->venueResource->delete($venue);
        } catch (\Exception $e) {
            throw new CouldNotDeleteException(__('Could not delete venue: %1', $e->getMessage()), $e);
        }
        return true;
    }
}
