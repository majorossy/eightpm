<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use ArchiveDotOrg\Customer\Api\CassetteRepositoryInterface;
use ArchiveDotOrg\Customer\Model\CassetteFactory;
use ArchiveDotOrg\Customer\Model\ResourceModel\Cassette as CassetteResource;
use ArchiveDotOrg\Customer\Model\ResourceModel\Cassette\CollectionFactory;
use ArchiveDotOrg\Customer\Exception\CollectionException;

class CassetteRepository implements CassetteRepositoryInterface
{
    private const MAX_CASSETTES = 500;
    private const MAX_PAGE_SIZE = 500;

    private CassetteFactory $cassetteFactory;
    private CassetteResource $cassetteResource;
    private CollectionFactory $collectionFactory;

    public function __construct(
        CassetteFactory $cassetteFactory,
        CassetteResource $cassetteResource,
        CollectionFactory $collectionFactory
    ) {
        $this->cassetteFactory = $cassetteFactory;
        $this->cassetteResource = $cassetteResource;
        $this->collectionFactory = $collectionFactory;
    }

    public function getByCustomerId(int $customerId, int $pageSize = 0, int $currentPage = 1): array
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->setOrder('updated_at', 'DESC');

        if ($pageSize > 0) {
            $pageSize = min($pageSize, self::MAX_PAGE_SIZE);
            $currentPage = max(1, $currentPage);
            $collection->setPageSize($pageSize);
            $collection->setCurPage($currentPage);
        }

        $items = [];
        foreach ($collection as $item) {
            $items[] = $item->getData();
        }
        return $items;
    }

    public function getCountByCustomerId(int $customerId): int
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        return $collection->getSize();
    }

    public function save(int $customerId, array $data): Cassette
    {
        $clientId = $data['client_id'] ?? '';
        if (empty($clientId)) {
            throw new \InvalidArgumentException('client_id is required');
        }

        // Try to load existing by customer_id + client_id
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->addFieldToFilter('client_id', $clientId);
        $existing = $collection->getFirstItem();

        if ($existing->getId()) {
            $cassette = $existing;
        } else {
            // Check limit
            $countCollection = $this->collectionFactory->create();
            $countCollection->addFieldToFilter('customer_id', $customerId);
            if ($countCollection->getSize() >= self::MAX_CASSETTES) {
                throw CollectionException::limitExceeded('cassette', self::MAX_CASSETTES);
            }
            $cassette = $this->cassetteFactory->create();
            $cassette->setData('customer_id', $customerId);
            $cassette->setData('client_id', $clientId);
        }

        $allowedFields = [
            'name', 'album_identifier', 'artist_slug', 'artist_name',
            'album_name', 'cover_art', 'show_date', 'show_venue',
            'show_location', 'version_overrides', 'color_index'
        ];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $cassette->setData($field, $data[$field]);
            }
        }

        $this->cassetteResource->save($cassette);
        return $cassette;
    }

    public function deleteByClientId(int $customerId, string $clientId): bool
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->addFieldToFilter('client_id', $clientId);
        $item = $collection->getFirstItem();

        if (!$item->getId()) {
            throw CollectionException::notFound('Cassette', $clientId);
        }

        $this->cassetteResource->delete($item);
        return true;
    }
}
