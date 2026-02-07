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
// Mock Factories
// =============================================================================

let idCounter = 0;

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
  return actions.reduce((state, action) => queueReducer(state, action), initial);
}

// =============================================================================
// Edge Case Tests
// =============================================================================

beforeEach(() => {
  idCounter = 0;
});

// ---------------------------------------------------------------------------
// 1. Empty queue operations
// ---------------------------------------------------------------------------
describe('Empty queue operations', () => {
  it('ADVANCE_CURSOR on empty queue (cursor -1) stays unchanged', () => {
    const state = queueReducer(initialQueueState, { type: 'ADVANCE_CURSOR' });
    // Reducer checks items.length === 0 and returns state unchanged
    expect(state.cursorIndex).toBe(-1);
    expect(state.items).toHaveLength(0);
  });

  it('RETREAT_CURSOR on empty queue stays unchanged', () => {
    const state = queueReducer(initialQueueState, { type: 'RETREAT_CURSOR' });
    expect(state.cursorIndex).toBe(-1);
    expect(state.items).toHaveLength(0);
  });

  it('MARK_PLAYED on empty queue does not crash', () => {
    // cursorIndex is -1, which is < 0, so early return
    const state = queueReducer(initialQueueState, { type: 'MARK_PLAYED' });
    expect(state).toBe(initialQueueState);
  });

  it('CLEAR_UPCOMING on empty queue does not crash', () => {
    // cursorIndex is -1, which is < 0, so early return
    const state = queueReducer(initialQueueState, { type: 'CLEAR_UPCOMING' });
    expect(state).toBe(initialQueueState);
  });

  it('INSERT_AFTER_CURSOR on empty queue (cursor -1) puts item at index 0', () => {
    const item = makeQueueItem({ queueId: 'q-first' });
    const state = queueReducer(initialQueueState, {
      type: 'INSERT_AFTER_CURSOR',
      items: item,
    });
    // insertAt = cursorIndex + 1 = -1 + 1 = 0
    expect(state.items).toHaveLength(1);
    expect(state.items[0].queueId).toBe('q-first');
    // Cursor should still be -1 (INSERT_AFTER_CURSOR does not change cursor)
    expect(state.cursorIndex).toBe(-1);
  });

  it('REMOVE_ITEM with non-existent queueId returns state unchanged', () => {
    const items = makeAlbumItems(3, 'batch-remove-test');
    const state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const result = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: 'q-nonexistent-id-12345',
    });
    // Should return same reference (no match found)
    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// 2. Single item queue
// ---------------------------------------------------------------------------
describe('Single item queue', () => {
  let singleItemState: UnifiedQueue;
  let singleItem: QueueItem;

  beforeEach(() => {
    singleItem = makeQueueItem({ queueId: 'q-single' });
    singleItemState = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items: [singleItem], cursorIndex: 0 },
    ]);
  });

  it('ADVANCE_CURSOR with repeat=off goes past end', () => {
    const state = queueReducer(singleItemState, { type: 'ADVANCE_CURSOR' });
    // nextIdx = 0 + 1 = 1, which is >= items.length (1), repeat=off
    // so cursor goes to items.length = 1 (past end)
    expect(state.cursorIndex).toBe(1);
  });

  it('ADVANCE_CURSOR with repeat=one stays at 0', () => {
    const withRepeat = queueReducer(singleItemState, {
      type: 'SET_REPEAT',
      mode: 'one',
    });
    const state = queueReducer(withRepeat, { type: 'ADVANCE_CURSOR' });
    expect(state.cursorIndex).toBe(0);
  });

  it('ADVANCE_CURSOR with repeat=all wraps to 0', () => {
    const withRepeat = queueReducer(singleItemState, {
      type: 'SET_REPEAT',
      mode: 'all',
    });
    const state = queueReducer(withRepeat, { type: 'ADVANCE_CURSOR' });
    // nextIdx = 1 >= items.length (1), repeat=all => cursorIndex = 0
    expect(state.cursorIndex).toBe(0);
  });

  it('REMOVE_ITEM the only item results in empty queue with cursor -1', () => {
    const state = queueReducer(singleItemState, {
      type: 'REMOVE_ITEM',
      queueId: 'q-single',
    });
    expect(state.items).toHaveLength(0);
    expect(state.cursorIndex).toBe(-1);
  });

  it('MOVE_ITEM from 0 to 0 is a no-op', () => {
    const state = queueReducer(singleItemState, {
      type: 'MOVE_ITEM',
      fromIndex: 0,
      toIndex: 0,
    });
    // Guard clause: fromIndex === toIndex => return state
    expect(state).toBe(singleItemState);
  });
});

// ---------------------------------------------------------------------------
// 3. Cursor boundary tracking
// ---------------------------------------------------------------------------
describe('Cursor boundary tracking', () => {
  it('MOVE_ITEM: move cursor item (index 2) to index 0 -- cursor follows to 0', () => {
    const items = makeAlbumItems(5, 'batch-cursor');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 2 },
    ]);

    state = queueReducer(state, {
      type: 'MOVE_ITEM',
      fromIndex: 2,
      toIndex: 0,
    });
    expect(state.cursorIndex).toBe(0);
    // The item that was at index 2 should now be at index 0
    expect(state.items[0].queueId).toBe(items[2].queueId);
  });

  it('MOVE_ITEM: move item from before cursor to after -- cursor decrements', () => {
    const items = makeAlbumItems(5, 'batch-shift');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 2 },
    ]);

    // Move item at index 0 (before cursor at 2) to index 4 (after cursor)
    state = queueReducer(state, {
      type: 'MOVE_ITEM',
      fromIndex: 0,
      toIndex: 4,
    });
    // fromIndex(0) < cursor(2) && toIndex(4) >= cursor(2) => cursor - 1 = 1
    expect(state.cursorIndex).toBe(1);
  });

  it('MOVE_ITEM: move item from after cursor to before -- cursor increments', () => {
    const items = makeAlbumItems(5, 'batch-shift2');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 2 },
    ]);

    // Move item at index 4 (after cursor at 2) to index 0 (before cursor)
    state = queueReducer(state, {
      type: 'MOVE_ITEM',
      fromIndex: 4,
      toIndex: 0,
    });
    // fromIndex(4) > cursor(2) && toIndex(0) <= cursor(2) => cursor + 1 = 3
    expect(state.cursorIndex).toBe(3);
  });

  it('INSERT_AFTER_CURSOR when cursor is at last item -- new item goes to end', () => {
    const items = makeAlbumItems(3, 'batch-end');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 2 },
    ]);

    const newItem = makeQueueItem({ queueId: 'q-appended-end' });
    state = queueReducer(state, {
      type: 'INSERT_AFTER_CURSOR',
      items: newItem,
    });

    // insertAt = 2 + 1 = 3 (the end)
    expect(state.items).toHaveLength(4);
    expect(state.items[3].queueId).toBe('q-appended-end');
    expect(state.cursorIndex).toBe(2); // unchanged
  });

  it('REMOVE_ITEM: remove item before cursor -- cursor decrements', () => {
    const items = makeAlbumItems(5, 'batch-rem-before');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 3 },
    ]);

    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: items[1].queueId,
    });

    expect(state.items).toHaveLength(4);
    expect(state.cursorIndex).toBe(2); // 3 - 1
  });

  it('REMOVE_ITEM: remove item after cursor -- cursor unchanged', () => {
    const items = makeAlbumItems(5, 'batch-rem-after');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 1 },
    ]);

    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: items[3].queueId,
    });

    expect(state.items).toHaveLength(4);
    expect(state.cursorIndex).toBe(1); // unchanged
  });

  it('REMOVE_ITEM: remove item AT cursor (not first, not last) -- cursor stays, now points to next item', () => {
    const items = makeAlbumItems(5, 'batch-rem-at');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 2 },
    ]);

    const nextItemId = items[3].queueId;
    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: items[2].queueId,
    });

    expect(state.items).toHaveLength(4);
    // Cursor stays at 2, which now points to what was previously items[3]
    expect(state.cursorIndex).toBe(2);
    expect(state.items[state.cursorIndex].queueId).toBe(nextItemId);
  });
});

// ---------------------------------------------------------------------------
// 4. MOVE_BLOCK edge cases
// ---------------------------------------------------------------------------
describe('MOVE_BLOCK edge cases', () => {
  it('Move block to position 0 (start of queue)', () => {
    const albumA = makeAlbumItems(2, 'batch-a');
    const albumB = makeAlbumItems(3, 'batch-b');
    // Load: A0, A1, B0, B1, B2
    const allItems = [...albumA, ...albumB];
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items: allItems, cursorIndex: 0 },
    ]);

    // Move batch-b (indices 2-4) to target index 0
    state = queueReducer(state, {
      type: 'MOVE_BLOCK',
      batchId: 'batch-b',
      startIndex: 2,
      endIndex: 4,
      targetIndex: 0,
    });

    // Block items [B0, B1, B2] removed from remaining = [A0, A1]
    // removedBefore count: none (all block items at indices 2-4 are >= targetIndex 0)
    // adjustedTarget = 0 - 0 = 0
    // Result: B0, B1, B2, A0, A1
    expect(state.items[0].batchId).toBe('batch-b');
    expect(state.items[1].batchId).toBe('batch-b');
    expect(state.items[2].batchId).toBe('batch-b');
    expect(state.items[3].batchId).toBe('batch-a');
    expect(state.items[4].batchId).toBe('batch-a');
  });

  it('Move block to end of queue', () => {
    const albumA = makeAlbumItems(3, 'batch-a2');
    const albumB = makeAlbumItems(2, 'batch-b2');
    // Load: A0, A1, A2, B0, B1
    const allItems = [...albumA, ...albumB];
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items: allItems, cursorIndex: 4 },
    ]);

    // Move batch-a2 (indices 0-2) to target index 5 (past end)
    state = queueReducer(state, {
      type: 'MOVE_BLOCK',
      batchId: 'batch-a2',
      startIndex: 0,
      endIndex: 2,
      targetIndex: 5,
    });

    // remaining = [B0, B1], removedBefore = 3 (all at indices 0,1,2 < 5)
    // adjustedTarget = 5 - 3 = 2, clamped to min(2, remainingLength=2) = 2 (end)
    // Result: B0, B1, A0, A1, A2
    expect(state.items[0].batchId).toBe('batch-b2');
    expect(state.items[1].batchId).toBe('batch-b2');
    expect(state.items[2].batchId).toBe('batch-a2');
    expect(state.items[3].batchId).toBe('batch-a2');
    expect(state.items[4].batchId).toBe('batch-a2');
  });

  it('Move block that includes the cursor item -- cursor follows', () => {
    const albumA = makeAlbumItems(2, 'batch-mc-a');
    const albumB = makeAlbumItems(3, 'batch-mc-b');
    // Load: A0, A1, B0, B1, B2 - cursor at B1 (index 3)
    const allItems = [...albumA, ...albumB];
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items: allItems, cursorIndex: 3 },
    ]);

    const cursorQueueId = state.items[3].queueId;

    // Move batch-mc-b (indices 2-4) to target 0
    state = queueReducer(state, {
      type: 'MOVE_BLOCK',
      batchId: 'batch-mc-b',
      startIndex: 2,
      endIndex: 4,
      targetIndex: 0,
    });

    // Result: B0, B1, B2, A0, A1
    // Cursor should follow the cursor item by queueId
    expect(state.items[state.cursorIndex].queueId).toBe(cursorQueueId);
  });

  it('Move block with batchId that does not match any items in range -- no-op', () => {
    const items = makeAlbumItems(5, 'batch-nomatch');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    // Try to move batchId 'nonexistent' in range 0-4
    const result = queueReducer(state, {
      type: 'MOVE_BLOCK',
      batchId: 'nonexistent-batch',
      startIndex: 0,
      endIndex: 4,
      targetIndex: 2,
    });

    // blockItems.length === 0, so early return state
    expect(result).toBe(state);
  });

  it('Move block of size 1 (single item with that batchId in range)', () => {
    // Mix of different batchIds
    const itemA = makeQueueItem({
      queueId: 'q-a',
      batchId: 'batch-a3',
      albumSource: makeAlbumSource(),
    });
    const itemB = makeQueueItem({
      queueId: 'q-b',
      batchId: 'batch-b3',
      albumSource: makeAlbumSource(),
    });
    const itemC = makeQueueItem({
      queueId: 'q-c',
      batchId: 'batch-c3',
      albumSource: makeAlbumSource(),
    });

    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items: [itemA, itemB, itemC], cursorIndex: 0 },
    ]);

    // Move batch-b3 (only at index 1) to target 0
    state = queueReducer(state, {
      type: 'MOVE_BLOCK',
      batchId: 'batch-b3',
      startIndex: 1,
      endIndex: 1,
      targetIndex: 0,
    });

    // Result: B, A, C
    expect(state.items[0].queueId).toBe('q-b');
    expect(state.items[1].queueId).toBe('q-a');
    expect(state.items[2].queueId).toBe('q-c');
  });
});

// ---------------------------------------------------------------------------
// 5. Large queue stress test
// ---------------------------------------------------------------------------
describe('Large queue stress test', () => {
  it('100 items: ADVANCE_CURSOR 50 times reaches cursor 50', () => {
    const items: QueueItem[] = [];
    for (let i = 0; i < 100; i++) {
      items.push(
        makeQueueItem({
          queueId: `q-stress-${i}`,
          batchId: 'batch-stress',
        }),
      );
    }

    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    for (let i = 0; i < 50; i++) {
      state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
    }
    expect(state.cursorIndex).toBe(50);
  });

  it('100 items: REMOVE_ITEM at various positions keeps cursor correct', () => {
    const items: QueueItem[] = [];
    for (let i = 0; i < 100; i++) {
      items.push(
        makeQueueItem({
          queueId: `q-stress2-${i}`,
          batchId: 'batch-stress2',
        }),
      );
    }

    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 50 },
    ]);

    // Track the cursor item's queueId
    const cursorItemId = state.items[50].queueId;

    // Remove items before cursor (at indices 10, 20, 30)
    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: `q-stress2-10`,
    });
    expect(state.cursorIndex).toBe(49); // decremented
    expect(state.items[state.cursorIndex].queueId).toBe(cursorItemId);

    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: `q-stress2-20`,
    });
    expect(state.cursorIndex).toBe(48);
    expect(state.items[state.cursorIndex].queueId).toBe(cursorItemId);

    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: `q-stress2-30`,
    });
    expect(state.cursorIndex).toBe(47);
    expect(state.items[state.cursorIndex].queueId).toBe(cursorItemId);

    // Remove items after cursor (at indices originally 60, 70)
    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: `q-stress2-60`,
    });
    expect(state.cursorIndex).toBe(47); // unchanged
    expect(state.items[state.cursorIndex].queueId).toBe(cursorItemId);

    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: `q-stress2-70`,
    });
    expect(state.cursorIndex).toBe(47); // unchanged
    expect(state.items[state.cursorIndex].queueId).toBe(cursorItemId);

    // Verify total items removed
    expect(state.items).toHaveLength(95);
  });
});

// ---------------------------------------------------------------------------
// 6. computeAlbumGroups edge cases
// ---------------------------------------------------------------------------
describe('computeAlbumGroups edge cases', () => {
  it('All items have null albumSource -- empty groups array', () => {
    const items = [
      makeQueueItem({ queueId: 'q-1', albumSource: null }),
      makeQueueItem({ queueId: 'q-2', albumSource: null }),
      makeQueueItem({ queueId: 'q-3', albumSource: null }),
    ];
    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(0);
  });

  it('All items have same batchId -- one big group', () => {
    const batchId = 'batch-same';
    const items = [
      makeQueueItem({
        queueId: 'q-g1',
        batchId,
        albumSource: makeAlbumSource({ originalTrackIndex: 0 }),
      }),
      makeQueueItem({
        queueId: 'q-g2',
        batchId,
        albumSource: makeAlbumSource({ originalTrackIndex: 1 }),
      }),
      makeQueueItem({
        queueId: 'q-g3',
        batchId,
        albumSource: makeAlbumSource({ originalTrackIndex: 2 }),
      }),
      makeQueueItem({
        queueId: 'q-g4',
        batchId,
        albumSource: makeAlbumSource({ originalTrackIndex: 3 }),
      }),
    ];
    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(4);
    expect(groups[0].startIndex).toBe(0);
    expect(groups[0].endIndex).toBe(3);
  });

  it('Alternating batchIds -- many small groups', () => {
    const items = [
      makeQueueItem({
        queueId: 'q-alt-0',
        batchId: 'batch-x',
        albumSource: makeAlbumSource(),
      }),
      makeQueueItem({
        queueId: 'q-alt-1',
        batchId: 'batch-y',
        albumSource: makeAlbumSource(),
      }),
      makeQueueItem({
        queueId: 'q-alt-2',
        batchId: 'batch-x',
        albumSource: makeAlbumSource(),
      }),
      makeQueueItem({
        queueId: 'q-alt-3',
        batchId: 'batch-y',
        albumSource: makeAlbumSource(),
      }),
    ];
    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(4);
    // First occurrences are not continuation, subsequent are
    expect(groups[0].isContinuation).toBe(false); // first batch-x
    expect(groups[1].isContinuation).toBe(false); // first batch-y
    expect(groups[2].isContinuation).toBe(true); // second batch-x
    expect(groups[3].isContinuation).toBe(true); // second batch-y
  });

  it('cursorIndex at -1 -- all items are upcoming, groups start from index 0', () => {
    const items = makeAlbumItems(3, 'batch-upcoming');
    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(1);
    expect(groups[0].startIndex).toBe(0);
    expect(groups[0].endIndex).toBe(2);
  });

  it('cursorIndex past end -- no groups', () => {
    const items = makeAlbumItems(3, 'batch-past');
    const groups = computeAlbumGroups(items, 10);
    // startFrom = 10 + 1 = 11, which is >= items.length (3)
    expect(groups).toHaveLength(0);
  });

  it('cursorIndex at last item -- no groups (nothing after cursor)', () => {
    const items = makeAlbumItems(3, 'batch-last');
    const groups = computeAlbumGroups(items, 2);
    // startFrom = 2 + 1 = 3, which is >= items.length (3)
    expect(groups).toHaveLength(0);
  });

  it('Single item with albumSource -- one group of size 1', () => {
    const items = [
      makeQueueItem({
        queueId: 'q-single-grp',
        batchId: 'batch-single-grp',
        albumSource: makeAlbumSource(),
      }),
    ];
    const groups = computeAlbumGroups(items, -1);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(1);
    expect(groups[0].startIndex).toBe(0);
    expect(groups[0].endIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 7. CLEAR_QUEUE preserves repeat mode
// ---------------------------------------------------------------------------
describe('CLEAR_QUEUE preserves repeat mode', () => {
  it('Set repeat to all, clear queue -- repeat still all', () => {
    const items = makeAlbumItems(3, 'batch-clear-rep');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
      { type: 'SET_REPEAT', mode: 'all' },
    ]);

    state = queueReducer(state, { type: 'CLEAR_QUEUE' });
    expect(state.items).toHaveLength(0);
    expect(state.cursorIndex).toBe(-1);
    expect(state.repeat).toBe('all');
  });

  it('Set repeat to one, clear queue -- repeat still one', () => {
    const items = makeAlbumItems(3, 'batch-clear-rep2');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
      { type: 'SET_REPEAT', mode: 'one' },
    ]);

    state = queueReducer(state, { type: 'CLEAR_QUEUE' });
    expect(state.items).toHaveLength(0);
    expect(state.cursorIndex).toBe(-1);
    expect(state.repeat).toBe('one');
  });
});

// ---------------------------------------------------------------------------
// 8. SELECT_VERSION with same song
// ---------------------------------------------------------------------------
describe('SELECT_VERSION with same song', () => {
  it('SELECT_VERSION with the same song object still updates state', () => {
    const items = makeAlbumItems(3, 'batch-ver');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const sameSong = state.items[1].song;

    // SELECT_VERSION with the same song -- the reducer doesn't check for
    // same-song optimization, so it creates a new state
    const result = queueReducer(state, {
      type: 'SELECT_VERSION',
      queueId: items[1].queueId,
      song: sameSong,
    });

    // Even with the same song, state should be updated (new object)
    // because the reducer creates new items array regardless
    expect(result).not.toBe(state);
    expect(result.items[1].song).toBe(sameSong);
  });

  it('SELECT_VERSION with non-existent queueId returns state unchanged', () => {
    const items = makeAlbumItems(2, 'batch-ver2');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const result = queueReducer(state, {
      type: 'SELECT_VERSION',
      queueId: 'q-does-not-exist',
      song: makeSong(),
    });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// 9. Rapid ADVANCE_CURSOR calls
// ---------------------------------------------------------------------------
describe('Rapid ADVANCE_CURSOR calls', () => {
  it('5-item queue, 10 ADVANCE calls with repeat=off -- cursor at items.length', () => {
    const items = makeAlbumItems(5, 'batch-rapid');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    for (let i = 0; i < 10; i++) {
      state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
    }

    // After advancing past the end with repeat=off, cursor = items.length = 5
    // But note: once cursor is at 5 (past end), ADVANCE_CURSOR still runs
    // because items.length > 0. nextIdx = 5 + 1 = 6, which is >= 5.
    // repeat=off => cursor = items.length = 5.
    // So even after 10 calls, cursor stabilizes at 5.
    expect(state.cursorIndex).toBe(5);
  });

  it('5-item queue, 10 ADVANCE calls with repeat=all -- wraps correctly (cursor at 0)', () => {
    const items = makeAlbumItems(5, 'batch-rapid2');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
      { type: 'SET_REPEAT', mode: 'all' },
    ]);

    for (let i = 0; i < 10; i++) {
      state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
    }

    // 10 advances from 0: 1,2,3,4,0,1,2,3,4,0 => cursor at 0
    expect(state.cursorIndex).toBe(10 % 5); // 0
  });

  it('5-item queue, 13 ADVANCE calls with repeat=all -- wraps correctly', () => {
    const items = makeAlbumItems(5, 'batch-rapid3');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
      { type: 'SET_REPEAT', mode: 'all' },
    ]);

    for (let i = 0; i < 13; i++) {
      state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
    }

    // 13 advances from 0: 13 % 5 = 3
    expect(state.cursorIndex).toBe(13 % 5);
  });
});

// ---------------------------------------------------------------------------
// 10. INSERT_AFTER_CURSOR with empty array
// ---------------------------------------------------------------------------
describe('INSERT_AFTER_CURSOR with empty array', () => {
  it('INSERT_AFTER_CURSOR with [] returns state unchanged', () => {
    const items = makeAlbumItems(3, 'batch-empty-insert');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 1 },
    ]);

    const result = queueReducer(state, {
      type: 'INSERT_AFTER_CURSOR',
      items: [],
    });

    // Guard clause: toInsert.length === 0 => return state
    expect(result).toBe(state);
  });

  it('APPEND_ITEMS with [] returns state unchanged', () => {
    const items = makeAlbumItems(3, 'batch-empty-append');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 1 },
    ]);

    const result = queueReducer(state, {
      type: 'APPEND_ITEMS',
      items: [],
    });

    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// 11. APPEND_ITEMS to queue with cursor at -1
// ---------------------------------------------------------------------------
describe('APPEND_ITEMS to queue with cursor at -1', () => {
  it('Start empty, APPEND 3 items -- cursor stays -1 (user has not started playing)', () => {
    const items = makeAlbumItems(3, 'batch-append-no-play');

    let state = queueReducer(initialQueueState, {
      type: 'APPEND_ITEMS',
      items,
    });

    expect(state.items).toHaveLength(3);
    // APPEND_ITEMS does not touch cursorIndex
    expect(state.cursorIndex).toBe(-1);
  });

  it('APPEND then SET_CURSOR to start playing', () => {
    const items = makeAlbumItems(3, 'batch-append-then-play');

    let state = runActions(initialQueueState, [
      { type: 'APPEND_ITEMS', items },
    ]);

    expect(state.cursorIndex).toBe(-1);

    // Now user starts playing
    state = queueReducer(state, { type: 'SET_CURSOR', index: 0 });
    expect(state.cursorIndex).toBe(0);
    expect(state.items[0].queueId).toBe(items[0].queueId);
  });
});

// ---------------------------------------------------------------------------
// Additional adversarial tests
// ---------------------------------------------------------------------------

describe('SET_CURSOR boundary conditions', () => {
  it('SET_CURSOR with negative index returns state unchanged', () => {
    const items = makeAlbumItems(3, 'batch-set-neg');
    const state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const result = queueReducer(state, { type: 'SET_CURSOR', index: -1 });
    expect(result).toBe(state);
  });

  it('SET_CURSOR with index >= items.length returns state unchanged', () => {
    const items = makeAlbumItems(3, 'batch-set-oob');
    const state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const result = queueReducer(state, { type: 'SET_CURSOR', index: 3 });
    expect(result).toBe(state);
  });

  it('SET_CURSOR with index = items.length - 1 succeeds', () => {
    const items = makeAlbumItems(3, 'batch-set-last');
    const state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const result = queueReducer(state, { type: 'SET_CURSOR', index: 2 });
    expect(result.cursorIndex).toBe(2);
  });
});

describe('MOVE_ITEM boundary conditions', () => {
  it('MOVE_ITEM with out-of-bounds fromIndex returns state unchanged', () => {
    const items = makeAlbumItems(3, 'batch-mv-oob');
    const state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const result = queueReducer(state, {
      type: 'MOVE_ITEM',
      fromIndex: -1,
      toIndex: 0,
    });
    expect(result).toBe(state);

    const result2 = queueReducer(state, {
      type: 'MOVE_ITEM',
      fromIndex: 3,
      toIndex: 0,
    });
    expect(result2).toBe(state);
  });

  it('MOVE_ITEM with out-of-bounds toIndex returns state unchanged', () => {
    const items = makeAlbumItems(3, 'batch-mv-oob2');
    const state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const result = queueReducer(state, {
      type: 'MOVE_ITEM',
      fromIndex: 0,
      toIndex: -1,
    });
    expect(result).toBe(state);

    const result2 = queueReducer(state, {
      type: 'MOVE_ITEM',
      fromIndex: 0,
      toIndex: 3,
    });
    expect(result2).toBe(state);
  });
});

describe('MOVE_BLOCK boundary conditions', () => {
  it('startIndex > endIndex returns state unchanged', () => {
    const items = makeAlbumItems(5, 'batch-mb-inv');
    const state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const result = queueReducer(state, {
      type: 'MOVE_BLOCK',
      batchId: 'batch-mb-inv',
      startIndex: 3,
      endIndex: 1,
      targetIndex: 0,
    });
    expect(result).toBe(state);
  });

  it('startIndex < 0 returns state unchanged', () => {
    const items = makeAlbumItems(3, 'batch-mb-neg');
    const state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const result = queueReducer(state, {
      type: 'MOVE_BLOCK',
      batchId: 'batch-mb-neg',
      startIndex: -1,
      endIndex: 2,
      targetIndex: 0,
    });
    expect(result).toBe(state);
  });

  it('endIndex >= items.length returns state unchanged', () => {
    const items = makeAlbumItems(3, 'batch-mb-oob');
    const state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    const result = queueReducer(state, {
      type: 'MOVE_BLOCK',
      batchId: 'batch-mb-oob',
      startIndex: 0,
      endIndex: 5,
      targetIndex: 0,
    });
    expect(result).toBe(state);
  });
});

describe('RETREAT_CURSOR edge cases', () => {
  it('RETREAT_CURSOR at index 0 with repeat=off stays at 0', () => {
    const items = makeAlbumItems(3, 'batch-retreat');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    state = queueReducer(state, { type: 'RETREAT_CURSOR' });
    // prevIdx = 0 - 1 = -1, which is < 0, repeat != all, so stays at 0
    expect(state.cursorIndex).toBe(0);
  });

  it('RETREAT_CURSOR at index 0 with repeat=all wraps to last item', () => {
    const items = makeAlbumItems(5, 'batch-retreat-wrap');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
      { type: 'SET_REPEAT', mode: 'all' },
    ]);

    state = queueReducer(state, { type: 'RETREAT_CURSOR' });
    expect(state.cursorIndex).toBe(4); // items.length - 1
  });

  it('RETREAT_CURSOR with repeat=one still retreats (no special case)', () => {
    const items = makeAlbumItems(3, 'batch-retreat-one');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 1 },
      { type: 'SET_REPEAT', mode: 'one' },
    ]);

    state = queueReducer(state, { type: 'RETREAT_CURSOR' });
    // RETREAT_CURSOR does NOT check for repeat=one, so it decrements normally
    expect(state.cursorIndex).toBe(0);
  });
});

describe('MARK_PLAYED edge cases', () => {
  it('MARK_PLAYED when cursor is past end (cursorIndex >= items.length) -- no crash', () => {
    const items = makeAlbumItems(2, 'batch-mark-oob');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    // Advance past end
    state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
    state = queueReducer(state, { type: 'ADVANCE_CURSOR' });
    expect(state.cursorIndex).toBe(2); // past end

    // MARK_PLAYED should be a no-op since cursor is out of bounds
    const result = queueReducer(state, { type: 'MARK_PLAYED' });
    expect(result).toBe(state);
  });
});

describe('LOAD_ITEMS preserves repeat mode', () => {
  it('LOAD_ITEMS preserves existing repeat setting', () => {
    let state = queueReducer(initialQueueState, {
      type: 'SET_REPEAT',
      mode: 'all',
    });

    const items = makeAlbumItems(3, 'batch-load-repeat');
    state = queueReducer(state, {
      type: 'LOAD_ITEMS',
      items,
      cursorIndex: 0,
    });

    expect(state.repeat).toBe('all');
    expect(state.items).toHaveLength(3);
    expect(state.cursorIndex).toBe(0);
  });
});

describe('Interleaved operations stress', () => {
  it('Rapid insert, remove, move sequence does not corrupt state', () => {
    const items = makeAlbumItems(5, 'batch-interleave');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 2 },
    ]);

    // Insert after cursor
    const newItem = makeQueueItem({ queueId: 'q-new-interleave' });
    state = queueReducer(state, {
      type: 'INSERT_AFTER_CURSOR',
      items: newItem,
    });
    expect(state.items).toHaveLength(6);
    expect(state.cursorIndex).toBe(2);

    // Remove item before cursor
    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: items[0].queueId,
    });
    expect(state.items).toHaveLength(5);
    expect(state.cursorIndex).toBe(1);

    // Move item from after cursor to before cursor
    state = queueReducer(state, {
      type: 'MOVE_ITEM',
      fromIndex: 3,
      toIndex: 0,
    });
    expect(state.cursorIndex).toBe(2); // incremented because move crossed cursor

    // Remove the inserted item
    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: 'q-new-interleave',
    });
    expect(state.items).toHaveLength(4);

    // Verify no item duplication and no items lost
    const queueIds = state.items.map((i) => i.queueId);
    const uniqueIds = new Set(queueIds);
    expect(uniqueIds.size).toBe(queueIds.length);
  });
});

describe('CLEAR_UPCOMING edge cases', () => {
  it('CLEAR_UPCOMING when cursor is at index 0 keeps only first item', () => {
    const items = makeAlbumItems(5, 'batch-clear-at-zero');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    state = queueReducer(state, { type: 'CLEAR_UPCOMING' });
    expect(state.items).toHaveLength(1);
    expect(state.cursorIndex).toBe(0);
    expect(state.items[0].queueId).toBe(items[0].queueId);
  });

  it('CLEAR_UPCOMING when cursor is at last item is a no-op (nothing to clear)', () => {
    const items = makeAlbumItems(3, 'batch-clear-at-end');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 2 },
    ]);

    const result = queueReducer(state, { type: 'CLEAR_UPCOMING' });
    // Kept = items.slice(0, 3) which is the full array
    expect(result.items).toHaveLength(3);
    expect(result.cursorIndex).toBe(2);
  });

  it('CLEAR_UPCOMING when cursor is -1 returns state unchanged', () => {
    const items = makeAlbumItems(3, 'batch-clear-neg');
    let state: UnifiedQueue = {
      items,
      cursorIndex: -1,
      repeat: 'off',
    };

    const result = queueReducer(state, { type: 'CLEAR_UPCOMING' });
    // Guard clause: cursorIndex < 0 => return state
    expect(result).toBe(state);
  });
});

describe('RESET_PLAYED on empty queue', () => {
  it('RESET_PLAYED on empty queue does not crash', () => {
    const result = queueReducer(initialQueueState, { type: 'RESET_PLAYED' });
    expect(result.items).toHaveLength(0);
  });
});

describe('Double remove same item', () => {
  it('Removing the same queueId twice -- second remove is a no-op', () => {
    const items = makeAlbumItems(3, 'batch-double-rem');
    let state = runActions(initialQueueState, [
      { type: 'LOAD_ITEMS', items, cursorIndex: 0 },
    ]);

    state = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: items[1].queueId,
    });
    expect(state.items).toHaveLength(2);

    const result = queueReducer(state, {
      type: 'REMOVE_ITEM',
      queueId: items[1].queueId,
    });
    // Already removed, findIndex returns -1, early return
    expect(result).toBe(state);
    expect(result.items).toHaveLength(2);
  });
});
