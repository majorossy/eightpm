import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
// These should be set in environment variables for production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured (both URL and key are required)
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);


// Create a single supabase client for interacting with your database
// Only create if configured, otherwise create a dummy client that won't be used
export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

// Database types (these would be generated from your Supabase schema)
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DbPlaylist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_art: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPlaylistSong {
  id: string;
  playlist_id: string;
  song_data: object; // JSON object with Song data
  position: number;
  added_at: string;
}

export interface DbWishlistItem {
  id: string;
  user_id: string;
  song_data: object;
  added_at: string;
}

export interface DbFollowedArtist {
  user_id: string;
  artist_slug: string;
  followed_at: string;
}

export interface DbFollowedAlbum {
  user_id: string;
  artist_slug: string;
  album_title: string;
  followed_at: string;
}

export interface DbRecentlyPlayed {
  id: string;
  user_id: string;
  song_data: object;
  play_count: number;
  played_at: string;
}

export interface DbUserPreferences {
  user_id: string;
  crossfade_duration: number;
  theme_preference: string;
  updated_at: string;
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}
