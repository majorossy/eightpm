/**
 * Integration test: Recording source format detection
 *
 * Tests getSourceFormat from components/recording/recordingUtils.ts:
 * - Detects flac24 from albumIdentifier (.flac24, .24bit)
 * - Detects flac16 from albumIdentifier (.flac16, .16bit, .shn)
 * - Detects mp3 from albumIdentifier (.mp3)
 * - Falls back to trackOriginalFile extension
 * - Returns null when format unknown
 */
import { describe, it, expect } from 'vitest';
import { getSourceFormat } from '@/components/recording/recordingUtils';
import { Song } from '@/lib/types';

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

describe('Recording Utils Integration', () => {
  describe('getSourceFormat', () => {
    it('detects flac24 from .flac24 in identifier', () => {
      const song = buildSong({ albumIdentifier: 'gd1977-05-08.flac24' });
      expect(getSourceFormat(song)).toBe('flac24');
    });

    it('detects flac24 from .24bit in identifier', () => {
      const song = buildSong({ albumIdentifier: 'gd1977-05-08.24bit' });
      expect(getSourceFormat(song)).toBe('flac24');
    });

    it('detects flac16 from .flac16 in identifier', () => {
      const song = buildSong({ albumIdentifier: 'gd1977-05-08.flac16' });
      expect(getSourceFormat(song)).toBe('flac16');
    });

    it('detects flac16 from .16bit in identifier', () => {
      const song = buildSong({ albumIdentifier: 'gd1977-05-08.16bit' });
      expect(getSourceFormat(song)).toBe('flac16');
    });

    it('detects flac16 from .shn in identifier', () => {
      const song = buildSong({ albumIdentifier: 'gd1977-05-08.shn' });
      expect(getSourceFormat(song)).toBe('flac16');
    });

    it('detects mp3 from .mp3 in identifier', () => {
      const song = buildSong({ albumIdentifier: 'gd1977-05-08.mp3' });
      expect(getSourceFormat(song)).toBe('mp3');
    });

    it('falls back to trackOriginalFile for .flac extension', () => {
      const song = buildSong({
        albumIdentifier: 'gd1977-05-08',
        trackOriginalFile: 'track01.flac',
      });
      expect(getSourceFormat(song)).toBe('flac16');
    });

    it('falls back to trackOriginalFile for .mp3 extension', () => {
      const song = buildSong({
        albumIdentifier: 'gd1977-05-08',
        trackOriginalFile: 'track01.mp3',
      });
      expect(getSourceFormat(song)).toBe('mp3');
    });

    it('falls back to trackOriginalFile for .shn extension', () => {
      const song = buildSong({
        albumIdentifier: 'gd1977-05-08',
        trackOriginalFile: 'track01.shn',
      });
      expect(getSourceFormat(song)).toBe('flac16');
    });

    it('returns null when format unknown', () => {
      const song = buildSong({ albumIdentifier: 'gd1977-05-08' });
      expect(getSourceFormat(song)).toBeNull();
    });

    it('returns null when no identifier or file', () => {
      const song = buildSong({ albumIdentifier: '' });
      expect(getSourceFormat(song)).toBeNull();
    });
  });
});
