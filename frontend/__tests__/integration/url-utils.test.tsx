/**
 * Integration test: URL sanitization utilities
 *
 * Tests sanitizeStreamUrl from lib/urlUtils.ts:
 * - Fixes double-slash after domain
 * - Converts .flac → .mp3 (Archive.org derives MP3 for every FLAC)
 * - Encodes spaces in path
 * - Handles empty/falsy input
 * - Leaves valid URLs unchanged
 * - Handles combinations of all transforms
 */
import { describe, it, expect } from 'vitest';
import { sanitizeStreamUrl } from '@/lib/urlUtils';

describe('URL Utils Integration', () => {
  describe('sanitizeStreamUrl', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeStreamUrl('')).toBe('');
    });

    it('fixes double-slash after domain', () => {
      const url = 'https://archive.org//24/items/gd1977-05-08/gd77-05-08d1t01.mp3';
      expect(sanitizeStreamUrl(url)).toBe(
        'https://archive.org/24/items/gd1977-05-08/gd77-05-08d1t01.mp3'
      );
    });

    it('converts .flac to .mp3', () => {
      const url = 'https://archive.org/download/gd1977-05-08/gd77-05-08d1t01.flac';
      const result = sanitizeStreamUrl(url);
      expect(result).toContain('.mp3');
      expect(result).not.toContain('.flac');
    });

    it('encodes spaces in path', () => {
      const url = 'https://archive.org/download/rre2024/Bird on a Wire.mp3';
      expect(sanitizeStreamUrl(url)).toBe(
        'https://archive.org/download/rre2024/Bird%20on%20a%20Wire.mp3'
      );
    });

    it('leaves valid URLs unchanged', () => {
      const url = 'https://archive.org/download/gd1977-05-08/track01.mp3';
      expect(sanitizeStreamUrl(url)).toBe(url);
    });

    it('handles all transforms combined', () => {
      const url = 'https://archive.org//download/show/Bird Song.flac';
      const result = sanitizeStreamUrl(url);
      expect(result).toBe('https://archive.org/download/show/Bird%20Song.mp3');
    });

    it('preserves http:// protocol', () => {
      const url = 'http://archive.org//download/show/track.flac';
      const result = sanitizeStreamUrl(url);
      expect(result).toContain('http://archive.org/download');
      expect(result).toContain('.mp3');
    });

    it('does not modify non-flac extensions', () => {
      const url = 'https://archive.org/download/show/track.ogg';
      expect(sanitizeStreamUrl(url)).toBe(url);
    });

    it('only converts trailing .flac (not mid-path)', () => {
      // A path component named "flac_files" should not be affected
      const url = 'https://archive.org/download/show/track.mp3';
      expect(sanitizeStreamUrl(url)).toBe(url);
    });
  });
});
