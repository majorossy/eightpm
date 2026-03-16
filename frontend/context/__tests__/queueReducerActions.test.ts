import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueReducer, QueueAction } from '@/context/QueueContext';
import { QueueItem, UnifiedQueue } from '@/lib/queueTypes';
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
    batchId: 'batch-A',
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

function makeState(items: QueueItem[], cursorIndex: number): UnifiedQueue {
  return { items, cursorIndex, repeat: 'off' };
}

// =============================================================================
// DETACH_ITEM
// =============================================================================

describe('DETACH_ITEM', () => {
  it('detaches item from its batch and gives it a new batchId', () => {
    const items = [
      mockItem({ batchId: 'batch-A' }),
      mockItem({ batchId: 'batch-A' }),
      mockItem({ batchId: 'batch-A' }),
    ];
    const state = makeState(items, 0);

    const result = queueReducer(state, {
      type: 'DETACH_ITEM',
      queueId: items[1].queueId,
      targetIndex: 1,
    });

    // Item should have a new batchId
    expect(result.items[1].batchId).not.toBe('batch-A');
    // Other items keep their batchId
    expect(result.items[0].batchId).toBe('batch-A');
    expect(result.items[2].batchId).toBe('batch-A');
  });

  it('moves item from before cursor to after cursor, adjusting cursor', () => {
    const items = [
      mockItem({ queueId: 'q-before' }),
      mockItem({ queueId: 'q-cursor' }),
      mockItem({ queueId: 'q-after' }),
    ];
    const state = makeState(items, 1); // cursor at q-cursor

    const result = queueReducer(state, {
      type: 'DETACH_ITEM',
      queueId: 'q-before',
      targetIndex: 3, // move to end (past current position)
    });

    // Removed from before cursor → cursor decrements
    expect(result.cursorIndex).toBe(0);
    // Item moved to end (adjusted: 3 - 1 = 2)
    expect(result.items[2].queueId).toBe('q-before');
  });

  it('moves item from after cursor to before cursor, adjusting cursor', () => {
    const items = [
      mockItem({ queueId: 'q-first' }),
      mockItem({ queueId: 'q-cursor' }),
      mockItem({ queueId: 'q-after' }),
    ];
    const state = makeState(items, 1);

    const result = queueReducer(state, {
      type: 'DETACH_ITEM',
      queueId: 'q-after',
      targetIndex: 0, // move to start (before cursor)
    });

    // Inserted before cursor → cursor increments
    expect(result.cursorIndex).toBe(2);
    expect(result.items[0].queueId).toBe('q-after');
  });

  it('follows cursor when detaching the currently playing item', () => {
    const items = [
      mockItem({ queueId: 'q-0' }),
      mockItem({ queueId: 'q-1' }),
      mockItem({ queueId: 'q-2' }),
    ];
    const state = makeState(items, 1); // cursor at q-1

    const result = queueReducer(state, {
      type: 'DETACH_ITEM',
      queueId: 'q-1',
      targetIndex: 0, // move cursor item to start
    });

    // Cursor follows the detached item
    expect(result.cursorIndex).toBe(0);
    expect(result.items[0].queueId).toBe('q-1');
  });

  it('returns same state if queueId not found', () => {
    const state = makeState([mockItem()], 0);
    const result = queueReducer(state, {
      type: 'DETACH_ITEM',
      queueId: 'nonexistent',
      targetIndex: 0,
    });
    expect(result).toBe(state);
  });

  it('returns same state if targetIndex is out of bounds', () => {
    const items = [mockItem({ queueId: 'q-0' })];
    const state = makeState(items, 0);

    const result = queueReducer(state, {
      type: 'DETACH_ITEM',
      queueId: 'q-0',
      targetIndex: -1,
    });
    expect(result).toBe(state);
  });

  it('handles detaching to same position (no-move, just new batchId)', () => {
    const items = [
      mockItem({ queueId: 'q-0', batchId: 'batch-A' }),
      mockItem({ queueId: 'q-1', batchId: 'batch-A' }),
    ];
    const state = makeState(items, 0);

    const result = queueReducer(state, {
      type: 'DETACH_ITEM',
      queueId: 'q-0',
      targetIndex: 0,
    });

    expect(result.items[0].queueId).toBe('q-0');
    expect(result.items[0].batchId).not.toBe('batch-A');
    expect(result.cursorIndex).toBe(0);
  });
});

// =============================================================================
// RESTORE_FROM_HISTORY
// =============================================================================

describe('RESTORE_FROM_HISTORY', () => {
  it('moves a played (history) item to upcoming zone', () => {
    const items = [
      mockItem({ queueId: 'q-played', played: true }),
      mockItem({ queueId: 'q-cursor', played: false }),
      mockItem({ queueId: 'q-upcoming', played: false }),
    ];
    const state = makeState(items, 1); // cursor at q-cursor

    const result = queueReducer(state, {
      type: 'RESTORE_FROM_HISTORY',
      queueId: 'q-played',
      targetIndex: 3, // place at end
    });

    // Cursor decrements (item removed from before cursor)
    expect(result.cursorIndex).toBe(0);
    // Item moved to upcoming (after cursor) and marked unplayed
    const restored = result.items.find(i => i.queueId === 'q-played');
    expect(restored?.played).toBe(false);
    // Gets a new batchId
    expect(restored?.batchId).not.toBe('batch-A');
  });

  it('rejects restore if item is at or after cursor (not history)', () => {
    const items = [
      mockItem({ queueId: 'q-0' }),
      mockItem({ queueId: 'q-cursor' }),
      mockItem({ queueId: 'q-upcoming' }),
    ];
    const state = makeState(items, 1);

    // Try to "restore" the cursor item
    const result = queueReducer(state, {
      type: 'RESTORE_FROM_HISTORY',
      queueId: 'q-cursor',
      targetIndex: 2,
    });
    expect(result).toBe(state);

    // Try to "restore" an upcoming item
    const result2 = queueReducer(state, {
      type: 'RESTORE_FROM_HISTORY',
      queueId: 'q-upcoming',
      targetIndex: 2,
    });
    expect(result2).toBe(state);
  });

  it('clamps target to upcoming zone (cannot place before cursor)', () => {
    const items = [
      mockItem({ queueId: 'q-hist1', played: true }),
      mockItem({ queueId: 'q-hist2', played: true }),
      mockItem({ queueId: 'q-cursor' }),
      mockItem({ queueId: 'q-upcoming' }),
    ];
    const state = makeState(items, 2);

    const result = queueReducer(state, {
      type: 'RESTORE_FROM_HISTORY',
      queueId: 'q-hist1',
      targetIndex: 0, // try to place at start (before cursor)
    });

    // Cursor decrements: was 2, removed item before → 1
    // Clamped target = max(newCursor+1, adjustedTarget) = max(2, 0) = 2
    expect(result.cursorIndex).toBe(1);
    // Item should be in upcoming zone (at or after cursor+1)
    const restoredIdx = result.items.findIndex(i => i.queueId === 'q-hist1');
    expect(restoredIdx).toBeGreaterThan(result.cursorIndex);
  });

  it('returns same state if queueId not found', () => {
    const state = makeState([mockItem()], 0);
    const result = queueReducer(state, {
      type: 'RESTORE_FROM_HISTORY',
      queueId: 'nonexistent',
      targetIndex: 0,
    });
    expect(result).toBe(state);
  });

  it('handles restoring from position 0 in a longer queue', () => {
    const items = [
      mockItem({ queueId: 'q-0', played: true }),
      mockItem({ queueId: 'q-1', played: true }),
      mockItem({ queueId: 'q-2', played: true }),
      mockItem({ queueId: 'q-cursor' }),
      mockItem({ queueId: 'q-last' }),
    ];
    const state = makeState(items, 3);

    const result = queueReducer(state, {
      type: 'RESTORE_FROM_HISTORY',
      queueId: 'q-0',
      targetIndex: 5, // end
    });

    expect(result.cursorIndex).toBe(2); // was 3, one removed before
    expect(result.items.length).toBe(5); // same count (moved, not removed)
    expect(result.items[result.items.length - 1].queueId).toBe('q-0');
  });
});

// =============================================================================
// REMOVE_BATCH
// =============================================================================

describe('REMOVE_BATCH', () => {
  it('removes all items with matching batchId after cursor', () => {
    const items = [
      mockItem({ queueId: 'q-0', batchId: 'batch-A', played: true }),
      mockItem({ queueId: 'q-cursor', batchId: 'batch-B' }),
      mockItem({ queueId: 'q-2', batchId: 'batch-C' }),
      mockItem({ queueId: 'q-3', batchId: 'batch-C' }),
      mockItem({ queueId: 'q-4', batchId: 'batch-C' }),
    ];
    const state = makeState(items, 1);

    const result = queueReducer(state, {
      type: 'REMOVE_BATCH',
      batchId: 'batch-C',
    });

    expect(result.items.length).toBe(2);
    expect(result.items.map(i => i.queueId)).toEqual(['q-0', 'q-cursor']);
    // Cursor stays the same
    expect(result.cursorIndex).toBe(1);
  });

  it('preserves items with matching batchId at or before cursor', () => {
    const items = [
      mockItem({ queueId: 'q-0', batchId: 'batch-X' }),
      mockItem({ queueId: 'q-cursor', batchId: 'batch-X' }),
      mockItem({ queueId: 'q-2', batchId: 'batch-X' }),
    ];
    const state = makeState(items, 1);

    const result = queueReducer(state, {
      type: 'REMOVE_BATCH',
      batchId: 'batch-X',
    });

    // Items at index 0 and 1 (at or before cursor) are preserved
    expect(result.items.length).toBe(2);
    expect(result.items[0].queueId).toBe('q-0');
    expect(result.items[1].queueId).toBe('q-cursor');
  });

  it('returns same state if no items match the batchId', () => {
    const items = [mockItem({ batchId: 'batch-A' })];
    const state = makeState(items, 0);

    const result = queueReducer(state, {
      type: 'REMOVE_BATCH',
      batchId: 'nonexistent',
    });
    expect(result).toBe(state);
  });

  it('returns same state if all matching items are at or before cursor', () => {
    const items = [
      mockItem({ queueId: 'q-0', batchId: 'batch-A' }),
      mockItem({ queueId: 'q-1', batchId: 'batch-A' }),
      mockItem({ queueId: 'q-2', batchId: 'batch-B' }),
    ];
    const state = makeState(items, 1); // cursor at index 1

    const result = queueReducer(state, {
      type: 'REMOVE_BATCH',
      batchId: 'batch-A',
    });

    // Both batch-A items are at/before cursor — nothing removed
    expect(result).toBe(state);
  });

  it('handles removing the only upcoming items (nothing left after cursor)', () => {
    const items = [
      mockItem({ queueId: 'q-cursor', batchId: 'batch-A' }),
      mockItem({ queueId: 'q-1', batchId: 'batch-B' }),
      mockItem({ queueId: 'q-2', batchId: 'batch-B' }),
    ];
    const state = makeState(items, 0);

    const result = queueReducer(state, {
      type: 'REMOVE_BATCH',
      batchId: 'batch-B',
    });

    expect(result.items.length).toBe(1);
    expect(result.cursorIndex).toBe(0);
  });
});

// =============================================================================
// PLAY_NOW
// =============================================================================

describe('PLAY_NOW', () => {
  it('appends and starts playing when queue is empty', () => {
    const state = makeState([], -1);
    const newItem = mockItem({ queueId: 'q-new' });

    const result = queueReducer(state, {
      type: 'PLAY_NOW',
      item: newItem,
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].queueId).toBe('q-new');
    expect(result.cursorIndex).toBe(0);
  });

  it('inserts after cursor and advances to it', () => {
    const items = [
      mockItem({ queueId: 'q-0' }),
      mockItem({ queueId: 'q-1' }),
      mockItem({ queueId: 'q-2' }),
    ];
    const state = makeState(items, 0); // playing q-0

    const newItem = mockItem({ queueId: 'q-new' });
    const result = queueReducer(state, {
      type: 'PLAY_NOW',
      item: newItem,
    });

    expect(result.items.length).toBe(4);
    // Inserted at cursorIndex + 1 = 1
    expect(result.items[1].queueId).toBe('q-new');
    // Cursor advances to the new item
    expect(result.cursorIndex).toBe(1);
  });

  it('is a no-op when the same song is already playing', () => {
    const song = mockSong({ id: 'same-song-id' });
    const items = [
      mockItem({ queueId: 'q-current', song }),
    ];
    const state = makeState(items, 0);

    const newItem = mockItem({
      queueId: 'q-duplicate',
      song: { ...song }, // same id, different object
    });
    const result = queueReducer(state, {
      type: 'PLAY_NOW',
      item: newItem,
    });

    // Returns exact same state reference (no-op)
    expect(result).toBe(state);
  });

  it('works when cursor is at the last item', () => {
    const items = [
      mockItem({ queueId: 'q-0' }),
      mockItem({ queueId: 'q-1' }),
    ];
    const state = makeState(items, 1); // cursor at last item

    const newItem = mockItem({ queueId: 'q-new' });
    const result = queueReducer(state, {
      type: 'PLAY_NOW',
      item: newItem,
    });

    expect(result.items.length).toBe(3);
    expect(result.items[2].queueId).toBe('q-new');
    expect(result.cursorIndex).toBe(2);
  });

  it('handles cursorIndex < 0 (nothing playing)', () => {
    const items = [mockItem({ queueId: 'q-0' })];
    const state = makeState(items, -1);

    const newItem = mockItem({ queueId: 'q-new' });
    const result = queueReducer(state, {
      type: 'PLAY_NOW',
      item: newItem,
    });

    // Appends to end and sets cursor
    expect(result.items.length).toBe(2);
    expect(result.cursorIndex).toBe(1);
  });

  it('preserves existing items when inserting', () => {
    const items = [
      mockItem({ queueId: 'q-0' }),
      mockItem({ queueId: 'q-1' }),
      mockItem({ queueId: 'q-2' }),
    ];
    const state = makeState(items, 1);

    const newItem = mockItem({ queueId: 'q-new' });
    const result = queueReducer(state, {
      type: 'PLAY_NOW',
      item: newItem,
    });

    // q-0, q-1, q-new, q-2
    expect(result.items.map(i => i.queueId)).toEqual(['q-0', 'q-1', 'q-new', 'q-2']);
    expect(result.cursorIndex).toBe(2);
  });
});
