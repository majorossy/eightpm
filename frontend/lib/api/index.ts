// Barrel re-export - all public API surface
// Preserves `import { ... } from '@/lib/api'` across the codebase

// Types from types.ts
export type {
  Song,
  Artist,
  ArtistDetail,
  Album,
  Track,
  VenueDetail,
  VenueShow,
  VenueArtist,
  ArtistVenueCount,
  Podcast,
  PodcastEpisode,
  PodcastDetail,
} from '../types';

// Re-export VersionFilters type and hasActiveFilters from filters
export type { VersionFilters } from '../filters';
export { hasActiveFilters } from '../filters';

// GraphQL client exports
export { graphqlFetch, MAGENTO_GRAPHQL_URL, MAGENTO_MEDIA_URL, CACHE_DURATION, RETRY_CONFIG } from './graphql-client';

// Fragment exports
export { PRODUCT_FIELDS_FRAGMENT, GET_SONGS_BY_CATEGORY_QUERY, GET_SONGS_BY_SEARCH_QUERY, GET_ALL_SONGS_QUERY, GET_SONG_BY_ID_QUERY } from './fragments';

// Transform exports
export {
  categoryToArtist,
  productToSong,
  groupProductsIntoTracks,
  LOCAL_ALBUM_ART,
  getAlbumCoverArt,
  getCategoryImageUrl,
  normalizeUrl,
  slugify,
  formatDuration,
  venueSlug,
} from './transforms';
export type { MagentoCategory, MagentoProduct, CategoryBreadcrumb } from './transforms';

// Artist exports
export { getArtists, getArtist, getArtistAlbums, ARTISTS_PARENT_CATEGORY_ID } from './artists';

// Song exports
export { getSongs, getSong, getAlbum, getTrack } from './songs';

// Search exports
export {
  search,
  searchTracksLazy,
  searchTrackCategories,
  searchAlbumCategories,
  searchTrackCategoriesServer,
  searchAlbumCategoriesServer,
  getVersionsForTrack,
  searchTracksWithVersions,
  reapplyFilters,
  getAllAvailableYears,
} from './search';
export type { TrackCategory, AlbumCategory, TrackWithVersions } from './search';

// Venue exports
export { getVenue, getVenueShows, getVenueArtists, getNearbyVenues, getVenues, getArtistVenues } from './venues';

// Podcast exports
export { getPodcasts, getPodcastBySlug, getPodcastEpisodes, PODCASTS_PARENT_CATEGORY_ID } from './podcasts';
