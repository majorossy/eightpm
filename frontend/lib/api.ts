// API layer - Magento 2 GraphQL integration
import { unstable_cache } from 'next/cache';
import { Song, Artist, ArtistDetail, Album, Track } from './types';
import { fetchWikipediaSummary } from './wikipedia';
import { applyFilters, getAvailableYears, hasActiveFilters } from './filters';
import type { VersionFilters } from './filters';

export type { Song, Artist, ArtistDetail, Album, Track } from './types';
export type { VersionFilters } from './filters';
export { hasActiveFilters } from './filters';

// Track category cache for search
let trackCategoryCache: TrackCategory[] | null = null;

// Album category cache for search
let albumCategoryCache: AlbumCategory[] | null = null;

// Cache duration in seconds
const CACHE_DURATION = 60 * 5; // 5 minutes

// ============================================
// Retry Configuration
// ============================================
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000, // 1 second base delay
  maxDelayMs: 10000, // 10 seconds max delay
  // Status codes that should NOT be retried
  nonRetryableStatuses: [400, 401, 403, 404, 422],
};

// Error types that indicate network/timeout issues (should retry)
const RETRYABLE_ERROR_MESSAGES = [
  'fetch failed',
  'network error',
  'timeout',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'socket hang up',
];

/**
 * Check if an error is retryable based on its type/message
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return RETRYABLE_ERROR_MESSAGES.some(msg => message.includes(msg.toLowerCase()));
  }
  return false;
}

/**
 * Check if an HTTP status code is retryable
 */
function isRetryableStatus(status: number): boolean {
  // Don't retry client errors (4xx) except for rate limiting (429) and server overload (503)
  if (RETRY_CONFIG.nonRetryableStatuses.includes(status)) {
    return false;
  }
  // Retry 5xx server errors and 429 rate limiting
  return status >= 500 || status === 429;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s...
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  // Add jitter (0-25% of the delay) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * Math.random();
  // Cap at max delay
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelayMs);
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  context: string = 'fetch'
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Check if response status indicates we should retry
      if (!response.ok && isRetryableStatus(response.status)) {
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = getRetryDelay(attempt);
          console.warn(
            `[${context}] Request failed with status ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`
          );
          await sleep(delay);
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (isRetryableError(error) && attempt < RETRY_CONFIG.maxRetries) {
        const delay = getRetryDelay(attempt);
        console.warn(
          `[${context}] Request failed with error: ${lastError.message}, retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`
        );
        await sleep(delay);
        continue;
      }

      // Non-retryable error or max retries reached
      throw lastError;
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error(`[${context}] Request failed after ${RETRY_CONFIG.maxRetries} retries`);
}

// GraphQL endpoint - uses Docker service name internally, external URL for client
const MAGENTO_GRAPHQL_URL = process.env.MAGENTO_GRAPHQL_URL || 'https://app:8443/graphql';
console.log('[API] Using GraphQL URL:', MAGENTO_GRAPHQL_URL);

// Magento media URL for images (browser-accessible)
const MAGENTO_MEDIA_URL = process.env.NEXT_PUBLIC_MAGENTO_MEDIA_URL || 'https://magento.test/media';

// Parent category ID for artists
const ARTISTS_PARENT_CATEGORY_ID = '48';

// Local album art mapping (slug -> filename in /images/albums/)
// Filenames match url_keys exactly (no hyphens)
const LOCAL_ALBUM_ART: Record<string, string> = {
  // STS9
  'artifact': '/images/albums/artifact.jpg',
  'interplanetaryescapevehicle': '/images/albums/interplanetaryescapevehicle.jpg',
  'offeredschematicssuggestingpeace': '/images/albums/offeredschematicssuggestingpeace.jpg',
  // String Cheese Incident
  'bornonthewrongplanet': '/images/albums/bornonthewrongplanet.jpg',
  'astringcheeseincident': '/images/albums/astringcheeseincident.jpg',
  'roundthewheel': '/images/albums/roundthewheel.jpg',
  'carnival99': '/images/albums/carnival99.jpg',
  'outsideinside': '/images/albums/outsideinside.jpg',
  'untyingthenot': '/images/albums/untyingthenot.jpg',
  'onestepcloser': '/images/albums/onestepcloser.jpg',
  'trickortreat': '/images/albums/trickortreat.jpg',
  'songinmyhead': '/images/albums/songinmyhead.jpg',
  'believe': '/images/albums/believe.jpg',
  // Tea Leaf Green
  'tealeafgreenalbum': '/images/albums/tealeafgreenalbum.jpg',
  'taughttobeproud': '/images/albums/taughttobeproud.jpg',
  'raiseupthetent': '/images/albums/raiseupthetent.jpg',
  // Grace Potter
  'originalsoul': '/images/albums/originalsoul.jpg',
  'midnight': '/images/albums/midnight.jpg',
  // O.A.R.
  'inbetweennowandthen': '/images/albums/inbetweennowandthen.jpg',
  'soulsaflame': '/images/albums/soulsaflame.jpg',
  'thewanderer': '/images/albums/thewanderer.jpg',
  'risen': '/images/albums/risen.jpg',
};

// Get album cover art - check local mapping only, return undefined if not found
// so components can show their proper fallback (vinyl icon) instead of a Magento placeholder
function getAlbumCoverArt(urlKey: string): string | undefined {
  const slug = urlKey.toLowerCase();
  if (LOCAL_ALBUM_ART[slug]) {
    return LOCAL_ALBUM_ART[slug];
  }
  return undefined;
}

// Helper to construct category image URL from url_key (workaround for GraphQL placeholder issue)
function getCategoryImageUrl(urlKey: string): string {
  return `${MAGENTO_MEDIA_URL}/catalog/category/${urlKey}.jpg`;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// Breadcrumb for category hierarchy
interface CategoryBreadcrumb {
  category_uid: string;
  category_name: string;
  category_url_key: string;
}

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

// VersionFilters type is re-exported from './filters'

interface FetchOptions {
  cache?: boolean;
  revalidate?: number;
}

async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: FetchOptions = { cache: true, revalidate: CACHE_DURATION }
): Promise<T> {
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  };

  // Add Next.js caching options (these are non-standard fetch options)
  if (options.cache) {
    (fetchOptions as any).next = { revalidate: options.revalidate };
  } else {
    fetchOptions.cache = 'no-store';
  }

  // Use fetch with retry for network resilience
  const response = await fetchWithRetry(
    MAGENTO_GRAPHQL_URL,
    fetchOptions,
    'GraphQL'
  );

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors) {
    console.error('[GraphQL] Errors:', JSON.stringify(result.errors, null, 2));
    throw new Error(result.errors.map(e => e.message).join(', '));
  }

  if (!result.data) {
    console.error('[GraphQL] No data returned:', result);
    throw new Error('No data returned from GraphQL');
  }

  return result.data;
}

// GraphQL Queries
// Use categories query with pagination to get all artists (categoryList has ~20 item limit)
const GET_ARTISTS_QUERY = `
  query GetArtists($parentId: String!, $pageSize: Int!, $currentPage: Int!) {
    categories(filters: { parent_id: { eq: $parentId } }, pageSize: $pageSize, currentPage: $currentPage) {
      total_count
      items {
        uid
        name
        url_key
        description
        image
        product_count
        children_count
        band_total_shows
        band_most_played_track
        band_formation_date
        band_total_recordings
        band_total_hours
        band_total_venues
      }
    }
  }
`;

const GET_ARTIST_BY_SLUG_QUERY = `
  query GetArtistBySlug($urlKey: String!) {
    categoryList(filters: { url_key: { eq: $urlKey } }) {
      uid
      name
      url_key
      description
      image
      product_count
      band_formation_date
      band_origin_location
      band_years_active
      band_extended_bio
      band_image_url
      band_genres
      band_official_website
      band_youtube_channel
      band_facebook
      band_instagram
      band_twitter
      band_total_shows
      band_most_played_track
      band_total_recordings
      band_total_hours
      band_total_venues
    }
  }
`;

// Get child categories (albums) of an artist category
const GET_CHILD_CATEGORIES_QUERY = `
  query GetChildCategories($parentUid: String!) {
    categoryList(filters: { parent_category_uid: { eq: $parentUid } }) {
      uid
      name
      url_key
      description
      image
      wikipedia_artwork_url
      product_count
    }
  }
`;

// Get child categories with pagination support
const GET_CHILD_CATEGORIES_PAGINATED_QUERY = `
  query GetChildCategoriesPaginated($parentUid: String!, $pageSize: Int!, $currentPage: Int!) {
    categories(filters: { parent_category_uid: { eq: $parentUid } }, pageSize: $pageSize, currentPage: $currentPage) {
      items {
        uid
        name
        url_key
        description
        image
        wikipedia_artwork_url
        product_count
      }
      total_count
    }
  }
`;

const GET_SONGS_BY_CATEGORY_QUERY = `
  query GetSongsByCategory($categoryUid: String!, $pageSize: Int!) {
    products(filter: { category_uid: { eq: $categoryUid } }, pageSize: $pageSize) {
      items {
        uid
        sku
        name
        song_title
        song_duration
        song_url
        song_url_high
        song_url_medium
        song_url_low
        show_name
        identifier
        show_venue
        show_location
        show_taper
        show_source
        lineage
        notes
        archive_avg_rating
        archive_num_reviews
        archive_downloads
        archive_downloads_week
        archive_downloads_month
        categories {
          uid
          name
          url_key
        }
      }
      total_count
    }
  }
`;

const GET_SONGS_BY_SEARCH_QUERY = `
  query GetSongsBySearch($search: String!, $pageSize: Int!) {
    products(search: $search, pageSize: $pageSize) {
      items {
        uid
        sku
        name
        song_title
        song_duration
        song_url
        song_url_high
        song_url_medium
        song_url_low
        show_name
        identifier
        show_venue
        show_location
        show_taper
        show_source
        lineage
        notes
        archive_avg_rating
        archive_num_reviews
        archive_downloads
        archive_downloads_week
        archive_downloads_month
        categories {
          uid
          name
          url_key
        }
      }
      total_count
    }
  }
`;

const GET_ALL_SONGS_QUERY = `
  query GetAllSongs($pageSize: Int!) {
    products(search: "", pageSize: $pageSize) {
      items {
        uid
        sku
        name
        song_title
        song_duration
        song_url
        song_url_high
        song_url_medium
        song_url_low
        show_name
        identifier
        show_venue
        show_location
        show_taper
        show_source
        lineage
        notes
        archive_avg_rating
        archive_num_reviews
        archive_downloads
        archive_downloads_week
        archive_downloads_month
        categories {
          uid
          name
          url_key
        }
      }
      total_count
    }
  }
`;

const GET_SONG_BY_ID_QUERY = `
  query GetSongById($uid: String!) {
    products(filter: { uid: { eq: $uid } }) {
      items {
        uid
        sku
        name
        song_title
        song_duration
        song_url
        song_url_high
        song_url_medium
        song_url_low
        show_name
        identifier
        show_venue
        show_location
        show_taper
        show_source
        lineage
        notes
        archive_avg_rating
        archive_num_reviews
        archive_downloads
        archive_downloads_week
        archive_downloads_month
        categories {
          uid
          name
          url_key
        }
      }
    }
  }
`;

// Query to get track categories (categories where is_song = 1)
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

// Query to get album categories (categories where is_album = 1)
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

// ============================================================================
// SERVER-SIDE SEARCH QUERIES (Phase 2 - Optimized)
// Use Magento's native category name filter instead of fetching all categories
// ============================================================================

// Server-side track category search (replaces client-side filtering)
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

// Server-side album category search (replaces client-side filtering)
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

// Type definitions for GraphQL responses
interface CategoryBreadcrumb {
  category_uid: string;
  category_name: string;
  category_url_key: string;
}

interface MagentoCategory {
  uid: string;
  name: string;
  url_key: string;
  description?: string;
  image?: string;
  product_count?: number;
  children_count?: number;
  breadcrumbs?: CategoryBreadcrumb[];
  wikipedia_artwork_url?: string;
  band_formation_date?: string;
  band_origin_location?: string;
  band_years_active?: string;
  band_extended_bio?: string;
  band_image_url?: string;
  band_genres?: string;
  band_official_website?: string;
  band_youtube_channel?: string;
  band_facebook?: string;
  band_instagram?: string;
  band_twitter?: string;
  band_total_shows?: number;
  band_most_played_track?: string;
  band_total_recordings?: number;
  band_total_hours?: number;
  band_total_venues?: number;
}

interface MagentoProduct {
  uid: string;
  sku: string;
  name: string;
  song_title?: string;
  song_duration?: number;
  song_url?: string;
  song_url_high?: string;
  song_url_medium?: string;
  song_url_low?: string;
  show_name?: string;
  identifier?: string;          // Archive.org album identifier
  show_venue?: string;          // Archive.org: venue
  show_location?: string;       // Archive.org: coverage (city/state)
  show_taper?: string;          // Archive.org: taper (who recorded)
  show_source?: string;         // Archive.org: source (recording equipment)
  lineage?: string;             // Archive.org: lineage (transfer chain)
  notes?: string;               // Performance notes, guests, covers
  archive_avg_rating?: number;  // Archive.org average rating (1-5)
  archive_num_reviews?: number; // Archive.org review count
  archive_downloads?: number;   // Archive.org total downloads
  archive_downloads_week?: number;  // Archive.org downloads this week
  archive_downloads_month?: number; // Archive.org downloads this month
  categories?: Array<{ uid: string; name: string; url_key: string }>;
}

// Transform Magento category to Artist
function categoryToArtist(category: MagentoCategory): Artist {
  return {
    id: category.uid,
    name: category.name,
    slug: category.url_key,
    image: getCategoryImageUrl(category.url_key),
    bio: category.description || '',
    songCount: category.product_count || 0,
    albumCount: category.children_count || 0,
    formationDate: category.band_formation_date || undefined,
    originLocation: category.band_origin_location || undefined,
    yearsActive: category.band_years_active || undefined,
    extendedBio: category.band_extended_bio || undefined,
    bandImageUrl: category.band_image_url || undefined,
    genres: category.band_genres ? category.band_genres.split(',').map(g => g.trim()) : undefined,
    officialWebsite: category.band_official_website || undefined,
    youtubeChannel: category.band_youtube_channel || undefined,
    facebook: category.band_facebook || undefined,
    instagram: category.band_instagram || undefined,
    twitter: category.band_twitter || undefined,
    totalShows: category.band_total_shows || undefined,
    mostPlayedTrack: category.band_most_played_track || undefined,
    totalRecordings: category.band_total_recordings || undefined,
    totalHours: category.band_total_hours || undefined,
    totalVenues: category.band_total_venues || undefined,
    formationYear: category.band_formation_date
      ? parseInt(category.band_formation_date)
      : undefined,
  };
}

// Normalize a URL - fix missing colons, handle double protocols
function normalizeUrl(url: string): string {
  if (!url) return '';

  // Fix "https//" or "http//" (missing colon)
  url = url.replace(/^(https?)\/\//, '$1://');

  // If URL already has a valid protocol, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Otherwise, prepend https://
  return `https://${url}`;
}

// Generate URL-safe slug from string
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Parse show_name to extract venue and date
// Format: "{Artist} Live at {Venue} on {YYYY-MM-DD}"
function parseShowName(showName: string): { venue?: string; date?: string } {
  const result: { venue?: string; date?: string } = {};

  // Extract date (YYYY-MM-DD format)
  const dateMatch = showName.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    result.date = dateMatch[1];
  }

  // Extract venue (between "Live at " and " on ")
  const venueMatch = showName.match(/Live at (.+?) on \d{4}-\d{2}-\d{2}/);
  if (venueMatch) {
    result.venue = venueMatch[1].trim();
  }

  return result;
}

// Extract taper/source info from identifier
// Format: "artist-YYYY-MM-DD.source.format" e.g. "sts9-2006-10-31.sonyecm.pumpkin.flac16"
function parseIdentifier(identifier: string): { source?: string } {
  const result: { source?: string } = {};

  // Get everything after the date
  const sourceMatch = identifier.match(/\d{4}-\d{2}-\d{2}\.(.+?)(?:\.flac|$)/i);
  if (sourceMatch) {
    // Clean up the source info (replace dots with spaces, format nicely)
    result.source = sourceMatch[1].replace(/\./g, ' ').trim();
  }

  return result;
}

// Transform Magento product to Song (with album context)
function productToSong(product: MagentoProduct, albumIdentifier?: string): Song {
  // Find the main artist category (first category that's not a song-specific one)
  const artistCategory = product.categories?.find(
    c => c.url_key && !c.url_key.includes('-')
  ) || product.categories?.[0];

  // Use product.identifier (Archive.org show ID) if available, otherwise fall back to album category
  const identifier = product.identifier || albumIdentifier || 'unknown-album';
  const albumName = product.show_name || identifier;
  const trackTitle = product.song_title || product.name;

  // Parse venue and date from show_name
  const showInfo = parseShowName(albumName);

  // Parse source/taper from identifier
  const identifierInfo = parseIdentifier(identifier);

  return {
    id: product.uid,
    sku: product.sku,
    title: trackTitle,
    artistId: artistCategory?.uid || '',
    artistName: artistCategory?.name || 'Unknown Artist',
    artistSlug: artistCategory?.url_key || '',
    duration: product.song_duration || 0, // API returns seconds from Archive.org
    streamUrl: product.song_url ? normalizeUrl(product.song_url) : '',
    albumArt: '/images/songs/default.jpg',
    // Multi-quality support
    qualityUrls: {
      high: product.song_url_high ? normalizeUrl(product.song_url_high) : undefined,
      medium: product.song_url_medium ? normalizeUrl(product.song_url_medium) : undefined,
      low: product.song_url_low ? normalizeUrl(product.song_url_low) : undefined,
    },
    defaultQuality: 'medium', // Recommended default
    // Album/track context
    albumIdentifier: identifier,
    albumName,
    trackTitle,
    // Show info (prefer direct fields, fallback to parsed)
    showDate: showInfo.date,
    showVenue: product.show_venue || showInfo.venue,
    showLocation: product.show_location || undefined,
    // Recording metadata (prefer direct fields, fallback to parsed)
    taper: product.show_taper || undefined,
    source: product.show_source || identifierInfo.source,
    lineage: product.lineage || undefined,
    notes: product.notes || undefined,
    // Archive.org ratings
    avgRating: product.archive_avg_rating || undefined,
    numReviews: product.archive_num_reviews || undefined,
    // Archive.org download stats
    downloads: product.archive_downloads || undefined,
    downloadsWeek: product.archive_downloads_week || undefined,
    downloadsMonth: product.archive_downloads_month || undefined,
  };
}

// Group products within an album into tracks
function groupProductsIntoTracks(
  products: MagentoProduct[],
  albumIdentifier: string,
  albumName: string,
  artistId: string,
  artistName: string,
  artistSlug: string
): Track[] {
  const trackMap = new Map<string, MagentoProduct[]>();

  // Group by song_title
  products.forEach(product => {
    const trackTitle = product.song_title || product.name;
    if (!trackMap.has(trackTitle)) {
      trackMap.set(trackTitle, []);
    }
    trackMap.get(trackTitle)!.push(product);
  });

  return Array.from(trackMap.entries()).map(([title, trackProducts]) => ({
    id: `${albumIdentifier}-${slugify(title)}`,
    title,
    slug: slugify(title),
    albumIdentifier,
    albumName,
    artistId,
    artistName,
    artistSlug,
    songs: trackProducts.map(p => productToSong(p, albumIdentifier)),
    totalDuration: trackProducts[0].song_duration || 0,
    songCount: trackProducts.length,
  }));
}

// Group products into albums by identifier
function groupProductsIntoAlbums(
  products: MagentoProduct[],
  artistId: string,
  artistName: string,
  artistSlug: string
): Album[] {
  const albumMap = new Map<string, MagentoProduct[]>();

  // Group by identifier
  products.forEach(product => {
    const identifier = product.identifier || 'unknown-album';
    if (!albumMap.has(identifier)) {
      albumMap.set(identifier, []);
    }
    albumMap.get(identifier)!.push(product);
  });

  // Transform to Album objects
  return Array.from(albumMap.entries()).map(([identifier, albumProducts]) => {
    const firstProduct = albumProducts[0];
    const albumName = firstProduct.show_name || identifier;
    const tracks = groupProductsIntoTracks(
      albumProducts,
      identifier,
      albumName,
      artistId,
      artistName,
      artistSlug
    );

    return {
      id: identifier,
      identifier,
      name: albumName,
      slug: slugify(identifier),
      artistId,
      artistName,
      artistSlug,
      tracks,
      totalTracks: tracks.length,
      totalSongs: albumProducts.length,
      totalDuration: albumProducts.reduce((sum, p) => sum + (p.song_duration || 0), 0),
    };
  });
}

// API Functions
export async function getArtists(): Promise<Artist[]> {
  try {
    const PAGE_SIZE = 50; // Fetch 50 artists per page
    let allArtists: MagentoCategory[] = [];
    let currentPage = 1;
    let totalCount = 0;

    // Fetch first page to get total count
    const firstPageData = await graphqlFetch<{
      categories: { items: MagentoCategory[]; total_count: number };
    }>(GET_ARTISTS_QUERY, {
      parentId: ARTISTS_PARENT_CATEGORY_ID,
      pageSize: PAGE_SIZE,
      currentPage: 1,
    });

    allArtists = firstPageData.categories.items || [];
    totalCount = firstPageData.categories.total_count || 0;
    console.log(`[getArtists] Page 1: got ${allArtists.length} artists, total: ${totalCount}`);

    // Fetch remaining pages if needed
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    for (currentPage = 2; currentPage <= totalPages; currentPage++) {
      const pageData = await graphqlFetch<{
        categories: { items: MagentoCategory[]; total_count: number };
      }>(GET_ARTISTS_QUERY, {
        parentId: ARTISTS_PARENT_CATEGORY_ID,
        pageSize: PAGE_SIZE,
        currentPage,
      });

      const pageArtists = pageData.categories.items || [];
      allArtists = allArtists.concat(pageArtists);
      console.log(`[getArtists] Page ${currentPage}: got ${pageArtists.length} more artists`);
    }

    console.log(`[getArtists] Total artists fetched: ${allArtists.length}`);
    return allArtists.map(categoryToArtist);
  } catch (error) {
    console.error('Failed to fetch artists:', error);
    return [];
  }
}

export async function getArtist(slug: string): Promise<ArtistDetail | null> {
  console.log('[getArtist] Fetching artist:', slug);
  try {
    // Get artist category by slug
    const artistData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
      GET_ARTIST_BY_SLUG_QUERY,
      { urlKey: slug }
    );
    console.log('[getArtist] Got artist data:', artistData.categoryList.length, 'categories');

    if (!artistData.categoryList.length) {
      console.log('[getArtist] No categories found for slug:', slug);
      return null;
    }

    const category = artistData.categoryList[0];
    const artist = categoryToArtist(category);

    // Get child categories (albums) of the artist category with pagination
    const PAGE_SIZE = 100;
    let allAlbumCategories: MagentoCategory[] = [];
    let currentPage = 1;
    let totalCount = 0;

    // Fetch first page to get total count
    const firstPageData = await graphqlFetch<{
      categories: { items: MagentoCategory[]; total_count: number };
    }>(GET_CHILD_CATEGORIES_PAGINATED_QUERY, {
      parentUid: category.uid,
      pageSize: PAGE_SIZE,
      currentPage: 1,
    });

    allAlbumCategories = firstPageData.categories.items || [];
    totalCount = firstPageData.categories.total_count || 0;
    console.log(`[getArtist] Page 1: got ${allAlbumCategories.length} albums, total: ${totalCount}`);

    // Fetch remaining pages if needed
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    for (currentPage = 2; currentPage <= totalPages; currentPage++) {
      const pageData = await graphqlFetch<{
        categories: { items: MagentoCategory[]; total_count: number };
      }>(GET_CHILD_CATEGORIES_PAGINATED_QUERY, {
        parentUid: category.uid,
        pageSize: PAGE_SIZE,
        currentPage,
      });

      const pageAlbums = pageData.categories.items || [];
      allAlbumCategories = allAlbumCategories.concat(pageAlbums);
      console.log(`[getArtist] Page ${currentPage}: got ${pageAlbums.length} more albums`);
    }

    console.log(`[getArtist] Total albums fetched: ${allAlbumCategories.length}`);
    const albumCategories = allAlbumCategories;

    // For each album category, get its track categories and their products
    const albums: Album[] = await Promise.all(
      albumCategories.map(async (albumCat) => {
        // Get track categories (children of album)
        const trackCategoriesData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
          GET_CHILD_CATEGORIES_QUERY,
          { parentUid: albumCat.uid }
        );

        const trackCategories = trackCategoriesData.categoryList || [];
        console.log('[getArtist] Album:', albumCat.name, '-> Track categories:', trackCategories.length);
        let tracks: Track[] = [];

        if (trackCategories.length > 0) {
          console.log('[getArtist] Album has', trackCategories.length, 'track categories');
          // For each track category, get its products (song versions)
          tracks = await Promise.all(
            trackCategories.map(async (trackCat) => {
              console.log('[getArtist] Querying track:', trackCat.name, 'UID:', trackCat.uid);
              const productsData = await graphqlFetch<{ products: { items: MagentoProduct[]; total_count: number } }>(
                GET_SONGS_BY_CATEGORY_QUERY,
                { categoryUid: trackCat.uid, pageSize: 250 }
              );

              const products = productsData.products.items || [];
              console.log('[getArtist] Track:', trackCat.name, 'UID:', trackCat.uid, '-> Products:', products.length, 'Total:', productsData.products.total_count);
              const songs = products.map(p => productToSong(p, albumCat.url_key));

              return {
                id: trackCat.uid,
                title: trackCat.name,
                slug: trackCat.url_key,
                albumIdentifier: albumCat.url_key,
                albumName: albumCat.name,
                artistId: category.uid,
                artistName: category.name,
                artistSlug: category.url_key,
                songs,
                totalDuration: songs[0]?.duration || 0,
                songCount: songs.length,
              };
            })
          );

          // Check if any tracks have products
          const totalProducts = tracks.reduce((sum, t) => sum + t.songs.length, 0);

          // Fallback: if track categories exist but have no products, try fetching from album directly
          if (totalProducts === 0) {
            console.log('[getArtist] Track categories have 0 products, falling back to album-level products');
            const productsData = await graphqlFetch<{ products: { items: MagentoProduct[]; total_count: number } }>(
              GET_SONGS_BY_CATEGORY_QUERY,
              { categoryUid: albumCat.uid, pageSize: 500 }
            );

            const products = productsData.products.items || [];
            console.log('[getArtist] Found', products.length, 'products at album level');

            if (products.length > 0) {
              // Group products by song_title to create tracks
              tracks = groupProductsIntoTracks(
                products,
                albumCat.url_key,
                albumCat.name,
                category.uid,
                category.name,
                category.url_key
              );
            }
          }
        } else {
          // No track subcategories - products are directly under album
          // Fetch products from album category and group by song_title
          console.log('[getArtist] No track categories for album:', albumCat.name, '- fetching products directly');
          const productsData = await graphqlFetch<{ products: { items: MagentoProduct[]; total_count: number } }>(
            GET_SONGS_BY_CATEGORY_QUERY,
            { categoryUid: albumCat.uid, pageSize: 500 }
          );

          const products = productsData.products.items || [];
          console.log('[getArtist] Found', products.length, 'products directly under album');

          // Group products by song_title to create tracks
          tracks = groupProductsIntoTracks(
            products,
            albumCat.url_key,
            albumCat.name,
            category.uid,
            category.name,
            category.url_key
          );
        }

        // Calculate totals
        const totalSongs = tracks.reduce((sum, t) => sum + t.songs.length, 0);
        const totalDuration = tracks.reduce((sum, t) =>
          sum + t.songs.reduce((s, song) => s + song.duration, 0), 0
        );

        // Extract show info from first song (venue, location, date)
        const firstSong = tracks[0]?.songs[0];
        const showDate = firstSong?.showDate;
        const showVenue = firstSong?.showVenue;
        const showLocation = firstSong?.showLocation;

        return {
          id: albumCat.uid,
          identifier: albumCat.url_key,
          name: albumCat.name,
          slug: albumCat.url_key,
          artistId: category.uid,
          artistName: category.name,
          artistSlug: category.url_key,
          showDate,
          showVenue,
          showLocation,
          tracks,
          totalTracks: tracks.length,
          totalSongs,
          totalDuration,
          coverArt: albumCat.wikipedia_artwork_url || getAlbumCoverArt(albumCat.url_key),
          wikipediaArtworkUrl: albumCat.wikipedia_artwork_url,
        };
      })
    );

    // Flatten all songs from all albums for backwards compatibility
    const songs: Song[] = albums.flatMap(album =>
      album.tracks.flatMap(track => track.songs)
    );

    // Fetch Wikipedia summary using the artist name
    // Convert spaces to underscores for Wikipedia page title format
    const wikipediaPageTitle = artist.name.replace(/ /g, '_');
    const wikipediaSummary = await fetchWikipediaSummary(wikipediaPageTitle);

    return {
      ...artist,
      albums,
      songs,
      albumCount: albums.length,
      songCount: songs.length,
      wikipediaSummary,
    };
  } catch (error) {
    console.error('Failed to fetch artist:', error);
    return null;
  }
}

export async function getSongs(limit: number = 50): Promise<Song[]> {
  try {
    const data = await graphqlFetch<{ products: { items: MagentoProduct[] } }>(
      GET_ALL_SONGS_QUERY,
      { pageSize: limit }
    );
    return data.products.items.map(p => productToSong(p));
  } catch (error) {
    console.error('Failed to fetch songs:', error);
    return [];
  }
}

export async function getSong(id: string): Promise<Song | null> {
  try {
    const data = await graphqlFetch<{ products: { items: MagentoProduct[] } }>(
      GET_SONG_BY_ID_QUERY,
      { uid: id }
    );

    if (!data.products.items.length) {
      return null;
    }

    return productToSong(data.products.items[0]);
  } catch (error) {
    console.error('Failed to fetch song:', error);
    return null;
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Lightweight function to get artist albums (no tracks/products)
// Used by the artists listing page for better performance
export async function getArtistAlbums(slug: string): Promise<{ artist: Artist; albums: Album[] } | null> {
  try {
    // Get artist category by slug
    const artistData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
      GET_ARTIST_BY_SLUG_QUERY,
      { urlKey: slug }
    );

    if (!artistData.categoryList.length) {
      return null;
    }

    const category = artistData.categoryList[0];
    const artist = categoryToArtist(category);

    // Get child categories (albums) - just metadata, no products
    const albumCategoriesData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
      GET_CHILD_CATEGORIES_QUERY,
      { parentUid: category.uid }
    );

    const albumCategories = albumCategoriesData.categoryList || [];

    // Transform to lightweight Album objects (no tracks, no products)
    const albums: Album[] = albumCategories.map((albumCat) => ({
        id: albumCat.uid,
        identifier: albumCat.url_key,
        name: albumCat.name,
        slug: albumCat.url_key,
        artistId: category.uid,
        artistName: category.name,
        artistSlug: category.url_key,
        tracks: [], // Empty - not fetched
        totalTracks: albumCat.product_count || 0, // Use category product count as estimate
        totalSongs: albumCat.product_count || 0, // Use category product count for coming soon check
        totalDuration: 0,
        coverArt: albumCat.wikipedia_artwork_url || getAlbumCoverArt(albumCat.url_key),
        wikipediaArtworkUrl: albumCat.wikipedia_artwork_url,
      }
    ));

    return { artist, albums };
  } catch (error) {
    console.error('Failed to fetch artist albums:', error);
    return null;
  }
}

// Query to get a specific album category by url_key
const GET_ALBUM_BY_URL_KEY_QUERY = `
  query GetAlbumByUrlKey($urlKey: String!) {
    categoryList(filters: { url_key: { eq: $urlKey } }) {
      uid
      name
      url_key
      description
      image
      wikipedia_artwork_url
      product_count
      breadcrumbs {
        category_uid
        category_name
        category_url_key
      }
    }
  }
`;

// Get a specific album by artist slug and album identifier/slug
// OPTIMIZED: Only fetches the specific album, not all artist albums
export async function getAlbum(
  artistSlug: string,
  albumIdentifier: string
): Promise<Album | null> {
  console.log('[getAlbum] Fetching album directly:', artistSlug, albumIdentifier);

  try {
    // Fetch the album category directly by url_key
    const albumData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
      GET_ALBUM_BY_URL_KEY_QUERY,
      { urlKey: albumIdentifier }
    );

    if (!albumData.categoryList.length) {
      console.log('[getAlbum] Album not found:', albumIdentifier);
      return null;
    }

    const albumCat = albumData.categoryList[0];

    // Verify the album belongs to the correct artist via breadcrumbs
    const artistBreadcrumb = albumCat.breadcrumbs?.find(
      b => b.category_url_key === artistSlug
    );
    if (!artistBreadcrumb) {
      console.log('[getAlbum] Album does not belong to artist:', artistSlug);
      return null;
    }

    // Get track categories (children of album)
    const trackCategoriesData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
      GET_CHILD_CATEGORIES_QUERY,
      { parentUid: albumCat.uid }
    );

    const trackCategories = trackCategoriesData.categoryList || [];
    console.log('[getAlbum] Album:', albumCat.name, '-> Track categories:', trackCategories.length);

    let tracks: Track[] = [];

    if (trackCategories.length > 0) {
      // For each track category, get its products (song versions)
      tracks = await Promise.all(
        trackCategories.map(async (trackCat) => {
          const productsData = await graphqlFetch<{ products: { items: MagentoProduct[]; total_count: number } }>(
            GET_SONGS_BY_CATEGORY_QUERY,
            { categoryUid: trackCat.uid, pageSize: 250 }
          );

          const products = productsData.products.items || [];
          const songs = products.map(p => productToSong(p, albumCat.url_key));

          return {
            id: trackCat.uid,
            title: trackCat.name,
            slug: trackCat.url_key,
            albumIdentifier: albumCat.url_key,
            albumName: albumCat.name,
            artistId: artistBreadcrumb.category_uid,
            artistName: artistBreadcrumb.category_name,
            artistSlug: artistBreadcrumb.category_url_key,
            songs,
            totalDuration: songs[0]?.duration || 0,
            songCount: songs.length,
          };
        })
      );

      // Fallback: if track categories exist but have no products, try album directly
      const totalProducts = tracks.reduce((sum, t) => sum + t.songs.length, 0);
      if (totalProducts === 0) {
        console.log('[getAlbum] Track categories have 0 products, falling back to album-level');
        const productsData = await graphqlFetch<{ products: { items: MagentoProduct[]; total_count: number } }>(
          GET_SONGS_BY_CATEGORY_QUERY,
          { categoryUid: albumCat.uid, pageSize: 500 }
        );

        const products = productsData.products.items || [];
        if (products.length > 0) {
          tracks = groupProductsIntoTracks(
            products,
            albumCat.url_key,
            albumCat.name,
            artistBreadcrumb.category_uid,
            artistBreadcrumb.category_name,
            artistBreadcrumb.category_url_key
          );
        }
      }
    } else {
      // No track subcategories - products are directly under album
      console.log('[getAlbum] No track categories, fetching products directly');
      const productsData = await graphqlFetch<{ products: { items: MagentoProduct[]; total_count: number } }>(
        GET_SONGS_BY_CATEGORY_QUERY,
        { categoryUid: albumCat.uid, pageSize: 500 }
      );

      const products = productsData.products.items || [];
      tracks = groupProductsIntoTracks(
        products,
        albumCat.url_key,
        albumCat.name,
        artistBreadcrumb.category_uid,
        artistBreadcrumb.category_name,
        artistBreadcrumb.category_url_key
      );
    }

    // Calculate totals
    const totalSongs = tracks.reduce((sum, t) => sum + t.songs.length, 0);
    const totalDuration = tracks.reduce((sum, t) =>
      sum + t.songs.reduce((s, song) => s + song.duration, 0), 0
    );

    // Extract show info from first song (venue, location, date)
    // All songs in an album share the same show metadata
    const firstSong = tracks[0]?.songs[0];
    const showDate = firstSong?.showDate;
    const showVenue = firstSong?.showVenue;
    const showLocation = firstSong?.showLocation;

    console.log('[getAlbum] Found album:', albumCat.name, 'with', tracks.length, 'tracks,', totalSongs, 'songs');
    console.log('[getAlbum] Show info - date:', showDate, 'venue:', showVenue, 'location:', showLocation);

    return {
      id: albumCat.uid,
      identifier: albumCat.url_key,
      name: albumCat.name,
      slug: albumCat.url_key,
      artistId: artistBreadcrumb.category_uid,
      artistName: artistBreadcrumb.category_name,
      artistSlug: artistBreadcrumb.category_url_key,
      showDate,
      showVenue,
      showLocation,
      tracks,
      totalTracks: tracks.length,
      totalSongs,
      totalDuration,
      coverArt: albumCat.wikipedia_artwork_url || getAlbumCoverArt(albumCat.url_key),
      wikipediaArtworkUrl: albumCat.wikipedia_artwork_url,
    };
  } catch (error) {
    console.error('[getAlbum] Failed:', error);
    return null;
  }
}

// Get a specific track by artist slug, album identifier, and track slug
export async function getTrack(
  artistSlug: string,
  albumIdentifier: string,
  trackSlug: string
): Promise<Track | null> {
  const album = await getAlbum(artistSlug, albumIdentifier);
  if (!album) return null;

  return album.tracks.find(t => t.slug === trackSlug) || null;
}

// Get all track categories (categories where is_song = 1)
// Used for track search - caches results for performance
async function getTrackCategories(): Promise<TrackCategory[]> {
  if (trackCategoryCache) {
    console.log('[getTrackCategories] Using cache:', trackCategoryCache.length, 'tracks');
    return trackCategoryCache;
  }

  console.log('[getTrackCategories] Fetching all track categories...');
  const PAGE_SIZE = 200;
  let allTracks: TrackCategory[] = [];
  let currentPage = 1;
  let totalCount = 0;

  // Fetch first page
  const firstPage = await graphqlFetch<{
    categories: { items: TrackCategory[]; total_count: number };
  }>(GET_TRACK_CATEGORIES_QUERY, { pageSize: PAGE_SIZE, currentPage: 1 });

  allTracks = firstPage.categories.items || [];
  totalCount = firstPage.categories.total_count || 0;

  // Fetch remaining pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  for (currentPage = 2; currentPage <= totalPages; currentPage++) {
    const page = await graphqlFetch<{
      categories: { items: TrackCategory[]; total_count: number };
    }>(GET_TRACK_CATEGORIES_QUERY, { pageSize: PAGE_SIZE, currentPage });
    allTracks = allTracks.concat(page.categories.items || []);
  }

  console.log('[getTrackCategories] Fetched', allTracks.length, 'track categories');
  trackCategoryCache = allTracks;
  return allTracks;
}

// Search track categories by name
export async function searchTrackCategories(query: string): Promise<TrackCategory[]> {
  if (!query.trim()) return [];

  const allTracks = await getTrackCategories();
  const searchLower = query.toLowerCase();

  const matches = allTracks.filter(track =>
    track.name && track.name.toLowerCase().includes(searchLower)
  );

  console.log('[searchTrackCategories] Query:', query, '-> Matches:', matches.length);
  return matches.slice(0, 20);
}

/**
 * Lightweight track search (no version fetching)
 * Returns track categories without eagerly loading versions.
 * Versions are lazy-loaded by SearchTrackResult on expand.
 *
 * OPTIMIZED (Phase 2): Uses server-side category filtering
 * - Before: 250+ API calls (pagination to fetch all categories)
 * - After: 1 API call with server-side name filter
 */
export async function searchTracksLazy(query: string): Promise<TrackCategory[]> {
  if (!query.trim()) return [];
  console.log('[searchTracksLazy] Query:', query);
  try {
    const results = await searchTrackCategoriesServer(query);
    console.log('[searchTracksLazy] Got', results.length, 'tracks');
    return results;
  } catch (error) {
    console.error('[searchTracksLazy] Error:', error);
    return [];
  }
}

// Get all album categories (categories where is_album = 1)
// Used for album search - caches results for performance
async function getAlbumCategories(): Promise<AlbumCategory[]> {
  if (albumCategoryCache) {
    console.log('[getAlbumCategories] Using cache:', albumCategoryCache.length, 'albums');
    return albumCategoryCache;
  }

  console.log('[getAlbumCategories] Fetching all album categories...');
  const PAGE_SIZE = 200;
  let allAlbums: AlbumCategory[] = [];
  let currentPage = 1;
  let totalCount = 0;

  // Fetch first page
  const firstPage = await graphqlFetch<{
    categories: { items: AlbumCategory[]; total_count: number };
  }>(GET_ALBUM_CATEGORIES_QUERY, { pageSize: PAGE_SIZE, currentPage: 1 });

  allAlbums = firstPage.categories.items || [];
  totalCount = firstPage.categories.total_count || 0;

  // Fetch remaining pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  for (currentPage = 2; currentPage <= totalPages; currentPage++) {
    const page = await graphqlFetch<{
      categories: { items: AlbumCategory[]; total_count: number };
    }>(GET_ALBUM_CATEGORIES_QUERY, { pageSize: PAGE_SIZE, currentPage });
    allAlbums = allAlbums.concat(page.categories.items || []);
  }

  console.log('[getAlbumCategories] Fetched', allAlbums.length, 'album categories');
  albumCategoryCache = allAlbums;
  return allAlbums;
}

// Search album categories by name or artist
export async function searchAlbumCategories(query: string): Promise<AlbumCategory[]> {
  if (!query.trim()) return [];

  const allAlbums = await getAlbumCategories();
  const searchLower = query.toLowerCase();

  // Score albums by relevance
  const scoredAlbums = allAlbums
    .map(album => {
      let score = 0;
      const nameLower = album.name?.toLowerCase() || '';

      // Get artist name from breadcrumbs (first breadcrumb is typically the artist)
      const artistName = album.breadcrumbs?.[0]?.category_name?.toLowerCase() || '';

      // Match by album name
      if (nameLower.includes(searchLower)) {
        score += 10;
        // Bonus for exact match or starts with
        if (nameLower === searchLower) score += 20;
        else if (nameLower.startsWith(searchLower)) score += 10;
      }

      // Match by artist name (from breadcrumbs)
      if (artistName.includes(searchLower)) {
        score += 8;
        if (artistName === searchLower) score += 15;
        else if (artistName.startsWith(searchLower)) score += 5;
      }

      // Bonus for albums with more tracks (more complete recordings)
      if (score > 0 && album.product_count > 0) {
        score += Math.min(album.product_count / 10, 5);
      }

      return { album, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => {
      // Sort by score descending, then by track count descending
      if (b.score !== a.score) return b.score - a.score;
      return (b.album.product_count || 0) - (a.album.product_count || 0);
    })
    .map(item => item.album);

  console.log('[searchAlbumCategories] Query:', query, '-> Matches:', scoredAlbums.length);
  return scoredAlbums.slice(0, 15);
}

// ============================================================================
// SERVER-SIDE SEARCH FUNCTIONS (Phase 2 - Optimized)
// These use Magento's native category name filter for ~100x faster search
// - Before: 250+ API calls to fetch all categories, then client-side filter
// - After: 1 API call with server-side filter
// ============================================================================

/**
 * Search track categories server-side using Magento's native name filter
 * Replaces client-side searchTrackCategories() for the search() function
 */
export async function searchTrackCategoriesServer(query: string): Promise<TrackCategory[]> {
  if (!query.trim()) return [];

  console.log('[searchTrackCategoriesServer] Query:', query);

  try {
    const data = await graphqlFetch<{
      categories: { items: TrackCategory[]; total_count: number };
    }>(SEARCH_TRACK_CATEGORIES_QUERY, {
      nameFilter: query,
      pageSize: 20,
    });

    const tracks = data.categories.items || [];
    console.log('[searchTrackCategoriesServer] Found', tracks.length, 'tracks (total:', data.categories.total_count, ')');
    return tracks;
  } catch (error) {
    console.error('[searchTrackCategoriesServer] Failed:', error);
    return [];
  }
}

/**
 * Search album categories server-side using Magento's native name filter
 * Replaces client-side searchAlbumCategories() for the search() function
 */
export async function searchAlbumCategoriesServer(query: string): Promise<AlbumCategory[]> {
  if (!query.trim()) return [];

  console.log('[searchAlbumCategoriesServer] Query:', query);

  try {
    const data = await graphqlFetch<{
      categories: { items: AlbumCategory[]; total_count: number };
    }>(SEARCH_ALBUM_CATEGORIES_QUERY, {
      nameFilter: query,
      pageSize: 15,
    });

    const albums = data.categories.items || [];
    console.log('[searchAlbumCategoriesServer] Found', albums.length, 'albums (total:', data.categories.total_count, ')');
    return albums;
  } catch (error) {
    console.error('[searchAlbumCategoriesServer] Failed:', error);
    return [];
  }
}

// Version cache for track versions (5-minute TTL)
const versionCache = new Map<string, { data: Song[]; timestamp: number }>();
const VERSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch all versions (products) for a track category
export async function getVersionsForTrack(trackCategoryUid: string): Promise<Song[]> {
  // Check cache first
  const cached = versionCache.get(trackCategoryUid);
  if (cached && Date.now() - cached.timestamp < VERSION_CACHE_TTL) {
    console.log('[getVersionsForTrack] Cache hit for:', trackCategoryUid);
    return cached.data;
  }

  console.log('[getVersionsForTrack] Fetching versions for track:', trackCategoryUid);

  try {
    const data = await graphqlFetch<{
      products: { items: MagentoProduct[]; total_count: number };
    }>(GET_SONGS_BY_CATEGORY_QUERY, {
      categoryUid: trackCategoryUid,
      pageSize: 100, // Most tracks have <100 versions
    });

    const products = data.products.items || [];
    console.log('[getVersionsForTrack] Found', products.length, 'versions');

    // Convert MagentoProduct to Song using existing productToSong
    // We need to get the album identifier from the product categories
    const songs = products.map(product => {
      // Find the album category (parent of track category)
      const albumCategory = product.categories?.find(cat =>
        cat.url_key && !cat.url_key.includes('artist')
      );
      const albumIdentifier = albumCategory?.url_key || 'unknown';
      return productToSong(product, albumIdentifier);
    });

    // Cache the results
    versionCache.set(trackCategoryUid, { data: songs, timestamp: Date.now() });

    return songs;
  } catch (error) {
    console.error('[getVersionsForTrack] Failed:', error);
    return [];
  }
}

// Search across artists, albums, and tracks
// Results are always returned in order: Artists, Albums, Tracks
// When a track matches, its parent album and artist are automatically included
//
// OPTIMIZED (Phase 2): Uses server-side category filtering
// - Before: 250+ API calls (fetch all categories, then client-side filter)
// - After: 4 API calls (artists, albums, tracks, products - all server-filtered)
export async function search(query: string): Promise<{
  artists: Artist[];
  albums: AlbumCategory[];
  tracks: TrackCategory[];
  venues: string[];
}> {
  console.log('[search] Starting search for:', query);

  if (!query.trim()) {
    return { artists: [], albums: [], tracks: [], venues: [] };
  }

  try {
    // Search artists, albums, track categories, and products in parallel
    // Uses server-side filtering for albums/tracks (single API call each)
    const [allArtists, matchingAlbums, matchingTracks, matchingProducts] = await Promise.all([
      getArtists(),
      searchAlbumCategoriesServer(query),   // Server-side filter (1 API call)
      searchTrackCategoriesServer(query),   // Server-side filter (1 API call)
      // Also search products by name to find tracks not in track categories
      graphqlFetch<{ products: { items: MagentoProduct[]; total_count: number } }>(
        GET_SONGS_BY_SEARCH_QUERY,
        { search: query, pageSize: 50 }
      ).then(data => data.products.items || []).catch(() => [] as MagentoProduct[])
    ]);

    const searchLower = query.toLowerCase();

    // Extract artist slugs from matching tracks' breadcrumbs
    const trackArtistSlugs = new Set<string>();

    for (const track of matchingTracks) {
      const breadcrumbs = track.breadcrumbs;
      if (breadcrumbs && breadcrumbs.length >= 1) {
        // First breadcrumb = artist
        trackArtistSlugs.add(breadcrumbs[0].category_url_key);
      }
    }

    // Also extract artist slugs from matching products' categories
    // Products have categories array where first level is typically the artist
    for (const product of matchingProducts) {
      if (product.categories?.length) {
        // Find artist category (matches an artist slug from allArtists)
        for (const cat of product.categories) {
          if (allArtists.some(a => a.slug === cat.url_key)) {
            trackArtistSlugs.add(cat.url_key);
            break; // Found artist, no need to continue
          }
        }
      }
    }

    console.log('[search] Product search found:', matchingProducts.length, 'products, extracted artist slugs:', trackArtistSlugs.size);

    // Extract unique venues from matching products
    const venueSet = new Set<string>();
    for (const product of matchingProducts) {
      if (product.show_venue && product.show_venue.trim()) {
        venueSet.add(product.show_venue.trim());
      }
    }
    const venues = Array.from(venueSet).sort();
    console.log('[search] Found', venues.length, 'unique venues');

    // Merge artists: query matches first, then track-related artists
    const artistsFromQuery = allArtists.filter(a =>
      a.name.toLowerCase().includes(searchLower)
    );
    const artistsFromTracks = allArtists.filter(a =>
      trackArtistSlugs.has(a.slug) &&
      !artistsFromQuery.some(x => x.slug === a.slug)
    );
    const artists = [...artistsFromQuery, ...artistsFromTracks].slice(0, 10);

    // Albums are already server-filtered, no need to merge with all albums
    const albums = matchingAlbums.slice(0, 15);

    console.log('[search] Results:', {
      artists: artists.length,
      albums: albums.length,
      tracks: matchingTracks.length,
      artistsFromTracks: artistsFromTracks.length,
    });

    // Return in order: Artists, Albums, Tracks, Venues
    return { artists, albums, tracks: matchingTracks, venues };
  } catch (error) {
    console.error('[search] Search failed:', error);
    return { artists: [], albums: [], tracks: [], venues: [] };
  }
}

// ============================================================================
// FILTERED SEARCH (for search results with version filtering)
// ============================================================================

/**
 * Track category with loaded and filtered versions
 */
export interface TrackWithVersions extends TrackCategory {
  versions: Song[];           // All versions for this track
  filteredVersions: Song[];   // Versions matching current filters
  availableYears: number[];   // Years available for filtering
}

/**
 * Search tracks and fetch versions, applying filters
 * Returns tracks with their filtered versions
 * Tracks with 0 matching versions are excluded when filters are active
 *
 * OPTIMIZED (Phase 2): Uses server-side category filtering
 */
export async function searchTracksWithVersions(
  query: string,
  filters: VersionFilters
): Promise<TrackWithVersions[]> {
  console.log('[searchTracksWithVersions] Query:', query, 'Filters:', filters);

  if (!query.trim()) {
    return [];
  }

  try {
    // 1. Search track categories server-side (fast, single API call)
    const tracks = await searchTrackCategoriesServer(query);
    console.log('[searchTracksWithVersions] Found', tracks.length, 'matching tracks');

    if (tracks.length === 0) {
      return [];
    }

    // 2. Fetch versions for each track in parallel (limit to 20 tracks)
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

    // 3. Filter out tracks with 0 matching versions (when filters are active)
    if (hasActiveFilters(filters)) {
      const filtered = tracksWithVersions.filter(t => t.filteredVersions.length > 0);
      console.log('[searchTracksWithVersions] After filter:', filtered.length, 'tracks with matches');
      return filtered;
    }

    return tracksWithVersions;
  } catch (error) {
    console.error('[searchTracksWithVersions] Failed:', error);
    return [];
  }
}

/**
 * Re-apply filters to already-loaded tracks (instant, no network)
 * Used when user changes filters after initial search
 */
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

/**
 * Aggregate all available years from all tracks
 * Used to populate year dropdown with valid options
 */
export function getAllAvailableYears(tracks: TrackWithVersions[]): number[] {
  const years = new Set<number>();
  tracks.forEach(track => {
    track.availableYears.forEach(y => years.add(y));
  });
  return Array.from(years).sort((a, b) => b - a);
}
