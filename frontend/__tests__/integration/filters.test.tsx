/**
 * Integration test: Version filter utilities
 *
 * Tests filter functions from lib/filters.ts:
 * - hasActiveFilters: detects when any filter is set
 * - applyFilters: year, date range, venue, soundboard, artist, minRating
 * - Combined filters (AND logic)
 * - extractYear: parses various date formats
 * - getAvailableYears: unique years in descending order
 * - getAvailableVenues: unique sorted venue list
 * - countSoundboards: counts SBD recordings
 * - getFilterSummary: aggregated summary
 */
import { describe, it, expect } from 'vitest';
import { Song } from '@/lib/types';
import {
  hasActiveFilters,
  applyFilters,
  extractYear,
  getAvailableYears,
  getAvailableVenues,
  countSoundboards,
  getFilterSummary,
} from '@/lib/filters';

// Minimal song factory for filter tests
function buildFilterSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-1',
    sku: 'song-1',
    title: 'Test Song',
    artistId: 'a1',
    artistName: 'Test Band',
    artistSlug: 'test-band',
    duration: 300,
    streamUrl: 'https://example.com/test.mp3',
    albumArt: '',
    qualityUrls: {},
    albumIdentifier: 'test-2024',
    albumName: 'Test Show',
    trackTitle: 'Test Song',
    ...overrides,
  };
}

const versions: Song[] = [
  buildFilterSong({
    id: 's1', showDate: '1977-05-08', showVenue: 'Barton Hall', artistSlug: 'grateful-dead',
    lineage: 'SBD > DAT > CD', avgRating: 4.5,
  }),
  buildFilterSong({
    id: 's2', showDate: '1977-05-09', showVenue: 'Veterans Memorial', artistSlug: 'grateful-dead',
    lineage: 'AUD > DAT', avgRating: 3.2,
  }),
  buildFilterSong({
    id: 's3', showDate: '1995-10-14', showVenue: 'Madison Square Garden', artistSlug: 'phish',
    lineage: 'Soundboard', avgRating: 4.8,
  }),
  buildFilterSong({
    id: 's4', showDate: '2024-06-15', showVenue: 'Red Rocks', artistSlug: 'railroadearth',
    lineage: 'Matrix > SBD + AUD', avgRating: 4.0,
  }),
];

describe('Filter Utils Integration', () => {
  describe('hasActiveFilters', () => {
    it('returns false for empty filters', () => {
      expect(hasActiveFilters({})).toBe(false);
    });

    it('returns true when any filter is set', () => {
      expect(hasActiveFilters({ year: 1977 })).toBe(true);
      expect(hasActiveFilters({ venue: 'Red Rocks' })).toBe(true);
      expect(hasActiveFilters({ isSoundboard: true })).toBe(true);
      expect(hasActiveFilters({ artist: 'phish' })).toBe(true);
      expect(hasActiveFilters({ minRating: 4.0 })).toBe(true);
    });
  });

  describe('applyFilters', () => {
    it('returns all versions when no filters active', () => {
      expect(applyFilters(versions, {})).toHaveLength(4);
    });

    it('filters by year', () => {
      const result = applyFilters(versions, { year: 1977 });
      expect(result).toHaveLength(2);
      expect(result.every(v => v.showDate?.startsWith('1977'))).toBe(true);
    });

    it('filters by date range', () => {
      const result = applyFilters(versions, {
        dateFrom: '1990-01-01',
        dateTo: '2000-12-31',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s3');
    });

    it('filters by venue (partial, case-insensitive)', () => {
      const result = applyFilters(versions, { venue: 'barton' });
      expect(result).toHaveLength(1);
      expect(result[0].showVenue).toBe('Barton Hall');
    });

    it('filters by soundboard', () => {
      const result = applyFilters(versions, { isSoundboard: true });
      expect(result).toHaveLength(3); // s1 (SBD), s3 (Soundboard), s4 (Matrix > SBD + AUD)
    });

    it('filters by artist slug', () => {
      const result = applyFilters(versions, { artist: 'phish' });
      expect(result).toHaveLength(1);
      expect(result[0].artistSlug).toBe('phish');
    });

    it('filters by minimum rating', () => {
      const result = applyFilters(versions, { minRating: 4.0 });
      expect(result).toHaveLength(3); // s1 (4.5), s3 (4.8), s4 (4.0)
    });

    it('combines multiple filters (AND logic)', () => {
      const result = applyFilters(versions, {
        year: 1977,
        isSoundboard: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });
  });

  describe('extractYear', () => {
    it('extracts from ISO date', () => {
      expect(extractYear('1977-05-08')).toBe(1977);
    });

    it('extracts from year-only string', () => {
      expect(extractYear('2024')).toBe(2024);
    });

    it('returns null for undefined/empty', () => {
      expect(extractYear(undefined)).toBeNull();
      expect(extractYear('')).toBeNull();
    });

    it('returns null for no year pattern', () => {
      expect(extractYear('no date here')).toBeNull();
    });

    it('handles embedded year', () => {
      expect(extractYear('May 11, 1972')).toBe(1972);
    });
  });

  describe('getAvailableYears', () => {
    it('returns unique years in descending order', () => {
      const years = getAvailableYears(versions);
      expect(years).toEqual([2024, 1995, 1977]);
    });

    it('returns empty array for no versions', () => {
      expect(getAvailableYears([])).toEqual([]);
    });
  });

  describe('getAvailableVenues', () => {
    it('returns sorted unique venues', () => {
      const venues = getAvailableVenues(versions);
      expect(venues).toEqual([
        'Barton Hall',
        'Madison Square Garden',
        'Red Rocks',
        'Veterans Memorial',
      ]);
    });
  });

  describe('countSoundboards', () => {
    it('counts SBD recordings', () => {
      expect(countSoundboards(versions)).toBe(3); // s1, s3, s4 (Matrix > SBD + AUD)
    });

    it('returns 0 for empty list', () => {
      expect(countSoundboards([])).toBe(0);
    });
  });

  describe('getFilterSummary', () => {
    it('returns complete summary', () => {
      const summary = getFilterSummary(versions);
      expect(summary.totalVersions).toBe(4);
      expect(summary.soundboardCount).toBe(3);
      expect(summary.years).toEqual([2024, 1995, 1977]);
      expect(summary.yearRange).toEqual({ min: 1977, max: 2024 });
    });

    it('returns null yearRange for empty list', () => {
      const summary = getFilterSummary([]);
      expect(summary.yearRange).toBeNull();
      expect(summary.totalVersions).toBe(0);
    });
  });
});
