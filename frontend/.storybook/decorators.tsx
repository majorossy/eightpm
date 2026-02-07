/**
 * Mock decorators for Storybook stories that need context providers.
 * These provide minimal, non-functional mock implementations sufficient
 * for rendering components in isolation.
 */
import React, { createContext, useContext } from 'react';
import type { Decorator } from '@storybook/nextjs-vite';
import type { Song, Album } from '../lib/types';
import type { QueueItem } from '../lib/queueTypes';
import { mockSong, mockSong2, mockSong3, mockQueueItems } from './fixtures';

// =============================================================================
// Mock Player Context
// =============================================================================

const noop = () => {};
const noopAsync = async () => {};

const MockPlayerContext = createContext({
  isPlaying: false,
  isBuffering: false,
  volume: 0.8,
  currentTime: 120,
  duration: 342,
  isQueueOpen: false,
  crossfadeDuration: 0,
  announcement: '',
  currentSong: mockSong as Song | null,
  playSong: noop as (song: Song) => void,
  togglePlay: noop,
  pause: noop,
  setVolume: noop as (v: number) => void,
  seek: noop as (t: number) => void,
  playNext: noop,
  playPrev: noop,
  toggleQueue: noop,
  playFromQueue: noop as (i: number) => void,
  playAlbum: noop as (album: Album, startIndex?: number) => void,
  playAlbumFromTrack: noop as (album: Album, trackIndex: number, song: Song) => void,
  setCrossfadeDuration: noop as (d: number) => void,
  analyzerData: { frequency: new Uint8Array(0), waveform: new Uint8Array(0), bass: 0, mid: 0, treble: 0, volume: 0 },
  audioRef: { current: null } as React.MutableRefObject<HTMLAudioElement | null>,
  queue: [mockSong, mockSong2, mockSong3] as Song[],
  queueIndex: 0,
  savedProgress: null,
  resumeSavedProgress: noop,
  clearSavedProgress: noop,
});

export function usePlayer() {
  return useContext(MockPlayerContext);
}

// =============================================================================
// Mock Queue Context
// =============================================================================

const MockQueueContext = createContext({
  items: mockQueueItems as QueueItem[],
  cursorIndex: 0,
  repeat: 'off' as 'off' | 'all' | 'one',
  currentItem: mockQueueItems[0] as QueueItem | null,
  upcomingItems: mockQueueItems.slice(1) as QueueItem[],
  playedItems: [] as QueueItem[],
  albumGroups: [] as Array<{ batchId: string; items: QueueItem[] }>,
  hasNext: true,
  hasPrev: false,
  isShuffled: false,
  loadAlbum: noop as (album: Album, startIndex?: number) => void,
  insertNext: noop as (items: QueueItem | QueueItem[]) => void,
  appendToQueue: noop as (items: QueueItem | QueueItem[]) => void,
  removeItem: noop as (queueId: string) => void,
  moveItem: noop as (from: number, to: number) => void,
  setCursor: noop as (index: number) => void,
  advance: noop,
  retreat: noop,
  selectVersion: noop as (queueId: string, song: Song) => void,
  setRepeat: noop as (mode: 'off' | 'all' | 'one') => void,
  clearQueue: noop,
  clearUpcoming: noop,
  toggleShuffle: noop,
});

export function useQueue() {
  return useContext(MockQueueContext);
}

// =============================================================================
// Mock Wishlist Context
// =============================================================================

const MockWishlistContext = createContext({
  wishlist: { id: 'wl-1', items: [], itemCount: 0 },
  isLoading: false,
  syncStatus: 'idle' as const,
  addToWishlist: noop as (song: Song) => void,
  removeFromWishlist: noop as (itemId: string) => void,
  isInWishlist: (() => false) as (songId: string) => boolean,
  isAuthenticated: false,
  followedArtists: [] as string[],
  followedAlbums: [] as string[],
  followArtist: noop as (slug: string) => void,
  unfollowArtist: noop as (slug: string) => void,
  isArtistFollowed: (() => false) as (slug: string) => boolean,
  followAlbum: noop as (artistSlug: string, albumTitle: string) => void,
  unfollowAlbum: noop as (artistSlug: string, albumTitle: string) => void,
  isAlbumFollowed: (() => false) as (artistSlug: string, albumTitle: string) => boolean,
  forceSync: noopAsync,
});

export function useWishlist() {
  return useContext(MockWishlistContext);
}

// =============================================================================
// Mock MobileUI Context
// =============================================================================

const MockMobileUIContext = createContext({
  isSidebarOpen: false,
  isMobile: false,
  isPlayerExpanded: false,
  isTransitioning: false,
  dragOffset: 0,
  toggleSidebar: noop,
  closeSidebar: noop,
  openSidebar: noop,
  expandPlayer: noop,
  collapsePlayer: noop,
  togglePlayer: noop,
  setDragOffset: noop as (offset: number) => void,
});

export function useMobileUI() {
  return useContext(MockMobileUIContext);
}

// =============================================================================
// Mock Auth Context
// =============================================================================

const MockAuthContext = createContext({
  user: null as null | { id: string; email: string },
  isAuthenticated: false,
  isLoading: false,
  login: noopAsync as (email: string, password: string) => Promise<void>,
  logout: noopAsync,
  register: noopAsync as (email: string, password: string, firstname: string, lastname: string) => Promise<void>,
});

export function useAuth() {
  return useContext(MockAuthContext);
}

// =============================================================================
// Mock Breadcrumb Context
// =============================================================================

const MockBreadcrumbContext = createContext({
  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Railroad Earth', href: '/artists/railroadearth', type: 'artist' as const },
  ],
  setBreadcrumbs: noop as (items: Array<{ label: string; href?: string; type?: string }>) => void,
  clearBreadcrumbs: noop,
});

export function useBreadcrumbs() {
  return useContext(MockBreadcrumbContext);
}

// =============================================================================
// Mock Quality Context
// =============================================================================

const MockQualityContext = createContext({
  quality: 'high' as 'high' | 'medium' | 'low',
  setQuality: noop as (q: 'high' | 'medium' | 'low') => void,
  autoQuality: true,
  setAutoQuality: noop as (auto: boolean) => void,
});

export function useQuality() {
  return useContext(MockQualityContext);
}

// =============================================================================
// Mock Toast Hook
// =============================================================================

export function useToast() {
  return {
    toasts: [],
    addToast: noop as (message: string, type?: string, duration?: number) => void,
    removeToast: noop as (id: string) => void,
    showError: noop as (message: string) => void,
    showSuccess: noop as (message: string) => void,
    showInfo: noop as (message: string) => void,
    showWarning: noop as (message: string) => void,
  };
}

// =============================================================================
// Mock Share Hook
// =============================================================================

export function useShare() {
  return {
    showShareModal: false,
    shareUrl: '',
    shareTitle: '',
    copiedToClipboard: false,
    shareItem: noop,
    shareSong: noop as (song: Song) => void,
    closeShareModal: noop,
    copyToClipboard: noop,
  };
}

// =============================================================================
// Composite Decorators
// =============================================================================

/** Wraps with Player + Queue contexts (for TrackCard, SongCard, BottomPlayer, etc.) */
export const withPlayerContext: Decorator = (Story) => (
  <MockPlayerContext.Provider value={useContext(MockPlayerContext)}>
    <MockQueueContext.Provider value={useContext(MockQueueContext)}>
      <Story />
    </MockQueueContext.Provider>
  </MockPlayerContext.Provider>
);

/** Wraps with Player + Queue + Wishlist contexts */
export const withFullContext: Decorator = (Story) => (
  <MockPlayerContext.Provider value={useContext(MockPlayerContext)}>
    <MockQueueContext.Provider value={useContext(MockQueueContext)}>
      <MockWishlistContext.Provider value={useContext(MockWishlistContext)}>
        <MockAuthContext.Provider value={useContext(MockAuthContext)}>
          <MockMobileUIContext.Provider value={useContext(MockMobileUIContext)}>
            <Story />
          </MockMobileUIContext.Provider>
        </MockAuthContext.Provider>
      </MockWishlistContext.Provider>
    </MockQueueContext.Provider>
  </MockPlayerContext.Provider>
);

/** Wraps with MobileUI context (for navigation components) */
export const withMobileUIContext: Decorator = (Story) => (
  <MockMobileUIContext.Provider value={useContext(MockMobileUIContext)}>
    <Story />
  </MockMobileUIContext.Provider>
);

/** Wraps with Auth context (for modals, forms) */
export const withAuthContext: Decorator = (Story) => (
  <MockAuthContext.Provider value={useContext(MockAuthContext)}>
    <Story />
  </MockAuthContext.Provider>
);

// =============================================================================
// Mock Toast Context (matches hooks/useToast.ts ToastContext)
// =============================================================================

const MockToastContext = createContext({
  toasts: [] as Array<{ id: string; message: string; type: string }>,
  addToast: noop as (message: string, type?: string, duration?: number) => void,
  removeToast: noop as (id: string) => void,
  showError: noop as (message: string) => void,
  showSuccess: noop as (message: string) => void,
  showInfo: noop as (message: string) => void,
  showWarning: noop as (message: string) => void,
});

/** Wraps with Toast context (for ShareButton, DownloadButton, etc.) */
export const withToastContext: Decorator = (Story) => (
  <MockToastContext.Provider value={useContext(MockToastContext)}>
    <Story />
  </MockToastContext.Provider>
);

// =============================================================================
// Mock Playlist Context
// =============================================================================

const MockPlaylistContext = createContext({
  playlists: [] as Array<{ id: string; name: string; description?: string; songs: Song[]; coverArt?: string; createdAt: string; updatedAt: string }>,
  isLoading: false,
  syncStatus: 'idle' as const,
  createPlaylist: ((name: string) => ({ id: 'new-pl', name, songs: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })) as (name: string, description?: string) => { id: string; name: string; songs: Song[]; coverArt?: string; createdAt: string; updatedAt: string },
  deletePlaylist: noop as (playlistId: string) => void,
  addToPlaylist: noop as (playlistId: string, song: Song) => void,
  removeFromPlaylist: noop as (playlistId: string, songId: string) => void,
  updatePlaylist: noop as (playlistId: string, updates: Partial<{ name: string; description: string }>) => void,
  getPlaylist: (() => undefined) as (playlistId: string) => undefined,
  forceSync: noopAsync,
});

/** Wraps with Playlist + Auth contexts (for AddToPlaylistModal) */
export const withPlaylistContext: Decorator = (Story) => (
  <MockAuthContext.Provider value={useContext(MockAuthContext)}>
    <MockPlaylistContext.Provider value={useContext(MockPlaylistContext)}>
      <Story />
    </MockPlaylistContext.Provider>
  </MockAuthContext.Provider>
);

/** Wraps with Quality context (for QualitySelector) */
export const withQualityContext: Decorator = (Story) => (
  <MockQualityContext.Provider value={useContext(MockQualityContext)}>
    <Story />
  </MockQualityContext.Provider>
);
