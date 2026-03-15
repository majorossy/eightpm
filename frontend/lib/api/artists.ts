// Artist API functions

import { Artist, ArtistDetail, Album, Track, Song } from '../types';
import { fetchWikipediaSummary } from '../wikipedia';
import { graphqlFetch } from './graphql-client';
import { GET_SONGS_BY_CATEGORY_QUERY } from './fragments';
import {
  MagentoCategory,
  MagentoProduct,
  categoryToArtist,
  productToSong,
  groupProductsIntoTracks,
  getAlbumCoverArt,
} from './transforms';

export const ARTISTS_PARENT_CATEGORY_ID = '48';

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
        band_short_name
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
      band_short_name
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
      children {
        uid
        name
        url_key
        product_count
      }
    }
  }
`;

const STUDIO_ALBUMS_QUERY = `
  query GetStudioAlbums($artistName: String!) {
    studioAlbums(artistName: $artistName) {
      items {
        album_title
        release_year
      }
    }
  }
`;

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

export async function getArtists(): Promise<Artist[]> {
  try {
    const PAGE_SIZE = 50;
    let allArtists: MagentoCategory[] = [];
    let currentPage = 1;
    let totalCount = 0;

    const firstPageData = await graphqlFetch<{
      categories: { items: MagentoCategory[]; total_count: number };
    }>(GET_ARTISTS_QUERY, {
      parentId: ARTISTS_PARENT_CATEGORY_ID,
      pageSize: PAGE_SIZE,
      currentPage: 1,
    });

    allArtists = firstPageData.categories.items || [];
    totalCount = firstPageData.categories.total_count || 0;

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
    }

    return allArtists.map(categoryToArtist);
  } catch (error) {
    console.error('Failed to fetch artists:', error);
    return [];
  }
}

export async function getArtist(slug: string): Promise<ArtistDetail | null> {
  try {
    const artistData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
      GET_ARTIST_BY_SLUG_QUERY,
      { urlKey: slug }
    );
    if (!artistData.categoryList.length) {
      return null;
    }

    const category = artistData.categoryList[0];
    const artist = categoryToArtist(category);

    const PAGE_SIZE = 100;
    let allAlbumCategories: MagentoCategory[] = [];
    let currentPage = 1;
    let totalCount = 0;

    const firstPageData = await graphqlFetch<{
      categories: { items: MagentoCategory[]; total_count: number };
    }>(GET_CHILD_CATEGORIES_PAGINATED_QUERY, {
      parentUid: category.uid,
      pageSize: PAGE_SIZE,
      currentPage: 1,
    });

    allAlbumCategories = firstPageData.categories.items || [];
    totalCount = firstPageData.categories.total_count || 0;

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
    }

    const albumCategories = allAlbumCategories;
    const yearMap = await fetchReleaseYearMap(category.name);

    const albums: Album[] = await Promise.all(
      albumCategories.map(async (albumCat) => {
        const trackCategoriesData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
          GET_CHILD_CATEGORIES_QUERY,
          { parentUid: albumCat.uid }
        );

        const trackCategories = trackCategoriesData.categoryList || [];
        let tracks: Track[] = [];

        if (trackCategories.length > 0) {
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
                artistId: category.uid,
                artistName: category.name,
                artistSlug: category.url_key,
                songs,
                totalDuration: songs[0]?.duration || 0,
                songCount: songs.length,
              };
            })
          );

          const totalProducts = tracks.reduce((sum, t) => sum + t.songs.length, 0);

          if (totalProducts === 0) {
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
                category.uid,
                category.name,
                category.url_key
              );
            }
          }
        } else {
          const productsData = await graphqlFetch<{ products: { items: MagentoProduct[]; total_count: number } }>(
            GET_SONGS_BY_CATEGORY_QUERY,
            { categoryUid: albumCat.uid, pageSize: 500 }
          );

          const products = productsData.products.items || [];

          tracks = groupProductsIntoTracks(
            products,
            albumCat.url_key,
            albumCat.name,
            category.uid,
            category.name,
            category.url_key
          );
        }

        const totalSongs = tracks.reduce((sum, t) => sum + t.songs.length, 0);
        const totalDuration = tracks.reduce((sum, t) =>
          sum + t.songs.reduce((s, song) => s + song.duration, 0), 0
        );

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
          releaseYear: yearMap.get(albumCat.name) || undefined,
        };
      })
    );

    const songs: Song[] = albums.flatMap(album =>
      album.tracks.flatMap(track => track.songs)
    );

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

async function fetchReleaseYearMap(artistName: string): Promise<Map<string, number>> {
  const yearMap = new Map<string, number>();
  try {
    const data = await graphqlFetch<{
      studioAlbums: { items: Array<{ album_title: string; release_year: number | null }> } | null;
    }>(STUDIO_ALBUMS_QUERY, { artistName });
    for (const sa of data.studioAlbums?.items ?? []) {
      if (sa.release_year) yearMap.set(sa.album_title, sa.release_year);
    }
  } catch {
    // Non-critical — albums will just render without years
  }
  return yearMap;
}

export async function getArtistAlbums(slug: string): Promise<{ artist: Artist; albums: Album[] } | null> {
  try {
    const artistData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
      GET_ARTIST_BY_SLUG_QUERY,
      { urlKey: slug }
    );

    if (!artistData.categoryList.length) {
      return null;
    }

    const category = artistData.categoryList[0];
    const artist = categoryToArtist(category);

    const [albumCategoriesData, yearMap] = await Promise.all([
      graphqlFetch<{ categoryList: MagentoCategory[] }>(
        GET_CHILD_CATEGORIES_QUERY,
        { parentUid: category.uid }
      ),
      fetchReleaseYearMap(category.name),
    ]);

    const albumCategories = albumCategoriesData.categoryList || [];

    const albums: Album[] = albumCategories.map((albumCat) => ({
        id: albumCat.uid,
        identifier: albumCat.url_key,
        name: albumCat.name,
        slug: albumCat.url_key,
        artistId: category.uid,
        artistName: category.name,
        artistSlug: category.url_key,
        tracks: [],
        totalTracks: albumCat.product_count || 0,
        totalSongs: albumCat.product_count || 0,
        totalDuration: 0,
        coverArt: albumCat.wikipedia_artwork_url || getAlbumCoverArt(albumCat.url_key),
        wikipediaArtworkUrl: albumCat.wikipedia_artwork_url,
        releaseYear: yearMap.get(albumCat.name) || undefined,
        trackChildren: (albumCat.children || []).map(child => ({
          id: child.uid,
          name: child.name,
          slug: child.url_key,
          versionCount: child.product_count || 0,
        })),
      }
    ));

    return { artist, albums };
  } catch (error) {
    console.error('Failed to fetch artist albums:', error);
    return null;
  }
}
