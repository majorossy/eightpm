'use client';

// CollectionContext — Unified context for Cassettes and MiniDiscs
// Replaces PlaylistContext with two purpose-built collection types.
// Uses localStorage for persistence with optional Supabase sync.

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Song } from '@/lib/types';
import { Cassette } from '@/lib/cassetteTypes';
import { MiniDisc } from '@/lib/minidiscTypes';
import { useAuth } from '@/context/AuthContext';
import {
  syncPlaylistToServer,
  deletePlaylistFromServer,
  fetchUserPlaylists,
  subscribeToPlaylistChanges,
  SyncStatus,
} from '@/lib/syncService';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  trackMiniDiscCreate,
  trackMiniDiscDelete,
  trackAddToMiniDisc,
  trackRemoveFromMiniDisc,
  trackCassetteSave,
  trackCassetteDelete,
} from '@/lib/analytics';
import { VALIDATION_LIMITS } from '@/lib/validation';

// ============================================================================
// Context Types
// ============================================================================

interface CollectionContextType {
  // MiniDisc state & methods
  minidiscs: MiniDisc[];
  createMiniDisc: (name: string, description?: string) => MiniDisc;
  deleteMiniDisc: (id: string) => void;
  addToMiniDisc: (id: string, song: Song) => void;
  removeFromMiniDisc: (id: string, songId: string) => void;
  updateMiniDisc: (id: string, updates: Partial<Pick<MiniDisc, 'name' | 'description'>>) => void;
  reorderMiniDisc: (id: string, fromIndex: number, toIndex: number) => void;
  getMiniDisc: (id: string) => MiniDisc | undefined;

  // Cassette state & methods
  cassettes: Cassette[];
  saveCassette: (cassette: Omit<Cassette, 'id' | 'createdAt' | 'updatedAt'>) => Cassette;
  deleteCassette: (id: string) => void;
  updateCassette: (id: string, updates: Partial<Pick<Cassette, 'name' | 'versionOverrides'>>) => void;
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

let idCounter = Date.now();
const generateMiniDiscId = () => `minidisc-${++idCounter}`;
const generateCassetteId = () => `cassette-${++idCounter}`;

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
  const { user, isAuthenticated } = useAuth();
  const [minidiscs, setMiniDiscs] = useState<MiniDisc[]>([]);
  const [cassettes, setCassettes] = useState<Cassette[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedFromServerRef = useRef(false);

  // ---------- Load from localStorage on mount ----------
  useEffect(() => {
    // Try migration first
    const migrated = migratePlaylistsToMiniDiscs();
    if (migrated) {
      setMiniDiscs(migrated);
      localStorage.setItem(MINIDISCS_STORAGE_KEY, JSON.stringify(migrated));
    } else {
      const stored = localStorage.getItem(MINIDISCS_STORAGE_KEY);
      if (stored) {
        try { setMiniDiscs(JSON.parse(stored)); } catch {}
      }
    }

    // Load cassettes
    const storedCassettes = localStorage.getItem(CASSETTES_STORAGE_KEY);
    if (storedCassettes) {
      try { setCassettes(JSON.parse(storedCassettes)); } catch {}
    }

    setIsLoading(false);
  }, []);

  // ---------- Save to localStorage on change ----------
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(MINIDISCS_STORAGE_KEY, JSON.stringify(minidiscs));
    }
  }, [minidiscs, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(CASSETTES_STORAGE_KEY, JSON.stringify(cassettes));
    }
  }, [cassettes, isLoading]);

  // ---------- Supabase: Fetch on auth ----------
  useEffect(() => {
    if (!isAuthenticated || !user || !isSupabaseConfigured() || hasFetchedFromServerRef.current) return;

    const fetchFromServer = async () => {
      setSyncStatus('syncing');
      try {
        // Reuse existing playlist sync — server playlists become minidiscs
        const serverPlaylists = await fetchUserPlaylists(user.id);
        if (serverPlaylists.length > 0) {
          setMiniDiscs((prev) => {
            const serverIds = new Set(serverPlaylists.map((p) => p.id));
            const localOnly = prev.filter((m) => !serverIds.has(m.id));
            const converted: MiniDisc[] = serverPlaylists.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              songs: p.songs,
              coverArt: p.coverArt,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            }));
            return [...converted, ...localOnly];
          });
        }
        setSyncStatus('synced');
        hasFetchedFromServerRef.current = true;
      } catch {
        setSyncStatus('error');
      }
    };

    fetchFromServer();
  }, [isAuthenticated, user]);

  // ---------- Supabase: Realtime subscription ----------
  useEffect(() => {
    if (!isAuthenticated || !user || !isSupabaseConfigured()) return;

    const unsubscribe = subscribeToPlaylistChanges(user.id, (serverPlaylists) => {
      const converted: MiniDisc[] = serverPlaylists.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        songs: p.songs,
        coverArt: p.coverArt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
      setMiniDiscs(converted);
      setSyncStatus('synced');
    });

    return unsubscribe;
  }, [isAuthenticated, user]);

  // ---------- Debounced sync helper ----------
  const syncMiniDiscDebounced = useCallback(
    (disc: MiniDisc) => {
      if (!isAuthenticated || !user || !isSupabaseConfigured()) return;

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      setSyncStatus('syncing');
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          // Reuse existing playlist sync — MiniDisc maps to Playlist on server
          await syncPlaylistToServer(user.id, {
            id: disc.id,
            name: disc.name,
            description: disc.description,
            songs: disc.songs,
            coverArt: disc.coverArt,
            createdAt: disc.createdAt,
            updatedAt: disc.updatedAt,
          });
          setSyncStatus('synced');
        } catch {
          setSyncStatus('error');
        }
      }, 500);
    },
    [isAuthenticated, user],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  // ---------- Force sync ----------
  const forceSync = useCallback(async () => {
    if (!isAuthenticated || !user || !isSupabaseConfigured()) return;

    setSyncStatus('syncing');
    try {
      for (const disc of minidiscs) {
        await syncPlaylistToServer(user.id, {
          id: disc.id,
          name: disc.name,
          description: disc.description,
          songs: disc.songs,
          coverArt: disc.coverArt,
          createdAt: disc.createdAt,
          updatedAt: disc.updatedAt,
        });
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, [isAuthenticated, user, minidiscs]);

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
      if (isAuthenticated && user && isSupabaseConfigured()) {
        deletePlaylistFromServer(id).catch(() => {});
      }
    },
    [isAuthenticated, user, minidiscs],
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
      return cassette;
    },
    [],
  );

  const deleteCassette = useCallback(
    (id: string) => {
      const cassette = cassettes.find((c) => c.id === id);
      if (cassette) trackCassetteDelete(cassette.name);
      setCassettes((prev) => prev.filter((c) => c.id !== id));
    },
    [cassettes],
  );

  const updateCassette = useCallback(
    (id: string, updates: Partial<Pick<Cassette, 'name' | 'versionOverrides'>>) => {
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
          return patched;
        }),
      );
    },
    [],
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
        addToMiniDisc,
        removeFromMiniDisc,
        updateMiniDisc,
        reorderMiniDisc,
        getMiniDisc,

        cassettes,
        saveCassette,
        deleteCassette,
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
    addToMiniDisc: ctx.addToMiniDisc,
    removeFromMiniDisc: ctx.removeFromMiniDisc,
    updateMiniDisc: ctx.updateMiniDisc,
    reorderMiniDisc: ctx.reorderMiniDisc,
    getMiniDisc: ctx.getMiniDisc,
    forceSync: ctx.forceSync,
  };
}

export function useCassettes() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCassettes must be used within a CollectionProvider');
  return {
    cassettes: ctx.cassettes,
    isLoading: ctx.isLoading,
    saveCassette: ctx.saveCassette,
    deleteCassette: ctx.deleteCassette,
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
