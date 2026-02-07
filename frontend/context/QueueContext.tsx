'use client';

// QueueContext - Unified flat queue with visual album grouping
// Single items[] array with a cursor. No two-zone split.

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Song, Album, Track } from '@/lib/types';
import {
  QueueItem,
  QueueItemAlbumSource,
  UnifiedQueue,
  AlbumGroup,
  initialQueueState,
  albumToQueueItems,
  trackToQueueItem,
  computeAlbumGroups,
} from '@/lib/queueTypes';

// =============================================================================
// Action Types (discriminated union)
// =============================================================================

export type QueueAction =
  | { type: 'LOAD_ITEMS'; items: QueueItem[]; cursorIndex: number }
  | { type: 'INSERT_AFTER_CURSOR'; items: QueueItem | QueueItem[] }
  | { type: 'APPEND_ITEMS'; items: QueueItem | QueueItem[] }
  | { type: 'REMOVE_ITEM'; queueId: string }
  | { type: 'MOVE_ITEM'; fromIndex: number; toIndex: number }
  | {
      type: 'MOVE_BLOCK';
      batchId: string;
      startIndex: number;
      endIndex: number;
      targetIndex: number;
    }
  | { type: 'SET_CURSOR'; index: number }
  | { type: 'ADVANCE_CURSOR' }
  | { type: 'RETREAT_CURSOR' }
  | { type: 'SELECT_VERSION'; queueId: string; song: Song }
  | { type: 'MARK_PLAYED' }
  | { type: 'RESET_PLAYED' }
  | { type: 'SET_REPEAT'; mode: 'off' | 'all' | 'one' }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'CLEAR_UPCOMING' };

// =============================================================================
// Reducer
// =============================================================================

export function queueReducer(state: UnifiedQueue, action: QueueAction): UnifiedQueue {
  switch (action.type) {
    case 'LOAD_ITEMS': {
      return {
        items: action.items,
        cursorIndex: action.cursorIndex,
        repeat: state.repeat,
      };
    }

    case 'INSERT_AFTER_CURSOR': {
      const toInsert = Array.isArray(action.items)
        ? action.items
        : [action.items];
      if (toInsert.length === 0) return state;

      const insertAt = state.cursorIndex + 1;
      const newItems = [...state.items];
      newItems.splice(insertAt, 0, ...toInsert);

      return {
        ...state,
        items: newItems,
        // Cursor stays the same -- new items are after it
      };
    }

    case 'APPEND_ITEMS': {
      const toAppend = Array.isArray(action.items)
        ? action.items
        : [action.items];
      if (toAppend.length === 0) return state;

      return {
        ...state,
        items: [...state.items, ...toAppend],
      };
    }

    case 'REMOVE_ITEM': {
      const removeIdx = state.items.findIndex(
        (item) => item.queueId === action.queueId,
      );
      if (removeIdx === -1) return state;

      const newItems = state.items.filter((_, i) => i !== removeIdx);
      let newCursor = state.cursorIndex;

      if (newItems.length === 0) {
        newCursor = -1;
      } else if (removeIdx < state.cursorIndex) {
        // Removed item was before cursor -- shift cursor back
        newCursor = state.cursorIndex - 1;
      } else if (removeIdx === state.cursorIndex) {
        // Removed current item -- cursor stays at same index (now next item)
        // Clamp to valid range
        newCursor = Math.min(state.cursorIndex, newItems.length - 1);
      }
      // removeIdx > cursorIndex: no cursor change

      return {
        ...state,
        items: newItems,
        cursorIndex: newCursor,
      };
    }

    case 'MOVE_ITEM': {
      const { fromIndex, toIndex } = action;
      if (
        fromIndex < 0 ||
        fromIndex >= state.items.length ||
        toIndex < 0 ||
        toIndex >= state.items.length ||
        fromIndex === toIndex
      ) {
        return state;
      }

      const newItems = [...state.items];
      const [moved] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, moved);

      // Cursor follows the currently-playing item
      let newCursor = state.cursorIndex;
      if (fromIndex === state.cursorIndex) {
        // The currently-playing item was moved
        newCursor = toIndex;
      } else {
        // Adjust cursor based on items shifting around it
        if (fromIndex < state.cursorIndex && toIndex >= state.cursorIndex) {
          newCursor = state.cursorIndex - 1;
        } else if (
          fromIndex > state.cursorIndex &&
          toIndex <= state.cursorIndex
        ) {
          newCursor = state.cursorIndex + 1;
        }
      }

      return {
        ...state,
        items: newItems,
        cursorIndex: newCursor,
      };
    }

    case 'MOVE_BLOCK': {
      const { batchId, startIndex, endIndex, targetIndex } = action;
      if (startIndex < 0 || endIndex >= state.items.length || startIndex > endIndex) {
        return state;
      }

      // Extract items in the range that match the batchId
      const blockItems: QueueItem[] = [];
      const remainingItems: QueueItem[] = [];
      const cursorItem =
        state.cursorIndex >= 0 && state.cursorIndex < state.items.length
          ? state.items[state.cursorIndex]
          : null;

      for (let i = 0; i < state.items.length; i++) {
        if (
          i >= startIndex &&
          i <= endIndex &&
          state.items[i].batchId === batchId
        ) {
          blockItems.push(state.items[i]);
        } else {
          remainingItems.push(state.items[i]);
        }
      }

      if (blockItems.length === 0) return state;

      // Calculate adjusted target in the remaining array
      let adjustedTarget = targetIndex;
      // Count how many block items were before targetIndex
      let removedBefore = 0;
      for (let i = startIndex; i <= endIndex; i++) {
        if (
          state.items[i].batchId === batchId &&
          i < targetIndex
        ) {
          removedBefore++;
        }
      }
      adjustedTarget = Math.max(0, Math.min(targetIndex - removedBefore, remainingItems.length));

      // Insert block at adjusted target
      const newItems = [...remainingItems];
      newItems.splice(adjustedTarget, 0, ...blockItems);

      // Find cursor by identity
      let newCursor = state.cursorIndex;
      if (cursorItem) {
        newCursor = newItems.findIndex(
          (item) => item.queueId === cursorItem.queueId,
        );
        if (newCursor === -1) newCursor = 0;
      }

      return {
        ...state,
        items: newItems,
        cursorIndex: newCursor,
      };
    }

    case 'SET_CURSOR': {
      const { index } = action;
      if (index < 0 || index >= state.items.length) {
        return state;
      }
      return {
        ...state,
        cursorIndex: index,
      };
    }

    case 'ADVANCE_CURSOR': {
      if (state.items.length === 0) return state;

      // repeat === 'one': don't change cursor (player will restart the same track)
      if (state.repeat === 'one') {
        return state;
      }

      const nextIdx = state.cursorIndex + 1;

      if (nextIdx < state.items.length) {
        return {
          ...state,
          cursorIndex: nextIdx,
        };
      }

      // Past end
      if (state.repeat === 'all') {
        return {
          ...state,
          cursorIndex: 0,
        };
      }

      // Nothing more to play -- cursor past end
      return {
        ...state,
        cursorIndex: state.items.length,
      };
    }

    case 'RETREAT_CURSOR': {
      if (state.items.length === 0) return state;

      const prevIdx = state.cursorIndex - 1;

      if (prevIdx >= 0) {
        return {
          ...state,
          cursorIndex: prevIdx,
        };
      }

      // At start
      if (state.repeat === 'all') {
        return {
          ...state,
          cursorIndex: state.items.length - 1,
        };
      }

      // Stay at 0
      return {
        ...state,
        cursorIndex: 0,
      };
    }

    case 'SELECT_VERSION': {
      const idx = state.items.findIndex(
        (item) => item.queueId === action.queueId,
      );
      if (idx === -1) return state;

      const item = state.items[idx];
      // Only allow version change on unplayed items
      if (item.played) return state;

      const newItems = [...state.items];
      newItems[idx] = {
        ...item,
        song: action.song,
      };

      return {
        ...state,
        items: newItems,
      };
    }

    case 'MARK_PLAYED': {
      if (
        state.cursorIndex < 0 ||
        state.cursorIndex >= state.items.length
      ) {
        return state;
      }

      const newItems = [...state.items];
      newItems[state.cursorIndex] = {
        ...newItems[state.cursorIndex],
        played: true,
      };

      return {
        ...state,
        items: newItems,
      };
    }

    case 'RESET_PLAYED': {
      return {
        ...state,
        items: state.items.map((item) => ({ ...item, played: false })),
      };
    }

    case 'SET_REPEAT': {
      return {
        ...state,
        repeat: action.mode,
      };
    }

    case 'CLEAR_QUEUE': {
      return {
        ...initialQueueState,
        repeat: state.repeat,
      };
    }

    case 'CLEAR_UPCOMING': {
      if (state.cursorIndex < 0) return state;

      const kept = state.items.slice(0, state.cursorIndex + 1);
      return {
        ...state,
        items: kept,
      };
    }

    default:
      return state;
  }
}

// =============================================================================
// Context Type
// =============================================================================

interface QueueContextType {
  // State
  queue: UnifiedQueue;

  // Computed
  currentItem: QueueItem | null;
  currentSong: Song | null;
  albumGroups: AlbumGroup[];
  totalItems: number;
  hasItems: boolean;
  isLastItem: boolean;
  isFirstItem: boolean;

  // Actions
  playAlbum: (
    album: Album,
    startIndex?: number,
    versionOverrides?: Map<string, string>,
  ) => void;
  playNext: (items: QueueItem | QueueItem[]) => void;
  addToQueue: (items: QueueItem | QueueItem[]) => void;
  removeItem: (queueId: string) => void;
  moveItem: (fromIndex: number, toIndex: number) => void;
  moveBlock: (
    batchId: string,
    startIndex: number,
    endIndex: number,
    targetIndex: number,
  ) => void;
  setCursor: (index: number) => void;
  advanceCursor: () => QueueItem | null;
  retreatCursor: () => void;
  peekNext: () => QueueItem | null;
  selectVersion: (queueId: string, song: Song) => void;
  markPlayed: () => void;
  setRepeat: (mode: 'off' | 'all' | 'one') => void;
  clearQueue: () => void;
  clearUpcoming: () => void;

  // Helpers
  albumToItems: (
    album: Album,
    versionOverrides?: Map<string, string>,
  ) => QueueItem[];
  trackToItem: (
    song: Song,
    track?: Track,
    albumSource?: QueueItemAlbumSource,
  ) => QueueItem;
}

const QueueContext = createContext<QueueContextType | null>(null);

// =============================================================================
// localStorage Persistence
// =============================================================================

const QUEUE_STORAGE_KEY = '8pm_queue_snapshot';

function getInitialState(): UnifiedQueue {
  if (typeof window === 'undefined') return initialQueueState;
  try {
    const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.items)) {
        const items: QueueItem[] = parsed.items.map((item: QueueItem) => ({
          ...item,
          availableVersions: item.song ? [item.song] : [],
        }));
        return {
          items,
          cursorIndex: typeof parsed.cursorIndex === 'number' ? parsed.cursorIndex : -1,
          repeat: parsed.repeat || 'off',
        };
      }
    }
  } catch (e) {
    console.error('[QueueContext] Failed to restore queue:', e);
  }
  return initialQueueState;
}

// =============================================================================
// Provider
// =============================================================================

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [queue, dispatch] = useReducer(queueReducer, null, getInitialState);

  // Ref that always holds the latest queue state (stale closure fix)
  const queueRef = useRef(queue);
  queueRef.current = queue;

  // ---------------------------------------------------------------------------
  // Debounced localStorage save
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        if (queue.items.length === 0) {
          localStorage.removeItem(QUEUE_STORAGE_KEY);
          return;
        }
        const snapshot = {
          items: queue.items.map(({ availableVersions, ...rest }) => rest),
          cursorIndex: queue.cursorIndex,
          repeat: queue.repeat,
        };
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(snapshot));
      } catch (e) {
        console.error('[QueueContext] Failed to save queue:', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [queue]);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const currentItem = useMemo((): QueueItem | null => {
    const { items, cursorIndex } = queue;
    if (cursorIndex < 0 || cursorIndex >= items.length) {
      return null;
    }
    return items[cursorIndex];
  }, [queue.items, queue.cursorIndex]);

  const currentSong = useMemo((): Song | null => {
    return currentItem?.song ?? null;
  }, [currentItem]);

  const albumGroups = useMemo(
    () => computeAlbumGroups(queue.items, queue.cursorIndex),
    [queue.items, queue.cursorIndex],
  );

  const totalItems = queue.items.length;
  const hasItems = queue.items.length > 0;
  const isLastItem =
    queue.cursorIndex >= 0 && queue.cursorIndex >= queue.items.length - 1;
  const isFirstItem = queue.cursorIndex <= 0;

  // ---------------------------------------------------------------------------
  // Helper to compute what the "next" item would be without dispatching
  // ---------------------------------------------------------------------------

  function peekNextFromState(q: UnifiedQueue): QueueItem | null {
    if (q.items.length === 0) return null;

    if (q.repeat === 'one') {
      // repeat-one: same item again
      if (q.cursorIndex >= 0 && q.cursorIndex < q.items.length) {
        return q.items[q.cursorIndex];
      }
      return null;
    }

    const nextIdx = q.cursorIndex + 1;

    if (nextIdx < q.items.length) {
      return q.items[nextIdx];
    }

    // Past end
    if (q.repeat === 'all' && q.items.length > 0) {
      return q.items[0];
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const playAlbum = useCallback(
    (
      album: Album,
      startIndex?: number,
      versionOverrides?: Map<string, string>,
    ) => {
      const items = albumToQueueItems(album, versionOverrides);
      dispatch({
        type: 'LOAD_ITEMS',
        items,
        cursorIndex: startIndex ?? 0,
      });
    },
    [],
  );

  const playNext = useCallback((items: QueueItem | QueueItem[]) => {
    dispatch({ type: 'INSERT_AFTER_CURSOR', items });
  }, []);

  const addToQueue = useCallback((items: QueueItem | QueueItem[]) => {
    dispatch({ type: 'APPEND_ITEMS', items });
  }, []);

  const removeItem = useCallback((queueId: string) => {
    dispatch({ type: 'REMOVE_ITEM', queueId });
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'MOVE_ITEM', fromIndex, toIndex });
  }, []);

  const moveBlock = useCallback(
    (
      batchId: string,
      startIndex: number,
      endIndex: number,
      targetIndex: number,
    ) => {
      dispatch({ type: 'MOVE_BLOCK', batchId, startIndex, endIndex, targetIndex });
    },
    [],
  );

  const setCursor = useCallback((index: number) => {
    dispatch({ type: 'SET_CURSOR', index });
  }, []);

  // advanceCursor: reads from ref to avoid stale closures
  const advanceCursor = useCallback((): QueueItem | null => {
    const q = queueRef.current;

    // Pre-compute what the next item will be
    const nextItem = peekNextFromState(q);

    // Dispatch the state change
    dispatch({ type: 'ADVANCE_CURSOR' });

    return nextItem;
  }, []); // Empty deps -- uses ref

  const retreatCursor = useCallback(() => {
    dispatch({ type: 'RETREAT_CURSOR' });
  }, []);

  // peekNext: reads from ref for consistency
  const peekNext = useCallback((): QueueItem | null => {
    return peekNextFromState(queueRef.current);
  }, []); // Empty deps -- uses ref

  const selectVersion = useCallback((queueId: string, song: Song) => {
    dispatch({ type: 'SELECT_VERSION', queueId, song });
  }, []);

  const markPlayed = useCallback(() => {
    dispatch({ type: 'MARK_PLAYED' });
  }, []);

  const setRepeat = useCallback((mode: 'off' | 'all' | 'one') => {
    dispatch({ type: 'SET_REPEAT', mode });
  }, []);

  const clearQueue = useCallback(() => {
    dispatch({ type: 'CLEAR_QUEUE' });
  }, []);

  const clearUpcoming = useCallback(() => {
    dispatch({ type: 'CLEAR_UPCOMING' });
  }, []);

  // ---------------------------------------------------------------------------
  // Helpers (passthroughs)
  // ---------------------------------------------------------------------------

  const albumToItems = useCallback(
    (album: Album, versionOverrides?: Map<string, string>): QueueItem[] => {
      return albumToQueueItems(album, versionOverrides);
    },
    [],
  );

  const trackToItem = useCallback(
    (
      song: Song,
      track?: Track,
      albumSource?: QueueItemAlbumSource,
    ): QueueItem => {
      return trackToQueueItem(song, track, albumSource);
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value: QueueContextType = useMemo(
    () => ({
      // State
      queue,

      // Computed
      currentItem,
      currentSong,
      albumGroups,
      totalItems,
      hasItems,
      isLastItem,
      isFirstItem,

      // Actions
      playAlbum,
      playNext,
      addToQueue,
      removeItem,
      moveItem,
      moveBlock,
      setCursor,
      advanceCursor,
      retreatCursor,
      peekNext,
      selectVersion,
      markPlayed,
      setRepeat,
      clearQueue,
      clearUpcoming,

      // Helpers
      albumToItems,
      trackToItem,
    }),
    [
      queue,
      currentItem,
      currentSong,
      albumGroups,
      totalItems,
      hasItems,
      isLastItem,
      isFirstItem,
      playAlbum,
      playNext,
      addToQueue,
      removeItem,
      moveItem,
      moveBlock,
      setCursor,
      advanceCursor,
      retreatCursor,
      peekNext,
      selectVersion,
      markPlayed,
      setRepeat,
      clearQueue,
      clearUpcoming,
      albumToItems,
      trackToItem,
    ],
  );

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
