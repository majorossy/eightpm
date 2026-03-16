/**
 * Test data factories for Song, Album, Track, and Artist.
 *
 * Usage:
 *   const song = buildSong({ title: 'Tweezer' });
 *   const album = buildAlbum({ tracks: [buildTrack({ songs: [song] })] });
 */
import type { Song, Album, Track, Artist } from '@/lib/types';

let songCounter = 0;
let trackCounter = 0;
let albumCounter = 0;
let artistCounter = 0;

export function resetCounters() {
  songCounter = trackCounter = albumCounter = artistCounter = 0;
}

export function buildSong(overrides: Partial<Song> = {}): Song {
  songCounter++;
  const id = overrides.id ?? `song-${songCounter}`;
  const artistSlug = overrides.artistSlug ?? 'railroad-earth';
  return {
    id,
    sku: `sku-${songCounter}`,
    title: `Song ${songCounter}`,
    artistId: `artist-1`,
    artistName: 'Railroad Earth',
    artistSlug,
    duration: 300,
    streamUrl: `https://archive.org/download/test/song${songCounter}.mp3`,
    albumArt: '/img/default-cover.jpg',
    albumIdentifier: `re-2024-01-01`,
    albumName: 'Railroad Earth Live at Red Rocks 2024-01-01',
    trackTitle: `Track ${songCounter}`,
    showDate: '2024-01-01',
    showVenue: 'Red Rocks Amphitheatre',
    showLocation: 'Morrison, CO',
    qualityUrls: {
      high: `https://archive.org/download/test/song${songCounter}.flac`,
      medium: `https://archive.org/download/test/song${songCounter}.mp3`,
      low: `https://archive.org/download/test/song${songCounter}-64.mp3`,
    },
    ...overrides,
  };
}

export function buildTrack(overrides: Partial<Track> = {}): Track {
  trackCounter++;
  const songs = overrides.songs ?? [buildSong()];
  return {
    id: `track-${trackCounter}`,
    title: `Track ${trackCounter}`,
    slug: `track-${trackCounter}`,
    albumIdentifier: 're-2024-01-01',
    albumName: 'Railroad Earth Live at Red Rocks 2024-01-01',
    artistId: 'artist-1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroad-earth',
    songs,
    totalDuration: songs[0]?.duration ?? 300,
    songCount: songs.length,
    ...overrides,
  };
}

export function buildAlbum(overrides: Partial<Album> = {}): Album {
  albumCounter++;
  const identifier = overrides.identifier ?? `re-2024-01-${String(albumCounter).padStart(2, '0')}`;
  const tracks = overrides.tracks ?? [buildTrack(), buildTrack(), buildTrack()];
  return {
    id: `album-${albumCounter}`,
    identifier,
    name: `Railroad Earth Live ${albumCounter}`,
    slug: identifier,
    artistId: 'artist-1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroad-earth',
    showDate: '2024-01-01',
    showVenue: 'Red Rocks Amphitheatre',
    showLocation: 'Morrison, CO',
    tracks,
    totalTracks: tracks.length,
    totalSongs: tracks.reduce((sum, t) => sum + t.songCount, 0),
    totalDuration: tracks.reduce((sum, t) => sum + t.totalDuration, 0),
    ...overrides,
  };
}

export function buildArtist(overrides: Partial<Artist> = {}): Artist {
  artistCounter++;
  return {
    id: `artist-${artistCounter}`,
    name: 'Railroad Earth',
    slug: 'railroad-earth',
    image: '/img/railroad-earth.jpg',
    bio: 'Railroad Earth is an American jam band from Stillwater, NJ.',
    songCount: 500,
    albumCount: 120,
    ...overrides,
  };
}
