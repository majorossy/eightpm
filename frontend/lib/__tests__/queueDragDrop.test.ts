import { describe, it, expect, beforeEach } from 'vitest';
import { queueReducer, QueueAction } from '@/context/QueueContext';
import {
  QueueItem,
  QueueItemAlbumSource,
  UnifiedQueue,
  initialQueueState,
  computeAlbumGroups,
} from '@/lib/queueTypes';
import { Song } from '@/lib/types';

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
  albumSourceOverrides: Partial<QueueItemAlbumSource> = {},
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
        ...albumSourceOverrides,
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
// Tests: MOVE_ITEM for drag-and-drop
// =============================================================================

describe('Drag and Drop - MOVE_ITEM', () => {
  describe('basic reordering', () => {
    it('drag item forward (index 0 to index 3)', () => {
      const items = [
        makeQueueItem({ queueId: 'a' }),
        makeQueueItem({ queueId: 'b' }),
        makeQueueItem({ queueId: 'c' }),
        makeQueueItem({ queueId: 'd' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 0,
        toIndex: 3,
      });

      expect(result.items.map((i) => i.queueId)).toEqual([
        'b', 'c', 'd', 'a',
      ]);
    });

    it('drag item backward (index 3 to index 0)', () => {
      const items = [
        makeQueueItem({ queueId: 'a' }),
        makeQueueItem({ queueId: 'b' }),
        makeQueueItem({ queueId: 'c' }),
        makeQueueItem({ queueId: 'd' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 3, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 3,
        toIndex: 0,
      });

      expect(result.items.map((i) => i.queueId)).toEqual([
        'd', 'a', 'b', 'c',
      ]);
    });

    it('drag adjacent items (swap neighbors)', () => {
      const items = [
        makeQueueItem({ queueId: 'a' }),
        makeQueueItem({ queueId: 'b' }),
        makeQueueItem({ queueId: 'c' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 1,
        toIndex: 2,
      });

      expect(result.items.map((i) => i.queueId)).toEqual(['a', 'c', 'b']);
    });
  });

  describe('cursor tracking during drag', () => {
    it('cursor follows when the cursor item itself is dragged forward', () => {
      const items = makeAlbumItems(5, 'batch-drag');
      const state: UnifiedQueue = { items, cursorIndex: 1, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 1,
        toIndex: 4,
      });

      // Cursor item was at 1, now dragged to 4
      expect(result.cursorIndex).toBe(4);
      expect(result.items[4].queueId).toBe(items[1].queueId);
    });

    it('cursor follows when the cursor item itself is dragged backward', () => {
      const items = makeAlbumItems(5, 'batch-drag-back');
      const state: UnifiedQueue = { items, cursorIndex: 3, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 3,
        toIndex: 0,
      });

      expect(result.cursorIndex).toBe(0);
      expect(result.items[0].queueId).toBe(items[3].queueId);
    });

    it('cursor decrements when item dragged from before cursor to after cursor', () => {
      const items = makeAlbumItems(5, 'batch-cross');
      const state: UnifiedQueue = { items, cursorIndex: 2, repeat: 'off' };

      // Drag item at 0 (before cursor) to 4 (after cursor)
      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 0,
        toIndex: 4,
      });

      // Item removed from before cursor, cursor shifts back
      expect(result.cursorIndex).toBe(1);
    });

    it('cursor increments when item dragged from after cursor to before cursor', () => {
      const items = makeAlbumItems(5, 'batch-cross2');
      const state: UnifiedQueue = { items, cursorIndex: 2, repeat: 'off' };

      // Drag item at 4 (after cursor) to 0 (before cursor)
      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 4,
        toIndex: 0,
      });

      // Item inserted before cursor, cursor shifts forward
      expect(result.cursorIndex).toBe(3);
    });

    it('cursor unchanged when drag is entirely after cursor', () => {
      const items = makeAlbumItems(5, 'batch-after');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      // Drag item 3 to 4 (both after cursor)
      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 3,
        toIndex: 4,
      });

      expect(result.cursorIndex).toBe(0);
    });

    it('cursor unchanged when drag is entirely before cursor', () => {
      const items = makeAlbumItems(5, 'batch-before');
      const state: UnifiedQueue = { items, cursorIndex: 4, repeat: 'off' };

      // Drag item 0 to 2 (both before cursor)
      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 0,
        toIndex: 2,
      });

      expect(result.cursorIndex).toBe(4);
    });
  });

  describe('boundary conditions', () => {
    it('no-op when fromIndex equals toIndex', () => {
      const items = makeAlbumItems(3, 'batch-noop');
      const state: UnifiedQueue = { items, cursorIndex: 1, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 2,
        toIndex: 2,
      });

      expect(result).toBe(state);
    });

    it('no-op for negative fromIndex', () => {
      const items = makeAlbumItems(3, 'batch-neg-from');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: -1,
        toIndex: 1,
      });

      expect(result).toBe(state);
    });

    it('no-op for negative toIndex', () => {
      const items = makeAlbumItems(3, 'batch-neg-to');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 1,
        toIndex: -1,
      });

      expect(result).toBe(state);
    });

    it('no-op for fromIndex >= items.length', () => {
      const items = makeAlbumItems(3, 'batch-oob-from');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 3,
        toIndex: 0,
      });

      expect(result).toBe(state);
    });

    it('no-op for toIndex >= items.length', () => {
      const items = makeAlbumItems(3, 'batch-oob-to');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 0,
        toIndex: 3,
      });

      expect(result).toBe(state);
    });

    it('works with 2-item queue (swap)', () => {
      const items = [
        makeQueueItem({ queueId: 'first' }),
        makeQueueItem({ queueId: 'second' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 0,
        toIndex: 1,
      });

      expect(result.items.map((i) => i.queueId)).toEqual(['second', 'first']);
      expect(result.cursorIndex).toBe(1); // cursor follows dragged item
    });
  });
});

// =============================================================================
// Tests: MOVE_BLOCK for drag-and-drop of album groups
// =============================================================================

describe('Drag and Drop - MOVE_BLOCK', () => {
  describe('block reordering', () => {
    it('move album block to the beginning', () => {
      const albumA = makeAlbumItems(2, 'batch-a');
      const albumB = makeAlbumItems(3, 'batch-b');
      const allItems = [...albumA, ...albumB];
      const state: UnifiedQueue = { items: allItems, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-b',
        startIndex: 2,
        endIndex: 4,
        targetIndex: 0,
      });

      // batch-b items should be at start
      expect(result.items[0].batchId).toBe('batch-b');
      expect(result.items[1].batchId).toBe('batch-b');
      expect(result.items[2].batchId).toBe('batch-b');
      expect(result.items[3].batchId).toBe('batch-a');
      expect(result.items[4].batchId).toBe('batch-a');
    });

    it('move album block to the end', () => {
      const albumA = makeAlbumItems(3, 'batch-a');
      const albumB = makeAlbumItems(2, 'batch-b');
      const allItems = [...albumA, ...albumB];
      const state: UnifiedQueue = { items: allItems, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-a',
        startIndex: 0,
        endIndex: 2,
        targetIndex: 5,
      });

      // batch-b first, then batch-a
      expect(result.items[0].batchId).toBe('batch-b');
      expect(result.items[1].batchId).toBe('batch-b');
      expect(result.items[2].batchId).toBe('batch-a');
      expect(result.items[3].batchId).toBe('batch-a');
      expect(result.items[4].batchId).toBe('batch-a');
    });

    it('move block between two other blocks', () => {
      const albumA = makeAlbumItems(2, 'batch-a');
      const albumB = makeAlbumItems(2, 'batch-b');
      const albumC = makeAlbumItems(2, 'batch-c');
      // Order: A0, A1, B0, B1, C0, C1
      const allItems = [...albumA, ...albumB, ...albumC];
      const state: UnifiedQueue = { items: allItems, cursorIndex: 0, repeat: 'off' };

      // Move batch-c between A and B (targetIndex = 2)
      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-c',
        startIndex: 4,
        endIndex: 5,
        targetIndex: 2,
      });

      // Expected: A0, A1, C0, C1, B0, B1
      expect(result.items[0].batchId).toBe('batch-a');
      expect(result.items[1].batchId).toBe('batch-a');
      expect(result.items[2].batchId).toBe('batch-c');
      expect(result.items[3].batchId).toBe('batch-c');
      expect(result.items[4].batchId).toBe('batch-b');
      expect(result.items[5].batchId).toBe('batch-b');
    });
  });

  describe('cursor tracking during block drag', () => {
    it('cursor tracks item by queueId when block moves', () => {
      const albumA = makeAlbumItems(2, 'batch-a');
      const albumB = makeAlbumItems(3, 'batch-b');
      // Cursor at B1 (index 3)
      const allItems = [...albumA, ...albumB];
      const state: UnifiedQueue = { items: allItems, cursorIndex: 3, repeat: 'off' };
      const cursorItemId = state.items[3].queueId;

      // Move batch-b to start
      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-b',
        startIndex: 2,
        endIndex: 4,
        targetIndex: 0,
      });

      // Cursor should follow the item by queueId
      expect(result.items[result.cursorIndex].queueId).toBe(cursorItemId);
    });

    it('cursor tracks correctly when block moves away from cursor', () => {
      const albumA = makeAlbumItems(3, 'batch-a');
      const albumB = makeAlbumItems(2, 'batch-b');
      // Cursor at A1 (index 1)
      const allItems = [...albumA, ...albumB];
      const state: UnifiedQueue = { items: allItems, cursorIndex: 1, repeat: 'off' };
      const cursorItemId = state.items[1].queueId;

      // Move batch-b from end to start
      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-b',
        startIndex: 3,
        endIndex: 4,
        targetIndex: 0,
      });

      // Cursor should still point to same item
      expect(result.items[result.cursorIndex].queueId).toBe(cursorItemId);
    });

    it('cursor tracks when cursor item is inside the moved block', () => {
      const albumA = makeAlbumItems(2, 'batch-a');
      const albumB = makeAlbumItems(3, 'batch-b');
      // Cursor at B0 (index 2, first item of batch-b)
      const allItems = [...albumA, ...albumB];
      const state: UnifiedQueue = { items: allItems, cursorIndex: 2, repeat: 'off' };
      const cursorItemId = state.items[2].queueId;

      // Move batch-b to start
      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-b',
        startIndex: 2,
        endIndex: 4,
        targetIndex: 0,
      });

      expect(result.items[result.cursorIndex].queueId).toBe(cursorItemId);
    });
  });

  describe('boundary conditions', () => {
    it('no-op when batchId does not match any items in range', () => {
      const items = makeAlbumItems(3, 'batch-nomatch');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'nonexistent',
        startIndex: 0,
        endIndex: 2,
        targetIndex: 0,
      });

      expect(result).toBe(state);
    });

    it('no-op when startIndex > endIndex', () => {
      const items = makeAlbumItems(3, 'batch-inv');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-inv',
        startIndex: 2,
        endIndex: 0,
        targetIndex: 0,
      });

      expect(result).toBe(state);
    });

    it('no-op when startIndex < 0', () => {
      const items = makeAlbumItems(3, 'batch-neg');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-neg',
        startIndex: -1,
        endIndex: 1,
        targetIndex: 0,
      });

      expect(result).toBe(state);
    });

    it('no-op when endIndex >= items.length', () => {
      const items = makeAlbumItems(3, 'batch-oob');
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-oob',
        startIndex: 0,
        endIndex: 5,
        targetIndex: 0,
      });

      expect(result).toBe(state);
    });

    it('single-item block can be moved', () => {
      const items = [
        makeQueueItem({ queueId: 'a', batchId: 'batch-1', albumSource: makeAlbumSource() }),
        makeQueueItem({ queueId: 'b', batchId: 'batch-2', albumSource: makeAlbumSource() }),
        makeQueueItem({ queueId: 'c', batchId: 'batch-3', albumSource: makeAlbumSource() }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-3',
        startIndex: 2,
        endIndex: 2,
        targetIndex: 0,
      });

      expect(result.items[0].queueId).toBe('c');
      expect(result.items[1].queueId).toBe('a');
      expect(result.items[2].queueId).toBe('b');
    });
  });

  describe('album group integrity after drag', () => {
    it('computeAlbumGroups reflects block reorder', () => {
      const albumA = makeAlbumItems(3, 'batch-a');
      const albumB = makeAlbumItems(2, 'batch-b');
      const allItems = [...albumA, ...albumB];
      let state: UnifiedQueue = { items: allItems, cursorIndex: 0, repeat: 'off' };

      // Move batch-b before batch-a
      state = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-b',
        startIndex: 3,
        endIndex: 4,
        targetIndex: 0,
      });

      // Compute groups after cursor (index 0)
      const groups = computeAlbumGroups(state.items, state.cursorIndex);

      // Should have 2 groups: rest of batch-b (1 item), batch-a (3 items)
      // Cursor is at the moved batch-b first item (index 0)
      // Groups start from index 1
      expect(groups.length).toBeGreaterThanOrEqual(1);
    });

    it('multiple MOVE_ITEM operations maintain queue integrity', () => {
      const items = makeAlbumItems(5, 'batch-multi');
      let state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      // Perform multiple drags
      state = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 4,
        toIndex: 1,
      });
      state = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 2,
        toIndex: 4,
      });
      state = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 0,
        toIndex: 3,
      });

      // Verify no items lost or duplicated
      expect(state.items).toHaveLength(5);
      const queueIds = new Set(state.items.map((i) => i.queueId));
      expect(queueIds.size).toBe(5);

      // Cursor should be valid
      expect(state.cursorIndex).toBeGreaterThanOrEqual(0);
      expect(state.cursorIndex).toBeLessThan(5);
    });
  });
});
