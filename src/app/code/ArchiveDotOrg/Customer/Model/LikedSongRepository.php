<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use ArchiveDotOrg\Customer\Api\LikedSongRepositoryInterface;
use ArchiveDotOrg\Customer\Model\LikedSongFactory;
use ArchiveDotOrg\Customer\Model\ResourceModel\LikedSong as LikedSongResource;
use ArchiveDotOrg\Customer\Model\ResourceModel\LikedSong\CollectionFactory;
use ArchiveDotOrg\Customer\Exception\CollectionException;

class LikedSongRepository implements LikedSongRepositoryInterface
{
    private const MAX_LIKED_SONGS = 10000;
    private const MAX_PAGE_SIZE = 10000;

    private LikedSongFactory $likedSongFactory;
    private LikedSongResource $likedSongResource;
    private CollectionFactory $collectionFactory;

    public function __construct(
        LikedSongFactory $likedSongFactory,
        LikedSongResource $likedSongResource,
        CollectionFactory $collectionFactory
    ) {
        $this->likedSongFactory = $likedSongFactory;
        $this->likedSongResource = $likedSongResource;
        $this->collectionFactory = $collectionFactory;
    }

    public function getByCustomerId(int $customerId, int $pageSize = 0, int $currentPage = 1): array
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->setOrder('added_at', 'DESC');

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

    public function save(int $customerId, array $data): LikedSong
    {
        $songId = $data['song_id'] ?? '';
        if (empty($songId)) {
            throw new \InvalidArgumentException('song_id is required');
        }

        // Check if already liked
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->addFieldToFilter('song_id', $songId);
        $existing = $collection->getFirstItem();

        if ($existing->getId()) {
            // Update snapshot if provided
            if (isset($data['song_data_snapshot'])) {
                $existing->setData('song_data_snapshot', $data['song_data_snapshot']);
                $this->likedSongResource->save($existing);
            }
            return $existing;
        }

        // Check limit
        $countCollection = $this->collectionFactory->create();
        $countCollection->addFieldToFilter('customer_id', $customerId);
        if ($countCollection->getSize() >= self::MAX_LIKED_SONGS) {
            throw CollectionException::limitExceeded('liked song', self::MAX_LIKED_SONGS);
        }

        $likedSong = $this->likedSongFactory->create();
        $likedSong->setData('customer_id', $customerId);
        $likedSong->setData('song_id', $songId);
        $likedSong->setData('sku', $data['sku'] ?? null);
        $likedSong->setData('song_data_snapshot', $data['song_data_snapshot'] ?? null);

        $this->likedSongResource->save($likedSong);
        // Reload to get DB-generated timestamps
        $this->likedSongResource->load($likedSong, $likedSong->getId());
        return $likedSong;
    }

    public function deleteBySongId(int $customerId, string $songId): bool
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->addFieldToFilter('song_id', $songId);
        $item = $collection->getFirstItem();

        if (!$item->getId()) {
            throw CollectionException::notFound('Liked song', $songId);
        }

        $this->likedSongResource->delete($item);
        return true;
    }
}
