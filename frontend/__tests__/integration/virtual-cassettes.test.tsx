/**
 * Integration test: Virtual cassette utilities
 *
 * Tests from lib/virtualCassettes.ts:
 * - Sentinel constants (IDs, names, tint indices)
 * - getVirtualCassetteTint: returns tint style for each virtual type
 * - isVirtualCassette: identifies virtual IDs
 * - hasMultiVersionTracks: detects tracks with >1 song
 * - computeVirtualOverrides: selects best/oldest/newest versions
 */
import { describe, it, expect } from 'vitest';
import {
  VIRTUAL_BEST_ID,
  VIRTUAL_OLDEST_ID,
  VIRTUAL_NEWEST_ID,
  VIRTUAL_BEST_NAME,
  VIRTUAL_OLDEST_NAME,
  VIRTUAL_NEWEST_NAME,
  getVirtualCassetteTint,
  isVirtualCassette,
  hasMultiVersionTracks,
  computeVirtualOverrides,
} from '@/lib/virtualCassettes';
import { Song, Track } from '@/lib/types';

function buildSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-1',
    sku: 'song-1',
    title: 'Test Song',
    artistId: 'a1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroadearth',
    duration: 300,
    streamUrl: 'https://example.com/test.mp3',
    albumArt: '',
    qualityUrls: {},
    albumIdentifier: 'rre-2024',
    albumName: 'Test Show',
    trackTitle: 'Test Song',
    ...overrides,
  };
}

function buildTrack(songs: Song[], overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    title: 'Bird on a Wire',
    slug: 'bird-on-a-wire',
    albumIdentifier: 'rre-2024',
    albumName: 'Red Rocks 2024',
    artistId: 'a1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroadearth',
    songs,
    totalDuration: songs[0]?.duration || 300,
    songCount: songs.length,
    ...overrides,
  };
}

describe('Virtual Cassettes Integration', () => {
  describe('sentinel constants', () => {
    it('has expected IDs', () => {
      expect(VIRTUAL_BEST_ID).toBe('virtual-best');
      expect(VIRTUAL_OLDEST_ID).toBe('virtual-oldest');
      expect(VIRTUAL_NEWEST_ID).toBe('virtual-newest');
    });

    it('has expected names', () => {
      expect(VIRTUAL_BEST_NAME).toBe('Ratings');
      expect(VIRTUAL_OLDEST_NAME).toBe('Earliest Recording');
      expect(VIRTUAL_NEWEST_NAME).toBe('Latest Recording');
    });
  });

  describe('getVirtualCassetteTint', () => {
    it('returns tint for best', () => {
      const tint = getVirtualCassetteTint(VIRTUAL_BEST_ID);
      expect(tint).toBeDefined();
      expect(tint!['--cassette-glow']).toBe('#c8940a');
    });

    it('returns tint for oldest', () => {
      const tint = getVirtualCassetteTint(VIRTUAL_OLDEST_ID);
      expect(tint).toBeDefined();
      expect(tint!['--cassette-glow']).toBe('#a07808');
    });

    it('returns tint for newest', () => {
      const tint = getVirtualCassetteTint(VIRTUAL_NEWEST_ID);
      expect(tint).toBeDefined();
      expect(tint!['--cassette-glow']).toBe('#5ad0f8');
    });

    it('returns undefined for non-virtual ID', () => {
      expect(getVirtualCassetteTint('cassette-123')).toBeUndefined();
    });

    it('returns undefined for null', () => {
      expect(getVirtualCassetteTint(null)).toBeUndefined();
    });
  });

  describe('isVirtualCassette', () => {
    it('returns true for all virtual IDs', () => {
      expect(isVirtualCassette(VIRTUAL_BEST_ID)).toBe(true);
      expect(isVirtualCassette(VIRTUAL_OLDEST_ID)).toBe(true);
      expect(isVirtualCassette(VIRTUAL_NEWEST_ID)).toBe(true);
    });

    it('returns false for regular cassette ID', () => {
      expect(isVirtualCassette('cassette-123')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isVirtualCassette(null)).toBe(false);
    });
  });

  describe('hasMultiVersionTracks', () => {
    it('returns true when a track has multiple songs', () => {
      const tracks = [
        buildTrack([buildSong({ id: 's1' }), buildSong({ id: 's2' })]),
      ];
      expect(hasMultiVersionTracks(tracks)).toBe(true);
    });

    it('returns false when all tracks have single songs', () => {
      const tracks = [
        buildTrack([buildSong({ id: 's1' })]),
        buildTrack([buildSong({ id: 's2' })], { id: 'track-2' }),
      ];
      expect(hasMultiVersionTracks(tracks)).toBe(false);
    });

    it('returns false for empty tracks', () => {
      expect(hasMultiVersionTracks([])).toBe(false);
    });
  });

  describe('computeVirtualOverrides', () => {
    const song1 = buildSong({ id: 's1', avgRating: 4.5, showDate: '1977-05-08' });
    const song2 = buildSong({ id: 's2', avgRating: 3.0, showDate: '2024-06-15' });
    const song3 = buildSong({ id: 's3', avgRating: 5.0, showDate: '1995-10-14' });

    const multiTrack = buildTrack([song1, song2, song3], { id: 'track-multi' });

    it('best mode selects highest-rated version', () => {
      const overrides = computeVirtualOverrides([multiTrack], 'best');
      // getBestVersion sorts by avgRating desc — song3 (5.0) wins
      expect(overrides['track-multi']).toBe('s3');
    });

    it('oldest mode selects earliest show date', () => {
      const overrides = computeVirtualOverrides([multiTrack], 'oldest');
      // 1977-05-08 is oldest (s1), differs from best (s3)
      expect(overrides['track-multi']).toBe('s1');
    });

    it('newest mode selects latest show date', () => {
      const overrides = computeVirtualOverrides([multiTrack], 'newest');
      // 2024-06-15 is newest (s2), differs from best (s3)
      expect(overrides['track-multi']).toBe('s2');
    });

    it('skips single-song tracks', () => {
      const singleTrack = buildTrack([buildSong()], { id: 'track-single' });
      const overrides = computeVirtualOverrides([singleTrack], 'best');
      expect(overrides).toEqual({});
    });

    it('returns empty for empty tracks', () => {
      expect(computeVirtualOverrides([], 'best')).toEqual({});
    });
  });
});
