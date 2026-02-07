import { describe, it, expect } from 'vitest';
import type { Song, Album, Track } from '@/lib/types';
import type { QueueItem, QueueItemAlbumSource } from '@/lib/queueTypes';
import {
  getBestVersion,
  generateQueueId,
  generateBatchId,
  albumToQueueItems,
  trackToQueueItem,
  computeAlbumGroups,
} from '@/lib/queueTypes';

// =============================================================================
// Mock Factories
// =============================================================================

const mockSong = (overrides?: Partial<Song>): Song => ({
  id: 'song-1',
  sku: 'sku-1',
  title: 'Dark Star',
  trackTitle: 'Dark Star',
  duration: 300,
  artistName: 'Grateful Dead',
  artistSlug: 'grateful-dead',
  artistId: 'artist-1',
  albumName: 'Live at Fillmore',
  albumIdentifier: 'gd1969-01-01',
  streamUrl: 'https://example.com/stream.mp3',
  albumArt: '',
  avgRating: 4.5,
  ...overrides,
});

const mockTrack = (overrides?: Partial<Track>): Track => ({
  id: 'track-1',
  title: 'Dark Star',
  slug: 'dark-star',
  albumIdentifier: 'gd1969-01-01',
  albumName: 'Live at Fillmore',
  artistId: 'artist-1',
  artistName: 'Grateful Dead',
  artistSlug: 'grateful-dead',
  songs: [mockSong()],
  totalDuration: 300,
  songCount: 1,
  ...overrides,
});

const mockAlbum = (overrides?: Partial<Album>): Album => ({
  id: 'album-1',
  identifier: 'gd1969-01-01',
  name: 'Live at Fillmore 1969-01-01',
  slug: 'gd1969-01-01',
  artistId: 'artist-1',
  artistName: 'Grateful Dead',
  artistSlug: 'grateful-dead',
  showDate: '1969-01-01',
  showVenue: 'Fillmore West',
  showLocation: 'San Francisco, CA',
  tracks: [
    mockTrack({ id: 'track-1', title: 'Dark Star', slug: 'dark-star' }),
    mockTrack({
      id: 'track-2',
      title: 'St. Stephen',
      slug: 'st-stephen',
      songs: [
        mockSong({ id: 'song-2', title: 'St. Stephen', trackTitle: 'St. Stephen', avgRating: 4.0 }),
      ],
    }),
  ],
  totalTracks: 2,
  totalSongs: 2,
  totalDuration: 600,
  coverArt: 'https://example.com/cover.jpg',
  ...overrides,
});

const mockAlbumSource = (overrides?: Partial<QueueItemAlbumSource>): QueueItemAlbumSource => ({
  albumId: 'album-1',
  albumIdentifier: 'gd1969-01-01',
  albumName: 'Live at Fillmore 1969-01-01',
  artistSlug: 'grateful-dead',
  artistName: 'Grateful Dead',
  originalTrackIndex: 0,
  ...overrides,
});

const mockQueueItem = (overrides?: Partial<QueueItem>): QueueItem => ({
  queueId: `q-${Date.now()}-test`,
  batchId: 'batch-test-1',
  song: mockSong(),
  trackTitle: 'Dark Star',
  trackSlug: 'dark-star',
  availableVersions: [mockSong()],
  albumSource: mockAlbumSource(),
  played: false,
  source: { type: 'album-load' },
  ...overrides,
});

// =============================================================================
// Tests
// =============================================================================

describe('getBestVersion', () => {
  it('returns the only song when array has 1 element', () => {
    const song = mockSong({ id: 'only-one', avgRating: 3.0 });
    expect(getBestVersion([song])).toBe(song);
  });

  it('returns highest rated song when multiple songs exist', () => {
    const low = mockSong({ id: 'low', avgRating: 2.0 });
    const mid = mockSong({ id: 'mid', avgRating: 3.5 });
    const high = mockSong({ id: 'high', avgRating: 4.8 });
    expect(getBestVersion([low, mid, high])).toBe(high);
  });

  it('returns highest rated regardless of input order', () => {
    const low = mockSong({ id: 'low', avgRating: 1.0 });
    const high = mockSong({ id: 'high', avgRating: 5.0 });
    expect(getBestVersion([high, low])).toBe(high);
    expect(getBestVersion([low, high])).toBe(high);
  });

  it('treats null avgRating as -1', () => {
    const withRating = mockSong({ id: 'rated', avgRating: 1.0 });
    const withNull = mockSong({ id: 'null-rating', avgRating: undefined });
    expect(getBestVersion([withNull, withRating])).toBe(withRating);
  });

  it('treats undefined avgRating as -1', () => {
    const withRating = mockSong({ id: 'rated', avgRating: 0 });
    const withUndefined = mockSong({ id: 'undef-rating' });
    // Delete avgRating to make it truly undefined
    delete (withUndefined as unknown as Record<string, unknown>).avgRating;
    expect(getBestVersion([withUndefined, withRating])).toBe(withRating);
  });

  it('returns first song (by sort stability) when all ratings are null/undefined', () => {
    const a = mockSong({ id: 'a', avgRating: undefined });
    const b = mockSong({ id: 'b', avgRating: undefined });
    const result = getBestVersion([a, b]);
    // Both have -1 rating; sort is stable so first stays first
    expect(result).toBe(a);
  });

  it('handles mix of rated and unrated songs', () => {
    const unrated = mockSong({ id: 'unrated', avgRating: undefined });
    const low = mockSong({ id: 'low', avgRating: 2.0 });
    const high = mockSong({ id: 'high', avgRating: 4.0 });
    expect(getBestVersion([unrated, low, high])).toBe(high);
  });

  it('throws on empty array', () => {
    expect(() => getBestVersion([])).toThrow(
      'Cannot get best version from empty songs array',
    );
  });

  it('does not mutate the original array', () => {
    const a = mockSong({ id: 'a', avgRating: 1.0 });
    const b = mockSong({ id: 'b', avgRating: 5.0 });
    const original = [a, b];
    getBestVersion(original);
    expect(original[0]).toBe(a);
    expect(original[1]).toBe(b);
  });
});

describe('generateQueueId', () => {
  it('returns a string starting with "q-"', () => {
    const id = generateQueueId();
    expect(id).toMatch(/^q-/);
  });

  it('returns a string with timestamp and random component', () => {
    const id = generateQueueId();
    // Format: q-{timestamp}-{random}
    expect(id).toMatch(/^q-\d+-[a-z0-9]+$/);
  });

  it('generates 100 unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateQueueId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('generateBatchId', () => {
  it('returns a string starting with "batch-"', () => {
    const id = generateBatchId();
    expect(id).toMatch(/^batch-/);
  });

  it('returns a string with timestamp and random component', () => {
    const id = generateBatchId();
    expect(id).toMatch(/^batch-\d+-[a-z0-9]+$/);
  });

  it('generates 100 unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateBatchId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('albumToQueueItems', () => {
  it('creates correct number of items (one per track with songs)', () => {
    const album = mockAlbum();
    const items = albumToQueueItems(album);
    expect(items).toHaveLength(2);
  });

  it('all items share the same batchId', () => {
    const album = mockAlbum();
    const items = albumToQueueItems(album);
    const batchIds = new Set(items.map((item) => item.batchId));
    expect(batchIds.size).toBe(1);
    expect(items[0].batchId).toMatch(/^batch-/);
  });

  it('each item has a unique queueId', () => {
    const album = mockAlbum();
    const items = albumToQueueItems(album);
    const queueIds = new Set(items.map((item) => item.queueId));
    expect(queueIds.size).toBe(items.length);
  });

  it('selects best version by default (highest avgRating)', () => {
    const bestSong = mockSong({ id: 'best', avgRating: 5.0 });
    const worseSong = mockSong({ id: 'worse', avgRating: 2.0 });
    const album = mockAlbum({
      tracks: [
        mockTrack({
          id: 'track-multi',
          songs: [worseSong, bestSong],
        }),
      ],
    });
    const items = albumToQueueItems(album);
    expect(items[0].song).toBe(bestSong);
  });

  it('respects versionOverrides map', () => {
    const defaultBest = mockSong({ id: 'default-best', avgRating: 5.0 });
    const overrideSong = mockSong({ id: 'override-pick', avgRating: 1.0 });
    const album = mockAlbum({
      tracks: [
        mockTrack({
          id: 'track-override',
          songs: [defaultBest, overrideSong],
        }),
      ],
    });

    const overrides = new Map<string, string>();
    overrides.set('track-override', 'override-pick');

    const items = albumToQueueItems(album, overrides);
    expect(items[0].song).toBe(overrideSong);
  });

  it('falls back to best version if override ID not found', () => {
    const bestSong = mockSong({ id: 'best', avgRating: 5.0 });
    const otherSong = mockSong({ id: 'other', avgRating: 2.0 });
    const album = mockAlbum({
      tracks: [
        mockTrack({
          id: 'track-fallback',
          songs: [otherSong, bestSong],
        }),
      ],
    });

    const overrides = new Map<string, string>();
    overrides.set('track-fallback', 'nonexistent-song-id');

    const items = albumToQueueItems(album, overrides);
    expect(items[0].song).toBe(bestSong);
  });

  it('skips tracks with empty songs array', () => {
    const album = mockAlbum({
      tracks: [
        mockTrack({ id: 'track-with-songs', songs: [mockSong()] }),
        mockTrack({ id: 'track-empty', songs: [] }),
        mockTrack({
          id: 'track-also-songs',
          songs: [mockSong({ id: 'song-3' })],
        }),
      ],
    });
    const items = albumToQueueItems(album);
    expect(items).toHaveLength(2);
  });

  it('sets albumSource correctly on each item', () => {
    const album = mockAlbum();
    const items = albumToQueueItems(album);

    for (const item of items) {
      expect(item.albumSource).not.toBeNull();
      expect(item.albumSource!.albumId).toBe(album.id);
      expect(item.albumSource!.albumIdentifier).toBe(album.identifier);
      expect(item.albumSource!.albumName).toBe(album.name);
      expect(item.albumSource!.artistSlug).toBe(album.artistSlug);
      expect(item.albumSource!.artistName).toBe(album.artistName);
      expect(item.albumSource!.coverArt).toBe(album.coverArt);
      expect(item.albumSource!.showDate).toBe(album.showDate);
      expect(item.albumSource!.showVenue).toBe(album.showVenue);
      expect(item.albumSource!.showLocation).toBe(album.showLocation);
    }
  });

  it('sets originalTrackIndex correctly', () => {
    const album = mockAlbum({
      tracks: [
        mockTrack({ id: 'track-a', songs: [mockSong({ id: 's-a' })] }),
        mockTrack({ id: 'track-b', songs: [mockSong({ id: 's-b' })] }),
        mockTrack({ id: 'track-c', songs: [mockSong({ id: 's-c' })] }),
      ],
    });
    const items = albumToQueueItems(album);
    expect(items[0].albumSource!.originalTrackIndex).toBe(0);
    expect(items[1].albumSource!.originalTrackIndex).toBe(1);
    expect(items[2].albumSource!.originalTrackIndex).toBe(2);
  });

  it('preserves originalTrackIndex when tracks are skipped', () => {
    const album = mockAlbum({
      tracks: [
        mockTrack({ id: 'track-0', songs: [mockSong({ id: 's-0' })] }),
        mockTrack({ id: 'track-1', songs: [] }), // skipped
        mockTrack({ id: 'track-2', songs: [mockSong({ id: 's-2' })] }),
      ],
    });
    const items = albumToQueueItems(album);
    expect(items).toHaveLength(2);
    expect(items[0].albumSource!.originalTrackIndex).toBe(0);
    expect(items[1].albumSource!.originalTrackIndex).toBe(2);
  });

  it('sets source to { type: "album-load" }', () => {
    const album = mockAlbum();
    const items = albumToQueueItems(album);
    for (const item of items) {
      expect(item.source).toEqual({ type: 'album-load' });
    }
  });

  it('sets played to false', () => {
    const album = mockAlbum();
    const items = albumToQueueItems(album);
    for (const item of items) {
      expect(item.played).toBe(false);
    }
  });

  it('sets trackTitle and trackSlug from the track', () => {
    const album = mockAlbum({
      tracks: [
        mockTrack({
          id: 'track-t',
          title: 'Scarlet Begonias',
          slug: 'scarlet-begonias',
          songs: [mockSong({ id: 'sb' })],
        }),
      ],
    });
    const items = albumToQueueItems(album);
    expect(items[0].trackTitle).toBe('Scarlet Begonias');
    expect(items[0].trackSlug).toBe('scarlet-begonias');
  });

  it('includes availableVersions from the track', () => {
    const songA = mockSong({ id: 'v1', avgRating: 3.0 });
    const songB = mockSong({ id: 'v2', avgRating: 5.0 });
    const album = mockAlbum({
      tracks: [
        mockTrack({ id: 'multi', songs: [songA, songB] }),
      ],
    });
    const items = albumToQueueItems(album);
    expect(items[0].availableVersions).toEqual([songA, songB]);
  });

  it('returns empty array for album with no tracks', () => {
    const album = mockAlbum({ tracks: [] });
    const items = albumToQueueItems(album);
    expect(items).toHaveLength(0);
  });
});

describe('trackToQueueItem', () => {
  it('creates item with unique queueId and batchId', () => {
    const song = mockSong();
    const item = trackToQueueItem(song);
    expect(item.queueId).toMatch(/^q-/);
    expect(item.batchId).toMatch(/^batch-/);
  });

  it('creates items with different queueIds and batchIds each call', () => {
    const song = mockSong();
    const item1 = trackToQueueItem(song);
    const item2 = trackToQueueItem(song);
    expect(item1.queueId).not.toBe(item2.queueId);
    expect(item1.batchId).not.toBe(item2.batchId);
  });

  it('uses song.trackTitle for trackTitle', () => {
    const song = mockSong({ trackTitle: 'Eyes of the World' });
    const item = trackToQueueItem(song);
    expect(item.trackTitle).toBe('Eyes of the World');
  });

  it('falls back to song.title when trackTitle is empty', () => {
    const song = mockSong({ trackTitle: '', title: 'Fallback Title' });
    const item = trackToQueueItem(song);
    expect(item.trackTitle).toBe('Fallback Title');
  });

  it('sets albumSource to null when not provided', () => {
    const song = mockSong();
    const item = trackToQueueItem(song);
    expect(item.albumSource).toBeNull();
  });

  it('sets albumSource when provided', () => {
    const song = mockSong();
    const source = mockAlbumSource({ albumId: 'custom-album' });
    const item = trackToQueueItem(song, undefined, source);
    expect(item.albumSource).toBe(source);
    expect(item.albumSource!.albumId).toBe('custom-album');
  });

  it('sets source to { type: "add-to-queue" } with addedAt timestamp', () => {
    const before = Date.now();
    const song = mockSong();
    const item = trackToQueueItem(song);
    const after = Date.now();

    expect(item.source.type).toBe('add-to-queue');
    if (item.source.type === 'add-to-queue') {
      expect(item.source.addedAt).toBeGreaterThanOrEqual(before);
      expect(item.source.addedAt).toBeLessThanOrEqual(after);
    }
  });

  it('sets played to false', () => {
    const song = mockSong();
    const item = trackToQueueItem(song);
    expect(item.played).toBe(false);
  });

  it('sets availableVersions from track.songs when track is provided', () => {
    const songA = mockSong({ id: 'v1' });
    const songB = mockSong({ id: 'v2' });
    const track = mockTrack({ songs: [songA, songB] });
    const item = trackToQueueItem(songA, track);
    expect(item.availableVersions).toEqual([songA, songB]);
  });

  it('sets availableVersions to [song] when no track is provided', () => {
    const song = mockSong();
    const item = trackToQueueItem(song);
    expect(item.availableVersions).toEqual([song]);
  });

  it('uses track.slug for trackSlug when track is provided', () => {
    const song = mockSong();
    const track = mockTrack({ slug: 'custom-slug' });
    const item = trackToQueueItem(song, track);
    expect(item.trackSlug).toBe('custom-slug');
  });

  it('generates slugified trackSlug when no track is provided', () => {
    const song = mockSong({ trackTitle: 'Dark Star' });
    const item = trackToQueueItem(song);
    expect(item.trackSlug).toBe('dark-star');
  });

  it('stores the song reference', () => {
    const song = mockSong({ id: 'my-song' });
    const item = trackToQueueItem(song);
    expect(item.song).toBe(song);
  });
});

describe('computeAlbumGroups', () => {
  it('returns empty array when cursor is at end (no items after cursor)', () => {
    const items = [mockQueueItem(), mockQueueItem()];
    const groups = computeAlbumGroups(items, 1);
    expect(groups).toEqual([]);
  });

  it('returns empty array for empty items array', () => {
    const groups = computeAlbumGroups([], -1);
    expect(groups).toEqual([]);
  });

  it('returns empty array when cursorIndex equals items.length - 1', () => {
    const items = [mockQueueItem()];
    const groups = computeAlbumGroups(items, 0);
    expect(groups).toEqual([]);
  });

  it('groups consecutive items with same batchId', () => {
    const batchId = 'batch-shared';
    const items: QueueItem[] = [
      mockQueueItem({ batchId, albumSource: mockAlbumSource({ originalTrackIndex: 0 }) }),
      mockQueueItem({ batchId, albumSource: mockAlbumSource({ originalTrackIndex: 1 }) }),
      mockQueueItem({ batchId, albumSource: mockAlbumSource({ originalTrackIndex: 2 }) }),
    ];

    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(1);
    expect(groups[0].batchId).toBe(batchId);
    expect(groups[0].startIndex).toBe(0);
    expect(groups[0].endIndex).toBe(2);
    expect(groups[0].items).toHaveLength(3);
    expect(groups[0].isContinuation).toBe(false);
  });

  it('splits groups when different batchId is between them', () => {
    const batchA = 'batch-a';
    const batchB = 'batch-b';
    const items: QueueItem[] = [
      mockQueueItem({ batchId: batchA, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId: batchA, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId: batchB, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId: batchA, albumSource: mockAlbumSource() }),
    ];

    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(3);
    expect(groups[0].batchId).toBe(batchA);
    expect(groups[0].startIndex).toBe(0);
    expect(groups[0].endIndex).toBe(1);
    expect(groups[1].batchId).toBe(batchB);
    expect(groups[1].startIndex).toBe(2);
    expect(groups[1].endIndex).toBe(2);
    expect(groups[2].batchId).toBe(batchA);
    expect(groups[2].startIndex).toBe(3);
    expect(groups[2].endIndex).toBe(3);
  });

  it('marks continuation groups correctly (same batchId seen before cursor)', () => {
    const batchId = 'batch-continued';
    const items: QueueItem[] = [
      // Index 0: before cursor - establishes the batchId as "seen"
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
      // Index 1: after cursor - should be a continuation
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
    ];

    const groups = computeAlbumGroups(items, 0);
    expect(groups).toHaveLength(1);
    expect(groups[0].batchId).toBe(batchId);
    expect(groups[0].isContinuation).toBe(true);
    expect(groups[0].startIndex).toBe(1);
    expect(groups[0].endIndex).toBe(2);
  });

  it('marks non-continuation groups correctly (batchId not seen before cursor)', () => {
    const batchBefore = 'batch-before';
    const batchAfter = 'batch-after';
    const items: QueueItem[] = [
      mockQueueItem({ batchId: batchBefore, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId: batchAfter, albumSource: mockAlbumSource() }),
    ];

    const groups = computeAlbumGroups(items, 0);
    expect(groups).toHaveLength(1);
    expect(groups[0].batchId).toBe(batchAfter);
    expect(groups[0].isContinuation).toBe(false);
  });

  it('standalone items (no albumSource) break groups', () => {
    const batchId = 'batch-split';
    const items: QueueItem[] = [
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId, albumSource: null }), // standalone breaks group
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
    ];

    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(2);
    expect(groups[0].startIndex).toBe(0);
    expect(groups[0].endIndex).toBe(0);
    expect(groups[0].items).toHaveLength(1);
    expect(groups[1].startIndex).toBe(2);
    expect(groups[1].endIndex).toBe(2);
    expect(groups[1].items).toHaveLength(1);
  });

  it('handles items with albumSource but different batchIds as separate groups', () => {
    const items: QueueItem[] = [
      mockQueueItem({ batchId: 'batch-x', albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId: 'batch-y', albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId: 'batch-z', albumSource: mockAlbumSource() }),
    ];

    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(3);
    expect(groups[0].batchId).toBe('batch-x');
    expect(groups[1].batchId).toBe('batch-y');
    expect(groups[2].batchId).toBe('batch-z');
  });

  it('only considers items after cursorIndex', () => {
    const batchId = 'batch-after';
    const items: QueueItem[] = [
      mockQueueItem({ batchId: 'batch-before-1', albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId: 'batch-before-2', albumSource: mockAlbumSource() }),
      // cursor at index 1, so groups start from index 2
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
    ];

    const groups = computeAlbumGroups(items, 1);
    expect(groups).toHaveLength(1);
    expect(groups[0].startIndex).toBe(2);
    expect(groups[0].endIndex).toBe(3);
  });

  it('uses albumSource from first item in group', () => {
    const batchId = 'batch-src';
    const source1 = mockAlbumSource({ originalTrackIndex: 0 });
    const source2 = mockAlbumSource({ originalTrackIndex: 1 });
    const items: QueueItem[] = [
      mockQueueItem({ batchId, albumSource: source1 }),
      mockQueueItem({ batchId, albumSource: source2 }),
    ];

    const groups = computeAlbumGroups(items, -1);
    expect(groups[0].albumSource).toBe(source1);
  });

  it('marks second occurrence of a batchId after cursor as continuation when first was also after cursor', () => {
    // If batchId first appears after the cursor (not continuation),
    // then a standalone breaks it, then the same batchId appears again,
    // the second occurrence should be marked as continuation.
    const batchId = 'batch-reappear';
    const items: QueueItem[] = [
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId: 'other', albumSource: null }), // standalone break
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
    ];

    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(2);
    expect(groups[0].isContinuation).toBe(false);
    expect(groups[1].isContinuation).toBe(true);
  });

  it('handles cursorIndex of -1 (nothing played yet)', () => {
    const batchId = 'batch-fresh';
    const items: QueueItem[] = [
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
    ];

    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(1);
    expect(groups[0].startIndex).toBe(0);
    expect(groups[0].endIndex).toBe(1);
    expect(groups[0].isContinuation).toBe(false);
  });

  it('handles mixed standalone and album items', () => {
    const batchId = 'batch-album';
    const items: QueueItem[] = [
      mockQueueItem({ batchId: 'standalone-1', albumSource: null }),
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
      mockQueueItem({ batchId: 'standalone-2', albumSource: null }),
      mockQueueItem({ batchId, albumSource: mockAlbumSource() }),
    ];

    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(2);
    expect(groups[0].startIndex).toBe(1);
    expect(groups[0].endIndex).toBe(2);
    expect(groups[0].isContinuation).toBe(false);
    expect(groups[1].startIndex).toBe(4);
    expect(groups[1].endIndex).toBe(4);
    expect(groups[1].isContinuation).toBe(true);
  });
});
