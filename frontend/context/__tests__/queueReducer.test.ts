import { describe, it, expect, beforeEach } from 'vitest';
import { queueReducer, QueueAction } from '@/context/QueueContext';
import { QueueItem, UnifiedQueue, initialQueueState } from '@/lib/queueTypes';
import { Song } from '@/lib/types';

// =============================================================================
// Test Helpers
// =============================================================================

let counter = 0;

beforeEach(() => {
  counter = 0;
});

const mockSong = (overrides?: Partial<Song>): Song => ({
  id: `song-${++counter}`,
  sku: `sku-${counter}`,
  title: `Song ${counter}`,
  duration: 300,
  artistName: 'Test Artist',
  artistSlug: 'test-artist',
  artistId: 'a1',
  albumName: 'Test Album',
  albumIdentifier: 'album-1',
  streamUrl: `https://example.com/song-${counter}.mp3`,
  albumArt: 'cover.jpg',
  trackTitle: `Track ${counter}`,
  avgRating: 4.0,
  ...overrides,
});

const mockItem = (overrides?: Partial<QueueItem>): QueueItem => {
  const song = mockSong();
  return {
    queueId: `q-${counter}`,
    batchId: 'batch-default',
    song,
    trackTitle: song.title,
    trackSlug: `track-${counter}`,
    availableVersions: [song],
    albumSource: null,
    played: false,
    source: { type: 'album-load' as const },
    ...overrides,
  };
};

const mockAlbumSource = (overrides?: Record<string, unknown>) => ({
  albumId: 'album-1',
  albumIdentifier: 'gd1969',
  albumName: 'Live at Fillmore',
  artistSlug: 'gd',
  artistName: 'Grateful Dead',
  coverArt: 'cover.jpg',
  showDate: '1969-01-01',
  showVenue: 'Fillmore',
  showLocation: 'SF, CA',
  originalTrackIndex: 0,
  ...overrides,
});

/** Build a state with N items. Cursor defaults to 0. */
function makeState(
  count: number,
  overrides?: Partial<UnifiedQueue>,
  itemOverrides?: Partial<QueueItem>,
): UnifiedQueue {
  const items: QueueItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push(mockItem(itemOverrides));
  }
  return {
    items,
    cursorIndex: count > 0 ? 0 : -1,
    repeat: 'off',
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('queueReducer', () => {
  // ---------------------------------------------------------------------------
  // LOAD_ITEMS
  // ---------------------------------------------------------------------------
  describe('LOAD_ITEMS', () => {
    it('replaces queue items and sets cursor', () => {
      const items = [mockItem(), mockItem(), mockItem()];
      const result = queueReducer(initialQueueState, {
        type: 'LOAD_ITEMS',
        items,
        cursorIndex: 1,
      });

      expect(result.items).toEqual(items);
      expect(result.cursorIndex).toBe(1);
    });

    it('preserves existing repeat mode', () => {
      const state: UnifiedQueue = {
        items: [],
        cursorIndex: -1,
        repeat: 'all',
      };
      const items = [mockItem()];
      const result = queueReducer(state, {
        type: 'LOAD_ITEMS',
        items,
        cursorIndex: 0,
      });

      expect(result.repeat).toBe('all');
    });

    it('replaces previous items entirely', () => {
      const oldItems = [mockItem(), mockItem()];
      const state: UnifiedQueue = {
        items: oldItems,
        cursorIndex: 0,
        repeat: 'off',
      };
      const newItems = [mockItem()];
      const result = queueReducer(state, {
        type: 'LOAD_ITEMS',
        items: newItems,
        cursorIndex: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].queueId).toBe(newItems[0].queueId);
    });
  });

  // ---------------------------------------------------------------------------
  // INSERT_AFTER_CURSOR
  // ---------------------------------------------------------------------------
  describe('INSERT_AFTER_CURSOR', () => {
    it('inserts a single item after cursor', () => {
      const state = makeState(3, { cursorIndex: 1 });
      const newItem = mockItem({ queueId: 'inserted' });

      const result = queueReducer(state, {
        type: 'INSERT_AFTER_CURSOR',
        items: newItem,
      });

      expect(result.items).toHaveLength(4);
      expect(result.items[2].queueId).toBe('inserted');
      expect(result.cursorIndex).toBe(1); // cursor unchanged
    });

    it('inserts multiple items after cursor', () => {
      const state = makeState(3, { cursorIndex: 0 });
      const newItems = [
        mockItem({ queueId: 'ins-1' }),
        mockItem({ queueId: 'ins-2' }),
      ];

      const result = queueReducer(state, {
        type: 'INSERT_AFTER_CURSOR',
        items: newItems,
      });

      expect(result.items).toHaveLength(5);
      expect(result.items[1].queueId).toBe('ins-1');
      expect(result.items[2].queueId).toBe('ins-2');
      expect(result.cursorIndex).toBe(0);
    });

    it('inserts at position 0 when cursor is -1 (empty queue)', () => {
      const state: UnifiedQueue = {
        items: [mockItem({ queueId: 'existing' })],
        cursorIndex: -1,
        repeat: 'off',
      };
      const newItem = mockItem({ queueId: 'inserted' });

      const result = queueReducer(state, {
        type: 'INSERT_AFTER_CURSOR',
        items: newItem,
      });

      // cursorIndex is -1, so insertAt = 0
      expect(result.items[0].queueId).toBe('inserted');
      expect(result.items[1].queueId).toBe('existing');
    });

    it('returns same state when inserting empty array', () => {
      const state = makeState(2);
      const result = queueReducer(state, {
        type: 'INSERT_AFTER_CURSOR',
        items: [],
      });

      expect(result).toBe(state);
    });

    it('inserts at end when cursor is at last position', () => {
      const state = makeState(3, { cursorIndex: 2 });
      const newItem = mockItem({ queueId: 'tail-insert' });

      const result = queueReducer(state, {
        type: 'INSERT_AFTER_CURSOR',
        items: newItem,
      });

      expect(result.items).toHaveLength(4);
      expect(result.items[3].queueId).toBe('tail-insert');
    });
  });

  // ---------------------------------------------------------------------------
  // APPEND_ITEMS
  // ---------------------------------------------------------------------------
  describe('APPEND_ITEMS', () => {
    it('appends a single item to the end', () => {
      const state = makeState(2);
      const newItem = mockItem({ queueId: 'appended' });

      const result = queueReducer(state, {
        type: 'APPEND_ITEMS',
        items: newItem,
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[2].queueId).toBe('appended');
    });

    it('appends multiple items to the end', () => {
      const state = makeState(1);
      const newItems = [
        mockItem({ queueId: 'app-1' }),
        mockItem({ queueId: 'app-2' }),
      ];

      const result = queueReducer(state, {
        type: 'APPEND_ITEMS',
        items: newItems,
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[1].queueId).toBe('app-1');
      expect(result.items[2].queueId).toBe('app-2');
    });

    it('returns same state when appending empty array', () => {
      const state = makeState(2);
      const result = queueReducer(state, {
        type: 'APPEND_ITEMS',
        items: [],
      });

      expect(result).toBe(state);
    });

    it('appends to empty queue', () => {
      const newItem = mockItem({ queueId: 'first' });
      const result = queueReducer(initialQueueState, {
        type: 'APPEND_ITEMS',
        items: newItem,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].queueId).toBe('first');
    });

    it('does not change cursor', () => {
      const state = makeState(3, { cursorIndex: 1 });
      const result = queueReducer(state, {
        type: 'APPEND_ITEMS',
        items: mockItem(),
      });

      expect(result.cursorIndex).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // REMOVE_ITEM
  // ---------------------------------------------------------------------------
  describe('REMOVE_ITEM', () => {
    it('removes item by queueId', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'REMOVE_ITEM',
        queueId: 'b',
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((i) => i.queueId)).toEqual(['a', 'c']);
    });

    it('adjusts cursor when removing item before cursor', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 2, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'REMOVE_ITEM',
        queueId: 'a',
      });

      expect(result.cursorIndex).toBe(1);
    });

    it('clamps cursor when removing item AT cursor (last item)', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 2, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'REMOVE_ITEM',
        queueId: 'c',
      });

      // cursor was 2, now only 2 items remain (indices 0,1), so clamp to 1
      expect(result.cursorIndex).toBe(1);
    });

    it('keeps cursor when removing item AT cursor that is not the last', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 1, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'REMOVE_ITEM',
        queueId: 'b',
      });

      // cursor stays at 1 (now points to 'c')
      expect(result.cursorIndex).toBe(1);
      expect(result.items[1].queueId).toBe('c');
    });

    it('does not change cursor when removing item after cursor', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'REMOVE_ITEM',
        queueId: 'c',
      });

      expect(result.cursorIndex).toBe(0);
    });

    it('sets cursor to -1 when removing the last remaining item', () => {
      const items = [mockItem({ queueId: 'only' })];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'REMOVE_ITEM',
        queueId: 'only',
      });

      expect(result.items).toHaveLength(0);
      expect(result.cursorIndex).toBe(-1);
    });

    it('returns same state for unknown queueId', () => {
      const state = makeState(3);
      const result = queueReducer(state, {
        type: 'REMOVE_ITEM',
        queueId: 'nonexistent',
      });

      expect(result).toBe(state);
    });
  });

  // ---------------------------------------------------------------------------
  // MOVE_ITEM
  // ---------------------------------------------------------------------------
  describe('MOVE_ITEM', () => {
    it('moves item forward (lower index to higher)', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
        mockItem({ queueId: 'd' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 1,
        toIndex: 3,
      });

      expect(result.items.map((i) => i.queueId)).toEqual([
        'a',
        'c',
        'd',
        'b',
      ]);
    });

    it('moves item backward (higher index to lower)', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
        mockItem({ queueId: 'd' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 3,
        toIndex: 1,
      });

      expect(result.items.map((i) => i.queueId)).toEqual([
        'a',
        'd',
        'b',
        'c',
      ]);
    });

    it('cursor follows the currently-playing item when it is moved', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      // Move the cursor item (index 0) to index 2
      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 0,
        toIndex: 2,
      });

      expect(result.cursorIndex).toBe(2);
    });

    it('adjusts cursor when item moves from before to after cursor', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
        mockItem({ queueId: 'd' }),
      ];
      // cursor at 'b' (index 1)
      const state: UnifiedQueue = { items, cursorIndex: 1, repeat: 'off' };

      // Move 'a' (index 0, before cursor) to index 3 (after cursor)
      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 0,
        toIndex: 3,
      });

      // 'a' was before cursor, now it's after. Cursor shifts back by 1.
      expect(result.cursorIndex).toBe(0);
    });

    it('adjusts cursor when item moves from after to before cursor', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
        mockItem({ queueId: 'd' }),
      ];
      // cursor at 'b' (index 1)
      const state: UnifiedQueue = { items, cursorIndex: 1, repeat: 'off' };

      // Move 'd' (index 3, after cursor) to index 0 (before cursor)
      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 3,
        toIndex: 0,
      });

      // 'd' was after cursor, now it's before/at. Cursor shifts forward by 1.
      expect(result.cursorIndex).toBe(2);
    });

    it('returns same state when fromIndex === toIndex', () => {
      const state = makeState(3, { cursorIndex: 1 });
      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 1,
        toIndex: 1,
      });

      expect(result).toBe(state);
    });

    it('returns same state for out-of-bounds indices', () => {
      const state = makeState(3);
      const result = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: -1,
        toIndex: 2,
      });

      expect(result).toBe(state);

      const result2 = queueReducer(state, {
        type: 'MOVE_ITEM',
        fromIndex: 0,
        toIndex: 5,
      });

      expect(result2).toBe(state);
    });
  });

  // ---------------------------------------------------------------------------
  // MOVE_BLOCK
  // ---------------------------------------------------------------------------
  describe('MOVE_BLOCK', () => {
    it('moves a block of items sharing batchId to a new position', () => {
      const items = [
        mockItem({ queueId: 'x', batchId: 'other' }),
        mockItem({ queueId: 'a', batchId: 'block-1' }),
        mockItem({ queueId: 'b', batchId: 'block-1' }),
        mockItem({ queueId: 'y', batchId: 'other2' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      // Move block-1 items (indices 1-2) to target index 0
      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'block-1',
        startIndex: 1,
        endIndex: 2,
        targetIndex: 0,
      });

      // block items should be at the start now
      expect(result.items[0].queueId).toBe('a');
      expect(result.items[1].queueId).toBe('b');
    });

    it('cursor follows the currently-playing item', () => {
      const items = [
        mockItem({ queueId: 'cursor-item', batchId: 'other' }),
        mockItem({ queueId: 'a', batchId: 'block-1' }),
        mockItem({ queueId: 'b', batchId: 'block-1' }),
        mockItem({ queueId: 'z', batchId: 'other2' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      // Move block-1 to before cursor item
      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'block-1',
        startIndex: 1,
        endIndex: 2,
        targetIndex: 0,
      });

      // cursor should still point to 'cursor-item' (now at index 2)
      const cursorItem = result.items[result.cursorIndex];
      expect(cursorItem.queueId).toBe('cursor-item');
    });

    it('handles block at the start of the queue', () => {
      const items = [
        mockItem({ queueId: 'a', batchId: 'block-1' }),
        mockItem({ queueId: 'b', batchId: 'block-1' }),
        mockItem({ queueId: 'c', batchId: 'other' }),
        mockItem({ queueId: 'd', batchId: 'other2' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 2, repeat: 'off' };

      // Move block from start to end
      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'block-1',
        startIndex: 0,
        endIndex: 1,
        targetIndex: 4,
      });

      // c, d should be first, then a, b
      expect(result.items[0].queueId).toBe('c');
      expect(result.items[1].queueId).toBe('d');
      expect(result.items[2].queueId).toBe('a');
      expect(result.items[3].queueId).toBe('b');
    });

    it('handles block at the end of the queue', () => {
      const items = [
        mockItem({ queueId: 'c', batchId: 'other' }),
        mockItem({ queueId: 'd', batchId: 'other2' }),
        mockItem({ queueId: 'a', batchId: 'block-1' }),
        mockItem({ queueId: 'b', batchId: 'block-1' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      // Move block from end to start
      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'block-1',
        startIndex: 2,
        endIndex: 3,
        targetIndex: 0,
      });

      expect(result.items[0].queueId).toBe('a');
      expect(result.items[1].queueId).toBe('b');
      expect(result.items[2].queueId).toBe('c');
      expect(result.items[3].queueId).toBe('d');
    });

    it('returns same state for invalid range (startIndex > endIndex)', () => {
      const state = makeState(3);
      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-default',
        startIndex: 2,
        endIndex: 0,
        targetIndex: 0,
      });

      expect(result).toBe(state);
    });

    it('returns same state for out-of-bounds range', () => {
      const state = makeState(3);
      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'batch-default',
        startIndex: -1,
        endIndex: 2,
        targetIndex: 0,
      });

      expect(result).toBe(state);
    });

    it('returns same state when no items in range match batchId', () => {
      const items = [
        mockItem({ queueId: 'a', batchId: 'other' }),
        mockItem({ queueId: 'b', batchId: 'other' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'MOVE_BLOCK',
        batchId: 'nonexistent',
        startIndex: 0,
        endIndex: 1,
        targetIndex: 0,
      });

      expect(result).toBe(state);
    });
  });

  // ---------------------------------------------------------------------------
  // SET_CURSOR
  // ---------------------------------------------------------------------------
  describe('SET_CURSOR', () => {
    it('sets cursor to a valid index', () => {
      const state = makeState(5, { cursorIndex: 0 });
      const result = queueReducer(state, {
        type: 'SET_CURSOR',
        index: 3,
      });

      expect(result.cursorIndex).toBe(3);
    });

    it('returns same state for negative index', () => {
      const state = makeState(3, { cursorIndex: 1 });
      const result = queueReducer(state, {
        type: 'SET_CURSOR',
        index: -1,
      });

      expect(result).toBe(state);
    });

    it('returns same state for index beyond items length', () => {
      const state = makeState(3);
      const result = queueReducer(state, {
        type: 'SET_CURSOR',
        index: 5,
      });

      expect(result).toBe(state);
    });

    it('returns same state for index equal to items length', () => {
      const state = makeState(3);
      const result = queueReducer(state, {
        type: 'SET_CURSOR',
        index: 3,
      });

      expect(result).toBe(state);
    });
  });

  // ---------------------------------------------------------------------------
  // ADVANCE_CURSOR
  // ---------------------------------------------------------------------------
  describe('ADVANCE_CURSOR', () => {
    it('moves cursor forward by one', () => {
      const state = makeState(5, { cursorIndex: 1 });
      const result = queueReducer(state, { type: 'ADVANCE_CURSOR' });

      expect(result.cursorIndex).toBe(2);
    });

    it('wraps to 0 when repeat is "all" and at end', () => {
      const state = makeState(3, { cursorIndex: 2, repeat: 'all' });
      const result = queueReducer(state, { type: 'ADVANCE_CURSOR' });

      expect(result.cursorIndex).toBe(0);
    });

    it('stays at same index when repeat is "one"', () => {
      const state = makeState(3, { cursorIndex: 1, repeat: 'one' });
      const result = queueReducer(state, { type: 'ADVANCE_CURSOR' });

      expect(result).toBe(state); // returns same reference
      expect(result.cursorIndex).toBe(1);
    });

    it('goes past end (cursor = items.length) when repeat is "off" and at last item', () => {
      const state = makeState(3, { cursorIndex: 2, repeat: 'off' });
      const result = queueReducer(state, { type: 'ADVANCE_CURSOR' });

      expect(result.cursorIndex).toBe(3); // past end
    });

    it('returns same state for empty queue', () => {
      const result = queueReducer(initialQueueState, {
        type: 'ADVANCE_CURSOR',
      });

      expect(result).toBe(initialQueueState);
    });

    it('advances normally from middle of queue', () => {
      const state = makeState(5, { cursorIndex: 2 });
      const result = queueReducer(state, { type: 'ADVANCE_CURSOR' });

      expect(result.cursorIndex).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // RETREAT_CURSOR
  // ---------------------------------------------------------------------------
  describe('RETREAT_CURSOR', () => {
    it('moves cursor backward by one', () => {
      const state = makeState(5, { cursorIndex: 3 });
      const result = queueReducer(state, { type: 'RETREAT_CURSOR' });

      expect(result.cursorIndex).toBe(2);
    });

    it('wraps to last item when repeat is "all" and at start', () => {
      const state = makeState(4, { cursorIndex: 0, repeat: 'all' });
      const result = queueReducer(state, { type: 'RETREAT_CURSOR' });

      expect(result.cursorIndex).toBe(3); // last index
    });

    it('stays at 0 when repeat is "off" and at start', () => {
      const state = makeState(3, { cursorIndex: 0, repeat: 'off' });
      const result = queueReducer(state, { type: 'RETREAT_CURSOR' });

      expect(result.cursorIndex).toBe(0);
    });

    it('stays at 0 when repeat is "one" and at start', () => {
      const state = makeState(3, { cursorIndex: 0, repeat: 'one' });
      const result = queueReducer(state, { type: 'RETREAT_CURSOR' });

      expect(result.cursorIndex).toBe(0);
    });

    it('returns same state for empty queue', () => {
      const result = queueReducer(initialQueueState, {
        type: 'RETREAT_CURSOR',
      });

      expect(result).toBe(initialQueueState);
    });
  });

  // ---------------------------------------------------------------------------
  // SELECT_VERSION
  // ---------------------------------------------------------------------------
  describe('SELECT_VERSION', () => {
    it('changes the song on a queue item', () => {
      const originalSong = mockSong({ id: 'original' });
      const newSong = mockSong({ id: 'new-version', title: 'Better Recording' });
      const items = [
        mockItem({ queueId: 'target', song: originalSong, played: false }),
        mockItem(),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'SELECT_VERSION',
        queueId: 'target',
        song: newSong,
      });

      expect(result.items[0].song.id).toBe('new-version');
      expect(result.items[0].song.title).toBe('Better Recording');
    });

    it('prevents version change on played items', () => {
      const newSong = mockSong({ id: 'new-version' });
      const items = [
        mockItem({ queueId: 'target', played: true }),
        mockItem(),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'SELECT_VERSION',
        queueId: 'target',
        song: newSong,
      });

      expect(result).toBe(state); // no change
    });

    it('returns same state for unknown queueId', () => {
      const state = makeState(3);
      const newSong = mockSong({ id: 'new-version' });

      const result = queueReducer(state, {
        type: 'SELECT_VERSION',
        queueId: 'nonexistent',
        song: newSong,
      });

      expect(result).toBe(state);
    });

    it('does not affect other items in the queue', () => {
      const newSong = mockSong({ id: 'new-version' });
      const items = [
        mockItem({ queueId: 'a', played: false }),
        mockItem({ queueId: 'b', played: false }),
        mockItem({ queueId: 'c', played: false }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, {
        type: 'SELECT_VERSION',
        queueId: 'b',
        song: newSong,
      });

      expect(result.items[0].song.id).toBe(items[0].song.id);
      expect(result.items[1].song.id).toBe('new-version');
      expect(result.items[2].song.id).toBe(items[2].song.id);
    });
  });

  // ---------------------------------------------------------------------------
  // MARK_PLAYED
  // ---------------------------------------------------------------------------
  describe('MARK_PLAYED', () => {
    it('marks the current cursor item as played', () => {
      const state = makeState(3, { cursorIndex: 1 });
      expect(state.items[1].played).toBe(false);

      const result = queueReducer(state, { type: 'MARK_PLAYED' });

      expect(result.items[1].played).toBe(true);
      // Other items unaffected
      expect(result.items[0].played).toBe(false);
      expect(result.items[2].played).toBe(false);
    });

    it('returns same state when cursor is -1', () => {
      const state: UnifiedQueue = {
        items: [mockItem()],
        cursorIndex: -1,
        repeat: 'off',
      };

      const result = queueReducer(state, { type: 'MARK_PLAYED' });
      expect(result).toBe(state);
    });

    it('returns same state when cursor is beyond items', () => {
      const state: UnifiedQueue = {
        items: [mockItem()],
        cursorIndex: 5,
        repeat: 'off',
      };

      const result = queueReducer(state, { type: 'MARK_PLAYED' });
      expect(result).toBe(state);
    });
  });

  // ---------------------------------------------------------------------------
  // RESET_PLAYED
  // ---------------------------------------------------------------------------
  describe('RESET_PLAYED', () => {
    it('clears all played flags', () => {
      const items = [
        mockItem({ played: true }),
        mockItem({ played: true }),
        mockItem({ played: false }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, { type: 'RESET_PLAYED' });

      result.items.forEach((item) => {
        expect(item.played).toBe(false);
      });
    });

    it('works on empty queue', () => {
      const result = queueReducer(initialQueueState, { type: 'RESET_PLAYED' });
      expect(result.items).toHaveLength(0);
    });

    it('does not affect other item properties', () => {
      const items = [
        mockItem({ queueId: 'keep-me', played: true, batchId: 'b1' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 0, repeat: 'off' };

      const result = queueReducer(state, { type: 'RESET_PLAYED' });

      expect(result.items[0].queueId).toBe('keep-me');
      expect(result.items[0].batchId).toBe('b1');
      expect(result.items[0].played).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // SET_REPEAT
  // ---------------------------------------------------------------------------
  describe('SET_REPEAT', () => {
    it('changes repeat mode to "all"', () => {
      const state = makeState(2);
      const result = queueReducer(state, {
        type: 'SET_REPEAT',
        mode: 'all',
      });

      expect(result.repeat).toBe('all');
    });

    it('changes repeat mode to "one"', () => {
      const state = makeState(2);
      const result = queueReducer(state, {
        type: 'SET_REPEAT',
        mode: 'one',
      });

      expect(result.repeat).toBe('one');
    });

    it('changes repeat mode to "off"', () => {
      const state: UnifiedQueue = {
        items: [mockItem()],
        cursorIndex: 0,
        repeat: 'all',
      };
      const result = queueReducer(state, {
        type: 'SET_REPEAT',
        mode: 'off',
      });

      expect(result.repeat).toBe('off');
    });

    it('does not change items or cursor', () => {
      const state = makeState(3, { cursorIndex: 2 });
      const result = queueReducer(state, {
        type: 'SET_REPEAT',
        mode: 'all',
      });

      expect(result.items).toEqual(state.items);
      expect(result.cursorIndex).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // CLEAR_QUEUE
  // ---------------------------------------------------------------------------
  describe('CLEAR_QUEUE', () => {
    it('empties items and resets cursor to -1', () => {
      const state = makeState(5, { cursorIndex: 3 });
      const result = queueReducer(state, { type: 'CLEAR_QUEUE' });

      expect(result.items).toHaveLength(0);
      expect(result.cursorIndex).toBe(-1);
    });

    it('preserves repeat mode', () => {
      const state = makeState(3, { repeat: 'all' });
      const result = queueReducer(state, { type: 'CLEAR_QUEUE' });

      expect(result.repeat).toBe('all');
    });

    it('works on already-empty queue', () => {
      const result = queueReducer(initialQueueState, { type: 'CLEAR_QUEUE' });

      expect(result.items).toHaveLength(0);
      expect(result.cursorIndex).toBe(-1);
      expect(result.repeat).toBe('off');
    });
  });

  // ---------------------------------------------------------------------------
  // CLEAR_UPCOMING
  // ---------------------------------------------------------------------------
  describe('CLEAR_UPCOMING', () => {
    it('removes items after cursor', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
        mockItem({ queueId: 'd' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 1, repeat: 'off' };

      const result = queueReducer(state, { type: 'CLEAR_UPCOMING' });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((i) => i.queueId)).toEqual(['a', 'b']);
    });

    it('keeps cursor at the same position', () => {
      const state = makeState(5, { cursorIndex: 2 });
      const result = queueReducer(state, { type: 'CLEAR_UPCOMING' });

      expect(result.cursorIndex).toBe(2);
    });

    it('keeps items at and before cursor', () => {
      const items = [
        mockItem({ queueId: 'a' }),
        mockItem({ queueId: 'b' }),
        mockItem({ queueId: 'c' }),
      ];
      const state: UnifiedQueue = { items, cursorIndex: 2, repeat: 'off' };

      const result = queueReducer(state, { type: 'CLEAR_UPCOMING' });

      // cursor is at last item, nothing to clear
      expect(result.items).toHaveLength(3);
    });

    it('returns same state when cursor is -1 (negative)', () => {
      const state: UnifiedQueue = {
        items: [mockItem()],
        cursorIndex: -1,
        repeat: 'off',
      };

      const result = queueReducer(state, { type: 'CLEAR_UPCOMING' });
      expect(result).toBe(state);
    });

    it('preserves repeat mode', () => {
      const state = makeState(3, { cursorIndex: 0, repeat: 'one' });
      const result = queueReducer(state, { type: 'CLEAR_UPCOMING' });

      expect(result.repeat).toBe('one');
    });
  });

  // ---------------------------------------------------------------------------
  // Default / unknown action
  // ---------------------------------------------------------------------------
  describe('default (unknown action)', () => {
    it('returns same state for unknown action type', () => {
      const state = makeState(3);
      const result = queueReducer(state, { type: 'UNKNOWN' } as any);

      expect(result).toBe(state);
    });
  });
});
