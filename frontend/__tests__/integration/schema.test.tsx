/**
 * Integration test: Schema.org structured data generation
 *
 * Tests from lib/schema.ts:
 * - calculateAlbumRating: weighted average, minimum 2 reviews
 * - generateBreadcrumbSchema: BreadcrumbList with positions
 * - generateWebSiteSchema: WebSite with SearchAction
 * - combineSchemas: @graph wrapper, filters nulls
 * - generateArtistFAQSchema: FAQPage with dynamic questions
 * - getShowMetadataFromAlbum: extracts show info from tracks
 * - generateMusicGroupSchema: artist structured data
 */
import { describe, it, expect } from 'vitest';
import {
  calculateAlbumRating,
  generateBreadcrumbSchema,
  generateWebSiteSchema,
  combineSchemas,
  generateArtistFAQSchema,
  getShowMetadataFromAlbum,
  generateMusicGroupSchema,
} from '@/lib/schema';
import { Album, Song, Track, Artist } from '@/lib/types';

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

function buildTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    title: 'Bird on a Wire',
    slug: 'bird-on-a-wire',
    albumIdentifier: 'rre-2024',
    albumName: 'Red Rocks 2024',
    artistId: 'a1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroadearth',
    songs: [buildSong()],
    totalDuration: 300,
    songCount: 1,
    ...overrides,
  };
}

function buildAlbum(overrides: Partial<Album> = {}): Album {
  return {
    id: 'album-1',
    identifier: 'rre-2024-06-15',
    name: 'Red Rocks 2024',
    slug: 'rre-2024-06-15',
    artistId: 'a1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroadearth',
    tracks: [buildTrack()],
    totalTracks: 1,
    totalSongs: 1,
    totalDuration: 300,
    ...overrides,
  };
}

describe('Schema.org Integration', () => {
  describe('calculateAlbumRating', () => {
    it('returns null when fewer than 2 reviews', () => {
      const album = buildAlbum({
        tracks: [
          buildTrack({
            songs: [buildSong({ avgRating: 4.5, numReviews: 1 })],
          }),
        ],
      });
      expect(calculateAlbumRating(album)).toBeNull();
    });

    it('returns weighted average for sufficient reviews', () => {
      const album = buildAlbum({
        tracks: [
          buildTrack({
            songs: [
              buildSong({ avgRating: 4.0, numReviews: 10 }),
              buildSong({ avgRating: 5.0, numReviews: 10 }),
            ],
          }),
        ],
      });

      const rating = calculateAlbumRating(album);
      expect(rating).not.toBeNull();
      expect(rating!.ratingValue).toBe(4.5); // (4*10 + 5*10) / 20
      expect(rating!.reviewCount).toBe(20);
    });

    it('ignores songs without ratings', () => {
      const album = buildAlbum({
        tracks: [
          buildTrack({
            songs: [
              buildSong({ avgRating: 4.0, numReviews: 5 }),
              buildSong({ avgRating: undefined, numReviews: undefined }),
              buildSong({ avgRating: 3.0, numReviews: 5 }),
            ],
          }),
        ],
      });

      const rating = calculateAlbumRating(album);
      expect(rating!.ratingValue).toBe(3.5); // (4*5 + 3*5) / 10
      expect(rating!.reviewCount).toBe(10);
    });

    it('returns null for album with no rated songs', () => {
      const album = buildAlbum({
        tracks: [buildTrack({ songs: [buildSong()] })],
      });
      expect(calculateAlbumRating(album)).toBeNull();
    });
  });

  describe('getShowMetadataFromAlbum', () => {
    it('extracts show metadata from album fields', () => {
      const album = buildAlbum({
        showDate: '2024-06-15',
        showVenue: 'Red Rocks',
        showLocation: 'Morrison, CO',
      });
      const meta = getShowMetadataFromAlbum(album);
      expect(meta.showDate).toBe('2024-06-15');
      expect(meta.showVenue).toBe('Red Rocks');
      expect(meta.showLocation).toBe('Morrison, CO');
    });

    it('falls back to first song metadata', () => {
      const album = buildAlbum({
        tracks: [
          buildTrack({
            songs: [
              buildSong({
                showDate: '1977-05-08',
                showVenue: 'Barton Hall',
                showLocation: 'Ithaca, NY',
              }),
            ],
          }),
        ],
      });
      const meta = getShowMetadataFromAlbum(album);
      expect(meta.showDate).toBe('1977-05-08');
      expect(meta.showVenue).toBe('Barton Hall');
    });
  });

  describe('generateBreadcrumbSchema', () => {
    it('generates BreadcrumbList with correct positions', () => {
      const schema = generateBreadcrumbSchema([
        { name: 'Home', url: 'https://8pm.me' },
        { name: 'Artists', url: 'https://8pm.me/artists' },
        { name: 'Railroad Earth', url: 'https://8pm.me/artists/railroadearth' },
      ]);

      expect(schema['@type']).toBe('BreadcrumbList');
      const items = schema.itemListElement as any[];
      expect(items).toHaveLength(3);
      expect(items[0].position).toBe(1);
      expect(items[0].name).toBe('Home');
      expect(items[1].position).toBe(2);
      expect(items[2].position).toBe(3);
      expect(items[2].name).toBe('Railroad Earth');
    });
  });

  describe('generateWebSiteSchema', () => {
    it('generates WebSite with SearchAction', () => {
      const schema = generateWebSiteSchema('https://8pm.me');

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('8pm.me');
      expect(schema.url).toBe('https://8pm.me');

      const action = schema.potentialAction as any;
      expect(action['@type']).toBe('SearchAction');
      expect(action.target['@type']).toBe('EntryPoint');
      expect(action.target.urlTemplate).toContain('/find?q=');
    });
  });

  describe('combineSchemas', () => {
    it('wraps schemas in @graph', () => {
      const s1 = { '@type': 'WebSite', name: '8pm' };
      const s2 = { '@type': 'BreadcrumbList', itemListElement: [] };

      const combined = combineSchemas(s1, s2);
      expect(combined['@context']).toBe('https://schema.org');
      expect((combined['@graph'] as any[])).toHaveLength(2);
    });

    it('filters null and undefined schemas', () => {
      const s1 = { '@type': 'WebSite', name: '8pm' };
      const combined = combineSchemas(s1, null, undefined);
      expect((combined['@graph'] as any[])).toHaveLength(1);
    });

    it('returns empty graph for all nulls', () => {
      const combined = combineSchemas(null, undefined);
      expect((combined['@graph'] as any[])).toHaveLength(0);
    });
  });

  describe('generateArtistFAQSchema', () => {
    it('generates FAQPage with base questions', () => {
      const schema = generateArtistFAQSchema('Railroad Earth');

      expect(schema['@type']).toBe('FAQPage');
      const questions = schema.mainEntity as any[];
      expect(questions.length).toBeGreaterThanOrEqual(3);
      expect(questions[0]['@type']).toBe('Question');
      expect(questions[0].name).toContain('Railroad Earth');
      expect(questions[0].acceptedAnswer['@type']).toBe('Answer');
    });

    it('includes total shows in answer when provided', () => {
      const schema = generateArtistFAQSchema('Railroad Earth', 500);
      const firstAnswer = (schema.mainEntity as any[])[0].acceptedAnswer.text;
      expect(firstAnswer).toContain('500');
    });

    it('includes formation/origin question when data provided', () => {
      const schema = generateArtistFAQSchema(
        'Railroad Earth',
        undefined,
        '2001-present',
        'Stillwater, NJ'
      );
      const questions = schema.mainEntity as any[];
      const formationQ = questions.find((q: any) =>
        q.name.includes('formed')
      );
      expect(formationQ).toBeDefined();
      expect(formationQ.acceptedAnswer.text).toContain('Stillwater, NJ');
      expect(formationQ.acceptedAnswer.text).toContain('2001-present');
    });

    it('omits formation question when no origin/years data', () => {
      const schema = generateArtistFAQSchema('Railroad Earth');
      const questions = schema.mainEntity as any[];
      const formationQ = questions.find((q: any) =>
        q.name.includes('formed')
      );
      expect(formationQ).toBeUndefined();
    });

    it('includes most played track when provided', () => {
      const schema = generateArtistFAQSchema(
        'Railroad Earth',
        undefined,
        undefined,
        undefined,
        'Bird on a Wire'
      );
      const bestShowsAnswer = (schema.mainEntity as any[])[1].acceptedAnswer.text;
      expect(bestShowsAnswer).toContain('Bird on a Wire');
    });
  });

  describe('generateMusicGroupSchema', () => {
    it('generates MusicGroup with artist data', () => {
      const artist: Artist = {
        id: 'a1',
        name: 'Railroad Earth',
        slug: 'railroadearth',
        image: 'https://8pm.me/images/rre.jpg',
        bio: 'Bluegrass-jam band from NJ',
        genres: 'bluegrass, jam',
        originLocation: 'Stillwater, NJ',
        formationDate: '2001',
        officialWebsite: 'https://railroadearth.com',
      };

      const schema = generateMusicGroupSchema(artist, 'https://8pm.me');

      expect(schema['@type']).toBe('MusicGroup');
      expect(schema.name).toBe('Railroad Earth');
      expect(schema.url).toBe('https://8pm.me/artists/railroadearth');
      expect(schema.genre).toBe('bluegrass, jam');
      expect(schema.foundingDate).toBe('2001');
      expect(schema.foundingLocation).toBe('Stillwater, NJ');
    });

    it('includes sameAs links (filtered for truthy)', () => {
      const artist: Artist = {
        id: 'a1',
        name: 'Railroad Earth',
        slug: 'railroadearth',
        image: '',
        bio: '',
        officialWebsite: 'https://railroadearth.com',
        facebook: 'https://facebook.com/rre',
        instagram: undefined,
        twitter: undefined,
      };

      const schema = generateMusicGroupSchema(artist, 'https://8pm.me');
      const sameAs = schema.sameAs as string[];
      expect(sameAs).toContain('https://railroadearth.com');
      expect(sameAs).toContain('https://facebook.com/rre');
      expect(sameAs).not.toContain(undefined);
    });
  });
});
