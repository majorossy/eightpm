// Data transformation functions for converting Magento GraphQL responses to app types

import { Song, Artist, Album, Track } from '../types';
import { MAGENTO_MEDIA_URL } from './graphql-client';

// Breadcrumb for category hierarchy
export interface CategoryBreadcrumb {
  category_uid: string;
  category_name: string;
  category_url_key: string;
}

export interface MagentoCategory {
  uid: string;
  name: string;
  url_key: string;
  description?: string;
  image?: string;
  product_count?: number;
  children_count?: number;
  children?: MagentoCategory[];
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
  // Podcast-specific
  is_podcast?: number;
  podcast_spotify_url?: string;
  podcast_apple_url?: string;
  podcast_youtube_url?: string;
  podcast_rss_feed?: string;
}

export interface MagentoProduct {
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
  identifier?: string;
  show_venue?: string;
  show_location?: string;
  venue_info?: {
    normalized_name?: string;
    slug?: string;
    city?: string;
    state?: string;
  } | null;
  show_taper?: string;
  show_source?: string;
  lineage?: string;
  notes?: string;
  archive_avg_rating?: number;
  archive_num_reviews?: number;
  archive_downloads?: number;
  archive_downloads_week?: number;
  archive_downloads_month?: number;
  is_streamable?: boolean;
  recording_type?: string;
  archive_detail_url?: string;
  archive_license_url?: string;
  access_restriction?: string;
  show_runtime?: string;
  show_added_date?: string;
  show_public_date?: string;
  show_subject?: string;
  track_original_file?: string;
  track_album?: string;
  recording_medium?: string;
  microphone_model?: string;
  recorder_device?: string;
  preamp_model?: string;
  ad_converter?: string;
  editing_software?: string;
  final_format?: string;
  show_date?: string;
  created_at?: string;
  categories?: Array<{ uid: string; name: string; url_key: string }>;
}

// Local album art mapping (slug -> filename in /images/albums/)
export const LOCAL_ALBUM_ART: Record<string, string> = {
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

export function getAlbumCoverArt(urlKey: string): string | undefined {
  const slug = urlKey.toLowerCase();
  if (LOCAL_ALBUM_ART[slug]) {
    return LOCAL_ALBUM_ART[slug];
  }
  return undefined;
}

export function getCategoryImageUrl(urlKey: string): string {
  return `${MAGENTO_MEDIA_URL}/catalog/category/${urlKey}.jpg`;
}

export function normalizeUrl(url: string): string {
  if (!url) return '';

  url = url.replace(/^(https?)\/\//, '$1://');

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  url = url.replace(/^(https?:\/\/[^/]+)\/\//, '$1/');

  const archiveServerMatch = url.match(
    /^https?:\/\/[a-z0-9]+\.(?:us|ca)\.archive\.org\/\d+\/items\/([^/]+)\/(.+)$/
  );
  if (archiveServerMatch) {
    url = `https://archive.org/download/${archiveServerMatch[1]}/${archiveServerMatch[2]}`;
  }

  url = url.replace(/ /g, '%20');

  return url;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function venueSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Parse show_name to extract venue and date
function parseShowName(showName: string): { venue?: string; date?: string } {
  const result: { venue?: string; date?: string } = {};

  const dateMatch = showName.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    result.date = dateMatch[1];
  }

  const venueMatch = showName.match(/Live at (.+?) on \d{4}-\d{2}-\d{2}/);
  if (venueMatch) {
    result.venue = venueMatch[1].trim();
  }

  return result;
}

// Extract taper/source info from identifier
function parseIdentifier(identifier: string): { source?: string } {
  const result: { source?: string } = {};

  const sourceMatch = identifier.match(/\d{4}-\d{2}-\d{2}\.(.+?)(?:\.flac|$)/i);
  if (sourceMatch) {
    result.source = sourceMatch[1].replace(/\./g, ' ').trim();
  }

  return result;
}

export function categoryToArtist(category: MagentoCategory): Artist {
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

export function productToSong(product: MagentoProduct, albumIdentifier?: string): Song {
  const artistCategory = product.categories?.find(
    c => c.url_key && !c.url_key.includes('-')
  ) || product.categories?.[0];

  const identifier = product.identifier || albumIdentifier || 'unknown-album';
  const albumName = product.show_name || identifier;
  const trackTitle = product.song_title || product.name;

  const showInfo = parseShowName(albumName);
  const identifierInfo = parseIdentifier(identifier);

  return {
    id: product.uid,
    sku: product.sku,
    title: trackTitle,
    artistId: artistCategory?.uid || '',
    artistName: artistCategory?.name || 'Unknown Artist',
    artistSlug: artistCategory?.url_key || '',
    duration: product.song_duration || 0,
    streamUrl: (() => {
      const medium = product.song_url_medium ? normalizeUrl(product.song_url_medium) : '';
      const low = product.song_url_low ? normalizeUrl(product.song_url_low) : '';

      if (medium) return medium;
      if (low) return low;

      const legacy = product.song_url ? normalizeUrl(product.song_url) : '';
      return legacy.endsWith('.flac') ? legacy.replace(/\.flac$/, '.mp3') : legacy;
    })(),
    albumArt: '/images/songs/default.jpg',
    qualityUrls: (() => {
      const high = product.song_url_high ? normalizeUrl(product.song_url_high) : undefined;
      const medium = product.song_url_medium ? normalizeUrl(product.song_url_medium) : undefined;
      const low = product.song_url_low ? normalizeUrl(product.song_url_low) : undefined;
      return { high, medium, low };
    })(),
    defaultQuality: 'medium',
    albumIdentifier: identifier,
    albumName,
    trackTitle,
    showDate: showInfo.date,
    showVenue: product.show_venue || showInfo.venue,
    showLocation: product.show_location || undefined,
    venueNormalizedName: product.venue_info?.normalized_name || undefined,
    venueSlug: product.venue_info?.slug || undefined,
    venueCity: product.venue_info?.city || undefined,
    venueState: product.venue_info?.state || undefined,
    taper: product.show_taper || undefined,
    source: product.show_source || identifierInfo.source,
    lineage: product.lineage || undefined,
    notes: product.notes || undefined,
    avgRating: product.archive_avg_rating || undefined,
    numReviews: product.archive_num_reviews || undefined,
    downloads: product.archive_downloads || undefined,
    downloadsWeek: product.archive_downloads_week || undefined,
    downloadsMonth: product.archive_downloads_month || undefined,
    isStreamable: product.is_streamable !== undefined ? product.is_streamable : true,
    recordingType: product.recording_type || undefined,
    archiveDetailUrl: product.archive_detail_url || undefined,
    archiveLicenseUrl: product.archive_license_url || undefined,
    accessRestriction: product.access_restriction || undefined,
    showRuntime: product.show_runtime || undefined,
    showAddedDate: product.show_added_date || undefined,
    showPublicDate: product.show_public_date || undefined,
    showSubject: product.show_subject || undefined,
    trackOriginalFile: product.track_original_file || undefined,
    trackAlbum: product.track_album || undefined,
    recordingMedium: product.recording_medium || undefined,
    microphoneModel: product.microphone_model || undefined,
    recorderDevice: product.recorder_device || undefined,
    preampModel: product.preamp_model || undefined,
    adConverter: product.ad_converter || undefined,
    editingSoftware: product.editing_software || undefined,
    finalFormat: product.final_format || undefined,
  };
}

export function groupProductsIntoTracks(
  products: MagentoProduct[],
  albumIdentifier: string,
  albumName: string,
  artistId: string,
  artistName: string,
  artistSlug: string
): Track[] {
  const trackMap = new Map<string, MagentoProduct[]>();

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
