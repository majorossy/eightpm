<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use ArchiveDotOrg\Customer\Api\FollowedArtistRepositoryInterface;
use ArchiveDotOrg\Customer\Model\FollowedArtistFactory;
use ArchiveDotOrg\Customer\Model\ResourceModel\FollowedArtist as FollowedArtistResource;
use ArchiveDotOrg\Customer\Model\ResourceModel\FollowedArtist\CollectionFactory;
use ArchiveDotOrg\Customer\Exception\CollectionException;

class FollowedArtistRepository implements FollowedArtistRepositoryInterface
{
    private const MAX_FOLLOWED_ARTISTS = 200;

    private FollowedArtistFactory $followedArtistFactory;
    private FollowedArtistResource $followedArtistResource;
    private CollectionFactory $collectionFactory;

    public function __construct(
        FollowedArtistFactory $followedArtistFactory,
        FollowedArtistResource $followedArtistResource,
        CollectionFactory $collectionFactory
    ) {
        $this->followedArtistFactory = $followedArtistFactory;
        $this->followedArtistResource = $followedArtistResource;
        $this->collectionFactory = $collectionFactory;
    }

    public function getByCustomerId(int $customerId): array
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->setOrder('followed_at', 'DESC');

        $items = [];
        foreach ($collection as $item) {
            $items[] = $item->getData();
        }
        return $items;
    }

    public function save(int $customerId, array $data): FollowedArtist
    {
        $artistSlug = $data['artist_slug'] ?? '';
        if (empty($artistSlug)) {
            throw new \InvalidArgumentException('artist_slug is required');
        }

        // Check if already following
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->addFieldToFilter('artist_slug', $artistSlug);
        $existing = $collection->getFirstItem();

        if ($existing->getId()) {
            return $existing;
        }

        // Check limit
        $countCollection = $this->collectionFactory->create();
        $countCollection->addFieldToFilter('customer_id', $customerId);
        if ($countCollection->getSize() >= self::MAX_FOLLOWED_ARTISTS) {
            throw CollectionException::limitExceeded('followed artist', self::MAX_FOLLOWED_ARTISTS);
        }

        $followedArtist = $this->followedArtistFactory->create();
        $followedArtist->setData('customer_id', $customerId);
        $followedArtist->setData('artist_slug', $artistSlug);

        $this->followedArtistResource->save($followedArtist);
        return $followedArtist;
    }

    public function deleteBySlug(int $customerId, string $artistSlug): bool
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->addFieldToFilter('artist_slug', $artistSlug);
        $item = $collection->getFirstItem();

        if (!$item->getId()) {
            throw CollectionException::notFound('Followed artist', $artistSlug);
        }

        $this->followedArtistResource->delete($item);
        return true;
    }
}
