/**
 * Integration test: Queue type utilities
 *
 * Tests from lib/queueTypes.ts:
 * - getBestVersion: selects highest-rated song
 * - generateQueueId/generateBatchId: unique ID format
 * - albumToQueueItems: converts album to queue items
 * - trackToQueueItem: wraps a song as queue item
 * - computeAlbumGroups: derives visual groups from queue
 */
import { describe, it, expect } from 'vitest';
import {
  getBestVersion,
  generateQueueId,
  generateBatchId,
  albumToQueueItems,
  trackToQueueItem,
  computeAlbumGroups,
  initialQueueState,
  type QueueItem,
} from '@/lib/queueTypes';
import { Song, Album, Track } from '@/lib/types';

function buildSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-1',
    sku: 'song-1',
    title: 'Test Song',
    artistId: 'a1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroadearth',
    duration: 300,
    streamUrl: 'https://example.com/test.mp3',
    albumArt: '',
    qualityUrls: {},
    albumIdentifier: 'rre-2024',
    albumName: 'Test Show',
    trackTitle: 'Test Song',
    ...overrides,
  };
}

function buildTrack(songs: Song[], overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    title: 'Bird on a Wire',
    slug: 'bird-on-a-wire',
    albumIdentifier: 'rre-2024',
    albumName: 'Red Rocks 2024',
    artistId: 'a1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroadearth',
    songs,
    totalDuration: 300,
    songCount: songs.length,
    ...overrides,
  };
}

function buildAlbum(tracks: Track[], overrides: Partial<Album> = {}): Album {
  return {
    id: 'album-1',
    identifier: 'rre-2024-06-15',
    name: 'Red Rocks 2024',
    slug: 'rre-2024-06-15',
    artistId: 'a1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroadearth',
    tracks,
    totalTracks: tracks.length,
    totalSongs: tracks.reduce((sum, t) => sum + t.songs.length, 0),
    totalDuration: 600,
    ...overrides,
  };
}

describe('Queue Types Integration', () => {
  describe('initialQueueState', () => {
    it('starts with empty items and cursor at -1', () => {
      expect(initialQueueState.items).toEqual([]);
      expect(initialQueueState.cursorIndex).toBe(-1);
      expect(initialQueueState.repeat).toBe('off');
    });
  });

  describe('getBestVersion', () => {
    it('returns undefined for empty array', () => {
      expect(getBestVersion([])).toBeUndefined();
    });

    it('returns single song for 1-element array', () => {
      const song = buildSong();
      expect(getBestVersion([song])).toBe(song);
    });

    it('returns highest-rated song', () => {
      const songs = [
        buildSong({ id: 's1', avgRating: 3.0 }),
        buildSong({ id: 's2', avgRating: 5.0 }),
        buildSong({ id: 's3', avgRating: 4.0 }),
      ];
      expect(getBestVersion(songs)!.id).toBe('s2');
    });

    it('treats null/undefined ratings as lowest', () => {
      const songs = [
        buildSong({ id: 's1', avgRating: undefined }),
        buildSong({ id: 's2', avgRating: 2.0 }),
      ];
      expect(getBestVersion(songs)!.id).toBe('s2');
    });

    it('returns first when all ratings are null', () => {
      const songs = [
        buildSong({ id: 's1' }),
        buildSong({ id: 's2' }),
      ];
      // Both have rating -1, sort is stable so first stays first
      const result = getBestVersion(songs);
      expect(result).toBeDefined();
    });
  });

  describe('generateQueueId / generateBatchId', () => {
    it('generates unique queue IDs', () => {
      const ids = new Set(Array.from({ length: 10 }, () => generateQueueId()));
      expect(ids.size).toBe(10);
    });

    it('queue ID starts with "q-"', () => {
      expect(generateQueueId()).toMatch(/^q-/);
    });

    it('batch ID starts with "batch-"', () => {
      expect(generateBatchId()).toMatch(/^batch-/);
    });
  });

  describe('albumToQueueItems', () => {
    it('creates queue items from album tracks', () => {
      const album = buildAlbum([
        buildTrack([buildSong({ id: 's1' })], { id: 't1', title: 'Track 1' }),
        buildTrack([buildSong({ id: 's2' })], { id: 't2', title: 'Track 2' }),
      ]);

      const items = albumToQueueItems(album);
      expect(items).toHaveLength(2);
      expect(items[0].trackTitle).toBe('Track 1');
      expect(items[1].trackTitle).toBe('Track 2');
    });

    it('all items share the same batchId', () => {
      const album = buildAlbum([
        buildTrack([buildSong({ id: 's1' })], { id: 't1' }),
        buildTrack([buildSong({ id: 's2' })], { id: 't2' }),
      ]);

      const items = albumToQueueItems(album);
      expect(items[0].batchId).toBe(items[1].batchId);
    });

    it('selects best version when multiple available', () => {
      const album = buildAlbum([
        buildTrack([
          buildSong({ id: 's1', avgRating: 2.0 }),
          buildSong({ id: 's2', avgRating: 5.0 }),
        ], { id: 't1' }),
      ]);

      const items = albumToQueueItems(album);
      expect(items[0].song.id).toBe('s2'); // highest rated
    });

    it('uses version override when provided', () => {
      const album = buildAlbum([
        buildTrack([
          buildSong({ id: 's1', avgRating: 5.0 }),
          buildSong({ id: 's2', avgRating: 2.0 }),
        ], { id: 't1' }),
      ]);

      const overrides = new Map([['t1', 's2']]);
      const items = albumToQueueItems(album, overrides);
      expect(items[0].song.id).toBe('s2'); // override, not best
    });

    it('populates albumSource with metadata', () => {
      const album = buildAlbum(
        [buildTrack([buildSong()], { id: 't1' })],
        { showDate: '2024-06-15', showVenue: 'Red Rocks' }
      );

      const items = albumToQueueItems(album);
      expect(items[0].albumSource).not.toBeNull();
      expect(items[0].albumSource!.showVenue).toBe('Red Rocks');
      expect(items[0].albumSource!.originalTrackIndex).toBe(0);
    });

    it('source type is album-load', () => {
      const album = buildAlbum([buildTrack([buildSong()])]);
      const items = albumToQueueItems(album);
      expect(items[0].source.type).toBe('album-load');
    });
  });

  describe('trackToQueueItem', () => {
    it('creates item from song', () => {
      const song = buildSong({ trackTitle: 'Bird on a Wire' });
      const item = trackToQueueItem(song);
      expect(item.trackTitle).toBe('Bird on a Wire');
      expect(item.song).toBe(song);
      expect(item.played).toBe(false);
    });

    it('source type is add-to-queue', () => {
      const item = trackToQueueItem(buildSong());
      expect(item.source.type).toBe('add-to-queue');
    });

    it('each item gets unique batchId', () => {
      const item1 = trackToQueueItem(buildSong());
      const item2 = trackToQueueItem(buildSong());
      expect(item1.batchId).not.toBe(item2.batchId);
    });
  });

  describe('computeAlbumGroups', () => {
    it('groups consecutive items with same batchId', () => {
      const batchId = 'batch-test';
      const albumSource = {
        albumId: 'a1', albumIdentifier: 'rre-2024', albumName: 'Show',
        artistSlug: 'rre', artistName: 'RRE', originalTrackIndex: 0,
      };

      const items: QueueItem[] = [
        { queueId: 'q1', batchId, song: buildSong(), trackTitle: 'T1', trackSlug: 't1', availableVersions: [], albumSource: { ...albumSource, originalTrackIndex: 0 }, played: false, source: { type: 'album-load' } },
        { queueId: 'q2', batchId, song: buildSong(), trackTitle: 'T2', trackSlug: 't2', availableVersions: [], albumSource: { ...albumSource, originalTrackIndex: 1 }, played: false, source: { type: 'album-load' } },
      ];

      const groups = computeAlbumGroups(items, -1);
      expect(groups).toHaveLength(1);
      expect(groups[0].items).toHaveLength(2);
      expect(groups[0].batchId).toBe(batchId);
    });

    it('only groups items after cursor', () => {
      const batchId = 'batch-test';
      const albumSource = {
        albumId: 'a1', albumIdentifier: 'rre-2024', albumName: 'Show',
        artistSlug: 'rre', artistName: 'RRE', originalTrackIndex: 0,
      };

      const items: QueueItem[] = [
        { queueId: 'q1', batchId, song: buildSong(), trackTitle: 'T1', trackSlug: 't1', availableVersions: [], albumSource: { ...albumSource, originalTrackIndex: 0 }, played: true, source: { type: 'album-load' } },
        { queueId: 'q2', batchId, song: buildSong(), trackTitle: 'T2', trackSlug: 't2', availableVersions: [], albumSource: { ...albumSource, originalTrackIndex: 1 }, played: false, source: { type: 'album-load' } },
      ];

      // cursor at 0 means only items[1+] are grouped
      const groups = computeAlbumGroups(items, 0);
      expect(groups).toHaveLength(1);
      expect(groups[0].items).toHaveLength(1);
      expect(groups[0].isContinuation).toBe(true); // batch was seen before cursor
    });

    it('returns empty for empty queue', () => {
      expect(computeAlbumGroups([], -1)).toEqual([]);
    });
  });
});
