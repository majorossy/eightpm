import { describe, it, expect, beforeEach } from 'vitest';
import { queueReducer, QueueAction } from '@/context/QueueContext';
import {
  QueueItem,
  QueueItemAlbumSource,
  UnifiedQueue,
  initialQueueState,
  computeAlbumGroups,
  albumToQueueItems,
  trackToQueueItem,
} from '@/lib/queueTypes';
import { Song, Album, Track } from '@/lib/types';

// =============================================================================
// Test Helpers
// =============================================================================

let idCounter = 0;

beforeEach(() => {
  idCounter = 0;
});

function makeSong(overrides: Partial<Song> = {}): Song {
  idCounter++;
  return {
    id: `song-${idCounter}`,
    sku: `sku-${idCounter}`,
    title: `Song ${idCounter}`,
    artistId: 'artist-1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroad-earth',
    duration: 300,
    streamUrl: `https://example.com/song-${idCounter}.mp3`,
    albumArt: '',
    albumIdentifier: 're-2024-01-01',
    albumName: 'Railroad Earth 2024-01-01',
    trackTitle: `Song ${idCounter}`,
    ...overrides,
  };
}

function makeTrack(overrides: Partial<Track> = {}): Track {
  const song = makeSong();
  return {
    id: `track-${idCounter}`,
    title: song.title,
    slug: `track-${idCounter}`,
    albumIdentifier: 're-2024-01-01',
    albumName: 'Railroad Earth 2024-01-01',
    artistId: 'artist-1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroad-earth',
    songs: [song],
    totalDuration: 300,
    songCount: 1,
    ...overrides,
  };
}

function makeAlbum(overrides: Partial<Album> = {}): Album {
  const tracks = [
    makeTrack({ title: 'Bird in a House', slug: 'bird-in-a-house' }),
    makeTrack({ title: 'Elko', slug: 'elko' }),
    makeTrack({ title: 'Long Way to Go', slug: 'long-way-to-go' }),
  ];
  return {
    id: 'album-1',
    identifier: 're-2024-01-01',
    name: 'Railroad Earth 2024-01-01',
    slug: 're-2024-01-01',
    artistId: 'artist-1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroad-earth',
    showDate: '2024-01-01',
    showVenue: 'Red Rocks',
    showLocation: 'Morrison, CO',
    tracks,
    totalTracks: tracks.length,
    totalSongs: tracks.length,
    totalDuration: 900,
    coverArt: 'https://example.com/cover.jpg',
    ...overrides,
  };
}

function makeAlbumSource(
  overrides: Partial<QueueItemAlbumSource> = {},
): QueueItemAlbumSource {
  return {
    albumId: 'album-1',
    albumIdentifier: 're-2024-01-01',
    albumName: 'Railroad Earth 2024-01-01',
    artistSlug: 'railroad-earth',
    artistName: 'Railroad Earth',
    originalTrackIndex: 0,
    ...overrides,
  };
}

function makeQueueItem(overrides: Partial<QueueItem> = {}): QueueItem {
  idCounter++;
  const song = makeSong();
  return {
    queueId: `q-${idCounter}`,
    batchId: 'batch-default',
    song,
    trackTitle: song.trackTitle,
    trackSlug: `song-${idCounter}`,
    availableVersions: [song],
    albumSource: null,
    played: false,
    source: { type: 'album-load' as const },
    ...overrides,
  };
}

function makeAlbumItems(
  count: number,
  batchId: string,
): QueueItem[] {
  return Array.from({ length: count }, (_, i) => {
    const song = makeSong({
      title: `${batchId}-track-${i}`,
      trackTitle: `${batchId}-track-${i}`,
    });
    return makeQueueItem({
      queueId: `q-${batchId}-${i}`,
      batchId,
      song,
      trackTitle: song.trackTitle,
      trackSlug: `${batchId}-track-${i}`,
      albumSource: makeAlbumSource({
        originalTrackIndex: i,
        albumName: `Album ${batchId}`,
      }),
    });
  });
}

function runActions(
  initial: UnifiedQueue,
  actions: QueueAction[],
): UnifiedQueue {
  return actions.reduce(
    (state, action) => queueReducer(state, action),
    initial,
  );
}

// =============================================================================
// Integration Tests: Player-Queue Interactions
// =============================================================================

describe('Player-Queue Integration', () => {
  // ---------------------------------------------------------------------------
  // Scenario: clearQueue produces empty state (ghost playback fix)
  // ---------------------------------------------------------------------------
  describe('CLEAR_QUEUE stops playback', () => {
    it('clearing queue sets items to empty and cursor to -1', () => {
      const items = makeAlbumItems(5, 'batch-playing');
      const state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 2 },
        { type: 'MARK_PLAYED' },
      ]);

      expect(state.items).toHaveLength(5);
      expect(state.cursorIndex).toBe(2);
      expect(state.items[2].played).toBe(true);

      const cleared = queueReducer(state, { type: 'CLEAR_QUEUE' });

      expect(cleared.items).toHaveLength(0);
      expect(cleared.cursorIndex).toBe(-1);
      // Player should detect null currentItem and call audio.pause()
    });

    it('currentItem is null after CLEAR_QUEUE', () => {
      const items = makeAlbumItems(3, 'batch-clear');
      const state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 1 },
      ]);

      const cleared = queueReducer(state, { type: 'CLEAR_QUEUE' });

      // Simulate what QueueContext.currentItem computes
      const cursorIndex = cleared.cursorIndex;
      const currentItem =
        cursorIndex >= 0 && cursorIndex < cleared.items.length
          ? cleared.items[cursorIndex]
          : null;

      expect(currentItem).toBeNull();
    });

    it('CLEAR_QUEUE preserves repeat mode', () => {
      const items = makeAlbumItems(3, 'batch-rep');
      const state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
        { type: 'SET_REPEAT', mode: 'all' },
      ]);

      const cleared = queueReducer(state, { type: 'CLEAR_QUEUE' });

      expect(cleared.repeat).toBe('all');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Repeat mode cycling
  // ---------------------------------------------------------------------------
  describe('Repeat mode cycling', () => {
    it('repeat=all wraps cursor to 0 after last track', () => {
      const items = makeAlbumItems(3, 'batch-repeat');
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
        { type: 'SET_REPEAT', mode: 'all' },
      ]);

      // Play through all tracks
      state = runActions(state, [
        { type: 'MARK_PLAYED' },
        { type: 'ADVANCE_CURSOR' },
        { type: 'MARK_PLAYED' },
        { type: 'ADVANCE_CURSOR' },
        { type: 'MARK_PLAYED' },
        { type: 'ADVANCE_CURSOR' },
      ]);

      // Should wrap to 0
      expect(state.cursorIndex).toBe(0);
    });

    it('repeat=one keeps cursor at same position on advance', () => {
      const items = makeAlbumItems(3, 'batch-one');
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 1 },
        { type: 'SET_REPEAT', mode: 'one' },
      ]);

      // Advance should not change cursor
      state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
      expect(state.cursorIndex).toBe(1);

      // Even after multiple advances
      state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
      state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
      expect(state.cursorIndex).toBe(1);
    });

    it('repeat=off goes past end when at last item', () => {
      const items = makeAlbumItems(3, 'batch-off');
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 2 },
      ]);

      state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
      expect(state.cursorIndex).toBe(3); // past end

      // currentItem should be null
      const currentItem =
        state.cursorIndex >= 0 && state.cursorIndex < state.items.length
          ? state.items[state.cursorIndex]
          : null;
      expect(currentItem).toBeNull();
    });

    it('repeat mode cycling: off -> all -> one -> off', () => {
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items: makeAlbumItems(3, 'batch-cycle'), cursorIndex: 0 },
      ]);

      expect(state.repeat).toBe('off');

      state = queueReducer(state, { type: 'SET_REPEAT', mode: 'all' });
      expect(state.repeat).toBe('all');

      state = queueReducer(state, { type: 'SET_REPEAT', mode: 'one' });
      expect(state.repeat).toBe('one');

      state = queueReducer(state, { type: 'SET_REPEAT', mode: 'off' });
      expect(state.repeat).toBe('off');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Album playback workflow
  // ---------------------------------------------------------------------------
  describe('Album playback workflow', () => {
    it('albumToQueueItems creates correct items for album play', () => {
      const album = makeAlbum();
      const items = albumToQueueItems(album);

      expect(items).toHaveLength(3);
      // All items share same batchId
      const batchIds = new Set(items.map((i) => i.batchId));
      expect(batchIds.size).toBe(1);

      // Each has albumSource
      for (const item of items) {
        expect(item.albumSource).not.toBeNull();
        expect(item.albumSource!.albumName).toBe('Railroad Earth 2024-01-01');
        expect(item.albumSource!.artistSlug).toBe('railroad-earth');
      }

      // originalTrackIndex is sequential
      expect(items[0].albumSource!.originalTrackIndex).toBe(0);
      expect(items[1].albumSource!.originalTrackIndex).toBe(1);
      expect(items[2].albumSource!.originalTrackIndex).toBe(2);
    });

    it('LOAD_ITEMS with albumToQueueItems creates playable state', () => {
      const album = makeAlbum();
      const items = albumToQueueItems(album);

      const state = queueReducer(initialQueueState, {
        type: 'LOAD_ITEMS',
        items,
        cursorIndex: 0,
      });

      expect(state.items).toHaveLength(3);
      expect(state.cursorIndex).toBe(0);

      // currentItem should be first track
      const currentItem = state.items[state.cursorIndex];
      expect(currentItem).toBeDefined();
      expect(currentItem.albumSource!.originalTrackIndex).toBe(0);
    });

    it('play album from specific track index', () => {
      const album = makeAlbum();
      const items = albumToQueueItems(album);

      // Start from track 2 (index 2)
      const state = queueReducer(initialQueueState, {
        type: 'LOAD_ITEMS',
        items,
        cursorIndex: 2,
      });

      expect(state.cursorIndex).toBe(2);
      const currentItem = state.items[state.cursorIndex];
      expect(currentItem.albumSource!.originalTrackIndex).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Play next + add to queue
  // ---------------------------------------------------------------------------
  describe('Play next + add to queue', () => {
    it('play-next inserts after cursor, add-to-queue appends', () => {
      const albumTracks = makeAlbumItems(3, 'batch-main');
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items: albumTracks, cursorIndex: 1 },
      ]);

      // Play-next: inserts after cursor (index 1 -> position 2)
      const playNextSong = makeSong({ title: 'Play Next Track' });
      const playNextItem = makeQueueItem({
        queueId: 'q-play-next',
        song: playNextSong,
        trackTitle: 'Play Next Track',
      });
      state = queueReducer(state, {
        type: 'INSERT_AFTER_CURSOR',
        items: playNextItem,
      });

      expect(state.items[2].queueId).toBe('q-play-next');
      expect(state.cursorIndex).toBe(1); // unchanged

      // Add to queue: appends to end
      const addQueueSong = makeSong({ title: 'Added Track' });
      const addQueueItem = makeQueueItem({
        queueId: 'q-add-queue',
        song: addQueueSong,
        trackTitle: 'Added Track',
      });
      state = queueReducer(state, {
        type: 'APPEND_ITEMS',
        items: addQueueItem,
      });

      expect(state.items[state.items.length - 1].queueId).toBe('q-add-queue');
      expect(state.cursorIndex).toBe(1); // still unchanged
      expect(state.items).toHaveLength(5);
    });

    it('multiple play-next stacks in LIFO order', () => {
      const albumTracks = makeAlbumItems(3, 'batch-main');
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items: albumTracks, cursorIndex: 0 },
      ]);

      // Play-next first song
      const first = makeQueueItem({ queueId: 'q-first' });
      state = queueReducer(state, {
        type: 'INSERT_AFTER_CURSOR',
        items: first,
      });

      // Play-next second song (should go before first)
      const second = makeQueueItem({ queueId: 'q-second' });
      state = queueReducer(state, {
        type: 'INSERT_AFTER_CURSOR',
        items: second,
      });

      // Order after cursor: second, first, then rest of album
      expect(state.items[1].queueId).toBe('q-second');
      expect(state.items[2].queueId).toBe('q-first');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Version selection during playback
  // ---------------------------------------------------------------------------
  describe('Version selection during playback', () => {
    it('can change version of upcoming (unplayed) item', () => {
      const items = makeAlbumItems(3, 'batch-ver');
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
        { type: 'MARK_PLAYED' },
      ]);

      // Item at index 1 is unplayed
      expect(state.items[1].played).toBe(false);

      const newSong = makeSong({ id: 'alt-version', title: 'Alt Recording' });
      state = queueReducer(state, {
        type: 'SELECT_VERSION',
        queueId: items[1].queueId,
        song: newSong,
      });

      expect(state.items[1].song.id).toBe('alt-version');
    });

    it('cannot change version of played item', () => {
      const items = makeAlbumItems(3, 'batch-ver-played');
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
        { type: 'MARK_PLAYED' },
      ]);

      // Item 0 is played
      expect(state.items[0].played).toBe(true);

      const newSong = makeSong({ id: 'rejected', title: 'Rejected' });
      const result = queueReducer(state, {
        type: 'SELECT_VERSION',
        queueId: items[0].queueId,
        song: newSong,
      });

      expect(result).toBe(state); // No change
    });

    it('RESET_PLAYED unlocks version changes', () => {
      const items = makeAlbumItems(3, 'batch-ver-reset');
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
        { type: 'MARK_PLAYED' },
        { type: 'ADVANCE_CURSOR' },
        { type: 'MARK_PLAYED' },
      ]);

      // Both items 0 and 1 are played
      expect(state.items[0].played).toBe(true);
      expect(state.items[1].played).toBe(true);

      // Reset
      state = queueReducer(state, { type: 'RESET_PLAYED' });
      expect(state.items.every((i) => !i.played)).toBe(true);

      // Now version change should work on item 0
      const newSong = makeSong({ id: 'unlocked', title: 'Unlocked' });
      state = queueReducer(state, {
        type: 'SELECT_VERSION',
        queueId: items[0].queueId,
        song: newSong,
      });

      expect(state.items[0].song.id).toBe('unlocked');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Full playthrough workflow
  // ---------------------------------------------------------------------------
  describe('Full playthrough workflow', () => {
    it('play album -> advance through all tracks -> repeat-all wraps', () => {
      const album = makeAlbum();
      const items = albumToQueueItems(album);

      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
        { type: 'SET_REPEAT', mode: 'all' },
      ]);

      // Simulate player: mark played, advance
      const playedIds: string[] = [];

      for (let i = 0; i < 6; i++) {
        // 6 advances = 2 full loops
        const currentItem =
          state.cursorIndex >= 0 && state.cursorIndex < state.items.length
            ? state.items[state.cursorIndex]
            : null;

        if (currentItem) {
          playedIds.push(currentItem.song.id);
          state = queueReducer(state, { type: 'MARK_PLAYED' });
          state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
        }
      }

      // Should have played 6 tracks (2 full loops of 3)
      expect(playedIds).toHaveLength(6);
      // Cursor should be at position 0 (after 6 advances from 0, repeat=all, 3 items)
      expect(state.cursorIndex).toBe(0);
    });

    it('play album -> remove current -> next plays', () => {
      const items = makeAlbumItems(4, 'batch-remove-play');
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 1 },
      ]);

      const nextItemId = state.items[2].queueId;

      // Remove current item
      state = queueReducer(state, {
        type: 'REMOVE_ITEM',
        queueId: items[1].queueId,
      });

      // Cursor stays at 1, which now points to what was previously index 2
      expect(state.cursorIndex).toBe(1);
      expect(state.items[state.cursorIndex].queueId).toBe(nextItemId);
    });

    it('CLEAR_UPCOMING while playing keeps current and history', () => {
      const items = makeAlbumItems(5, 'batch-clear-up');
      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items, cursorIndex: 2 },
      ]);

      state = queueReducer(state, { type: 'CLEAR_UPCOMING' });

      // Items 0, 1, 2 remain
      expect(state.items).toHaveLength(3);
      expect(state.cursorIndex).toBe(2);
      // No items after cursor
      expect(state.items.length - 1).toBe(state.cursorIndex);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: peekNext logic (tested via state inspection)
  // ---------------------------------------------------------------------------
  describe('peekNext behavior', () => {
    function peekNext(q: UnifiedQueue): QueueItem | null {
      if (q.items.length === 0) return null;
      if (q.repeat === 'one') {
        if (q.cursorIndex >= 0 && q.cursorIndex < q.items.length) {
          return q.items[q.cursorIndex];
        }
        return null;
      }
      const nextIdx = q.cursorIndex + 1;
      if (nextIdx < q.items.length) {
        return q.items[nextIdx];
      }
      if (q.repeat === 'all' && q.items.length > 0) {
        return q.items[0];
      }
      return null;
    }

    it('peekNext returns next item in normal mode', () => {
      const items = makeAlbumItems(3, 'batch-peek');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const next = peekNext(state);
      expect(next).not.toBeNull();
      expect(next!.queueId).toBe(items[1].queueId);
    });

    it('peekNext returns null at end with repeat=off', () => {
      const items = makeAlbumItems(3, 'batch-peek-end');
      const state: UnifiedQueue = { items, cursorIndex: 2, repeat: 'off' };

      const next = peekNext(state);
      expect(next).toBeNull();
    });

    it('peekNext wraps to first with repeat=all', () => {
      const items = makeAlbumItems(3, 'batch-peek-wrap');
      const state: UnifiedQueue = { items, cursorIndex: 2, repeat: 'all' };

      const next = peekNext(state);
      expect(next).not.toBeNull();
      expect(next!.queueId).toBe(items[0].queueId);
    });

    it('peekNext returns same item with repeat=one', () => {
      const items = makeAlbumItems(3, 'batch-peek-one');
      const state: UnifiedQueue = { items, cursorIndex: 1, repeat: 'one' };

      const next = peekNext(state);
      expect(next).not.toBeNull();
      expect(next!.queueId).toBe(items[1].queueId);
    });

    it('peekNext returns null for empty queue', () => {
      const next = peekNext(initialQueueState);
      expect(next).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Mixed album + standalone items
  // ---------------------------------------------------------------------------
  describe('Mixed album and standalone items', () => {
    it('interleaving album tracks with standalone tracks', () => {
      const albumItems = makeAlbumItems(3, 'batch-album');
      const standalone1 = makeQueueItem({
        queueId: 'q-standalone-1',
        batchId: 'batch-s1',
        albumSource: null,
      });
      const standalone2 = makeQueueItem({
        queueId: 'q-standalone-2',
        batchId: 'batch-s2',
        albumSource: null,
      });

      let state = runActions(initialQueueState, [
        { type: 'LOAD_ITEMS', items: albumItems, cursorIndex: 0 },
      ]);

      // Insert standalone after current
      state = queueReducer(state, {
        type: 'INSERT_AFTER_CURSOR',
        items: standalone1,
      });

      // Append another standalone
      state = queueReducer(state, {
        type: 'APPEND_ITEMS',
        items: standalone2,
      });

      // Total: 5 items (3 album + 2 standalone)
      expect(state.items).toHaveLength(5);

      // Album groups should reflect the split
      const groups = computeAlbumGroups(state.items, state.cursorIndex);

      // After cursor (index 0), we have:
      // index 1: standalone1 (no albumSource, breaks group)
      // index 2-3: album tracks (batch-album, continuation)
      // index 4: standalone2 (no albumSource)
      // So there should be 1 album group (items 2-3)
      expect(groups.length).toBe(1);
      expect(groups[0].batchId).toBe('batch-album');
      expect(groups[0].isContinuation).toBe(true);
    });

    it('trackToQueueItem creates standalone items', () => {
      const song = makeSong({ title: 'Standalone Song' });
      const item = trackToQueueItem(song);

      expect(item.albumSource).toBeNull();
      expect(item.source.type).toBe('add-to-queue');
      expect(item.availableVersions).toEqual([song]);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Queue state computed values
  // ---------------------------------------------------------------------------
  describe('Computed values from queue state', () => {
    it('isLastItem is true when cursor is at last position', () => {
      const items = makeAlbumItems(3, 'batch-last');
      const state: UnifiedQueue = { items, cursorIndex: 2, repeat: 'off' };

      const isLastItem = state.cursorIndex >= 0 && state.cursorIndex >= state.items.length - 1;
      expect(isLastItem).toBe(true);
    });

    it('isFirstItem is true when cursor is at 0', () => {
      const items = makeAlbumItems(3, 'batch-first');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const isFirstItem = state.cursorIndex <= 0;
      expect(isFirstItem).toBe(true);
    });

    it('isFirstItem is true when cursor is -1', () => {
      const isFirstItem = initialQueueState.cursorIndex <= 0;
      expect(isFirstItem).toBe(true);
    });

    it('hasItems is false for empty queue', () => {
      const hasItems = initialQueueState.items.length > 0;
      expect(hasItems).toBe(false);
    });

    it('hasItems is true for non-empty queue', () => {
      const items = makeAlbumItems(1, 'batch-has');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };
      const hasItems = state.items.length > 0;
      expect(hasItems).toBe(true);
    });

    it('totalItems reflects queue length', () => {
      const items = makeAlbumItems(7, 'batch-total');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };
      expect(state.items.length).toBe(7);
    });
  });
});
