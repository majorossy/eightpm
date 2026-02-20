// Podcast API functions

import { Podcast, PodcastEpisode, PodcastDetail } from '../types';
import { graphqlFetch } from './graphql-client';
import { GET_SONGS_BY_CATEGORY_QUERY } from './fragments';
import { MagentoCategory, MagentoProduct, productToSong } from './transforms';

export const PODCASTS_PARENT_CATEGORY_ID = '4435';

const GET_PODCASTS_QUERY = `
  query GetPodcasts($parentId: String!, $pageSize: Int!, $currentPage: Int!) {
    categories(filters: { parent_id: { eq: $parentId }, is_podcast: { eq: "1" } }, pageSize: $pageSize, currentPage: $currentPage) {
      total_count
      items {
        uid
        name
        url_key
        description
        image
        product_count
        is_podcast
        podcast_spotify_url
        podcast_apple_url
        podcast_youtube_url
        podcast_rss_feed
        band_extended_bio
        band_image_url
        band_genres
        band_official_website
        band_facebook
        band_instagram
        band_twitter
      }
    }
  }
`;

const GET_PODCAST_BY_SLUG_QUERY = `
  query GetPodcastBySlug($urlKey: String!) {
    categoryList(filters: { url_key: { eq: $urlKey }, is_podcast: { eq: "1" } }) {
      uid
      name
      url_key
      description
      image
      product_count
      is_podcast
      podcast_spotify_url
      podcast_apple_url
      podcast_youtube_url
      podcast_rss_feed
      band_extended_bio
      band_image_url
      band_genres
      band_official_website
      band_facebook
      band_instagram
      band_twitter
    }
  }
`;

function categoryToPodcast(category: MagentoCategory): Podcast {
  return {
    id: category.uid,
    name: category.name,
    slug: category.url_key,
    image: category.image || category.band_image_url || '/images/default-podcast.jpg',
    description: category.description || category.band_extended_bio || '',
    episodeCount: category.product_count,
    isPodcast: true,
    spotifyUrl: category.podcast_spotify_url,
    appleUrl: category.podcast_apple_url,
    youtubeUrl: category.podcast_youtube_url,
    rssFeed: category.podcast_rss_feed,
  };
}

export async function getPodcasts(): Promise<Podcast[]> {
  try {
    const PAGE_SIZE = 50;
    let allPodcasts: MagentoCategory[] = [];
    let currentPage = 1;
    let totalCount = 0;

    const firstPageData = await graphqlFetch<{
      categories: { items: MagentoCategory[]; total_count: number };
    }>(GET_PODCASTS_QUERY, {
      parentId: PODCASTS_PARENT_CATEGORY_ID,
      pageSize: PAGE_SIZE,
      currentPage: 1,
    });

    allPodcasts = firstPageData.categories.items || [];
    totalCount = firstPageData.categories.total_count || 0;

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    for (currentPage = 2; currentPage <= totalPages; currentPage++) {
      const pageData = await graphqlFetch<{
        categories: { items: MagentoCategory[]; total_count: number };
      }>(GET_PODCASTS_QUERY, {
        parentId: PODCASTS_PARENT_CATEGORY_ID,
        pageSize: PAGE_SIZE,
        currentPage,
      });

      const pagePodcasts = pageData.categories.items || [];
      allPodcasts = allPodcasts.concat(pagePodcasts);
    }

    return allPodcasts.map(categoryToPodcast);
  } catch (error) {
    console.error('Failed to fetch podcasts:', error);
    return [];
  }
}

export async function getPodcastBySlug(slug: string): Promise<PodcastDetail | null> {
  try {
    const podcastData = await graphqlFetch<{ categoryList: MagentoCategory[] }>(
      GET_PODCAST_BY_SLUG_QUERY,
      { urlKey: slug }
    );

    if (!podcastData.categoryList.length) {
      return null;
    }

    const category = podcastData.categoryList[0];
    const podcast = categoryToPodcast(category);

    const PAGE_SIZE = 100;
    let allEpisodes: MagentoProduct[] = [];
    let currentPage = 1;
    let totalCount = 0;

    const firstPageData = await graphqlFetch<{
      products: { items: MagentoProduct[]; total_count: number };
    }>(GET_SONGS_BY_CATEGORY_QUERY, {
      categoryUid: category.uid,
      pageSize: PAGE_SIZE,
      currentPage: 1,
    });

    allEpisodes = firstPageData.products.items || [];
    totalCount = firstPageData.products.total_count || 0;

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    for (currentPage = 2; currentPage <= totalPages; currentPage++) {
      const pageData = await graphqlFetch<{
        products: { items: MagentoProduct[]; total_count: number };
      }>(GET_SONGS_BY_CATEGORY_QUERY, {
        categoryUid: category.uid,
        pageSize: PAGE_SIZE,
        currentPage,
      });

      const pageEpisodes = pageData.products.items || [];
      allEpisodes = allEpisodes.concat(pageEpisodes);
    }

    const episodes: PodcastEpisode[] = allEpisodes.map(product => ({
      ...productToSong(product),
      publishDate: product.show_date || product.created_at,
    }));

    return {
      ...podcast,
      episodes,
    };
  } catch (error) {
    console.error('Failed to fetch podcast:', error);
    return null;
  }
}

export async function getPodcastEpisodes(slug: string): Promise<{ podcast: Podcast; episodes: PodcastEpisode[] } | null> {
  const result = await getPodcastBySlug(slug);
  if (!result) {
    return null;
  }

  const { episodes, ...podcast } = result;
  return { podcast, episodes };
}
