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
  useState,
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
  generateBatchId,
} from '@/lib/queueTypes';
import type { ChipGlow, ChipGlowType } from '@/lib/chipGlow';
import { sanitizeStreamUrl } from '@/lib/urlUtils';
import { trackAddToQueue, trackPlayNext, trackQueueReorder, trackVersionChange, trackRepeatChange } from '@/lib/analytics';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { saveQueueSnapshot, mergeQueueSnapshot, AuthExpiredError } from '@/lib/magentoSync';
import { getStoredToken } from '@/lib/magentoAuth';

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
  | { type: 'DETACH_ITEM'; queueId: string; targetIndex: number }
  | { type: 'RESTORE_FROM_HISTORY'; queueId: string; targetIndex: number }
  | { type: 'CLEAR_UPCOMING' }
  | { type: 'REMOVE_BATCH'; batchId: string }
  | { type: 'PLAY_NOW'; item: QueueItem };

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

      // Nothing playing — append and start playing the first inserted item
      if (state.items.length === 0 || state.cursorIndex < 0) {
        return { ...state, items: [...state.items, ...toInsert], cursorIndex: state.items.length };
      }

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

      // Nothing playing — append and start playing the first appended item
      if (state.items.length === 0 || state.cursorIndex < 0) {
        return { ...state, items: [...state.items, ...toAppend], cursorIndex: state.items.length };
      }

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
        if (removeIdx < newItems.length) {
          // Next item takes over at same index
          newCursor = removeIdx;
        } else {
          // Nothing upcoming — stop playback
          newCursor = -1;
        }
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

    case 'DETACH_ITEM': {
      const { queueId, targetIndex } = action;
      const fromIndex = state.items.findIndex(item => item.queueId === queueId);
      if (fromIndex === -1) return state;
      if (targetIndex < 0 || targetIndex > state.items.length) return state;

      const newItems = [...state.items];
      const [item] = newItems.splice(fromIndex, 1);
      const adjustedTarget = targetIndex > fromIndex ? targetIndex - 1 : targetIndex;
      const detachedItem = { ...item, batchId: generateBatchId() };
      newItems.splice(adjustedTarget, 0, detachedItem);

      let newCursor = state.cursorIndex;
      if (fromIndex === state.cursorIndex) {
        newCursor = adjustedTarget;
      } else {
        if (fromIndex < state.cursorIndex && adjustedTarget >= state.cursorIndex) {
          newCursor = state.cursorIndex - 1;
        } else if (fromIndex > state.cursorIndex && adjustedTarget <= state.cursorIndex) {
          newCursor = state.cursorIndex + 1;
        }
      }

      return { ...state, items: newItems, cursorIndex: newCursor };
    }

    case 'RESTORE_FROM_HISTORY': {
      const { queueId, targetIndex } = action;
      const fromIndex = state.items.findIndex(item => item.queueId === queueId);
      if (fromIndex === -1) return state;
      // Only allow restoring items that are before the cursor (history)
      if (fromIndex >= state.cursorIndex) return state;

      const newItems = [...state.items];
      const [item] = newItems.splice(fromIndex, 1);
      // Cursor decrements because we removed an item before it
      const newCursor = state.cursorIndex - 1;
      // Adjust target for the removal, clamp to upcoming zone
      const adjustedTarget = Math.max(
        newCursor + 1,
        targetIndex > fromIndex ? targetIndex - 1 : targetIndex,
      );
      const restoredItem = { ...item, played: false, batchId: generateBatchId() };
      newItems.splice(adjustedTarget, 0, restoredItem);

      return { ...state, items: newItems, cursorIndex: newCursor };
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

      // Nothing more to play -- clear queue entirely
      return {
        ...state,
        items: [],
        cursorIndex: -1,
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

    case 'REMOVE_BATCH': {
      const { batchId } = action;
      const newItems = state.items.filter(
        (item, i) => item.batchId !== batchId || i <= state.cursorIndex,
      );
      if (newItems.length === state.items.length) return state;

      // Cursor stays the same — we only remove items after cursor
      return {
        ...state,
        items: newItems,
      };
    }

    case 'PLAY_NOW': {
      const newItem = action.item;

      // Nothing playing — append and start playing
      if (state.items.length === 0 || state.cursorIndex < 0) {
        return { ...state, items: [...state.items, newItem], cursorIndex: state.items.length };
      }

      // Already playing this exact song — no-op (let PlayerContext toggle play/pause)
      const current = state.items[state.cursorIndex];
      if (current && current.song.id === newItem.song.id) {
        return state;
      }

      // Insert after cursor and advance to it atomically
      const insertAt = state.cursorIndex + 1;
      const newItems = [...state.items];
      newItems.splice(insertAt, 0, newItem);

      return {
        ...state,
        items: newItems,
        cursorIndex: insertAt,
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
  playNext: (items: QueueItem | QueueItem[], opts?: { glow?: ChipGlowType }) => void;
  playNow: (item: QueueItem, opts?: { glow?: ChipGlowType }) => void;
  addToQueue: (items: QueueItem | QueueItem[]) => void;
  removeItem: (queueId: string) => void;
  moveItem: (fromIndex: number, toIndex: number) => void;
  detachItem: (queueId: string, targetIndex: number) => void;
  restoreFromHistory: (queueId: string, targetIndex: number) => void;
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
  removeBatch: (batchId: string) => void;

  // Chip glow (swap / play-next / queued)
  chipGlow: ChipGlow;

  // Helpers
  albumToItems: (
    album: Album,
    versionOverrides?: Map<string, string>,
  ) => QueueItem[];
  trackToItem: (
    song: Song,
    track?: Track,
    albumSource?: QueueItemAlbumSource,
    availableVersions?: Song[],
  ) => QueueItem;
}

const QueueContext = createContext<QueueContextType | null>(null);

// =============================================================================
// localStorage Persistence
// =============================================================================

const QUEUE_STORAGE_KEY = '8pm_queue_snapshot';
const PROGRESS_STORAGE_KEY = '8pm_playback_progress';

/**
 * Synchronously flush queue state to localStorage.
 * Used for destructive operations (clear, advance-to-empty) to avoid
 * the 500ms debounce race condition where unmount cancels the pending write.
 */
export function flushQueueToStorage(
  queue: UnifiedQueue,
  hasHydrated: boolean,
): void {
  if (typeof window === 'undefined') return;
  if (!hasHydrated) return;
  try {
    if (queue.items.length === 0) {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    } else {
      const snapshot = {
        items: queue.items.map(({ availableVersions, played, ...rest }) => rest),
        cursorIndex: queue.cursorIndex,
        repeat: queue.repeat,
        savedAt: Date.now(),
      };
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(snapshot));
    }
  } catch (e) {
    console.error('[QueueContext] Failed to flush queue to storage:', e);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('8pm:storage-error', { detail: 'queue' }));
    }
  }
}

/** Sanitize an optional URL, returning undefined if input is falsy */
function sanitizeOptionalUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  return sanitizeStreamUrl(url);
}

/** Sanitize all URLs in a Song restored from localStorage */
function sanitizeSongUrls(song: Song): Song {
  return {
    ...song,
    streamUrl: sanitizeOptionalUrl(song.streamUrl) || song.streamUrl,
    qualityUrls: song.qualityUrls ? {
      high: sanitizeOptionalUrl(song.qualityUrls.high),
      medium: sanitizeOptionalUrl(song.qualityUrls.medium),
      low: sanitizeOptionalUrl(song.qualityUrls.low),
    } : song.qualityUrls,
  };
}

function getInitialState(): UnifiedQueue {
  if (typeof window === 'undefined') return initialQueueState;
  try {
    const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Discard snapshots older than 30 days (Archive.org stream URLs go stale)
      if (parsed?.savedAt) {
        const ageInDays = (Date.now() - parsed.savedAt) / (1000 * 60 * 60 * 24);
        if (ageInDays > 30) {
          localStorage.removeItem(QUEUE_STORAGE_KEY);
          return initialQueueState;
        }
      }
      if (parsed && Array.isArray(parsed.items)) {
        const items: QueueItem[] = parsed.items.map((item: QueueItem) => ({
          ...item,
          song: item.song ? sanitizeSongUrls(item.song) : item.song,
          availableVersions: Array.isArray(item.availableVersions) && item.availableVersions.length > 0
            ? item.availableVersions.map(sanitizeSongUrls)
            : item.song ? [sanitizeSongUrls(item.song)] : [],
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
  const { isAuthenticated } = useMagentoAuth();

  // Ref that always holds the latest queue state (stale closure fix)
  const queueRef = useRef(queue);
  queueRef.current = queue;

  // Track whether component has hydrated (prevents clearing localStorage on mount)
  const hasHydrated = useRef(false);
  useEffect(() => { hasHydrated.current = true; }, []);

  // When true, the debounced effect should skip (a sync flush already handled it)
  const skipDebounceRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Debounced localStorage save
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // A synchronous flush already handled this state change — skip the debounce
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      flushQueueToStorage(queue, hasHydrated.current);
    }, 500);

    return () => clearTimeout(timer);
  }, [queue]);

  // ---------------------------------------------------------------------------
  // Debounced server sync (5s after last queue change)
  // ---------------------------------------------------------------------------

  const serverSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAuthRef = useRef(false);
  const hasFetchedFromServerRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthenticated) return;
    if (!hasHydrated.current) return;

    if (serverSyncTimerRef.current) clearTimeout(serverSyncTimerRef.current);

    serverSyncTimerRef.current = setTimeout(() => {
      const q = queueRef.current;
      const savedAt = Date.now();
      if (q.items.length === 0) {
        // Sync empty queue so server knows it was cleared
        saveQueueSnapshot(JSON.stringify({ items: [], cursorIndex: -1, repeat: q.repeat, savedAt }), savedAt)
          .catch(() => {}); // fire-and-forget
      } else {
        const snapshot = {
          items: q.items.map(({ availableVersions, played, ...rest }) => rest),
          cursorIndex: q.cursorIndex,
          repeat: q.repeat,
          savedAt,
        };
        saveQueueSnapshot(JSON.stringify(snapshot), savedAt)
          .catch(() => {}); // fire-and-forget
      }
    }, 5000);

    return () => {
      if (serverSyncTimerRef.current) clearTimeout(serverSyncTimerRef.current);
    };
  }, [queue, isAuthenticated]);

  // ---------------------------------------------------------------------------
  // Fetch server snapshot on login
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const justLoggedIn = isAuthenticated && !prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (!justLoggedIn || hasFetchedFromServerRef.current) return;

    const fetchAndMerge = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;

        const { fetchCustomerCollections } = await import('@/lib/magentoSync');
        const collections = await fetchCustomerCollections(token);

        // Determine local savedAt from localStorage
        let localSavedAt = 0;
        try {
          const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            localSavedAt = parsed?.savedAt || 0;
          }
        } catch {}

        const { useServer, serverSnapshot } = mergeQueueSnapshot(localSavedAt, collections.queue_snapshot);

        if (useServer && serverSnapshot) {
          // Server has a more recent queue — restore it
          const items: QueueItem[] = (serverSnapshot.items as QueueItem[]).map(item => ({
            ...item,
            song: item.song ? sanitizeSongUrls(item.song) : item.song,
            availableVersions: item.song ? [item.song] : [],
            played: false,
          }));

          dispatch({
            type: 'LOAD_ITEMS',
            items,
            cursorIndex: serverSnapshot.cursorIndex,
          });

          if (serverSnapshot.repeat && serverSnapshot.repeat !== 'off') {
            dispatch({ type: 'SET_REPEAT', mode: serverSnapshot.repeat as 'off' | 'all' | 'one' });
          }
        } else if (!useServer && queueRef.current.items.length > 0) {
          // Local is newer — push to server (fire-and-forget)
          const q = queueRef.current;
          const savedAt = Date.now();
          const snapshot = {
            items: q.items.map(({ availableVersions, played, ...rest }) => rest),
            cursorIndex: q.cursorIndex,
            repeat: q.repeat,
            savedAt,
          };
          saveQueueSnapshot(JSON.stringify(snapshot), savedAt, token).catch(() => {});
        }

        hasFetchedFromServerRef.current = true;
      } catch (error) {
        if (error instanceof AuthExpiredError) {
          console.warn('[QueueContext] Auth expired during queue sync');
        } else {
          console.error('[QueueContext] Failed to sync queue from server:', error);
        }
      }
    };

    fetchAndMerge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
  // Chip glow tracking (ephemeral, not persisted)
  // ---------------------------------------------------------------------------

  const [chipGlow, setChipGlow] = useState<ChipGlow>(null);
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerChipGlow = useCallback((queueIds: string[], type: ChipGlowType) => {
    setChipGlow({ queueIds, type });
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    glowTimerRef.current = setTimeout(() => setChipGlow(null), 1800);
  }, []);

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

  const playNext = useCallback((items: QueueItem | QueueItem[], opts?: { glow?: ChipGlowType }) => {
    dispatch({ type: 'INSERT_AFTER_CURSOR', items });
    const arr = Array.isArray(items) ? items : [items];
    if (arr.length > 0) {
      trackPlayNext(arr[0].song);
      triggerChipGlow(arr.map(i => i.queueId), opts?.glow ?? 'play-next');
    }
  }, [triggerChipGlow]);

  const playNow = useCallback((item: QueueItem, opts?: { glow?: ChipGlowType }) => {
    dispatch({ type: 'PLAY_NOW', item });
    triggerChipGlow([item.queueId], opts?.glow ?? 'play-now');
  }, [triggerChipGlow]);

  const addToQueue = useCallback((items: QueueItem | QueueItem[]) => {
    dispatch({ type: 'APPEND_ITEMS', items });
    const arr = Array.isArray(items) ? items : [items];
    if (arr.length > 0) {
      trackAddToQueue(arr[0].song);
      triggerChipGlow(arr.map(i => i.queueId), 'queued');
    }
  }, [triggerChipGlow]);

  const removeItem = useCallback((queueId: string) => {
    const q = queueRef.current;
    dispatch({ type: 'REMOVE_ITEM', queueId });
    // If this removal empties the queue, flush synchronously (same race fix as clearQueue)
    const idx = q.items.findIndex(item => item.queueId === queueId);
    if (idx !== -1 && q.items.length === 1) {
      flushQueueToStorage({ ...initialQueueState, repeat: q.repeat }, hasHydrated.current);
      skipDebounceRef.current = true;
      try { localStorage.removeItem(PROGRESS_STORAGE_KEY); } catch {}
    }
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'MOVE_ITEM', fromIndex, toIndex });
    trackQueueReorder('move_item');
  }, []);

  const detachItem = useCallback((queueId: string, targetIndex: number) => {
    dispatch({ type: 'DETACH_ITEM', queueId, targetIndex });
  }, []);

  const restoreFromHistory = useCallback((queueId: string, targetIndex: number) => {
    dispatch({ type: 'RESTORE_FROM_HISTORY', queueId, targetIndex });
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

    // Detect if advance empties the queue (repeat=off, past end)
    const willEmpty =
      q.repeat === 'off' &&
      q.cursorIndex + 1 >= q.items.length;

    if (willEmpty) {
      const emptyState: UnifiedQueue = { ...initialQueueState, repeat: q.repeat };
      flushQueueToStorage(emptyState, hasHydrated.current);
      skipDebounceRef.current = true;
      try { localStorage.removeItem(PROGRESS_STORAGE_KEY); } catch {}
    }

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
    trackVersionChange(song.trackTitle, song.id);
    triggerChipGlow([queueId], 'swap');
  }, [triggerChipGlow]);

  const markPlayed = useCallback(() => {
    dispatch({ type: 'MARK_PLAYED' });
  }, []);

  const setRepeat = useCallback((mode: 'off' | 'all' | 'one') => {
    dispatch({ type: 'SET_REPEAT', mode });
    trackRepeatChange(mode);
  }, []);

  const clearQueue = useCallback(() => {
    dispatch({ type: 'CLEAR_QUEUE' });
    // Synchronously flush empty state — don't rely on the 500ms debounce
    const emptyState: UnifiedQueue = { ...initialQueueState, repeat: queueRef.current.repeat };
    flushQueueToStorage(emptyState, hasHydrated.current);
    skipDebounceRef.current = true;
    // Clear playback progress so ResumeBar doesn't resurrect a ghost song
    try { localStorage.removeItem(PROGRESS_STORAGE_KEY); } catch {}
  }, []);

  const clearUpcoming = useCallback(() => {
    const q = queueRef.current;
    dispatch({ type: 'CLEAR_UPCOMING' });
    // If items will actually be removed, flush synchronously
    if (q.cursorIndex >= 0 && q.cursorIndex < q.items.length - 1) {
      const kept: UnifiedQueue = {
        items: q.items.slice(0, q.cursorIndex + 1),
        cursorIndex: q.cursorIndex,
        repeat: q.repeat,
      };
      flushQueueToStorage(kept, hasHydrated.current);
      skipDebounceRef.current = true;
    }
  }, []);

  const removeBatch = useCallback((batchId: string) => {
    dispatch({ type: 'REMOVE_BATCH', batchId });
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
      availableVersions?: Song[],
    ): QueueItem => {
      return trackToQueueItem(song, track, albumSource, availableVersions);
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
      playNow,
      addToQueue,
      removeItem,
      moveItem,
      detachItem,
      restoreFromHistory,
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
      removeBatch,

      // Chip glow
      chipGlow,

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
      playNow,
      addToQueue,
      removeItem,
      moveItem,
      detachItem,
      restoreFromHistory,
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
      removeBatch,
      chipGlow,
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
