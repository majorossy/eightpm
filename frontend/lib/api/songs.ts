// Song API functions - getSongs, getSong, getAlbum, getTrack

import { Song, Album, Track } from '../types';
import { graphqlFetch } from './graphql-client';
import { GET_SONGS_BY_CATEGORY_QUERY, GET_ALL_SONGS_QUERY, GET_SONG_BY_ID_QUERY } from './fragments';
import {
  MagentoCategory,
  MagentoProduct,
  productToSong,
  groupProductsIntoTracks,
  getAlbumCoverArt,
} from './transforms';

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

export async function getAlbum(
  artistSlug: string,
  albumIdentifier: string
): Promise<Album | null> {
  try {
    const albumData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
      GET_ALBUM_BY_URL_KEY_QUERY,
      { urlKey: albumIdentifier }
    );

    if (!albumData.categoryList.length) {
      return null;
    }

    const albumCat = albumData.categoryList[0];

    const artistBreadcrumb = albumCat.breadcrumbs?.find(
      b => b.category_url_key === artistSlug
    );
    if (!artistBreadcrumb) {
      return null;
    }

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
            artistId: artistBreadcrumb.category_uid,
            artistName: artistBreadcrumb.category_name,
            artistSlug: artistBreadcrumb.category_url_key,
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
            artistBreadcrumb.category_uid,
            artistBreadcrumb.category_name,
            artistBreadcrumb.category_url_key
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
        artistBreadcrumb.category_uid,
        artistBreadcrumb.category_name,
        artistBreadcrumb.category_url_key
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

export async function getTrack(
  artistSlug: string,
  albumIdentifier: string,
  trackSlug: string
): Promise<Track | null> {
  const album = await getAlbum(artistSlug, albumIdentifier);
  if (!album) return null;

  return album.tracks.find(t => t.slug === trackSlug) || null;
}
