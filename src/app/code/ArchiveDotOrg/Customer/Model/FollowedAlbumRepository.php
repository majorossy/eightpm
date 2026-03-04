<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use ArchiveDotOrg\Customer\Api\FollowedAlbumRepositoryInterface;
use ArchiveDotOrg\Customer\Model\FollowedAlbumFactory;
use ArchiveDotOrg\Customer\Model\ResourceModel\FollowedAlbum as FollowedAlbumResource;
use ArchiveDotOrg\Customer\Model\ResourceModel\FollowedAlbum\CollectionFactory;
use ArchiveDotOrg\Customer\Exception\CollectionException;

class FollowedAlbumRepository implements FollowedAlbumRepositoryInterface
{
    private const MAX_FOLLOWED_ALBUMS = 500;

    private FollowedAlbumFactory $followedAlbumFactory;
    private FollowedAlbumResource $followedAlbumResource;
    private CollectionFactory $collectionFactory;

    public function __construct(
        FollowedAlbumFactory $followedAlbumFactory,
        FollowedAlbumResource $followedAlbumResource,
        CollectionFactory $collectionFactory
    ) {
        $this->followedAlbumFactory = $followedAlbumFactory;
        $this->followedAlbumResource = $followedAlbumResource;
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

    public function save(int $customerId, array $data): FollowedAlbum
    {
        $artistSlug = $data['artist_slug'] ?? '';
        $albumTitle = $data['album_title'] ?? '';
        if (empty($artistSlug) || empty($albumTitle)) {
            throw new \InvalidArgumentException('artist_slug and album_title are required');
        }

        // Check if already following
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->addFieldToFilter('artist_slug', $artistSlug);
        $collection->addFieldToFilter('album_title', $albumTitle);
        $existing = $collection->getFirstItem();

        if ($existing->getId()) {
            return $existing;
        }

        // Check limit
        $countCollection = $this->collectionFactory->create();
        $countCollection->addFieldToFilter('customer_id', $customerId);
        if ($countCollection->getSize() >= self::MAX_FOLLOWED_ALBUMS) {
            throw CollectionException::limitExceeded('followed album', self::MAX_FOLLOWED_ALBUMS);
        }

        $followedAlbum = $this->followedAlbumFactory->create();
        $followedAlbum->setData('customer_id', $customerId);
        $followedAlbum->setData('artist_slug', $artistSlug);
        $followedAlbum->setData('album_title', $albumTitle);

        $this->followedAlbumResource->save($followedAlbum);
        return $followedAlbum;
    }

    public function deleteByKey(int $customerId, string $artistSlug, string $albumTitle): bool
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->addFieldToFilter('artist_slug', $artistSlug);
        $collection->addFieldToFilter('album_title', $albumTitle);
        $item = $collection->getFirstItem();

        if (!$item->getId()) {
            throw CollectionException::notFound('Followed album', $artistSlug . '/' . $albumTitle);
        }

        $this->followedAlbumResource->delete($item);
        return true;
    }
}
