// Venue API functions

import { VenueDetail, VenueShow, VenueArtist, ArtistVenueCount } from '../types';
import { graphqlFetch } from './graphql-client';

const GET_VENUE_QUERY = `
  query GetVenue($slug: String!) {
    venue(slug: $slug) {
      venue_id
      slug
      normalized_name
      city
      state
      country
      latitude
      longitude
      total_shows
      total_artists
      total_tracks
      first_show_date
      last_show_date
    }
  }
`;

const GET_VENUE_SHOWS_QUERY = `
  query GetVenueShows($slug: String!, $pageSize: Int!, $currentPage: Int!) {
    venue(slug: $slug) {
      shows(pageSize: $pageSize, currentPage: $currentPage) {
        items {
          identifier
          name
          show_date
          artist_name
          artist_slug
          track_count
          recording_types
        }
        total_count
        page_info {
          current_page
          page_size
          total_pages
        }
      }
    }
  }
`;

const GET_VENUE_ARTISTS_QUERY = `
  query GetVenueArtists($slug: String!) {
    venue(slug: $slug) {
      artists {
        name
        slug
        show_count
      }
    }
  }
`;

const GET_VENUE_NEARBY_QUERY = `
  query GetVenueNearby($slug: String!, $radius: Float!) {
    venue(slug: $slug) {
      nearby_venues(radius_miles: $radius) {
        venue_id
        slug
        normalized_name
        city
        state
        country
        total_shows
        total_artists
        latitude
        longitude
      }
    }
  }
`;

const GET_VENUES_QUERY = `
  query GetVenues($search: String, $city: String, $state: String, $pageSize: Int!, $currentPage: Int!) {
    venues(search: $search, city: $city, state: $state, pageSize: $pageSize, currentPage: $currentPage) {
      items {
        venue_id
        slug
        normalized_name
        city
        state
        country
        total_shows
        total_artists
        total_tracks
        latitude
        longitude
      }
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
    }
  }
`;

const GET_ARTIST_VENUES_QUERY = `
  query GetArtistVenues($uid: String!) {
    categoryList(filters: { category_uid: { eq: $uid } }) {
      artist_venues {
        venue_name
        venue_slug
        recording_count
        city
        state
      }
    }
  }
`;

export async function getVenue(slug: string): Promise<VenueDetail | null> {
  try {
    const data = await graphqlFetch<{ venue: VenueDetail | null }>(
      GET_VENUE_QUERY,
      { slug }
    );
    return data.venue || null;
  } catch (error) {
    console.error('[getVenue] Failed:', error);
    return null;
  }
}

export async function getVenueShows(
  slug: string,
  pageSize: number = 50,
  currentPage: number = 1
): Promise<{ items: VenueShow[]; total_count: number }> {
  try {
    const data = await graphqlFetch<{
      venue: {
        shows: {
          items: VenueShow[];
          total_count: number;
          page_info: { current_page: number; page_size: number; total_pages: number };
        };
      };
    }>(GET_VENUE_SHOWS_QUERY, { slug, pageSize, currentPage });
    return data.venue?.shows || { items: [], total_count: 0 };
  } catch (error) {
    console.error('[getVenueShows] Failed:', error);
    return { items: [], total_count: 0 };
  }
}

export async function getVenueArtists(slug: string): Promise<VenueArtist[]> {
  try {
    const data = await graphqlFetch<{
      venue: { artists: VenueArtist[] };
    }>(GET_VENUE_ARTISTS_QUERY, { slug });
    return data.venue?.artists || [];
  } catch (error) {
    console.error('[getVenueArtists] Failed:', error);
    return [];
  }
}

export async function getNearbyVenues(slug: string, radiusMiles: number = 50): Promise<VenueDetail[]> {
  try {
    const data = await graphqlFetch<{
      venue: { nearby_venues: VenueDetail[] };
    }>(GET_VENUE_NEARBY_QUERY, { slug, radius: radiusMiles });
    return data.venue?.nearby_venues || [];
  } catch (error) {
    console.error('[getNearbyVenues] Failed:', error);
    return [];
  }
}

export async function getVenues(options: {
  search?: string;
  city?: string;
  state?: string;
  pageSize?: number;
  currentPage?: number;
} = {}): Promise<{ items: VenueDetail[]; total_count: number }> {
  const { search, city, state, pageSize = 20, currentPage = 1 } = options;
  try {
    const data = await graphqlFetch<{
      venues: {
        items: VenueDetail[];
        total_count: number;
        page_info: { current_page: number; page_size: number; total_pages: number };
      };
    }>(GET_VENUES_QUERY, { search: search || null, city: city || null, state: state || null, pageSize, currentPage });
    return {
      items: data.venues?.items || [],
      total_count: data.venues?.total_count || 0,
    };
  } catch (error) {
    console.error('[getVenues] Failed:', error);
    return { items: [], total_count: 0 };
  }
}

const GET_VENUE_TRACKS_QUERY = `
  query GetVenueTracks($slug: String!, $pageSize: Int!, $currentPage: Int!, $sortBy: VenueTrackSortField!, $sortDir: SortEnum!) {
    venue(slug: $slug) {
      tracks(pageSize: $pageSize, currentPage: $currentPage, sortBy: $sortBy, sortDir: $sortDir) {
        items {
          uid
          sku
          name
          song_title
          song_duration
          song_url_high
          song_url_medium
          song_url_low
          show_date
          show_name
          identifier
          artist_name
          artist_slug
          recording_type
          archive_avg_rating
          archive_downloads
          is_streamable
          show_venue
          show_location
          show_taper
          lineage
        }
        total_count
        page_info {
          current_page
          page_size
          total_pages
        }
      }
    }
  }
`;

interface VenueTrackResponse {
  uid: string;
  sku: string;
  name: string;
  song_title: string | null;
  song_duration: number | null;
  song_url_high: string | null;
  song_url_medium: string | null;
  song_url_low: string | null;
  show_date: string | null;
  show_name: string | null;
  identifier: string | null;
  artist_name: string | null;
  artist_slug: string | null;
  recording_type: string | null;
  archive_avg_rating: string | null;
  archive_downloads: number | null;
  is_streamable: boolean | null;
  show_venue: string | null;
  show_location: string | null;
  show_taper: string | null;
  lineage: string | null;
}

export type VenueTrackSortField = 'DATE' | 'TITLE' | 'ARTIST' | 'RATING' | 'DOWNLOADS';

export async function getVenueTracks(
  slug: string,
  options?: {
    pageSize?: number;
    currentPage?: number;
    sortBy?: VenueTrackSortField;
    sortDir?: 'ASC' | 'DESC';
  }
): Promise<{
  items: VenueTrackResponse[];
  total_count: number;
  page_info: { current_page: number; page_size: number; total_pages: number };
}> {
  const {
    pageSize = 50,
    currentPage = 1,
    sortBy = 'DATE',
    sortDir = 'DESC',
  } = options || {};

  try {
    const data = await graphqlFetch<{
      venue: {
        tracks: {
          items: VenueTrackResponse[];
          total_count: number;
          page_info: { current_page: number; page_size: number; total_pages: number };
        };
      };
    }>(GET_VENUE_TRACKS_QUERY, { slug, pageSize, currentPage, sortBy, sortDir });
    return data.venue?.tracks || { items: [], total_count: 0, page_info: { current_page: 1, page_size: pageSize, total_pages: 0 } };
  } catch (error) {
    console.error('[getVenueTracks] Failed:', error);
    return { items: [], total_count: 0, page_info: { current_page: 1, page_size: pageSize, total_pages: 0 } };
  }
}

export async function getArtistVenues(categoryUid: string): Promise<ArtistVenueCount[]> {
  try {
    const data = await graphqlFetch<{
      categoryList: Array<{ artist_venues: ArtistVenueCount[] }>;
    }>(GET_ARTIST_VENUES_QUERY, { uid: categoryUid });
    return data.categoryList?.[0]?.artist_venues || [];
  } catch (error) {
    console.error('[getArtistVenues] Failed:', error);
    return [];
  }
}
