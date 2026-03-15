'use client';

// CollectionContext — Unified context for Cassettes and MiniDiscs
// Uses localStorage for persistence with Magento sync for logged-in users.

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Song, SyncStatus } from '@/lib/types';
import { Cassette } from '@/lib/cassetteTypes';
import { MiniDisc } from '@/lib/minidiscTypes';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import {
  trackMiniDiscCreate,
  trackMiniDiscDelete,
  trackAddToMiniDisc,
  trackRemoveFromMiniDisc,
  trackCassetteSave,
  trackCassetteDelete,
} from '@/lib/analytics';
import { VALIDATION_LIMITS } from '@/lib/validation';
import { useToast } from '@/hooks/useToast';
import {
  fetchCustomerCollections,
  saveCassette as saveCassetteSync,
  deleteCassette as deleteCassetteSync,
  saveMiniDisc as saveMiniDiscSync,
  deleteMiniDisc as deleteMiniDiscSync,
  syncCassettes,
  syncMiniDiscs,
  mergeCassettes,
  mergeMiniDiscs,
  AuthExpiredError,
} from '@/lib/magentoSync';

// ============================================================================
// Context Types
// ============================================================================

interface CollectionContextType {
  // MiniDisc state & methods
  minidiscs: MiniDisc[];
  createMiniDisc: (name: string, description?: string) => MiniDisc;
  deleteMiniDisc: (id: string) => void;
  deleteMiniDiscs: (ids: string[]) => void;
  addToMiniDisc: (id: string, song: Song) => void;
  removeFromMiniDisc: (id: string, songId: string) => void;
  updateMiniDisc: (id: string, updates: Partial<Pick<MiniDisc, 'name' | 'description'>>) => void;
  reorderMiniDisc: (id: string, fromIndex: number, toIndex: number) => void;
  getMiniDisc: (id: string) => MiniDisc | undefined;
  cloneMiniDisc: (id: string) => MiniDisc | undefined;

  // Cassette state & methods
  cassettes: Cassette[];
  saveCassette: (cassette: Omit<Cassette, 'id' | 'createdAt' | 'updatedAt'>) => Cassette;
  deleteCassette: (id: string) => void;
  deleteCassettes: (ids: string[]) => void;
  updateCassette: (id: string, updates: Partial<Pick<Cassette, 'name' | 'versionOverrides' | 'colorIndex' | 'colorHex' | 'colorBrand' | 'isPublic'>>) => void;
  getCassette: (id: string) => Cassette | undefined;
  getCassettesForAlbum: (albumIdentifier: string) => Cassette[];

  // Shared
  isLoading: boolean;
  syncStatus: SyncStatus;
  forceSync: () => Promise<void>;
}

const CollectionContext = createContext<CollectionContextType | null>(null);

// ============================================================================
// Storage Keys & ID Generators
// ============================================================================

const MINIDISCS_STORAGE_KEY = '8pm_minidiscs';
const CASSETTES_STORAGE_KEY = '8pm_cassettes';
const OLD_PLAYLISTS_KEY = 'jamify_playlists';

const generateMiniDiscId = () => `minidisc-${crypto.randomUUID()}`;
const generateCassetteId = () => `cassette-${crypto.randomUUID()}`;

// ============================================================================
// Migration: jamify_playlists → 8pm_minidiscs
// ============================================================================

function migratePlaylistsToMiniDiscs(): MiniDisc[] | null {
  try {
    const existing = localStorage.getItem(MINIDISCS_STORAGE_KEY);
    if (existing) return null; // Already migrated

    const oldData = localStorage.getItem(OLD_PLAYLISTS_KEY);
    if (!oldData) return null;

    const oldPlaylists = JSON.parse(oldData) as Array<{
      id: string;
      name: string;
      description?: string;
      songs: Song[];
      coverArt?: string;
      createdAt: string;
      updatedAt: string;
    }>;

    if (!Array.isArray(oldPlaylists) || oldPlaylists.length === 0) return null;

    const migrated: MiniDisc[] = oldPlaylists.map((p) => ({
      id: p.id, // Preserve IDs for URL compat
      name: p.name,
      description: p.description,
      songs: p.songs || [],
      coverArt: p.coverArt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return migrated;
  } catch {
    return null;
  }
}

// ============================================================================
// Provider
// ============================================================================

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, signOut } = useMagentoAuth();
  const { showWarning, showInfo } = useToast();
  const [minidiscs, setMiniDiscs] = useState<MiniDisc[]>([]);
  const [cassettes, setCassettes] = useState<Cassette[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedFromServerRef = useRef(false);
  const prevAuthRef = useRef(false);

  // ---------- Load from localStorage on mount ----------
  useEffect(() => {
    // Try migration first
    const migrated = migratePlaylistsToMiniDiscs();
    if (migrated) {
      setMiniDiscs(migrated);
      try {
        localStorage.setItem(MINIDISCS_STORAGE_KEY, JSON.stringify(migrated));
      } catch (e) {
        console.error('[CollectionContext] Failed to save migrated minidiscs:', e);
      }
    } else {
      const stored = localStorage.getItem(MINIDISCS_STORAGE_KEY);
      if (stored) {
        try { setMiniDiscs(JSON.parse(stored)); } catch { /* corrupt localStorage */ }
      }
    }

    // Load cassettes
    const storedCassettes = localStorage.getItem(CASSETTES_STORAGE_KEY);
    if (storedCassettes) {
      try { setCassettes(JSON.parse(storedCassettes)); } catch { /* corrupt localStorage */ }
    }

    setIsLoading(false);
  }, []);

  // ---------- Save to localStorage on change ----------
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(MINIDISCS_STORAGE_KEY, JSON.stringify(minidiscs));
      } catch (e) {
        console.error('[CollectionContext] Failed to save minidiscs:', e);
        showWarning('Storage full. Some changes may not be saved locally.');
      }
    }
  }, [minidiscs, isLoading, showWarning]);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CASSETTES_STORAGE_KEY, JSON.stringify(cassettes));
      } catch (e) {
        console.error('[CollectionContext] Failed to save cassettes:', e);
        showWarning('Storage full. Some changes may not be saved locally.');
      }
    }
  }, [cassettes, isLoading, showWarning]);

  // ---------- Sync error handler ----------
  const handleSyncError = useCallback((error: unknown, action: string) => {
    if (error instanceof AuthExpiredError) {
      showWarning('Session expired. Sign in to sync.');
      signOut();
    } else {
      console.error(`Failed to ${action}:`, error);
      setSyncStatus('error');
    }
  }, [showWarning, signOut]);

  // ---------- Fetch from Magento on login ----------
  useEffect(() => {
    const justLoggedIn = isAuthenticated && !prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (!justLoggedIn || hasFetchedFromServerRef.current) return;

    const fetchAndMerge = async () => {
      setSyncStatus('syncing');
      try {
        const collections = await fetchCustomerCollections();

        // Merge cassettes
        const cassetteMerge = mergeCassettes(cassettes, collections.cassettes);
        setCassettes(cassetteMerge.merged);

        // Merge minidiscs
        const miniDiscMerge = mergeMiniDiscs(minidiscs, collections.minidiscs);
        setMiniDiscs(miniDiscMerge.merged);

        // Notify user of server-side updates
        const totalUpdated = cassetteMerge.updatedFromServer + miniDiscMerge.updatedFromServer;
        if (totalUpdated > 0) {
          showInfo(`${totalUpdated} item${totalUpdated > 1 ? 's' : ''} updated from another device`);
        }

        // Push local-only items to server
        if (cassetteMerge.toSync.length > 0) {
          await syncCassettes(cassetteMerge.toSync).catch(() => {});
        }
        if (miniDiscMerge.toSync.length > 0) {
          await syncMiniDiscs(miniDiscMerge.toSync).catch(() => {});
        }

        setSyncStatus('synced');
        hasFetchedFromServerRef.current = true;
      } catch (error) {
        handleSyncError(error, 'fetch collections from server');
      }
    };

    fetchAndMerge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ---------- Debounced sync helper ----------
  const syncMiniDiscDebounced = useCallback(
    (disc: MiniDisc) => {
      if (!isAuthenticated) return;

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      setSyncStatus('syncing');
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await saveMiniDiscSync(disc);
          setSyncStatus('synced');
        } catch (error) {
          handleSyncError(error, 'sync minidisc');
        }
      }, 500);
    },
    [isAuthenticated, handleSyncError],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  // ---------- Force sync ----------
  const forceSync = useCallback(async () => {
    if (!isAuthenticated) return;

    setSyncStatus('syncing');
    try {
      if (cassettes.length > 0) {
        await syncCassettes(cassettes);
      }
      if (minidiscs.length > 0) {
        await syncMiniDiscs(minidiscs);
      }
      setSyncStatus('synced');
    } catch (error) {
      handleSyncError(error, 'force sync collections');
    }
  }, [isAuthenticated, cassettes, minidiscs, handleSyncError]);

  // ======================================================================
  // MiniDisc CRUD
  // ======================================================================

  const createMiniDisc = useCallback(
    (name: string, description?: string): MiniDisc => {
      const sanitizedName = name.trim().slice(0, VALIDATION_LIMITS.PLAYLIST_NAME_MAX);
      const sanitizedDesc = description?.trim().slice(0, VALIDATION_LIMITS.PLAYLIST_DESCRIPTION_MAX);
      if (!sanitizedName) throw new Error('MiniDisc name is required');

      const disc: MiniDisc = {
        id: generateMiniDiscId(),
        name: sanitizedName,
        description: sanitizedDesc,
        songs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMiniDiscs((prev) => [...prev, disc]);
      trackMiniDiscCreate(sanitizedName);
      syncMiniDiscDebounced(disc);
      return disc;
    },
    [syncMiniDiscDebounced],
  );

  const deleteMiniDisc = useCallback(
    (id: string) => {
      const disc = minidiscs.find((m) => m.id === id);
      if (disc) trackMiniDiscDelete(disc.name);
      setMiniDiscs((prev) => prev.filter((m) => m.id !== id));

      // Sync deletion to Magento
      if (isAuthenticated) {
        deleteMiniDiscSync(id).catch(error => handleSyncError(error, 'delete minidisc'));
      }
    },
    [minidiscs, isAuthenticated, handleSyncError],
  );

  const deleteMiniDiscs = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      setMiniDiscs((prev) => prev.filter((m) => !idSet.has(m.id)));

      if (isAuthenticated) {
        for (const id of ids) {
          deleteMiniDiscSync(id).catch(error => handleSyncError(error, 'delete minidisc'));
        }
      }
    },
    [isAuthenticated, handleSyncError],
  );

  const addToMiniDisc = useCallback(
    (id: string, song: Song) => {
      let updated: MiniDisc | null = null;
      let discName: string | undefined;

      setMiniDiscs((prev) =>
        prev.map((disc) => {
          if (disc.id !== id) return disc;
          if (disc.songs.some((s) => s.id === song.id)) return disc;
          discName = disc.name;
          updated = {
            ...disc,
            songs: [...disc.songs, song],
            updatedAt: new Date().toISOString(),
            coverArt: disc.coverArt || song.albumArt,
          };
          return updated;
        }),
      );

      if (updated && discName) trackAddToMiniDisc(song, discName);
      if (updated) syncMiniDiscDebounced(updated);
    },
    [syncMiniDiscDebounced],
  );

  const removeFromMiniDisc = useCallback(
    (id: string, songId: string) => {
      let updated: MiniDisc | null = null;
      let removedSong: Song | undefined;
      let discName: string | undefined;

      setMiniDiscs((prev) =>
        prev.map((disc) => {
          if (disc.id !== id) return disc;
          discName = disc.name;
          removedSong = disc.songs.find((s) => s.id === songId);
          updated = {
            ...disc,
            songs: disc.songs.filter((s) => s.id !== songId),
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }),
      );

      if (removedSong && discName) trackRemoveFromMiniDisc(removedSong, discName);
      if (updated) syncMiniDiscDebounced(updated);
    },
    [syncMiniDiscDebounced],
  );

  const updateMiniDisc = useCallback(
    (id: string, updates: Partial<Pick<MiniDisc, 'name' | 'description'>>) => {
      const sanitized: Partial<Pick<MiniDisc, 'name' | 'description'>> = {};
      if (updates.name !== undefined) {
        const name = updates.name.trim().slice(0, VALIDATION_LIMITS.PLAYLIST_NAME_MAX);
        if (!name) return;
        sanitized.name = name;
      }
      if (updates.description !== undefined) {
        sanitized.description = updates.description.trim().slice(0, VALIDATION_LIMITS.PLAYLIST_DESCRIPTION_MAX);
      }

      let updated: MiniDisc | null = null;
      setMiniDiscs((prev) =>
        prev.map((disc) => {
          if (disc.id !== id) return disc;
          updated = { ...disc, ...sanitized, updatedAt: new Date().toISOString() };
          return updated;
        }),
      );
      if (updated) syncMiniDiscDebounced(updated);
    },
    [syncMiniDiscDebounced],
  );

  const reorderMiniDisc = useCallback(
    (id: string, fromIndex: number, toIndex: number) => {
      let updated: MiniDisc | null = null;
      setMiniDiscs((prev) =>
        prev.map((disc) => {
          if (disc.id !== id) return disc;
          const songs = [...disc.songs];
          const [moved] = songs.splice(fromIndex, 1);
          songs.splice(toIndex, 0, moved);
          updated = { ...disc, songs, updatedAt: new Date().toISOString() };
          return updated;
        }),
      );
      if (updated) syncMiniDiscDebounced(updated);
    },
    [syncMiniDiscDebounced],
  );

  const getMiniDisc = useCallback((id: string) => minidiscs.find((m) => m.id === id), [minidiscs]);

  const cloneMiniDisc = useCallback(
    (id: string): MiniDisc | undefined => {
      const source = minidiscs.find(m => m.id === id);
      if (!source) return undefined;

      const clone: MiniDisc = {
        id: generateMiniDiscId(),
        name: `${source.name} copy`,
        description: source.description,
        songs: [...source.songs],
        coverArt: source.coverArt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMiniDiscs(prev => [...prev, clone]);
      syncMiniDiscDebounced(clone);
      return clone;
    },
    [minidiscs, syncMiniDiscDebounced],
  );

  // ======================================================================
  // Cassette CRUD
  // ======================================================================

  const saveCassette = useCallback(
    (data: Omit<Cassette, 'id' | 'createdAt' | 'updatedAt'>): Cassette => {
      const sanitizedName = data.name.trim().slice(0, VALIDATION_LIMITS.PLAYLIST_NAME_MAX);
      if (!sanitizedName) throw new Error('Cassette name is required');

      const cassette: Cassette = {
        ...data,
        name: sanitizedName,
        id: generateCassetteId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCassettes((prev) => [...prev, cassette]);
      trackCassetteSave(sanitizedName, data.artistName);

      // Sync to Magento
      if (isAuthenticated) {
        saveCassetteSync(cassette).catch(error => handleSyncError(error, 'sync cassette'));
      }
      return cassette;
    },
    [isAuthenticated, handleSyncError],
  );

  const deleteCassette = useCallback(
    (id: string) => {
      const cassette = cassettes.find((c) => c.id === id);
      if (cassette) trackCassetteDelete(cassette.name);
      setCassettes((prev) => prev.filter((c) => c.id !== id));

      // Sync deletion to Magento
      if (isAuthenticated) {
        deleteCassetteSync(id).catch(error => handleSyncError(error, 'delete cassette'));
      }
    },
    [cassettes, isAuthenticated, handleSyncError],
  );

  const deleteCassettes = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      setCassettes((prev) => prev.filter((c) => !idSet.has(c.id)));

      if (isAuthenticated) {
        for (const id of ids) {
          deleteCassetteSync(id).catch(error => handleSyncError(error, 'delete cassette'));
        }
      }
    },
    [isAuthenticated, handleSyncError],
  );

  const updateCassette = useCallback(
    (id: string, updates: Partial<Pick<Cassette, 'name' | 'versionOverrides' | 'colorIndex' | 'colorHex' | 'colorBrand' | 'isPublic'>>) => {
      let updated: Cassette | null = null;
      setCassettes((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const patched = { ...c, updatedAt: new Date().toISOString() };
          if (updates.name !== undefined) {
            const name = updates.name.trim().slice(0, VALIDATION_LIMITS.PLAYLIST_NAME_MAX);
            if (name) patched.name = name;
          }
          if (updates.versionOverrides !== undefined) {
            patched.versionOverrides = updates.versionOverrides;
          }
          if (updates.colorIndex !== undefined) {
            patched.colorIndex = updates.colorIndex;
          }
          if (updates.colorHex !== undefined) {
            patched.colorHex = updates.colorHex || undefined;
          }
          if (updates.colorBrand !== undefined) {
            patched.colorBrand = updates.colorBrand || undefined;
          }
          if (updates.isPublic !== undefined) {
            patched.isPublic = updates.isPublic;
          }
          updated = patched;
          return patched;
        }),
      );

      // Sync updated cassette to Magento
      if (updated && isAuthenticated) {
        saveCassetteSync(updated).catch(error => handleSyncError(error, 'sync cassette update'));
      }
    },
    [isAuthenticated, handleSyncError],
  );

  const getCassette = useCallback((id: string) => cassettes.find((c) => c.id === id), [cassettes]);

  const getCassettesForAlbum = useCallback(
    (albumIdentifier: string) => cassettes.filter((c) => c.albumIdentifier === albumIdentifier),
    [cassettes],
  );

  // ======================================================================
  // Render
  // ======================================================================

  return (
    <CollectionContext.Provider
      value={{
        minidiscs,
        createMiniDisc,
        deleteMiniDisc,
        deleteMiniDiscs,
        addToMiniDisc,
        removeFromMiniDisc,
        updateMiniDisc,
        reorderMiniDisc,
        getMiniDisc,
        cloneMiniDisc,

        cassettes,
        saveCassette,
        deleteCassette,
        deleteCassettes,
        updateCassette,
        getCassette,
        getCassettesForAlbum,

        isLoading,
        syncStatus,
        forceSync,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

// ============================================================================
// Hooks — focused exports
// ============================================================================

export function useMiniDiscs() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useMiniDiscs must be used within a CollectionProvider');
  return {
    minidiscs: ctx.minidiscs,
    isLoading: ctx.isLoading,
    syncStatus: ctx.syncStatus,
    createMiniDisc: ctx.createMiniDisc,
    deleteMiniDisc: ctx.deleteMiniDisc,
    deleteMiniDiscs: ctx.deleteMiniDiscs,
    addToMiniDisc: ctx.addToMiniDisc,
    removeFromMiniDisc: ctx.removeFromMiniDisc,
    updateMiniDisc: ctx.updateMiniDisc,
    reorderMiniDisc: ctx.reorderMiniDisc,
    getMiniDisc: ctx.getMiniDisc,
    cloneMiniDisc: ctx.cloneMiniDisc,
    forceSync: ctx.forceSync,
  };
}

export function useCassettes() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCassettes must be used within a CollectionProvider');
  return {
    cassettes: ctx.cassettes,
    isLoading: ctx.isLoading,
    syncStatus: ctx.syncStatus,
    saveCassette: ctx.saveCassette,
    deleteCassette: ctx.deleteCassette,
    deleteCassettes: ctx.deleteCassettes,
    updateCassette: ctx.updateCassette,
    getCassette: ctx.getCassette,
    getCassettesForAlbum: ctx.getCassettesForAlbum,
  };
}

export function useCollections() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollections must be used within a CollectionProvider');
  return ctx;
}
