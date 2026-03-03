// Search API functions

import { Song, Artist } from '../types';
import { graphqlFetch } from './graphql-client';
import { GET_SONGS_BY_CATEGORY_QUERY, GET_SONGS_BY_SEARCH_QUERY } from './fragments';
import { MagentoProduct, CategoryBreadcrumb, productToSong } from './transforms';
import { getArtists } from './artists';

// Track category interface for search
export interface TrackCategory {
  uid: string;
  name: string;
  url_key: string;
  product_count: number;
  breadcrumbs?: CategoryBreadcrumb[];
}

// Album category interface for search
export interface AlbumCategory {
  uid: string;
  name: string;
  url_key: string;
  product_count: number;
  wikipedia_artwork_url?: string;
  breadcrumbs?: CategoryBreadcrumb[];
}

// Version cache for track versions (5-minute TTL)
const versionCache = new Map<string, { data: Song[]; timestamp: number }>();
const VERSION_CACHE_TTL = 5 * 60 * 1000;

// Queries

const SEARCH_TRACK_CATEGORIES_QUERY = `
  query SearchTrackCategories($nameFilter: String!, $pageSize: Int!) {
    categories(
      filters: {
        name: { match: $nameFilter }
        is_song: { eq: "1" }
      }
      pageSize: $pageSize
    ) {
      items {
        uid
        name
        url_key
        product_count
        breadcrumbs {
          category_uid
          category_name
          category_url_key
        }
      }
      total_count
    }
  }
`;

const SEARCH_ALBUM_CATEGORIES_QUERY = `
  query SearchAlbumCategories($nameFilter: String!, $pageSize: Int!) {
    categories(
      filters: {
        name: { match: $nameFilter }
        is_album: { eq: "1" }
      }
      pageSize: $pageSize
    ) {
      items {
        uid
        name
        url_key
        product_count
        wikipedia_artwork_url
        breadcrumbs {
          category_uid
          category_name
          category_url_key
        }
      }
      total_count
    }
  }
`;

// Server-side search functions

export async function searchTrackCategoriesServer(query: string): Promise<TrackCategory[]> {
  if (!query.trim()) return [];

  try {
    const data = await graphqlFetch<{
      categories: { items: TrackCategory[]; total_count: number };
    }>(SEARCH_TRACK_CATEGORIES_QUERY, {
      nameFilter: query,
      pageSize: 20,
    });

    return data.categories.items || [];
  } catch {
    return [];
  }
}

export async function searchAlbumCategoriesServer(query: string): Promise<AlbumCategory[]> {
  if (!query.trim()) return [];

  try {
    const data = await graphqlFetch<{
      categories: { items: AlbumCategory[]; total_count: number };
    }>(SEARCH_ALBUM_CATEGORIES_QUERY, {
      nameFilter: query,
      pageSize: 15,
    });

    return data.categories.items || [];
  } catch {
    return [];
  }
}

// Version fetching

export async function getVersionsForTrack(trackCategoryUid: string): Promise<Song[]> {
  const cached = versionCache.get(trackCategoryUid);
  if (cached && Date.now() - cached.timestamp < VERSION_CACHE_TTL) {
    return cached.data;
  }

  try {
    const data = await graphqlFetch<{
      products: { items: MagentoProduct[]; total_count: number };
    }>(GET_SONGS_BY_CATEGORY_QUERY, {
      categoryUid: trackCategoryUid,
      pageSize: 100,
    });

    const products = data.products.items || [];

    const songs = products.map(product => {
      const albumCategory = product.categories?.find(cat =>
        cat.url_key && !cat.url_key.includes('artist')
      );
      const albumIdentifier = albumCategory?.url_key || 'unknown';
      return productToSong(product, albumIdentifier);
    });

    versionCache.set(trackCategoryUid, { data: songs, timestamp: Date.now() });

    return songs;
  } catch (error) {
    console.error('[getVersionsForTrack] Failed:', error);
    return [];
  }
}

// Unified search

export async function search(query: string): Promise<{
  artists: Artist[];
  albums: AlbumCategory[];
  tracks: TrackCategory[];
  venues: string[];
}> {
  if (!query.trim()) {
    return { artists: [], albums: [], tracks: [], venues: [] };
  }

  try {
    const [allArtists, matchingAlbums, matchingTracks, matchingProducts] = await Promise.all([
      getArtists(),
      searchAlbumCategoriesServer(query),
      searchTrackCategoriesServer(query),
      graphqlFetch<{ products: { items: MagentoProduct[]; total_count: number } }>(
        GET_SONGS_BY_SEARCH_QUERY,
        { search: query, pageSize: 50 }
      ).then(data => data.products.items || []).catch(() => [] as MagentoProduct[])
    ]);

    const searchLower = query.toLowerCase();

    const trackArtistSlugs = new Set<string>();

    for (const track of matchingTracks) {
      const breadcrumbs = track.breadcrumbs;
      if (breadcrumbs && breadcrumbs.length >= 1) {
        trackArtistSlugs.add(breadcrumbs[0].category_url_key);
      }
    }

    for (const product of matchingProducts) {
      if (product.categories?.length) {
        for (const cat of product.categories) {
          if (allArtists.some(a => a.slug === cat.url_key)) {
            trackArtistSlugs.add(cat.url_key);
            break;
          }
        }
      }
    }

    const venueSet = new Set<string>();
    for (const product of matchingProducts) {
      if (product.show_venue && product.show_venue.trim()) {
        venueSet.add(product.show_venue.trim());
      }
    }
    const venues = Array.from(venueSet).sort();

    const artistsFromQuery = allArtists.filter(a =>
      a.name.toLowerCase().includes(searchLower)
    );
    const artistsFromTracks = allArtists.filter(a =>
      trackArtistSlugs.has(a.slug) &&
      !artistsFromQuery.some(x => x.slug === a.slug)
    );
    const artists = [...artistsFromQuery, ...artistsFromTracks].slice(0, 10);

    const albums = matchingAlbums.slice(0, 15);

    return { artists, albums, tracks: matchingTracks, venues };
  } catch (error) {
    console.error('[search] Search failed:', error);
    return { artists: [], albums: [], tracks: [], venues: [] };
  }
}

