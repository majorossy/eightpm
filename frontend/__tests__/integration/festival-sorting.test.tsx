/**
 * Integration test: Festival lineup sorting algorithms
 *
 * Tests from utils/festivalSorting.ts:
 * - sortBySongVersions: by songCount descending
 * - sortByShows: by totalShows descending
 * - sortByHours: by totalHours descending
 * - sortAlphabetically: by name A-Z
 * - sortArtistsByAlgorithm: main entry point
 * - isValidAlgorithm: validates algorithm strings
 * - All return new arrays without mutation
 */
import { describe, it, expect } from 'vitest';
import {
  sortBySongVersions,
  sortByShows,
  sortByHours,
  sortAlphabetically,
  sortArtistsByAlgorithm,
  isValidAlgorithm,
  type ArtistWithStats,
} from '@/utils/festivalSorting';

const artists: ArtistWithStats[] = [
  { slug: 'phish', name: 'Phish', songCount: 5000, albumCount: 200, totalShows: 2000, totalHours: 4000 },
  { slug: 'railroadearth', name: 'Railroad Earth', songCount: 1500, albumCount: 100, totalShows: 500, totalHours: 800 },
  { slug: 'grateful-dead', name: 'Grateful Dead', songCount: 8000, albumCount: 300, totalShows: 2300, totalHours: 5000 },
  { slug: 'goose', name: 'Goose', songCount: 400, albumCount: 50, totalShows: 200, totalHours: 300 },
];

describe('Festival Sorting Integration', () => {
  describe('sortBySongVersions', () => {
    it('sorts by songCount descending', () => {
      const result = sortBySongVersions(artists);
      expect(result[0].slug).toBe('grateful-dead');
      expect(result[1].slug).toBe('phish');
      expect(result[3].slug).toBe('goose');
    });

    it('returns empty for empty input', () => {
      expect(sortBySongVersions([])).toEqual([]);
    });

    it('does not mutate original array', () => {
      const original = [...artists];
      sortBySongVersions(artists);
      expect(artists).toEqual(original);
    });
  });

  describe('sortByShows', () => {
    it('sorts by totalShows descending', () => {
      const result = sortByShows(artists);
      expect(result[0].slug).toBe('grateful-dead'); // 2300
      expect(result[1].slug).toBe('phish'); // 2000
      expect(result[2].slug).toBe('railroadearth'); // 500
      expect(result[3].slug).toBe('goose'); // 200
    });
  });

  describe('sortByHours', () => {
    it('sorts by totalHours descending', () => {
      const result = sortByHours(artists);
      expect(result[0].slug).toBe('grateful-dead'); // 5000
      expect(result[1].slug).toBe('phish'); // 4000
    });
  });

  describe('sortAlphabetically', () => {
    it('sorts by name A-Z', () => {
      const result = sortAlphabetically(artists);
      expect(result[0].name).toBe('Goose');
      expect(result[1].name).toBe('Grateful Dead');
      expect(result[2].name).toBe('Phish');
      expect(result[3].name).toBe('Railroad Earth');
    });

    it('returns empty for empty input', () => {
      expect(sortAlphabetically([])).toEqual([]);
    });

    it('returns copy for single item', () => {
      const single = [artists[0]];
      const result = sortAlphabetically(single);
      expect(result).toHaveLength(1);
      expect(result).not.toBe(single); // different array reference
    });
  });

  describe('sortArtistsByAlgorithm', () => {
    it('delegates to songVersions algorithm', () => {
      const result = sortArtistsByAlgorithm(artists, 'songVersions');
      expect(result[0].slug).toBe('grateful-dead');
    });

    it('delegates to shows algorithm', () => {
      const result = sortArtistsByAlgorithm(artists, 'shows');
      expect(result[0].slug).toBe('grateful-dead');
    });

    it('delegates to hours algorithm', () => {
      const result = sortArtistsByAlgorithm(artists, 'hours');
      expect(result[0].slug).toBe('grateful-dead');
    });
  });

  describe('isValidAlgorithm', () => {
    it('accepts valid algorithms', () => {
      expect(isValidAlgorithm('songVersions')).toBe(true);
      expect(isValidAlgorithm('shows')).toBe(true);
      expect(isValidAlgorithm('hours')).toBe(true);
    });

    it('rejects invalid strings', () => {
      expect(isValidAlgorithm('invalid')).toBe(false);
      expect(isValidAlgorithm('')).toBe(false);
      expect(isValidAlgorithm('alphabetical')).toBe(false);
    });
  });

  describe('handles missing stats gracefully', () => {
    it('treats undefined stats as 0', () => {
      const incomplete: ArtistWithStats[] = [
        { slug: 'a', name: 'A', songCount: 100, albumCount: 10 },
        { slug: 'b', name: 'B', songCount: 200, albumCount: 20, totalShows: 50 },
      ];
      const byShows = sortByShows(incomplete);
      expect(byShows[0].slug).toBe('b'); // 50 > 0
    });
  });
});
