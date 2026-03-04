// Magento GraphQL sync service for customer collections
// Handles cassettes, minidiscs, liked songs, followed artists/albums
// Local-first: localStorage is always written first, server sync is fire-and-forget

import { getStoredToken } from './magentoAuth';
import { Song, WishlistItem, SyncStatus } from './types';
import { Cassette } from './cassetteTypes';
import { MiniDisc } from './minidiscTypes';

const MAGENTO_URL = process.env.NEXT_PUBLIC_MAGENTO_GRAPHQL_URL || 'https://magento.test/graphql';

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
  success: boolean;
  synced_count: number;
  user_errors: Array<{ message: string; path?: string[] }>;
}

export interface SaveResult {
  success: boolean;
  user_errors: Array<{ message: string; path?: string[] }>;
}

export interface ServerFollowedAlbum {
  artist_slug: string;
  album_title: string;
  followed_at: string;
}

export interface CustomerCollections {
  cassettes: ServerCassette[];
  minidiscs: ServerMiniDisc[];
  liked_songs: { items: ServerLikedSong[]; total_count: number };
  followed_artists: string[];
  followed_albums: ServerFollowedAlbum[];
}

export interface ServerCassette {
  entity_id: number;
  client_id: string;
  name: string;
  album_identifier: string;
  artist_slug: string;
  artist_name: string;
  album_name: string;
  cover_art: string | null;
  show_date: string | null;
  show_venue: string | null;
  show_location: string | null;
  version_overrides: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

export interface ServerMiniDisc {
  entity_id: number;
  client_id: string;
  name: string;
  description: string | null;
  cover_art: string | null;
  songs: ServerMiniDiscSong[];
  created_at: string;
  updated_at: string;
}

export interface ServerMiniDiscSong {
  song_id: string;
  sku: string | null;
  position: number;
  song_data_snapshot: string | null; // JSON string
}

export interface ServerLikedSong {
  song_id: string;
  sku: string | null;
  song_data_snapshot: string | null; // JSON string
  added_at: string;
}

// ============================================================================
// GraphQL Helper
// ============================================================================

async function magentoAuthFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<T> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new AuthExpiredError('No auth token available');
  }

  const response = await fetch(MAGENTO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    const msg = result.errors[0]?.message || 'GraphQL error';
    // Detect auth errors
    if (
      msg.includes('authorized') ||
      msg.includes('authentication') ||
      msg.includes('token') ||
      response.status === 401
    ) {
      throw new AuthExpiredError(msg);
    }
    throw new Error(msg);
  }

  return result.data;
}

export class AuthExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

// ============================================================================
// Fetch All Collections (used on login)
// ============================================================================

const FETCH_COLLECTIONS_QUERY = `
  query FetchCustomerCollections {
    customer {
      cassettes {
        entity_id
        client_id
        name
        album_identifier
        artist_slug
        artist_name
        album_name
        cover_art
        show_date
        show_venue
        show_location
        version_overrides
        created_at
        updated_at
      }
      minidiscs {
        entity_id
        client_id
        name
        description
        cover_art
        songs {
          song_id
          sku
          position
          song_data_snapshot
        }
        created_at
        updated_at
      }
      liked_songs {
        items {
          song_id
          sku
          song_data_snapshot
          added_at
        }
        total_count
      }
      followed_artists
      followed_albums {
        artist_slug
        album_title
        followed_at
      }
    }
  }
`;

export async function fetchCustomerCollections(token?: string): Promise<CustomerCollections> {
  const data = await magentoAuthFetch<{ customer: CustomerCollections }>(
    FETCH_COLLECTIONS_QUERY,
    undefined,
    token,
  );
  return data.customer;
}

// ============================================================================
// Cassette CRUD
// ============================================================================

export async function saveCassette(
  cassette: Cassette,
  token?: string,
): Promise<SaveResult> {
  const query = `
    mutation SaveCassette($input: CassetteInput!) {
      saveCassette(input: $input) {
        cassette { entity_id client_id }
        user_errors { message path }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    saveCassette: { cassette: { entity_id: number }; user_errors: Array<{ message: string; path?: string[] }> };
  }>(query, {
    input: {
      client_id: cassette.id,
      name: cassette.name,
      album_identifier: cassette.albumIdentifier,
      artist_slug: cassette.artistSlug,
      artist_name: cassette.artistName,
      album_name: cassette.albumName,
      cover_art: cassette.coverArt || null,
      show_date: cassette.showDate || null,
      show_venue: cassette.showVenue || null,
      show_location: cassette.showLocation || null,
      version_overrides: Object.keys(cassette.versionOverrides).length > 0
        ? JSON.stringify(cassette.versionOverrides)
        : null,
    },
  }, token);

  return {
    success: data.saveCassette.user_errors.length === 0,
    user_errors: data.saveCassette.user_errors,
  };
}

export async function deleteCassette(clientId: string, token?: string): Promise<boolean> {
  const query = `
    mutation DeleteCassette($client_id: String!) {
      deleteCassette(client_id: $client_id) {
        success
        user_errors { message }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    deleteCassette: { success: boolean };
  }>(query, { client_id: clientId }, token);

  return data.deleteCassette.success;
}

// ============================================================================
// MiniDisc CRUD
// ============================================================================

export async function saveMiniDisc(
  miniDisc: MiniDisc,
  token?: string,
): Promise<SaveResult> {
  const query = `
    mutation SaveMiniDisc($input: MiniDiscInput!) {
      saveMiniDisc(input: $input) {
        minidisc { entity_id client_id }
        user_errors { message path }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    saveMiniDisc: { minidisc: { entity_id: number }; user_errors: Array<{ message: string; path?: string[] }> };
  }>(query, {
    input: {
      client_id: miniDisc.id,
      name: miniDisc.name,
      description: miniDisc.description || null,
      cover_art: miniDisc.coverArt || null,
      songs: miniDisc.songs.map((song, index) => ({
        song_id: song.id,
        sku: song.sku,
        position: index,
        song_data_snapshot: JSON.stringify(song),
      })),
    },
  }, token);

  return {
    success: data.saveMiniDisc.user_errors.length === 0,
    user_errors: data.saveMiniDisc.user_errors,
  };
}

export async function deleteMiniDisc(clientId: string, token?: string): Promise<boolean> {
  const query = `
    mutation DeleteMiniDisc($client_id: String!) {
      deleteMiniDisc(client_id: $client_id) {
        success
        user_errors { message }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    deleteMiniDisc: { success: boolean };
  }>(query, { client_id: clientId }, token);

  return data.deleteMiniDisc.success;
}

// ============================================================================
// Liked Songs CRUD
// ============================================================================

export async function likeSong(
  song: Song,
  token?: string,
): Promise<SaveResult> {
  const query = `
    mutation LikeSong($input: LikedSongInput!) {
      likeSong(input: $input) {
        song { song_id }
        user_errors { message path }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    likeSong: { song: { song_id: string }; user_errors: Array<{ message: string; path?: string[] }> };
  }>(query, {
    input: {
      song_id: song.id,
      sku: song.sku,
      song_data_snapshot: JSON.stringify(song),
    },
  }, token);

  return {
    success: data.likeSong.user_errors.length === 0,
    user_errors: data.likeSong.user_errors,
  };
}

export async function unlikeSong(songId: string, token?: string): Promise<boolean> {
  const query = `
    mutation UnlikeSong($song_id: String!) {
      unlikeSong(song_id: $song_id) {
        success
        user_errors { message }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    unlikeSong: { success: boolean };
  }>(query, { song_id: songId }, token);

  return data.unlikeSong.success;
}

// ============================================================================
// Follow Artist/Album
// ============================================================================

export async function followArtist(slug: string, token?: string): Promise<boolean> {
  const query = `
    mutation FollowArtist($artist_slug: String!) {
      followArtist(artist_slug: $artist_slug) {
        success
        user_errors { message }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    followArtist: { success: boolean };
  }>(query, { artist_slug: slug }, token);

  return data.followArtist.success;
}

export async function unfollowArtist(slug: string, token?: string): Promise<boolean> {
  const query = `
    mutation UnfollowArtist($artist_slug: String!) {
      unfollowArtist(artist_slug: $artist_slug) {
        success
        user_errors { message }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    unfollowArtist: { success: boolean };
  }>(query, { artist_slug: slug }, token);

  return data.unfollowArtist.success;
}

export async function followAlbum(
  artistSlug: string,
  albumTitle: string,
  token?: string,
): Promise<boolean> {
  const query = `
    mutation FollowAlbum($input: FollowedAlbumInput!) {
      followAlbum(input: $input) {
        success
        user_errors { message }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    followAlbum: { success: boolean };
  }>(query, { input: { artist_slug: artistSlug, album_title: albumTitle } }, token);

  return data.followAlbum.success;
}

export async function unfollowAlbum(
  artistSlug: string,
  albumTitle: string,
  token?: string,
): Promise<boolean> {
  const query = `
    mutation UnfollowAlbum($input: FollowedAlbumInput!) {
      unfollowAlbum(input: $input) {
        success
        user_errors { message }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    unfollowAlbum: { success: boolean };
  }>(query, { input: { artist_slug: artistSlug, album_title: albumTitle } }, token);

  return data.unfollowAlbum.success;
}

// ============================================================================
// Batch Sync (used on login merge)
// ============================================================================

export async function syncCassettes(
  cassettes: Cassette[],
  token?: string,
): Promise<SyncResult> {
  const query = `
    mutation SyncCassettes($input: [CassetteInput!]!) {
      syncCassettes(input: $input) {
        success
        synced_count
        user_errors { message path }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    syncCassettes: SyncResult;
  }>(query, {
    input: cassettes.map(c => ({
      client_id: c.id,
      name: c.name,
      album_identifier: c.albumIdentifier,
      artist_slug: c.artistSlug,
      artist_name: c.artistName,
      album_name: c.albumName,
      cover_art: c.coverArt || null,
      show_date: c.showDate || null,
      show_venue: c.showVenue || null,
      show_location: c.showLocation || null,
      version_overrides: Object.keys(c.versionOverrides).length > 0
        ? JSON.stringify(c.versionOverrides)
        : null,
    })),
  }, token);

  return data.syncCassettes;
}

export async function syncMiniDiscs(
  minidiscs: MiniDisc[],
  token?: string,
): Promise<SyncResult> {
  const query = `
    mutation SyncMiniDiscs($input: [MiniDiscInput!]!) {
      syncMiniDiscs(input: $input) {
        success
        synced_count
        user_errors { message path }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    syncMiniDiscs: SyncResult;
  }>(query, {
    input: minidiscs.map(md => ({
      client_id: md.id,
      name: md.name,
      description: md.description || null,
      cover_art: md.coverArt || null,
      songs: md.songs.map((song, index) => ({
        song_id: song.id,
        sku: song.sku,
        position: index,
        song_data_snapshot: JSON.stringify(song),
      })),
    })),
  }, token);

  return data.syncMiniDiscs;
}

export async function syncLikedSongs(
  songs: WishlistItem[],
  token?: string,
): Promise<SyncResult> {
  const query = `
    mutation SyncLikedSongs($input: [LikedSongInput!]!) {
      syncLikedSongs(input: $input) {
        success
        synced_count
        user_errors { message path }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    syncLikedSongs: SyncResult;
  }>(query, {
    input: songs.map(item => ({
      song_id: item.song.id,
      sku: item.song.sku,
      song_data_snapshot: JSON.stringify(item.song),
    })),
  }, token);

  return data.syncLikedSongs;
}

export async function syncFollowedArtists(
  slugs: string[],
  token?: string,
): Promise<SyncResult> {
  const query = `
    mutation SyncFollowedArtists($artist_slugs: [String!]!) {
      syncFollowedArtists(artist_slugs: $artist_slugs) {
        success
        synced_count
        user_errors { message path }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    syncFollowedArtists: SyncResult;
  }>(query, { artist_slugs: slugs }, token);

  return data.syncFollowedArtists;
}

export async function syncFollowedAlbums(
  albums: Array<{ artist_slug: string; album_title: string }>,
  token?: string,
): Promise<SyncResult> {
  const query = `
    mutation SyncFollowedAlbums($input: [FollowedAlbumInput!]!) {
      syncFollowedAlbums(input: $input) {
        success
        synced_count
        user_errors { message path }
      }
    }
  `;

  const data = await magentoAuthFetch<{
    syncFollowedAlbums: SyncResult;
  }>(query, { input: albums }, token);

  return data.syncFollowedAlbums;
}

// ============================================================================
// Merge Helpers
// ============================================================================

/** Convert server cassette to local Cassette format */
export function serverCassetteToLocal(sc: ServerCassette): Cassette {
  return {
    id: sc.client_id,
    name: sc.name,
    albumIdentifier: sc.album_identifier,
    artistSlug: sc.artist_slug,
    artistName: sc.artist_name,
    albumName: sc.album_name,
    coverArt: sc.cover_art || undefined,
    showDate: sc.show_date || undefined,
    showVenue: sc.show_venue || undefined,
    showLocation: sc.show_location || undefined,
    versionOverrides: sc.version_overrides ? JSON.parse(sc.version_overrides) : {},
    createdAt: sc.created_at,
    updatedAt: sc.updated_at,
  };
}

/** Convert server minidisc to local MiniDisc format */
export function serverMiniDiscToLocal(smd: ServerMiniDisc): MiniDisc {
  // Songs are stored as snapshots — parse them back to Song objects
  const songs = smd.songs
    .sort((a, b) => a.position - b.position)
    .map(s => {
      if (s.song_data_snapshot) {
        try {
          return JSON.parse(s.song_data_snapshot);
        } catch {
          // Fallback: minimal Song with just the ID
          return { id: s.song_id, sku: s.sku || '' } as Record<string, unknown>;
        }
      }
      return { id: s.song_id, sku: s.sku || '' } as Record<string, unknown>;
    });

  return {
    id: smd.client_id,
    name: smd.name,
    description: smd.description || undefined,
    songs,
    coverArt: smd.cover_art || undefined,
    createdAt: smd.created_at,
    updatedAt: smd.updated_at,
  };
}

/** Convert server liked song to local WishlistItem format */
export function serverLikedSongToLocal(sls: ServerLikedSong): WishlistItem | null {
  if (sls.song_data_snapshot) {
    try {
      const song = JSON.parse(sls.song_data_snapshot);
      return {
        id: `wishlist-item-${sls.song_id}`,
        song,
        addedAt: sls.added_at,
      };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Identity-based merge: match by client_id/song_id, server wins for conflicts.
 * Returns items to push to server (local-only) and merged local state.
 */
export function mergeCassettes(
  local: Cassette[],
  server: ServerCassette[],
): { merged: Cassette[]; toSync: Cassette[] } {
  const serverMap = new Map(server.map(s => [s.client_id, s]));
  const merged: Cassette[] = [];
  const toSync: Cassette[] = [];

  // Server items take precedence
  for (const sc of server) {
    merged.push(serverCassetteToLocal(sc));
  }

  // Local-only items need to be synced
  for (const lc of local) {
    if (!serverMap.has(lc.id)) {
      merged.push(lc);
      toSync.push(lc);
    }
  }

  return { merged, toSync };
}

export function mergeMiniDiscs(
  local: MiniDisc[],
  server: ServerMiniDisc[],
): { merged: MiniDisc[]; toSync: MiniDisc[] } {
  const serverMap = new Map(server.map(s => [s.client_id, s]));
  const merged: MiniDisc[] = [];
  const toSync: MiniDisc[] = [];

  for (const smd of server) {
    merged.push(serverMiniDiscToLocal(smd));
  }

  for (const lmd of local) {
    if (!serverMap.has(lmd.id)) {
      merged.push(lmd);
      toSync.push(lmd);
    }
  }

  return { merged, toSync };
}

export function mergeLikedSongs(
  local: WishlistItem[],
  server: ServerLikedSong[],
): { merged: WishlistItem[]; toSync: WishlistItem[] } {
  const serverSongIds = new Set(server.map(s => s.song_id));
  const merged: WishlistItem[] = [];
  const toSync: WishlistItem[] = [];

  // Server items first
  for (const sls of server) {
    const item = serverLikedSongToLocal(sls);
    if (item) merged.push(item);
  }

  // Local-only items
  for (const li of local) {
    if (!serverSongIds.has(li.song.id)) {
      merged.push(li);
      toSync.push(li);
    }
  }

  return { merged, toSync };
}

export function mergeFollowedArtists(
  local: string[],
  server: string[],
): { merged: string[]; toSync: string[] } {
  const serverSet = new Set(server);
  const merged = [...server];
  const toSync: string[] = [];

  for (const slug of local) {
    if (!serverSet.has(slug)) {
      merged.push(slug);
      toSync.push(slug);
    }
  }

  return { merged, toSync };
}

export function mergeFollowedAlbums(
  local: string[],
  server: ServerFollowedAlbum[],
): { merged: string[]; toSync: string[] } {
  // Convert server objects to "artistSlug::albumTitle" identifiers
  const serverIdentifiers = server.map(s => `${s.artist_slug}::${s.album_title}`);
  const serverSet = new Set(serverIdentifiers);
  const merged = [...serverIdentifiers];
  const toSync: string[] = [];

  for (const identifier of local) {
    if (!serverSet.has(identifier)) {
      merged.push(identifier);
      toSync.push(identifier);
    }
  }

  return { merged, toSync };
}
