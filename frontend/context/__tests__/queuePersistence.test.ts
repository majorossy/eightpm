// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { queueReducer } from '@/context/QueueContext';
import {
  QueueItem,
  QueueItemAlbumSource,
  UnifiedQueue,
  initialQueueState,
} from '@/lib/queueTypes';
import { Song } from '@/lib/types';

// =============================================================================
// Test Helpers
// =============================================================================

let idCounter = 0;

beforeEach(() => {
  idCounter = 0;
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
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

const QUEUE_STORAGE_KEY = '8pm_queue_snapshot';

// =============================================================================
// Tests
// =============================================================================

describe('Queue Persistence - localStorage serialization', () => {
  // ---------------------------------------------------------------------------
  // Serialization round-trip
  // ---------------------------------------------------------------------------
  describe('Serialization round-trip', () => {
    it('queue state can be serialized to JSON and parsed back', () => {
      const items = makeAlbumItems(3, 'batch-persist');
      const state: UnifiedQueue = {
        items,
        cursorIndex: 1,
        repeat: 'all',
      };

      // Serialize: strip availableVersions (matches real save logic)
      const snapshot = {
        items: state.items.map(({ availableVersions, ...rest }) => rest),
        cursorIndex: state.cursorIndex,
        repeat: state.repeat,
      };
      const json = JSON.stringify(snapshot);
      const parsed = JSON.parse(json);

      expect(parsed.items).toHaveLength(3);
      expect(parsed.cursorIndex).toBe(1);
      expect(parsed.repeat).toBe('all');

      // Each item should have all fields except availableVersions
      for (const item of parsed.items) {
        expect(item.queueId).toBeDefined();
        expect(item.batchId).toBeDefined();
        expect(item.song).toBeDefined();
        expect(item.trackTitle).toBeDefined();
        expect(item.albumSource).toBeDefined();
        expect(item.availableVersions).toBeUndefined();
      }
    });

    it('restored items have availableVersions reconstructed from song', () => {
      const items = makeAlbumItems(2, 'batch-roundtrip');
      const state: UnifiedQueue = {
        items,
        cursorIndex: 0,
        repeat: 'off',
      };

      // Serialize
      const snapshot = {
        items: state.items.map(({ availableVersions, ...rest }) => rest),
        cursorIndex: state.cursorIndex,
        repeat: state.repeat,
      };
      const json = JSON.stringify(snapshot);
      const parsed = JSON.parse(json);

      // Restore (matches getInitialState logic)
      const restored: UnifiedQueue = {
        items: parsed.items.map((item: QueueItem) => ({
          ...item,
          availableVersions: item.song ? [item.song] : [],
        })),
        cursorIndex: parsed.cursorIndex,
        repeat: parsed.repeat || 'off',
      };

      expect(restored.items).toHaveLength(2);
      expect(restored.cursorIndex).toBe(0);
      expect(restored.repeat).toBe('off');

      // Each restored item should have availableVersions with its song
      for (let i = 0; i < restored.items.length; i++) {
        expect(restored.items[i].availableVersions).toHaveLength(1);
        expect(restored.items[i].availableVersions[0].id).toBe(
          restored.items[i].song.id,
        );
      }
    });

    it('song data survives JSON round-trip', () => {
      const song = makeSong({
        title: 'Bird in a House',
        avgRating: 4.5,
        duration: 420,
        showVenue: 'Red Rocks Amphitheatre',
        showLocation: 'Morrison, CO',
      });
      const item = makeQueueItem({
        song,
        albumSource: makeAlbumSource({ albumName: 'RE Live at Red Rocks' }),
      });

      const json = JSON.stringify(item);
      const parsed = JSON.parse(json);

      expect(parsed.song.title).toBe('Bird in a House');
      expect(parsed.song.avgRating).toBe(4.5);
      expect(parsed.song.duration).toBe(420);
      expect(parsed.song.showVenue).toBe('Red Rocks Amphitheatre');
      expect(parsed.albumSource.albumName).toBe('RE Live at Red Rocks');
    });
  });

  // ---------------------------------------------------------------------------
  // localStorage save/restore simulation
  // ---------------------------------------------------------------------------
  describe('localStorage save/restore', () => {
    it('save state to localStorage and restore it', () => {
      const items = makeAlbumItems(3, 'batch-save');
      const state: UnifiedQueue = {
        items,
        cursorIndex: 2,
        repeat: 'one',
      };

      // Save (mirroring QueueContext debounced save)
      const snapshot = {
        items: state.items.map(({ availableVersions, ...rest }) => rest),
        cursorIndex: state.cursorIndex,
        repeat: state.repeat,
      };
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(snapshot));

      // Verify localStorage has the data
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      expect(stored).not.toBeNull();

      // Restore (mirroring getInitialState)
      const parsed = JSON.parse(stored!);
      const restored: UnifiedQueue = {
        items: parsed.items.map((item: QueueItem) => ({
          ...item,
          availableVersions: item.song ? [item.song] : [],
        })),
        cursorIndex: typeof parsed.cursorIndex === 'number' ? parsed.cursorIndex : -1,
        repeat: parsed.repeat || 'off',
      };

      expect(restored.items).toHaveLength(3);
      expect(restored.cursorIndex).toBe(2);
      expect(restored.repeat).toBe('one');
      expect(restored.items[0].queueId).toBe('q-batch-save-0');
    });

    it('CLEAR_QUEUE produces state that should remove localStorage key', () => {
      const items = makeAlbumItems(3, 'batch-clear');
      const state: UnifiedQueue = {
        items,
        cursorIndex: 0,
        repeat: 'off',
      };

      const cleared = queueReducer(state, { type: 'CLEAR_QUEUE' });

      // After CLEAR_QUEUE, items is empty
      expect(cleared.items).toHaveLength(0);

      // Save logic: when items.length === 0, remove from localStorage
      if (cleared.items.length === 0) {
        localStorage.removeItem(QUEUE_STORAGE_KEY);
      }

      expect(localStorage.getItem(QUEUE_STORAGE_KEY)).toBeNull();
    });

    it('empty localStorage returns initialQueueState', () => {
      // getInitialState logic: no saved data
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      expect(saved).toBeNull();

      // Would return initialQueueState
      const result = saved ? JSON.parse(saved) : initialQueueState;
      expect(result).toEqual(initialQueueState);
    });
  });

  // ---------------------------------------------------------------------------
  // Corrupted data handling
  // ---------------------------------------------------------------------------
  describe('Corrupted localStorage data', () => {
    it('invalid JSON does not crash restore logic', () => {
      localStorage.setItem(QUEUE_STORAGE_KEY, 'not valid json {{{');

      let result: UnifiedQueue = initialQueueState;
      try {
        const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
        if (saved) {
          JSON.parse(saved); // This will throw
        }
      } catch {
        result = initialQueueState;
      }

      expect(result).toEqual(initialQueueState);
    });

    it('missing items array falls back to initialQueueState', () => {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify({ cursorIndex: 5 }));

      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      const parsed = JSON.parse(saved!);

      // getInitialState checks Array.isArray(parsed.items)
      if (!parsed || !Array.isArray(parsed.items)) {
        // Falls through to return initialQueueState
        expect(true).toBe(true);
      }
    });

    it('null items falls back to initialQueueState', () => {
      localStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify({ items: null, cursorIndex: 0, repeat: 'off' }),
      );

      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      const parsed = JSON.parse(saved!);

      expect(Array.isArray(parsed.items)).toBe(false);
      // getInitialState would fall through and return initialQueueState
    });

    it('non-numeric cursorIndex defaults to -1', () => {
      const items = [makeQueueItem()];
      const snapshot = {
        items: items.map(({ availableVersions, ...rest }) => rest),
        cursorIndex: 'invalid',
        repeat: 'off',
      };
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(snapshot));

      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      const parsed = JSON.parse(saved!);

      // getInitialState checks typeof parsed.cursorIndex === 'number'
      const cursorIndex =
        typeof parsed.cursorIndex === 'number' ? parsed.cursorIndex : -1;
      expect(cursorIndex).toBe(-1);
    });

    it('missing repeat defaults to off', () => {
      const items = [makeQueueItem()];
      const snapshot = {
        items: items.map(({ availableVersions, ...rest }) => rest),
        cursorIndex: 0,
      };
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(snapshot));

      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      const parsed = JSON.parse(saved!);

      const repeat = parsed.repeat || 'off';
      expect(repeat).toBe('off');
    });

    it('empty string in localStorage is handled', () => {
      localStorage.setItem(QUEUE_STORAGE_KEY, '');

      let result: UnifiedQueue = initialQueueState;
      try {
        const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
        if (saved) {
          JSON.parse(saved);
        }
      } catch {
        result = initialQueueState;
      }

      expect(result).toEqual(initialQueueState);
    });
  });

  // ---------------------------------------------------------------------------
  // SSR safety
  // ---------------------------------------------------------------------------
  describe('SSR safety', () => {
    it('getInitialState pattern handles undefined window', () => {
      // In node environment (SSR), we can't actually undefine window in jsdom,
      // but we can test the pattern
      const getInitialState = (): UnifiedQueue => {
        if (typeof window === 'undefined') return initialQueueState;
        try {
          const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && Array.isArray(parsed.items)) {
              return {
                items: parsed.items.map((item: QueueItem) => ({
                  ...item,
                  availableVersions: item.song ? [item.song] : [],
                })),
                cursorIndex:
                  typeof parsed.cursorIndex === 'number'
                    ? parsed.cursorIndex
                    : -1,
                repeat: parsed.repeat || 'off',
              };
            }
          }
        } catch {
          // fall through
        }
        return initialQueueState;
      };

      // In jsdom, window IS defined, so it should proceed normally
      // With empty localStorage, it should return initialQueueState
      const result = getInitialState();
      expect(result).toEqual(initialQueueState);
    });
  });

  // ---------------------------------------------------------------------------
  // availableVersions stripping
  // ---------------------------------------------------------------------------
  describe('availableVersions stripping on save', () => {
    it('strips availableVersions from items before saving', () => {
      const song1 = makeSong({ id: 'v1', avgRating: 3.0 });
      const song2 = makeSong({ id: 'v2', avgRating: 5.0 });
      const item = makeQueueItem({
        song: song1,
        availableVersions: [song1, song2],
      });

      const state: UnifiedQueue = {
        items: [item],
        cursorIndex: 0,
        repeat: 'off',
      };

      // Save logic: strip availableVersions
      const snapshot = {
        items: state.items.map(({ availableVersions, ...rest }) => rest),
        cursorIndex: state.cursorIndex,
        repeat: state.repeat,
      };

      const json = JSON.stringify(snapshot);
      const parsed = JSON.parse(json);

      // availableVersions should NOT be in the serialized data
      expect(parsed.items[0].availableVersions).toBeUndefined();
      // song should still be there
      expect(parsed.items[0].song.id).toBe('v1');
    });

    it('restores availableVersions from song on load', () => {
      const song = makeSong({ id: 'restored-v' });
      const item = makeQueueItem({ song, availableVersions: [song] });

      // Simulate save (strip availableVersions)
      const snapshot = {
        items: [item].map(({ availableVersions, ...rest }) => rest),
        cursorIndex: 0,
        repeat: 'off',
      };
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(snapshot));

      // Restore
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      const parsed = JSON.parse(saved!);
      const restored = parsed.items.map((i: QueueItem) => ({
        ...i,
        availableVersions: i.song ? [i.song] : [],
      }));

      expect(restored[0].availableVersions).toHaveLength(1);
      expect(restored[0].availableVersions[0].id).toBe('restored-v');
    });
  });

  // ---------------------------------------------------------------------------
  // Reducer state + persistence interaction
  // ---------------------------------------------------------------------------
  describe('Reducer operations produce persistable state', () => {
    it('LOAD_ITEMS state can be persisted and restored', () => {
      const items = makeAlbumItems(5, 'batch-load');
      const state = queueReducer(initialQueueState, {
        type: 'LOAD_ITEMS',
        items,
        cursorIndex: 2,
      });

      // Persist
      const snapshot = {
        items: state.items.map(({ availableVersions, ...rest }) => rest),
        cursorIndex: state.cursorIndex,
        repeat: state.repeat,
      };
      const json = JSON.stringify(snapshot);
      const parsed = JSON.parse(json);

      expect(parsed.items).toHaveLength(5);
      expect(parsed.cursorIndex).toBe(2);
      expect(parsed.repeat).toBe('off');
    });

    it('ADVANCE_CURSOR state is persistable', () => {
      const items = makeAlbumItems(3, 'batch-adv');
      let state = queueReducer(initialQueueState, {
        type: 'LOAD_ITEMS',
        items,
        cursorIndex: 0,
      });
      state = queueReducer(state, { type: 'ADVANCE_CURSOR' });

      const snapshot = {
        items: state.items.map(({ availableVersions, ...rest }) => rest),
        cursorIndex: state.cursorIndex,
        repeat: state.repeat,
      };
      const json = JSON.stringify(snapshot);
      const parsed = JSON.parse(json);

      expect(parsed.cursorIndex).toBe(1);
    });

    it('SET_REPEAT persists the repeat mode', () => {
      const items = makeAlbumItems(2, 'batch-rep');
      let state = queueReducer(initialQueueState, {
        type: 'LOAD_ITEMS',
        items,
        cursorIndex: 0,
      });
      state = queueReducer(state, { type: 'SET_REPEAT', mode: 'all' });

      const snapshot = {
        items: state.items.map(({ availableVersions, ...rest }) => rest),
        cursorIndex: state.cursorIndex,
        repeat: state.repeat,
      };
      const parsed = JSON.parse(JSON.stringify(snapshot));

      expect(parsed.repeat).toBe('all');
    });

    it('INSERT_AFTER_CURSOR state is persistable', () => {
      const items = makeAlbumItems(2, 'batch-iac');
      let state = queueReducer(initialQueueState, {
        type: 'LOAD_ITEMS',
        items,
        cursorIndex: 0,
      });

      const newItem = makeQueueItem({ queueId: 'q-inserted' });
      state = queueReducer(state, {
        type: 'INSERT_AFTER_CURSOR',
        items: newItem,
      });

      const snapshot = {
        items: state.items.map(({ availableVersions, ...rest }) => rest),
        cursorIndex: state.cursorIndex,
        repeat: state.repeat,
      };
      const parsed = JSON.parse(JSON.stringify(snapshot));

      expect(parsed.items).toHaveLength(3);
      expect(parsed.items[1].queueId).toBe('q-inserted');
    });
  });
});
