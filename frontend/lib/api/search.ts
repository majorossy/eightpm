// Search API functions

import { Song, Artist } from '../types';
import { applyFilters, getAvailableYears, hasActiveFilters } from '../filters';
import type { VersionFilters } from '../filters';
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

// Track category with loaded and filtered versions
export interface TrackWithVersions extends TrackCategory {
  versions: Song[];
  filteredVersions: Song[];
  availableYears: number[];
}

// Module-level caches
let trackCategoryCache: TrackCategory[] | null = null;
let albumCategoryCache: AlbumCategory[] | null = null;

// Version cache for track versions (5-minute TTL)
const versionCache = new Map<string, { data: Song[]; timestamp: number }>();
const VERSION_CACHE_TTL = 5 * 60 * 1000;

// Queries

const GET_TRACK_CATEGORIES_QUERY = `
  query GetTrackCategories($pageSize: Int!, $currentPage: Int!) {
    categories(
      filters: { is_song: { eq: "1" } }
      pageSize: $pageSize
      currentPage: $currentPage
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

const GET_ALBUM_CATEGORIES_QUERY = `
  query GetAlbumCategories($pageSize: Int!, $currentPage: Int!) {
    categories(
      filters: { is_album: { eq: "1" } }
      pageSize: $pageSize
      currentPage: $currentPage
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

// Client-side cache functions

async function getTrackCategories(): Promise<TrackCategory[]> {
  if (trackCategoryCache) {
    return trackCategoryCache;
  }
  const PAGE_SIZE = 200;
  let allTracks: TrackCategory[] = [];
  let currentPage = 1;
  let totalCount = 0;

  const firstPage = await graphqlFetch<{
    categories: { items: TrackCategory[]; total_count: number };
  }>(GET_TRACK_CATEGORIES_QUERY, { pageSize: PAGE_SIZE, currentPage: 1 });

  allTracks = firstPage.categories.items || [];
  totalCount = firstPage.categories.total_count || 0;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  for (currentPage = 2; currentPage <= totalPages; currentPage++) {
    const page = await graphqlFetch<{
      categories: { items: TrackCategory[]; total_count: number };
    }>(GET_TRACK_CATEGORIES_QUERY, { pageSize: PAGE_SIZE, currentPage });
    allTracks = allTracks.concat(page.categories.items || []);
  }

  trackCategoryCache = allTracks;
  return allTracks;
}

export async function searchTrackCategories(query: string): Promise<TrackCategory[]> {
  if (!query.trim()) return [];

  const allTracks = await getTrackCategories();
  const searchLower = query.toLowerCase();

  const matches = allTracks.filter(track =>
    track.name && track.name.toLowerCase().includes(searchLower)
  );

  return matches.slice(0, 20);
}

export async function searchTracksLazy(query: string): Promise<TrackCategory[]> {
  if (!query.trim()) return [];
  try {
    return await searchTrackCategoriesServer(query);
  } catch {
    return [];
  }
}

async function getAlbumCategories(): Promise<AlbumCategory[]> {
  if (albumCategoryCache) {
    return albumCategoryCache;
  }
  const PAGE_SIZE = 200;
  let allAlbums: AlbumCategory[] = [];
  let currentPage = 1;
  let totalCount = 0;

  const firstPage = await graphqlFetch<{
    categories: { items: AlbumCategory[]; total_count: number };
  }>(GET_ALBUM_CATEGORIES_QUERY, { pageSize: PAGE_SIZE, currentPage: 1 });

  allAlbums = firstPage.categories.items || [];
  totalCount = firstPage.categories.total_count || 0;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  for (currentPage = 2; currentPage <= totalPages; currentPage++) {
    const page = await graphqlFetch<{
      categories: { items: AlbumCategory[]; total_count: number };
    }>(GET_ALBUM_CATEGORIES_QUERY, { pageSize: PAGE_SIZE, currentPage });
    allAlbums = allAlbums.concat(page.categories.items || []);
  }

  albumCategoryCache = allAlbums;
  return allAlbums;
}

export async function searchAlbumCategories(query: string): Promise<AlbumCategory[]> {
  if (!query.trim()) return [];

  const allAlbums = await getAlbumCategories();
  const searchLower = query.toLowerCase();

  const scoredAlbums = allAlbums
    .map(album => {
      let score = 0;
      const nameLower = album.name?.toLowerCase() || '';
      const artistName = album.breadcrumbs?.[0]?.category_name?.toLowerCase() || '';

      if (nameLower.includes(searchLower)) {
        score += 10;
        if (nameLower === searchLower) score += 20;
        else if (nameLower.startsWith(searchLower)) score += 10;
      }

      if (artistName.includes(searchLower)) {
        score += 8;
        if (artistName === searchLower) score += 15;
        else if (artistName.startsWith(searchLower)) score += 5;
      }

      if (score > 0 && album.product_count > 0) {
        score += Math.min(album.product_count / 10, 5);
      }

      return { album, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.album.product_count || 0) - (a.album.product_count || 0);
    })
    .map(item => item.album);

  return scoredAlbums.slice(0, 15);
}

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

// Filtered search

export async function searchTracksWithVersions(
  query: string,
  filters: VersionFilters
): Promise<TrackWithVersions[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const tracks = await searchTrackCategoriesServer(query);

    if (tracks.length === 0) {
      return [];
    }

    const tracksToFetch = tracks.slice(0, 20);
    const tracksWithVersions = await Promise.all(
      tracksToFetch.map(async (track): Promise<TrackWithVersions> => {
        const versions = await getVersionsForTrack(track.uid);
        const filteredVersions = applyFilters(versions, filters);
        const availableYears = getAvailableYears(versions);

        return {
          ...track,
          versions,
          filteredVersions,
          availableYears,
        };
      })
    );

    if (hasActiveFilters(filters)) {
      return tracksWithVersions.filter(t => t.filteredVersions.length > 0);
    }

    return tracksWithVersions;
  } catch (error) {
    console.error('[searchTracksWithVersions] Failed:', error);
    return [];
  }
}

export function reapplyFilters(
  tracks: TrackWithVersions[],
  filters: VersionFilters
): TrackWithVersions[] {
  const refiltered = tracks.map(track => ({
    ...track,
    filteredVersions: applyFilters(track.versions, filters),
  }));

  if (hasActiveFilters(filters)) {
    return refiltered.filter(t => t.filteredVersions.length > 0);
  }

  return refiltered;
}

export function getAllAvailableYears(tracks: TrackWithVersions[]): number[] {
  const years = new Set<number>();
  tracks.forEach(track => {
    track.availableYears.forEach(y => years.add(y));
  });
  return Array.from(years).sort((a, b) => b - a);
}
