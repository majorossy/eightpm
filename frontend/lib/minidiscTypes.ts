// MiniDisc - a free-form collection across albums/artists
// Direct replacement for the former Playlist type.
// Stores full Song objects for cross-album mixes.

import { Song } from './types';

export interface MiniDisc {
  id: string;                                    // "minidisc-{timestamp}"
  name: string;
  description?: string;
  songs: Song[];                                 // Full Song objects
  coverArt?: string;
  createdAt: string;
  updatedAt: string;
}
