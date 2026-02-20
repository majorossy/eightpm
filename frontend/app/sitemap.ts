import { MetadataRoute } from 'next';
import { getAllArtists, getAllAlbumsPaginated } from '@/lib/sitemap';

/**
 * Dynamic sitemap generation for SEO
 *
 * CARD-6 Implementation:
 * - Static pages: Homepage, artists list, library, informational pages
 * - Artist pages: All artist category pages (level 2)
 * - Album/Show pages: All show categories (level 3) - uses paginated query
 * - Tracks: EXCLUDED (186k+ URLs would exceed Google's 50k limit)
 *
 * Performance:
 * - Uses single paginated GraphQL query (not N+1)
 * - ISR with 1-hour revalidation
 * - Build time: ~10 seconds (not 2+ hours)
 *
 * Current catalog:
 * - ~35 artists
 * - ~35,000 albums/shows
 * - ~186,000 tracks (excluded from sitemap)
 */

// ISR: Regenerate sitemap every hour (not on every request)
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  const now = new Date();

  // Static pages - all public informational pages
  const staticPages: MetadataRoute.Sitemap = [
    // Homepage - highest priority, updated daily
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    // Main navigation pages
    { url: `${baseUrl}/artists`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/library`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/playlists`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/tapers`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Informational pages
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    // Legal pages
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cookie-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/dmca`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Artist pages - fetch with pagination
  let artistPages: MetadataRoute.Sitemap = [];
  try {
    const artists = await getAllArtists();
    artistPages = artists.map((artist) => ({
      url: `${baseUrl}/artists/${artist.url_key}`,
      lastModified: artist.updated_at ? new Date(artist.updated_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('[Sitemap] Failed to fetch artists:', error);
  }

  // Album/Show pages - single paginated query (avoids N+1 problem)
  // This fetches all ~35k albums in ~355 API calls (100 per page)
  // NOT 35k sequential calls like the naive approach
  let albumPages: MetadataRoute.Sitemap = [];
  try {
    const albums = await getAllAlbumsPaginated();
    albumPages = albums.map((album) => {
      // url_path format: "music/artistslug/albumslug" or similar
      const pathParts = album.url_path?.split('/') || [];
      // Artist slug is typically the second part (after "music" or root)
      const artistSlug = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : 'unknown';

      return {
        url: `${baseUrl}/artists/${artistSlug}/album/${album.url_key}`,
        lastModified: album.updated_at ? new Date(album.updated_at) : now,
        // Historical concerts don't change
        changeFrequency: 'never' as const,
        priority: 0.7,
      };
    });
  } catch (error) {
    console.error('[Sitemap] Failed to fetch albums:', error);
  }

  const totalUrls = staticPages.length + artistPages.length + albumPages.length;

  return [...staticPages, ...artistPages, ...albumPages];
}
