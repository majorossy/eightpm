/**
 * Integration test: Library utility functions
 *
 * Tests from lib/libraryUtils.ts:
 * - formatRelativeTime: human-readable relative timestamps
 * - formatShowDate: MM/DD/YY date formatting
 * - aggregateVersions: groups wishlist items by track title
 * - getArtistInitials: extracts initials from artist name
 * - getLastUpdatedText: finds most recent date across collections
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeTime,
  formatShowDate,
  aggregateVersions,
  getArtistInitials,
  getLastUpdatedText,
} from '@/lib/libraryUtils';
import { WishlistItem, Song } from '@/lib/types';

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

function buildWishlistItem(overrides: Partial<Song> = {}): WishlistItem {
  return {
    songId: overrides.id || 'song-1',
    song: buildSong(overrides),
    addedAt: '2026-03-15T12:00:00Z',
  };
}

describe('Library Utils Integration', () => {
  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "Just now" for < 1 minute ago', () => {
      expect(formatRelativeTime('2026-03-15T11:59:30Z')).toBe('Just now');
    });

    it('returns minutes for < 1 hour', () => {
      expect(formatRelativeTime('2026-03-15T11:45:00Z')).toBe('15m ago');
    });

    it('returns hours for < 24 hours', () => {
      expect(formatRelativeTime('2026-03-15T06:00:00Z')).toBe('6h ago');
    });

    it('returns "Yesterday" for 1 day ago', () => {
      expect(formatRelativeTime('2026-03-14T12:00:00Z')).toBe('Yesterday');
    });

    it('returns days for < 7 days', () => {
      expect(formatRelativeTime('2026-03-11T12:00:00Z')).toBe('4d ago');
    });

    it('returns weeks for < 30 days', () => {
      expect(formatRelativeTime('2026-03-01T12:00:00Z')).toBe('2w ago');
    });

    it('returns months for < 365 days', () => {
      expect(formatRelativeTime('2025-12-15T12:00:00Z')).toBe('3mo ago');
    });

    it('returns years for >= 365 days', () => {
      expect(formatRelativeTime('2024-03-15T12:00:00Z')).toBe('2y ago');
    });
  });

  describe('formatShowDate', () => {
    it('formats ISO date as MM/DD/YY', () => {
      const result = formatShowDate('1977-05-08');
      expect(result).toBe('05/08/77');
    });

    it('returns empty string for undefined', () => {
      expect(formatShowDate(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(formatShowDate('')).toBe('');
    });
  });

  describe('aggregateVersions', () => {
    it('groups by track title and counts', () => {
      const items: WishlistItem[] = [
        buildWishlistItem({ id: 's1', trackTitle: 'Bird Song' }),
        buildWishlistItem({ id: 's2', trackTitle: 'Bird Song' }),
        buildWishlistItem({ id: 's3', trackTitle: 'Scarlet Begonias' }),
      ];

      const result = aggregateVersions(items);
      expect(result).toHaveLength(2);
      expect(result[0].trackTitle).toBe('Bird Song');
      expect(result[0].count).toBe(2);
      expect(result[1].trackTitle).toBe('Scarlet Begonias');
      expect(result[1].count).toBe(1);
    });

    it('sorts by count descending', () => {
      const items: WishlistItem[] = [
        buildWishlistItem({ id: 's1', trackTitle: 'A' }),
        buildWishlistItem({ id: 's2', trackTitle: 'B' }),
        buildWishlistItem({ id: 's3', trackTitle: 'B' }),
        buildWishlistItem({ id: 's4', trackTitle: 'B' }),
      ];

      const result = aggregateVersions(items);
      expect(result[0].trackTitle).toBe('B');
      expect(result[0].count).toBe(3);
    });

    it('sets progressPercent relative to max count', () => {
      const items: WishlistItem[] = [
        buildWishlistItem({ id: 's1', trackTitle: 'Top' }),
        buildWishlistItem({ id: 's2', trackTitle: 'Top' }),
        buildWishlistItem({ id: 's3', trackTitle: 'Top' }),
        buildWishlistItem({ id: 's4', trackTitle: 'Top' }),
        buildWishlistItem({ id: 's5', trackTitle: 'Half' }),
        buildWishlistItem({ id: 's6', trackTitle: 'Half' }),
      ];

      const result = aggregateVersions(items);
      expect(result[0].progressPercent).toBe(100); // 4/4
      expect(result[1].progressPercent).toBe(50); // 2/4
    });

    it('returns empty array for empty input', () => {
      expect(aggregateVersions([])).toEqual([]);
    });
  });

  describe('getArtistInitials', () => {
    it('returns two initials for multi-word names', () => {
      expect(getArtistInitials('Railroad Earth')).toBe('RE');
      expect(getArtistInitials('Grateful Dead')).toBe('GD');
    });

    it('returns single initial for single-word names', () => {
      expect(getArtistInitials('Phish')).toBe('P');
    });

    it('uppercases initials', () => {
      expect(getArtistInitials('my morning jacket')).toBe('MM');
    });

    it('handles empty-ish input gracefully', () => {
      expect(getArtistInitials('')).toBe('?');
    });
  });

  describe('getLastUpdatedText', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "never" for empty collections', () => {
      expect(getLastUpdatedText([], [], [], [])).toBe('never');
    });

    it('returns "today" for recent activity', () => {
      const recent = [
        {
          songId: 's1',
          song: { id: 's1', title: 'T', artistName: 'A', artistSlug: 'a', albumArt: '', albumIdentifier: 'x', albumName: 'X', trackTitle: 'T' },
          playedAt: '2026-03-15T10:00:00Z',
          playCount: 1,
        },
      ];
      expect(getLastUpdatedText([], [], [], recent)).toBe('today');
    });

    it('returns "yesterday" for 1 day ago', () => {
      const recent = [
        {
          songId: 's1',
          song: { id: 's1', title: 'T', artistName: 'A', artistSlug: 'a', albumArt: '', albumIdentifier: 'x', albumName: 'X', trackTitle: 'T' },
          playedAt: '2026-03-14T10:00:00Z',
          playCount: 1,
        },
      ];
      expect(getLastUpdatedText([], [], [], recent)).toBe('yesterday');
    });
  });
});
