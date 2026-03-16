/**
 * Test data factories for QueueItem and batch builders.
 *
 * Usage:
 *   const item = buildQueueItem({ song: buildSong({ title: 'Bird Song' }) });
 *   const batch = buildBatch(5); // 5 items sharing a batchId
 */
import type { QueueItem, QueueItemAlbumSource, QueueItemSource } from '@/lib/queueTypes';
import { buildSong } from './song';
import type { Song } from '@/lib/types';

let queueItemCounter = 0;
let batchCounter = 0;

export function resetQueueCounters() {
  queueItemCounter = batchCounter = 0;
}

export function buildAlbumSource(overrides: Partial<QueueItemAlbumSource> = {}): QueueItemAlbumSource {
  return {
    albumId: 'album-1',
    albumIdentifier: 're-2024-01-01',
    albumName: 'Railroad Earth Live at Red Rocks 2024-01-01',
    artistSlug: 'railroad-earth',
    artistName: 'Railroad Earth',
    coverArt: '/img/default-cover.jpg',
    showDate: '2024-01-01',
    showVenue: 'Red Rocks Amphitheatre',
    showLocation: 'Morrison, CO',
    originalTrackIndex: 0,
    ...overrides,
  };
}

export function buildQueueItem(overrides: Partial<QueueItem> = {}): QueueItem {
  queueItemCounter++;
  const song = overrides.song ?? buildSong();
  return {
    queueId: `q-test-${queueItemCounter}`,
    batchId: `batch-test-${batchCounter || 1}`,
    song,
    trackTitle: song.trackTitle || song.title,
    trackSlug: `track-${queueItemCounter}`,
    availableVersions: [song],
    albumSource: buildAlbumSource({ originalTrackIndex: queueItemCounter - 1 }),
    played: false,
    source: { type: 'album-load' } as QueueItemSource,
    ...overrides,
  };
}

/**
 * Build a batch of queue items that share the same batchId and albumSource.
 * Mimics loading an album into the queue.
 */
export function buildBatch(count: number, overrides: Partial<QueueItem> = {}): QueueItem[] {
  batchCounter++;
  const batchId = `batch-test-${batchCounter}`;
  const albumSource = buildAlbumSource();

  return Array.from({ length: count }, (_, i) => {
    const song = buildSong({ trackTitle: `Batch ${batchCounter} Track ${i + 1}` });
    return buildQueueItem({
      batchId,
      song,
      albumSource: { ...albumSource, originalTrackIndex: i },
      ...overrides,
    });
  });
}

/**
 * Build a standalone queue item (no album source) — like a play-next or add-to-queue action.
 */
export function buildStandaloneItem(song?: Song, source: QueueItemSource = { type: 'add-to-queue', addedAt: Date.now() }): QueueItem {
  return buildQueueItem({
    albumSource: null,
    source,
    song: song ?? buildSong(),
  });
}
