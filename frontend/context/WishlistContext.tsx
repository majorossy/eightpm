'use client';

// WishlistContext = Favorites (Magento Wishlist)
// Uses localStorage for persistence with Magento sync for logged-in users.

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Song, Wishlist, WishlistItem, SyncStatus } from '@/lib/types';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { trackLike, trackUnlike, trackFollowArtist, trackUnfollowArtist } from '@/lib/analytics';
import { useToast } from '@/hooks/useToast';
import {
  fetchCustomerCollections,
  likeSong as likeSongSync,
  unlikeSong as unlikeSongSync,
  followArtist as followArtistSync,
  unfollowArtist as unfollowArtistSync,
  followAlbum as followAlbumSync,
  unfollowAlbum as unfollowAlbumSync,
  syncLikedSongs,
  syncFollowedArtists,
  syncFollowedAlbums,
  mergeLikedSongs,
  mergeFollowedArtists,
  mergeFollowedAlbums,
  AuthExpiredError,
} from '@/lib/magentoSync';

interface WishlistContextType {
  wishlist: Wishlist;
  isLoading: boolean;
  syncStatus: SyncStatus;
  addToWishlist: (song: Song) => void;
  removeFromWishlist: (itemId: string) => void;
  isInWishlist: (songId: string) => boolean;
  // For auth state
  isAuthenticated: boolean;
  // Follow artists/albums
  followedArtists: string[];
  followedAlbums: string[];
  followArtist: (slug: string) => void;
  unfollowArtist: (slug: string) => void;
  isArtistFollowed: (slug: string) => boolean;
  followAlbum: (artistSlug: string, albumTitle: string) => void;
  unfollowAlbum: (artistSlug: string, albumTitle: string) => void;
  isAlbumFollowed: (artistSlug: string, albumTitle: string) => boolean;
  forceSync: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

// Generate mock wishlist item ID
let mockItemId = 0;
const generateItemId = () => `wishlist-item-${++mockItemId}`;

const WISHLIST_STORAGE_KEY = '8pm_wishlist';
const FOLLOWED_ARTISTS_STORAGE_KEY = '8pm_followed_artists';
const FOLLOWED_ALBUMS_STORAGE_KEY = '8pm_followed_albums';

// Legacy key migration helper
const migrateStorageKey = (oldKey: string, newKey: string) => {
  if (typeof window === 'undefined') return;
  const oldData = localStorage.getItem(oldKey);
  if (oldData && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, oldData);
    localStorage.removeItem(oldKey);
  }
};

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, signOut } = useMagentoAuth();
  const { showError, showWarning } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [followedArtists, setFollowedArtists] = useState<string[]>([]);
  const [followedAlbums, setFollowedAlbums] = useState<string[]>([]);
  const hasFetchedFromServerRef = useRef(false);
  const prevAuthRef = useRef(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    // Migrate legacy keys on first load
    migrateStorageKey('jamify_wishlist', WISHLIST_STORAGE_KEY);
    migrateStorageKey('jamify_followed_artists', FOLLOWED_ARTISTS_STORAGE_KEY);
    migrateStorageKey('jamify_followed_albums', FOLLOWED_ALBUMS_STORAGE_KEY);

    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      } catch (error) {
        console.error('Failed to load wishlist from localStorage:', error);
      }
    }

    const storedArtists = localStorage.getItem(FOLLOWED_ARTISTS_STORAGE_KEY);
    if (storedArtists) {
      try {
        const parsed = JSON.parse(storedArtists);
        setFollowedArtists(parsed);
      } catch (error) {
        console.error('Failed to load followed artists from localStorage:', error);
      }
    }

    const storedAlbums = localStorage.getItem(FOLLOWED_ALBUMS_STORAGE_KEY);
    if (storedAlbums) {
      try {
        const parsed = JSON.parse(storedAlbums);
        setFollowedAlbums(parsed);
      } catch (error) {
        console.error('Failed to load followed albums from localStorage:', error);
      }
    }

    setIsLoading(false);
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        if (items.length > 0) {
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
        } else {
          localStorage.removeItem(WISHLIST_STORAGE_KEY);
        }
      } catch (e) {
        console.error('[WishlistContext] Failed to save wishlist:', e);
        showWarning('Storage full. Some changes may not be saved locally.');
      }
    }
  }, [items, isLoading, showWarning]);

  // Save followed artists to localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        if (followedArtists.length > 0) {
          localStorage.setItem(FOLLOWED_ARTISTS_STORAGE_KEY, JSON.stringify(followedArtists));
        } else {
          localStorage.removeItem(FOLLOWED_ARTISTS_STORAGE_KEY);
        }
      } catch (e) {
        console.error('[WishlistContext] Failed to save followed artists:', e);
        showWarning('Storage full. Some changes may not be saved locally.');
      }
    }
  }, [followedArtists, isLoading, showWarning]);

  // Save followed albums to localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        if (followedAlbums.length > 0) {
          localStorage.setItem(FOLLOWED_ALBUMS_STORAGE_KEY, JSON.stringify(followedAlbums));
        } else {
          localStorage.removeItem(FOLLOWED_ALBUMS_STORAGE_KEY);
        }
      } catch (e) {
        console.error('[WishlistContext] Failed to save followed albums:', e);
        showWarning('Storage full. Some changes may not be saved locally.');
      }
    }
  }, [followedAlbums, isLoading, showWarning]);

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
    // Detect login transition (false → true)
    const justLoggedIn = isAuthenticated && !prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (!justLoggedIn || hasFetchedFromServerRef.current) return;

    const fetchAndMerge = async () => {
      setSyncStatus('syncing');
      try {
        const collections = await fetchCustomerCollections();

        // Merge liked songs
        const likedMerge = mergeLikedSongs(items, collections.liked_songs.items);
        setItems(likedMerge.merged);

        // Merge followed artists
        const artistMerge = mergeFollowedArtists(followedArtists, collections.followed_artists);
        setFollowedArtists(artistMerge.merged);

        // Merge followed albums
        const albumMerge = mergeFollowedAlbums(followedAlbums, collections.followed_albums);
        setFollowedAlbums(albumMerge.merged);

        // Push local-only items to server
        if (likedMerge.toSync.length > 0) {
          await syncLikedSongs(likedMerge.toSync).catch(e => handleSyncError(e, 'push local liked songs to server'));
        }
        if (artistMerge.toSync.length > 0) {
          await syncFollowedArtists(artistMerge.toSync).catch(e => handleSyncError(e, 'push local followed artists to server'));
        }
        if (albumMerge.toSync.length > 0) {
          const albumsToSync = albumMerge.toSync.map(id => {
            const [artist_slug, album_title] = id.split('::');
            return { artist_slug, album_title };
          });
          await syncFollowedAlbums(albumsToSync).catch(e => handleSyncError(e, 'push local followed albums to server'));
        }

        setSyncStatus('synced');
        hasFetchedFromServerRef.current = true;
      } catch (error) {
        handleSyncError(error, 'fetch wishlist from server');
      }
    };

    fetchAndMerge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const wishlist: Wishlist = {
    id: 'mock-wishlist-123',
    items,
    itemCount: items.length,
  };

  const addToWishlist = useCallback((song: Song) => {
    const newItem: WishlistItem = {
      id: generateItemId(),
      song,
      addedAt: new Date().toISOString(),
    };

    setItems(prev => {
      if (prev.some(item => item.song.id === song.id)) {
        return prev; // Already in wishlist
      }
      return [...prev, newItem];
    });

    // Track analytics event
    trackLike(song);

    // Sync to Magento
    if (isAuthenticated) {
      likeSongSync(song).catch(error => handleSyncError(error, 'sync liked song'));
    }
  }, [isAuthenticated, handleSyncError]);

  const removeFromWishlist = useCallback((itemId: string) => {
    // Find the song being removed for analytics
    const itemToRemove = items.find(item => item.id === itemId);
    if (itemToRemove) {
      trackUnlike(itemToRemove.song);

      // Sync to Magento
      if (isAuthenticated) {
        unlikeSongSync(itemToRemove.song.id).catch(error => handleSyncError(error, 'remove liked song'));
      }
    }

    setItems(prev => prev.filter(item => item.id !== itemId));
  }, [items, isAuthenticated, handleSyncError]);

  const isInWishlist = useCallback((songId: string) => {
    return items.some(item => item.song.id === songId);
  }, [items]);

  const followArtist = useCallback((slug: string) => {
    setFollowedArtists(prev => {
      if (prev.includes(slug)) {
        return prev;
      }
      return [...prev, slug];
    });

    // Track analytics event
    trackFollowArtist(slug, slug);

    // Sync to Magento
    if (isAuthenticated) {
      followArtistSync(slug).catch(error => handleSyncError(error, 'sync followed artist'));
    }
  }, [isAuthenticated, handleSyncError]);

  const unfollowArtist = useCallback((slug: string) => {
    setFollowedArtists(prev => prev.filter(s => s !== slug));

    // Track analytics event
    trackUnfollowArtist(slug, slug);

    // Sync to Magento
    if (isAuthenticated) {
      unfollowArtistSync(slug).catch(error => handleSyncError(error, 'sync unfollowed artist'));
    }
  }, [isAuthenticated, handleSyncError]);

  const isArtistFollowed = useCallback((slug: string) => {
    return followedArtists.includes(slug);
  }, [followedArtists]);

  const followAlbum = useCallback((artistSlug: string, albumTitle: string) => {
    const identifier = `${artistSlug}::${albumTitle}`;
    setFollowedAlbums(prev => {
      if (prev.includes(identifier)) {
        return prev;
      }
      return [...prev, identifier];
    });

    // Sync to Magento
    if (isAuthenticated) {
      followAlbumSync(artistSlug, albumTitle).catch(error => handleSyncError(error, 'sync followed album'));
    }
  }, [isAuthenticated, handleSyncError]);

  const unfollowAlbum = useCallback((artistSlug: string, albumTitle: string) => {
    const identifier = `${artistSlug}::${albumTitle}`;
    setFollowedAlbums(prev => prev.filter(s => s !== identifier));

    // Sync to Magento
    if (isAuthenticated) {
      unfollowAlbumSync(artistSlug, albumTitle).catch(error => handleSyncError(error, 'sync unfollowed album'));
    }
  }, [isAuthenticated, handleSyncError]);

  const isAlbumFollowed = useCallback((artistSlug: string, albumTitle: string) => {
    const identifier = `${artistSlug}::${albumTitle}`;
    return followedAlbums.includes(identifier);
  }, [followedAlbums]);

  // Force sync all data to Magento
  const forceSync = useCallback(async () => {
    if (!isAuthenticated) return;

    setSyncStatus('syncing');
    try {
      if (items.length > 0) {
        await syncLikedSongs(items);
      }
      if (followedArtists.length > 0) {
        await syncFollowedArtists(followedArtists);
      }
      if (followedAlbums.length > 0) {
        const albumsToSync = followedAlbums.map(id => {
          const [artist_slug, album_title] = id.split('::');
          return { artist_slug, album_title };
        });
        await syncFollowedAlbums(albumsToSync);
      }
      setSyncStatus('synced');
    } catch (error) {
      handleSyncError(error, 'force sync wishlist');
    }
  }, [isAuthenticated, items, followedArtists, followedAlbums, handleSyncError]);

  const contextValue = useMemo<WishlistContextType>(() => ({
    wishlist,
    isLoading,
    syncStatus,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    isAuthenticated,
    followedArtists,
    followedAlbums,
    followArtist,
    unfollowArtist,
    isArtistFollowed,
    followAlbum,
    unfollowAlbum,
    isAlbumFollowed,
    forceSync,
  }), [
    wishlist,
    isLoading,
    syncStatus,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    isAuthenticated,
    followedArtists,
    followedAlbums,
    followArtist,
    unfollowArtist,
    isArtistFollowed,
    followAlbum,
    unfollowAlbum,
    isAlbumFollowed,
    forceSync,
  ]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
