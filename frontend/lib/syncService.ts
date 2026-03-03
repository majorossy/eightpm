// Sync Service - Orchestrates data synchronization between localStorage and Supabase
// Uses optimistic updates with server reconciliation

import { supabase, isSupabaseConfigured } from './supabase';
import { Song } from './types';
import { MiniDisc } from './minidiscTypes';

// MiniDiscs map to playlists on the server side
type Playlist = MiniDisc;

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

// Sync status types
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingChanges: number;
  error: string | null;
}

// ================================
// PLAYLIST SYNC
// ================================

export async function fetchUserPlaylists(userId: string): Promise<Playlist[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    // Fetch playlists
    const { data: playlists, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (playlistError) {
      console.error('Error fetching playlists:', playlistError);
      return [];
    }

    // Fetch all songs for all playlists
    const playlistIds = playlists?.map(p => p.id) || [];
    if (playlistIds.length === 0) return [];

    const { data: songs, error: songsError } = await supabase
      .from('playlist_songs')
      .select('*')
      .in('playlist_id', playlistIds)
      .order('position', { ascending: true });

    if (songsError) {
      console.error('Error fetching playlist songs:', songsError);
    }

    // Combine playlists with their songs
    return (playlists || []).map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || undefined,
      coverArt: playlist.cover_art || undefined,
      createdAt: playlist.created_at,
      updatedAt: playlist.updated_at,
      songs: (songs || [])
        .filter(s => s.playlist_id === playlist.id)
        .map(s => s.song_data as Song),
    }));
  } catch (error) {
    console.error('Error in fetchUserPlaylists:', error);
    return [];
  }
}

export async function syncPlaylistToServer(userId: string, playlist: Playlist): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // Upsert playlist
    const { error: playlistError } = await supabase
      .from('playlists')
      .upsert({
        id: playlist.id,
        user_id: userId,
        name: playlist.name,
        description: playlist.description || null,
        cover_art: playlist.coverArt || null,
        created_at: playlist.createdAt,
        updated_at: playlist.updatedAt,
      });

    if (playlistError) {
      console.error('Error syncing playlist:', playlistError);
      return false;
    }

    // Delete existing songs and re-insert (simplest approach for now)
    await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlist.id);

    if (playlist.songs.length > 0) {
      const songsToInsert = playlist.songs.map((song, index) => ({
        playlist_id: playlist.id,
        song_data: song,
        position: index,
        added_at: new Date().toISOString(),
      }));

      const { error: songsError } = await supabase
        .from('playlist_songs')
        .insert(songsToInsert);

      if (songsError) {
        console.error('Error syncing playlist songs:', songsError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in syncPlaylistToServer:', error);
    return false;
  }
}

export async function deletePlaylistFromServer(playlistId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // Songs will be cascade deleted due to foreign key
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) {
      console.error('Error deleting playlist:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePlaylistFromServer:', error);
    return false;
  }
}

// ================================
// WISHLIST SYNC
// ================================

export interface WishlistData {
  items: Array<{ id: string; song: Song; addedAt: string }>;
  followedArtists: string[];
  followedAlbums: string[];
}

export async function fetchUserWishlist(userId: string): Promise<WishlistData> {
  if (!isSupabaseConfigured()) {
    return { items: [], followedArtists: [], followedAlbums: [] };
  }

  try {
    // Fetch wishlist items
    const { data: wishlistItems, error: wishlistError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (wishlistError) {
      console.error('Error fetching wishlist:', wishlistError);
    }

    // Fetch followed artists
    const { data: artists, error: artistsError } = await supabase
      .from('followed_artists')
      .select('artist_slug')
      .eq('user_id', userId);

    if (artistsError) {
      console.error('Error fetching followed artists:', artistsError);
    }

    // Fetch followed albums
    const { data: albums, error: albumsError } = await supabase
      .from('followed_albums')
      .select('artist_slug, album_title')
      .eq('user_id', userId);

    if (albumsError) {
      console.error('Error fetching followed albums:', albumsError);
    }

    return {
      items: (wishlistItems || []).map(item => ({
        id: item.id,
        song: item.song_data as Song,
        addedAt: item.added_at,
      })),
      followedArtists: (artists || []).map(a => a.artist_slug),
      followedAlbums: (albums || []).map(a => `${a.artist_slug}::${a.album_title}`),
    };
  } catch (error) {
    console.error('Error in fetchUserWishlist:', error);
    return { items: [], followedArtists: [], followedAlbums: [] };
  }
}

export async function syncWishlistItemToServer(
  userId: string,
  item: { id: string; song: Song; addedAt: string }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('wishlist')
      .upsert({
        id: item.id,
        user_id: userId,
        song_data: item.song,
        added_at: item.addedAt,
      });

    if (error) {
      console.error('Error syncing wishlist item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in syncWishlistItemToServer:', error);
    return false;
  }
}

export async function removeWishlistItemFromServer(itemId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error removing wishlist item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeWishlistItemFromServer:', error);
    return false;
  }
}

export async function syncFollowedArtist(userId: string, artistSlug: string, follow: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    if (follow) {
      const { error } = await supabase
        .from('followed_artists')
        .upsert({
          user_id: userId,
          artist_slug: artistSlug,
          followed_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error following artist:', error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('followed_artists')
        .delete()
        .eq('user_id', userId)
        .eq('artist_slug', artistSlug);

      if (error) {
        console.error('Error unfollowing artist:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in syncFollowedArtist:', error);
    return false;
  }
}

export async function syncFollowedAlbum(
  userId: string,
  artistSlug: string,
  albumTitle: string,
  follow: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    if (follow) {
      const { error } = await supabase
        .from('followed_albums')
        .upsert({
          user_id: userId,
          artist_slug: artistSlug,
          album_title: albumTitle,
          followed_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error following album:', error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('followed_albums')
        .delete()
        .eq('user_id', userId)
        .eq('artist_slug', artistSlug)
        .eq('album_title', albumTitle);

      if (error) {
        console.error('Error unfollowing album:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in syncFollowedAlbum:', error);
    return false;
  }
}

// ================================
// RECENTLY PLAYED SYNC
// ================================

export interface RecentlyPlayedItem {
  songId: string;
  song: Song;
  playedAt: string;
  playCount: number;
}

export async function fetchRecentlyPlayed(userId: string): Promise<RecentlyPlayedItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('recently_played')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching recently played:', error);
      return [];
    }

    return (data || []).map(item => ({
      songId: (item.song_data as Song).id,
      song: item.song_data as Song,
      playedAt: item.played_at,
      playCount: item.play_count,
    }));
  } catch (error) {
    console.error('Error in fetchRecentlyPlayed:', error);
    return [];
  }
}

export async function syncRecentlyPlayed(userId: string, item: RecentlyPlayedItem): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // Check if this song already exists
    const { data: existing } = await supabase
      .from('recently_played')
      .select('id, play_count')
      .eq('user_id', userId)
      .eq('song_data->>id', item.songId)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('recently_played')
        .update({
          play_count: existing.play_count + 1,
          played_at: item.playedAt,
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating recently played:', error);
        return false;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('recently_played')
        .insert({
          user_id: userId,
          song_data: item.song,
          play_count: item.playCount,
          played_at: item.playedAt,
        });

      if (error) {
        console.error('Error inserting recently played:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in syncRecentlyPlayed:', error);
    return false;
  }
}

// ================================
// REALTIME SUBSCRIPTIONS
// ================================

export function subscribeToPlaylistChanges(
  userId: string,
  onUpdate: (playlists: Playlist[]) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel(`playlists:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'playlists',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all playlists on any change
        const playlists = await fetchUserPlaylists(userId);
        onUpdate(playlists);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToWishlistChanges(
  userId: string,
  onUpdate: (data: WishlistData) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const wishlistChannel = supabase
    .channel(`wishlist:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wishlist',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        const data = await fetchUserWishlist(userId);
        onUpdate(data);
      }
    )
    .subscribe();

  const artistsChannel = supabase
    .channel(`followed_artists:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'followed_artists',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        const data = await fetchUserWishlist(userId);
        onUpdate(data);
      }
    )
    .subscribe();

  const albumsChannel = supabase
    .channel(`followed_albums:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'followed_albums',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        const data = await fetchUserWishlist(userId);
        onUpdate(data);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(wishlistChannel);
    supabase.removeChannel(artistsChannel);
    supabase.removeChannel(albumsChannel);
  };
}

// ================================
// DEBOUNCED SYNC FUNCTIONS
// ================================

export const debouncedSyncPlaylist = debounce(syncPlaylistToServer, 500);
export const debouncedSyncWishlistItem = debounce(syncWishlistItemToServer, 500);
export const debouncedSyncRecentlyPlayed = debounce(syncRecentlyPlayed, 2000);
