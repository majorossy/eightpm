'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Song } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import {
  fetchRecentlyPlayed,
  syncRecentlyPlayed,
  SyncStatus,
  RecentlyPlayedItem as SyncRecentlyPlayedItem,
} from '@/lib/syncService';
import { isSupabaseConfigured } from '@/lib/supabase';

interface RecentlyPlayedItem {
  songId: string;
  song: Song;
  playedAt: string; // ISO date string
  playCount: number;
}

interface RecentlyPlayedContextType {
  recentlyPlayed: RecentlyPlayedItem[];
  trackPlay: (song: Song) => void;
  clearRecentlyPlayed: () => void;
  syncStatus: SyncStatus;
}

const RecentlyPlayedContext = createContext<RecentlyPlayedContextType | null>(null);

const STORAGE_KEY = '8pm_recently_played';
const MAX_ITEMS = 50;

// Legacy key migration helper
const migrateStorageKey = (oldKey: string, newKey: string) => {
  if (typeof window === 'undefined') return;
  const oldData = localStorage.getItem(oldKey);
  if (oldData && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, oldData);
    localStorage.removeItem(oldKey);
  }
};

export function RecentlyPlayedProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedFromServerRef = useRef(false);
  const syncQueueRef = useRef<Map<string, RecentlyPlayedItem>>(new Map());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    // Migrate legacy key on first load
    migrateStorageKey('jamify_recently_played', STORAGE_KEY);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentlyPlayed(parsed);
      }
    } catch (error) {
      console.error('Failed to load recently played:', error);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever recentlyPlayed changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyPlayed));
      } catch (error) {
        console.error('Failed to save recently played:', error);
      }
    }
  }, [recentlyPlayed, isLoading]);

  // Fetch from server when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user || !isSupabaseConfigured() || hasFetchedFromServerRef.current) {
      return;
    }

    const fetchFromServer = async () => {
      setSyncStatus('syncing');
      try {
        const serverData = await fetchRecentlyPlayed(user.id);
        if (serverData.length > 0) {
          // Merge with local data - server takes precedence but keep local-only items
          setRecentlyPlayed(prev => {
            const serverIds = new Set(serverData.map(item => item.songId));
            const localOnly = prev.filter(item => !serverIds.has(item.songId));
            // Combine and re-sort by playedAt
            const combined = [...serverData, ...localOnly];
            combined.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
            return combined.slice(0, MAX_ITEMS);
          });
        }
        setSyncStatus('synced');
        hasFetchedFromServerRef.current = true;
      } catch (error) {
        console.error('Failed to fetch recently played from server:', error);
        setSyncStatus('error');
      }
    };

    fetchFromServer();
  }, [isAuthenticated, user]);

  // Debounced sync to server (batches multiple plays)
  const syncToServer = useCallback(() => {
    if (!isAuthenticated || !user || !isSupabaseConfigured()) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      const itemsToSync = Array.from(syncQueueRef.current.values());
      if (itemsToSync.length === 0) return;

      setSyncStatus('syncing');
      try {
        for (const item of itemsToSync) {
          await syncRecentlyPlayed(user.id, item);
        }
        syncQueueRef.current.clear();
        setSyncStatus('synced');
      } catch (error) {
        console.error('Failed to sync recently played:', error);
        setSyncStatus('error');
      }
    }, 2000); // 2 second debounce for play history
  }, [isAuthenticated, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Track a song as played
  const trackPlay = useCallback((song: Song) => {
    let updatedItem: RecentlyPlayedItem | null = null;

    setRecentlyPlayed(prev => {
      // Check if song already exists in history
      const existingIndex = prev.findIndex(item => item.songId === song.id);

      if (existingIndex !== -1) {
        // Song exists - update playedAt and increment playCount
        const updated = [...prev];
        updatedItem = {
          ...updated[existingIndex],
          playedAt: new Date().toISOString(),
          playCount: updated[existingIndex].playCount + 1,
        };
        updated[existingIndex] = updatedItem;

        // Move to front (most recent)
        const [item] = updated.splice(existingIndex, 1);
        return [item, ...updated];
      } else {
        // New song - add to front
        updatedItem = {
          songId: song.id,
          song,
          playedAt: new Date().toISOString(),
          playCount: 1,
        };

        // Add to front and keep only MAX_ITEMS
        return [updatedItem, ...prev].slice(0, MAX_ITEMS);
      }
    });

    // Queue for server sync
    if (updatedItem && isAuthenticated && user && isSupabaseConfigured()) {
      syncQueueRef.current.set(song.id, updatedItem);
      syncToServer();
    }
  }, [isAuthenticated, user, syncToServer]);

  // Clear all recently played history
  const clearRecentlyPlayed = useCallback(() => {
    setRecentlyPlayed([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <RecentlyPlayedContext.Provider
      value={{
        recentlyPlayed,
        trackPlay,
        clearRecentlyPlayed,
        syncStatus,
      }}
    >
      {children}
    </RecentlyPlayedContext.Provider>
  );
}

export function useRecentlyPlayed() {
  const context = useContext(RecentlyPlayedContext);
  if (!context) {
    throw new Error('useRecentlyPlayed must be used within a RecentlyPlayedProvider');
  }
  return context;
}
