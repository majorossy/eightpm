/**
 * Mock for @/lib/magentoSync — the Magento GraphQL sync layer.
 *
 * Provides controllable mock implementations matching the REAL return shapes
 * that contexts destructure. Key shapes:
 *   fetchCustomerCollections → { liked_songs: { items, total_count }, followed_artists: string[], cassettes: [], ... }
 *   mergeCassettes → { merged, toSync, updatedFromServer }
 *   mergeQueueSnapshot → { useServer, serverSnapshot }
 */
import { vi } from 'vitest';
import type { WishlistItem } from '@/lib/types';
import type { Cassette } from '@/lib/cassetteTypes';
import type { MiniDisc } from '@/lib/minidiscTypes';

// Shape that fetchCustomerCollections actually returns (matches CustomerCollections)
export interface MockCollections {
  liked_songs?: { items: Array<{ song_id: string; song_data: string }>; total_count: number };
  followed_artists?: string[];
  followed_albums?: Array<{ identifier: string; name: string; artist_slug: string; artist_name: string }>;
  cassettes?: Array<Record<string, unknown>>;
  minidiscs?: Array<Record<string, unknown>>;
  queue_snapshot?: { snapshot_json: string; updated_at: string } | null;
}

const defaultCollections: MockCollections = {
  liked_songs: { items: [], total_count: 0 },
  followed_artists: [],
  followed_albums: [],
  cassettes: [],
  minidiscs: [],
  queue_snapshot: null,
};

let collectionsData: MockCollections = { ...defaultCollections };

// Control what fetchCustomerCollections returns
export function setCollections(data: Partial<MockCollections>) {
  collectionsData = { ...defaultCollections, ...data };
}

export function resetCollections() {
  collectionsData = { ...defaultCollections };
}

// Mock implementations
export const fetchCustomerCollections = vi.fn(async () => collectionsData);

// Sync functions (fire-and-forget in the real code)
export const syncLikedSongs = vi.fn(async () => {});
export const syncFollowedArtists = vi.fn(async () => {});
export const syncFollowedAlbums = vi.fn(async () => {});
export const syncCassettes = vi.fn(async () => {});
export const syncMiniDiscs = vi.fn(async () => {});

// Individual CRUD
export const likeSong = vi.fn(async () => {});
export const unlikeSong = vi.fn(async () => {});
export const followArtist = vi.fn(async () => {});
export const unfollowArtist = vi.fn(async () => {});
export const followAlbum = vi.fn(async () => {});
export const unfollowAlbum = vi.fn(async () => {});
export const saveCassette = vi.fn(async () => {});
export const deleteCassette = vi.fn(async () => {});
export const saveMiniDisc = vi.fn(async () => {});
export const deleteMiniDisc = vi.fn(async () => {});
export const saveQueueSnapshot = vi.fn(async () => {});

// Merge functions — return shapes matching what the real code destructures
export const mergeLikedSongs = vi.fn((local: WishlistItem[], _server: unknown[]) => ({
  merged: local,
  toSync: [] as WishlistItem[],
}));

export const mergeFollowedArtists = vi.fn((local: string[], _server: string[]) => ({
  merged: local,
  toSync: [] as string[],
}));

export const mergeFollowedAlbums = vi.fn((local: unknown[], _server: unknown[]) => ({
  merged: local,
  toSync: [] as unknown[],
}));

export const mergeCassettes = vi.fn((local: Cassette[], _server: unknown[]) => ({
  merged: local,
  toSync: [] as Cassette[],
  updatedFromServer: 0,
}));

export const mergeMiniDiscs = vi.fn((local: MiniDisc[], _server: unknown[]) => ({
  merged: local,
  toSync: [] as MiniDisc[],
  updatedFromServer: 0,
}));

export const mergeQueueSnapshot = vi.fn((_localSavedAt: number, _server: unknown) => ({
  useServer: false,
  serverSnapshot: null,
}));

// Error class
export class AuthExpiredError extends Error {
  constructor(msg = 'Auth expired') { super(msg); this.name = 'AuthExpiredError'; }
}
