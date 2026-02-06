/**
 * Wikipedia API client for fetching artist summaries
 * Uses Wikipedia REST API v1 with 7-day caching
 * Extended with TextExtracts API for longer bios and Commons API for attribution
 */

import { WikipediaSummary, ImageAttribution } from './types';

/**
 * Fetches a Wikipedia summary for the given page title
 * @param pageTitle - The Wikipedia page title (e.g., "Grateful_Dead")
 * @returns WikipediaSummary object or null if not found/error
 */
export async function fetchWikipediaSummary(
  pageTitle: string
): Promise<WikipediaSummary | null> {
  try {
    // Wikipedia REST API endpoint
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;

    const response = await fetch(url, {
      next: { revalidate: 604800 }, // 7 days in seconds
      headers: {
        'User-Agent': '8pm-music-app/1.0',
      },
    } as RequestInit);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Wikipedia page not found: ${pageTitle}`);
        return null;
      }
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data = await response.json();

    // Map Wikipedia response to our interface
    const summary: WikipediaSummary = {
      title: data.title,
      extract: data.extract,
      description: data.description || null,
      thumbnail: data.thumbnail
        ? {
            source: data.thumbnail.source,
            width: data.thumbnail.width,
            height: data.thumbnail.height,
          }
        : null,
      url: data.content_urls?.desktop?.page || null,
    };

    // Fetch extended bio and attribution in parallel
    const [extendedBio, thumbnailAttribution] = await Promise.all([
      fetchExtendedBiography(pageTitle),
      summary.thumbnail ? fetchImageAttribution(summary.thumbnail.source) : Promise.resolve(null),
    ]);

    return {
      ...summary,
      extendedBio: extendedBio || undefined,
      thumbnailAttribution,
    };
  } catch (error) {
    console.error(`Error fetching Wikipedia summary for ${pageTitle}:`, error);
    return null;
  }
}

/**
 * Fetches extended biography (3-5 paragraphs) using TextExtracts API
 * @param pageTitle - The Wikipedia page title
 * @returns Extended biography text or null if not found/error
 */
async function fetchExtendedBiography(pageTitle: string): Promise<string | null> {
  try {
    const url = new URL('https://en.wikipedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('prop', 'extracts');
    url.searchParams.set('titles', pageTitle);
    url.searchParams.set('exintro', '1');  // Intro section only
    url.searchParams.set('explaintext', '1');  // Plain text (no HTML)
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');  // CORS

    const response = await fetch(url.toString(), {
      next: { revalidate: 604800 }, // 7 days
      headers: {
        'User-Agent': '8pm-music-app/1.0',
      },
    } as RequestInit);

    if (!response.ok) {
      console.warn(`TextExtracts API error for ${pageTitle}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    // Get the first (and typically only) page
    const pageId = Object.keys(pages)[0];
    if (!pageId || pageId === '-1') return null;

    const extract = pages[pageId]?.extract;
    return extract || null;
  } catch (error) {
    console.error(`Error fetching extended bio for ${pageTitle}:`, error);
    return null;
  }
}

/**
 * Fetches image attribution from Wikimedia Commons
 * @param imageUrl - The Wikipedia thumbnail URL
 * @returns ImageAttribution object or null if not found/error
 */
async function fetchImageAttribution(imageUrl: string): Promise<ImageAttribution | null> {
  try {
    // Extract filename from Wikipedia thumbnail URL
    // Format: https://upload.wikimedia.org/wikipedia/commons/thumb/X/XX/Filename.jpg/320px-Filename.jpg
    const urlParts = imageUrl.split('/');
    let filename: string | null = null;

    // Find the filename - it's the part before the dimension prefix (e.g., "320px-")
    for (let i = urlParts.length - 1; i >= 0; i--) {
      const part = urlParts[i];
      // Skip the sized version (e.g., "320px-Filename.jpg")
      if (part.match(/^\d+px-/)) {
        continue;
      }
      // Skip common path components
      if (['thumb', 'commons', 'wikipedia', 'en', 'upload.wikimedia.org'].includes(part)) {
        continue;
      }
      // Found it - this should be like "X" or "XX" or the actual filename
      if (part.includes('.')) {
        filename = decodeURIComponent(part);
        break;
      }
    }

    if (!filename) {
      // Try alternate extraction - get from sized version
      const sizedPart = urlParts[urlParts.length - 1];
      const match = sizedPart.match(/^\d+px-(.+)$/);
      if (match) {
        filename = decodeURIComponent(match[1]);
      }
    }

    if (!filename) {
      console.warn(`Could not extract filename from URL: ${imageUrl}`);
      return null;
    }

    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('titles', `File:${filename}`);
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'extmetadata');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');  // CORS

    const response = await fetch(url.toString(), {
      next: { revalidate: 604800 }, // 7 days
      headers: {
        'User-Agent': '8pm-music-app/1.0',
      },
    } as RequestInit);

    if (!response.ok) {
      console.warn(`Commons API error for ${filename}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    if (!pageId || pageId === '-1') return null;

    const imageinfo = pages[pageId]?.imageinfo?.[0];
    const extmetadata = imageinfo?.extmetadata;
    if (!extmetadata) return null;

    // Extract attribution info - strip HTML tags from artist value
    const artistRaw = extmetadata.Artist?.value || 'Unknown';
    const artist = artistRaw.replace(/<[^>]*>/g, '').trim() || 'Unknown';
    const license = extmetadata.LicenseShortName?.value || 'Wikimedia Commons';
    const licenseUrl = extmetadata.LicenseUrl?.value || 'https://commons.wikimedia.org/';

    return {
      artist,
      license,
      licenseUrl,
    };
  } catch (error) {
    console.error(`Error fetching image attribution:`, error);
    return null;
  }
}
