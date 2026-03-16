/**
 * Integration test: Audio quality utilities
 *
 * Tests from lib/qualityUtils.ts:
 * - getQualityLabel: returns human-readable label for quality level
 * - getEffectiveQuality: determines actual playback quality based on available URLs
 */
import { describe, it, expect, vi } from 'vitest';
import { Song } from '@/lib/types';

// Mock the getSourceFormat dependency before importing qualityUtils
vi.mock('@/components/recording/recordingUtils', () => ({
  getSourceFormat: (song: Song) => {
    if (song.albumIdentifier?.includes('.flac24')) return 'flac24';
    if (song.albumIdentifier?.includes('.flac16')) return 'flac16';
    return null;
  },
}));

import { getQualityLabel, getEffectiveQuality } from '@/lib/qualityUtils';

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

describe('Quality Utils Integration', () => {
  describe('getQualityLabel', () => {
    it('returns "FLAC" for high quality without song', () => {
      expect(getQualityLabel('high')).toBe('FLAC');
    });

    it('returns "320k" for medium quality', () => {
      expect(getQualityLabel('medium')).toBe('320k');
    });

    it('returns "128k" for low quality', () => {
      expect(getQualityLabel('low')).toBe('128k');
    });

    it('returns "FLAC 24" for high quality with 24-bit source', () => {
      const song = buildSong({ albumIdentifier: 'show.flac24' });
      expect(getQualityLabel('high', song)).toBe('FLAC 24');
    });

    it('returns "FLAC 16" for high quality with 16-bit source', () => {
      const song = buildSong({ albumIdentifier: 'show.flac16' });
      expect(getQualityLabel('high', song)).toBe('FLAC 16');
    });

    it('returns generic "FLAC" when source format is unknown', () => {
      const song = buildSong({ albumIdentifier: 'show-2024' });
      expect(getQualityLabel('high', song)).toBe('FLAC');
    });

    it('ignores song parameter for non-high quality', () => {
      const song = buildSong({ albumIdentifier: 'show.flac24' });
      expect(getQualityLabel('medium', song)).toBe('320k');
      expect(getQualityLabel('low', song)).toBe('128k');
    });
  });

  describe('getEffectiveQuality', () => {
    it('returns preferred quality when URL exists', () => {
      const song = buildSong({
        qualityUrls: {
          high: 'https://example.com/high.flac',
          medium: 'https://example.com/medium.mp3',
          low: 'https://example.com/low.mp3',
        },
      });
      expect(getEffectiveQuality(song, 'high')).toBe('high');
      expect(getEffectiveQuality(song, 'medium')).toBe('medium');
      expect(getEffectiveQuality(song, 'low')).toBe('low');
    });

    it('falls back to medium when preferred is unavailable', () => {
      const song = buildSong({
        qualityUrls: {
          medium: 'https://example.com/medium.mp3',
          low: 'https://example.com/low.mp3',
        },
      });
      expect(getEffectiveQuality(song, 'high')).toBe('medium');
    });

    it('falls back to high when medium unavailable', () => {
      const song = buildSong({
        qualityUrls: {
          high: 'https://example.com/high.flac',
          low: 'https://example.com/low.mp3',
        },
      });
      expect(getEffectiveQuality(song, 'medium')).toBe('high');
    });

    it('falls back to low as last resort', () => {
      const song = buildSong({
        qualityUrls: {
          low: 'https://example.com/low.mp3',
        },
      });
      expect(getEffectiveQuality(song, 'high')).toBe('low');
    });

    it('returns preferred when qualityUrls is empty', () => {
      const song = buildSong({ qualityUrls: {} });
      expect(getEffectiveQuality(song, 'high')).toBe('high');
    });

    it('returns preferred when qualityUrls is undefined', () => {
      const song = buildSong();
      (song as any).qualityUrls = undefined;
      expect(getEffectiveQuality(song, 'medium')).toBe('medium');
    });
  });
});
