/**
 * Integration test: Related artists configuration
 *
 * Tests from lib/relatedArtists.ts:
 * - getRelatedArtistSlugs: returns related artists for known/unknown slugs
 * - hasRelatedArtists: checks if relationships are configured
 * - getArtistsRelatedTo: reverse lookup (who references this artist)
 * - Default limit of 4, custom limits
 * - Filters out self-references
 * - Falls back to _default for unknown artists
 */
import { describe, it, expect } from 'vitest';
import {
  getRelatedArtistSlugs,
  hasRelatedArtists,
  getArtistsRelatedTo,
} from '@/lib/relatedArtists';

describe('Related Artists Integration', () => {
  describe('getRelatedArtistSlugs', () => {
    it('returns related artists for a known artist', () => {
      const related = getRelatedArtistSlugs('railroadearth');
      expect(related.length).toBeGreaterThan(0);
      expect(related.length).toBeLessThanOrEqual(4);
    });

    it('defaults to 4 results', () => {
      const related = getRelatedArtistSlugs('phish');
      expect(related).toHaveLength(4);
    });

    it('respects custom limit', () => {
      const related = getRelatedArtistSlugs('phish', 2);
      expect(related).toHaveLength(2);
    });

    it('returns default artists for unknown slug', () => {
      const related = getRelatedArtistSlugs('totally-unknown-band');
      expect(related.length).toBeGreaterThan(0);
      // Default includes well-known artists
      expect(related).toContain('grateful-dead');
    });

    it('filters out self-references', () => {
      const related = getRelatedArtistSlugs('grateful-dead');
      expect(related).not.toContain('grateful-dead');
    });

    it('returns Grateful Dead family connections', () => {
      const related = getRelatedArtistSlugs('grateful-dead', 6);
      expect(related).toContain('phish');
      expect(related).toContain('furthur');
    });

    it('returns bluegrass-jam connections for Railroad Earth', () => {
      const related = getRelatedArtistSlugs('railroadearth', 6);
      expect(related).toContain('thestringcheeseincident');
    });
  });

  describe('hasRelatedArtists', () => {
    it('returns true for configured artist', () => {
      expect(hasRelatedArtists('phish')).toBe(true);
      expect(hasRelatedArtists('grateful-dead')).toBe(true);
      expect(hasRelatedArtists('railroadearth')).toBe(true);
    });

    it('returns false for unconfigured artist', () => {
      expect(hasRelatedArtists('totally-unknown-band')).toBe(false);
    });
  });

  describe('getArtistsRelatedTo', () => {
    it('finds artists that reference Grateful Dead', () => {
      const relatedTo = getArtistsRelatedTo('grateful-dead');
      expect(relatedTo.length).toBeGreaterThan(0);
      expect(relatedTo).toContain('phish');
      expect(relatedTo).toContain('widespread-panic');
    });

    it('finds artists that reference Phish', () => {
      const relatedTo = getArtistsRelatedTo('phish');
      expect(relatedTo).toContain('goose');
      expect(relatedTo).toContain('moe');
    });

    it('returns empty array for artist nobody references', () => {
      const relatedTo = getArtistsRelatedTo('totally-obscure-band');
      expect(relatedTo).toEqual([]);
    });

    it('excludes _default from results', () => {
      // Even though _default includes 'grateful-dead', it should not appear
      const relatedTo = getArtistsRelatedTo('grateful-dead');
      expect(relatedTo).not.toContain('_default');
    });
  });
});
