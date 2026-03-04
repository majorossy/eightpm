<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Model;

use ArchiveDotOrg\Customer\Api\MiniDiscRepositoryInterface;
use ArchiveDotOrg\Customer\Model\MiniDiscFactory;
use ArchiveDotOrg\Customer\Model\MiniDiscSongFactory;
use ArchiveDotOrg\Customer\Model\ResourceModel\MiniDisc as MiniDiscResource;
use ArchiveDotOrg\Customer\Model\ResourceModel\MiniDiscSong as MiniDiscSongResource;
use ArchiveDotOrg\Customer\Model\ResourceModel\MiniDisc\CollectionFactory;
use ArchiveDotOrg\Customer\Model\ResourceModel\MiniDiscSong\CollectionFactory as SongCollectionFactory;
use ArchiveDotOrg\Customer\Exception\CollectionException;

class MiniDiscRepository implements MiniDiscRepositoryInterface
{
    private const MAX_MINIDISCS = 200;
    private const MAX_SONGS_PER_MINIDISC = 500;

    private MiniDiscFactory $miniDiscFactory;
    private MiniDiscSongFactory $songFactory;
    private MiniDiscResource $miniDiscResource;
    private MiniDiscSongResource $songResource;
    private CollectionFactory $collectionFactory;
    private SongCollectionFactory $songCollectionFactory;

    public function __construct(
        MiniDiscFactory $miniDiscFactory,
        MiniDiscSongFactory $songFactory,
        MiniDiscResource $miniDiscResource,
        MiniDiscSongResource $songResource,
        CollectionFactory $collectionFactory,
        SongCollectionFactory $songCollectionFactory
    ) {
        $this->miniDiscFactory = $miniDiscFactory;
        $this->songFactory = $songFactory;
        $this->miniDiscResource = $miniDiscResource;
        $this->songResource = $songResource;
        $this->collectionFactory = $collectionFactory;
        $this->songCollectionFactory = $songCollectionFactory;
    }

    public function getByCustomerId(int $customerId): array
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->setOrder('updated_at', 'DESC');

        $items = [];
        foreach ($collection as $miniDisc) {
            $data = $miniDisc->getData();
            $data['songs'] = $this->getSongsForMiniDisc((int)$miniDisc->getId());
            $items[] = $data;
        }
        return $items;
    }

    public function save(int $customerId, array $data): MiniDisc
    {
        $clientId = $data['client_id'] ?? '';
        if (empty($clientId)) {
            throw new \InvalidArgumentException('client_id is required');
        }

        // Try to load existing
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->addFieldToFilter('client_id', $clientId);
        $existing = $collection->getFirstItem();

        if ($existing->getId()) {
            $miniDisc = $existing;
        } else {
            $countCollection = $this->collectionFactory->create();
            $countCollection->addFieldToFilter('customer_id', $customerId);
            if ($countCollection->getSize() >= self::MAX_MINIDISCS) {
                throw CollectionException::limitExceeded('minidisc', self::MAX_MINIDISCS);
            }
            $miniDisc = $this->miniDiscFactory->create();
            $miniDisc->setData('customer_id', $customerId);
            $miniDisc->setData('client_id', $clientId);
        }

        $allowedFields = ['name', 'description', 'cover_art'];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $miniDisc->setData($field, $data[$field]);
            }
        }

        $this->miniDiscResource->save($miniDisc);

        // Save songs if provided
        if (isset($data['songs']) && is_array($data['songs'])) {
            $this->saveSongs((int)$miniDisc->getId(), $data['songs']);
        }

        return $miniDisc;
    }

    public function deleteByClientId(int $customerId, string $clientId): bool
    {
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId);
        $collection->addFieldToFilter('client_id', $clientId);
        $item = $collection->getFirstItem();

        if (!$item->getId()) {
            throw CollectionException::notFound('MiniDisc', $clientId);
        }

        // Songs cascade-deleted by FK
        $this->miniDiscResource->delete($item);
        return true;
    }

    private function getSongsForMiniDisc(int $miniDiscId): array
    {
        $collection = $this->songCollectionFactory->create();
        $collection->addFieldToFilter('minidisc_id', $miniDiscId);
        $collection->setOrder('position', 'ASC');

        $songs = [];
        foreach ($collection as $song) {
            $songs[] = $song->getData();
        }
        return $songs;
    }

    private function saveSongs(int $miniDiscId, array $songs): void
    {
        if (count($songs) > self::MAX_SONGS_PER_MINIDISC) {
            throw CollectionException::limitExceeded('songs per minidisc', self::MAX_SONGS_PER_MINIDISC);
        }

        // Delete existing songs and re-insert
        $existingSongs = $this->songCollectionFactory->create();
        $existingSongs->addFieldToFilter('minidisc_id', $miniDiscId);
        foreach ($existingSongs as $existing) {
            $this->songResource->delete($existing);
        }

        foreach ($songs as $position => $songData) {
            $song = $this->songFactory->create();
            $song->setData('minidisc_id', $miniDiscId);
            $song->setData('song_id', $songData['song_id'] ?? '');
            $song->setData('sku', $songData['sku'] ?? null);
            $song->setData('position', $songData['position'] ?? $position);
            $song->setData('song_data_snapshot', $songData['song_data_snapshot'] ?? null);
            $this->songResource->save($song);
        }
    }
}
