/**
 * Schema.org structured data generation utilities for SEO.
 * Generates JSON-LD schemas for music content (MusicGroup, MusicAlbum, MusicRecording).
 */

import { formatDuration } from './formatDuration';
import { Album, Track, Artist, ArtistDetail, BandMemberData } from './types';
import { getVenueDetails, extractCity, extractState, extractCountry } from './venues';

/**
 * Helper to clean undefined values from an object (recursively).
 * JSON-LD should not include undefined values.
 */
function cleanUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        result[key] = value.filter(v => v !== undefined && v !== null);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        const cleaned = cleanUndefined(value as Record<string, unknown>);
        if (Object.keys(cleaned).length > 0) {
          result[key] = cleaned;
        }
      } else {
        result[key] = value;
      }
    }
  }
  return result as Partial<T>;
}

/**
 * Get show metadata from an album by looking at the first track's first song.
 * Albums in our system are categories, so show data comes from the tracks.
 */
export function getShowMetadataFromAlbum(album: Album): {
  showDate?: string;
  showVenue?: string;
  showLocation?: string;
} {
  const firstTrack = album.tracks?.[0];
  const firstSong = firstTrack?.songs?.[0];

  return {
    showDate: album.showDate || firstSong?.showDate,
    showVenue: album.showVenue || firstSong?.showVenue,
    showLocation: album.showLocation || firstSong?.showLocation,
  };
}

/**
 * Calculate aggregate rating from all songs in an album.
 * Returns null if insufficient reviews (Google requires >= 2 reviews).
 */
export function calculateAlbumRating(album: Album): {
  ratingValue: number;
  reviewCount: number;
} | null {
  let totalWeightedRating = 0;
  let totalReviews = 0;

  for (const track of album.tracks) {
    for (const song of track.songs) {
      if (song.avgRating && song.numReviews && song.numReviews > 0) {
        totalWeightedRating += song.avgRating * song.numReviews;
        totalReviews += song.numReviews;
      }
    }
  }

  if (totalReviews < 2) {
    return null;
  }

  return {
    ratingValue: totalWeightedRating / totalReviews,
    reviewCount: totalReviews,
  };
}

/**
 * Generate MusicGroup schema for an artist.
 */
export function generateMusicGroupSchema(
  artist: Artist | ArtistDetail,
  baseUrl: string,
  bandData?: BandMemberData | null
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@type': 'MusicGroup',
    name: artist.name,
    url: `${baseUrl}/artists/${artist.slug}`,
    image: artist.bandImageUrl || artist.image,
    description: artist.extendedBio || artist.bio,
    genre: artist.genres,
    foundingDate: artist.formationDate,
    foundingLocation: artist.originLocation,
    sameAs: [
      artist.officialWebsite,
      artist.facebook,
      artist.instagram,
      artist.twitter,
      artist.youtubeChannel,
    ].filter(Boolean),
  };

  if (bandData?.members?.current && bandData.members.current.length > 0) {
    schema.member = bandData.members.current.map(member => ({
      '@type': 'OrganizationRole',
      member: {
        '@type': 'Person',
        name: member.name,
      },
      roleName: member.role,
      startDate: member.years?.split('-')[0],
      endDate: member.years?.includes('present') ? undefined : member.years?.split('-')[1],
    }));
  }

  return cleanUndefined(schema) as Record<string, unknown>;
}

/**
 * Generate BreadcrumbList schema.
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate MusicAlbum schema for a show/album.
 */
export function generateMusicAlbumSchema(
  album: Album,
  artistSlug: string,
  baseUrl: string
): Record<string, unknown> {
  const showMetadata = getShowMetadataFromAlbum(album);
  const rating = calculateAlbumRating(album);

  const schema: Record<string, unknown> = {
    '@type': 'MusicAlbum',
    name: album.name,
    url: `${baseUrl}/artists/${artistSlug}/album/${album.slug}`,
    image: album.coverArt || album.wikipediaArtworkUrl,
    datePublished: showMetadata.showDate,
    byArtist: {
      '@type': 'MusicGroup',
      name: album.artistName,
      url: `${baseUrl}/artists/${artistSlug}`,
    },
    numTracks: album.totalTracks,
    albumProductionType: 'LiveAlbum',
    albumReleaseType: 'AlbumRelease',
    track: album.tracks.map((track, index) => ({
      '@type': 'MusicRecording',
      position: index + 1,
      name: track.title,
      url: `${baseUrl}/artists/${artistSlug}/album/${album.slug}/track/${track.slug}`,
      duration: formatDuration(track.totalDuration),
    })),
  };

  if (showMetadata.showVenue) {
    schema.recordedAt = {
      '@type': 'Place',
      name: showMetadata.showVenue,
      address: showMetadata.showLocation,
    };
  }

  if (rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.ratingValue.toFixed(1),
      reviewCount: rating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return cleanUndefined(schema) as Record<string, unknown>;
}

/**
 * Generate MusicEvent schema for local SEO (venue-based searches).
 */
export function generateMusicEventSchema(
  album: Album,
  artistSlug: string,
  baseUrl: string
): Record<string, unknown> | null {
  const showMetadata = getShowMetadataFromAlbum(album);

  if (!showMetadata.showVenue) {
    return null;
  }

  const venueDetails = getVenueDetails(showMetadata.showVenue);

  const location = venueDetails
    ? {
        '@type': 'Place',
        name: venueDetails.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: venueDetails.city,
          addressRegion: venueDetails.state,
          addressCountry: venueDetails.country,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: venueDetails.lat,
          longitude: venueDetails.lon,
        },
      }
    : {
        '@type': 'Place',
        name: showMetadata.showVenue,
        address: showMetadata.showLocation
          ? {
              '@type': 'PostalAddress',
              addressLocality: extractCity(showMetadata.showLocation),
              addressRegion: extractState(showMetadata.showLocation),
              addressCountry: extractCountry(showMetadata.showLocation),
            }
          : showMetadata.showVenue,
      };

  return cleanUndefined({
    '@type': 'MusicEvent',
    name: `${album.artistName} Live at ${showMetadata.showVenue}`,
    startDate: showMetadata.showDate,
    location,
    performer: {
      '@type': 'MusicGroup',
      name: album.artistName,
      url: `${baseUrl}/artists/${artistSlug}`,
    },
    recordedIn: {
      '@type': 'MusicAlbum',
      name: album.name,
      url: `${baseUrl}/artists/${artistSlug}/album/${album.slug}`,
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/artists/${artistSlug}/album/${album.slug}`,
      description: 'Free streaming from Archive.org',
    },
  }) as Record<string, unknown>;
}

/**
 * Build a Place schema with enriched venue data when available.
 * Uses the venue database for known venues (with geocoordinates),
 * falls back to parsing location strings for unknown venues.
 */
function buildPlaceSchema(
  showVenue?: string,
  showLocation?: string
): Record<string, unknown> | undefined {
  if (!showVenue) return undefined;

  const venueDetails = getVenueDetails(showVenue);

  if (venueDetails) {
    // Known venue - use full details with geocoordinates
    return {
      '@type': 'Place',
      name: venueDetails.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: venueDetails.city,
        addressRegion: venueDetails.state,
        addressCountry: venueDetails.country,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: venueDetails.lat,
        longitude: venueDetails.lon,
      },
    };
  }

  // Unknown venue - parse location string
  return {
    '@type': 'Place',
    name: showVenue,
    address: showLocation
      ? {
          '@type': 'PostalAddress',
          addressLocality: extractCity(showLocation),
          addressRegion: extractState(showLocation),
          addressCountry: extractCountry(showLocation),
        }
      : showVenue,
  };
}

/**
 * Generate MusicRecording schema for a track.
 */
export function generateMusicRecordingSchema(
  track: Track,
  artistSlug: string,
  albumSlug: string,
  baseUrl: string
): Record<string, unknown> {
  const primarySong = track.songs?.[0];
  const placeSchema = buildPlaceSchema(primarySong?.showVenue, primarySong?.showLocation);

  const schema: Record<string, unknown> = {
    '@type': 'MusicRecording',
    name: track.title,
    url: `${baseUrl}/artists/${artistSlug}/album/${albumSlug}/track/${track.slug}`,
    byArtist: {
      '@type': 'MusicGroup',
      name: track.artistName,
      url: `${baseUrl}/artists/${artistSlug}`,
    },
    recordingOf: {
      '@type': 'MusicComposition',
      name: track.title,
      composer: {
        '@type': 'MusicGroup',
        name: track.artistName,
      },
    },
    inAlbum: {
      '@type': 'MusicAlbum',
      name: track.albumName,
      datePublished: primarySong?.showDate,
      url: `${baseUrl}/artists/${artistSlug}/album/${albumSlug}`,
    },
    duration: formatDuration(track.totalDuration),
    recordedAt: placeSchema,
    datePublished: primarySong?.showDate,
  };

  if (primarySong?.numReviews && primarySong.numReviews >= 2) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: primarySong.avgRating?.toFixed(1),
      reviewCount: primarySong.numReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (primarySong?.streamUrl) {
    schema.audio = {
      '@type': 'AudioObject',
      contentUrl: primarySong.streamUrl,
      encodingFormat: 'audio/mpeg',
      duration: formatDuration(primarySong.duration),
    };
  }

  return cleanUndefined(schema) as Record<string, unknown>;
}

/**
 * Generate MusicEvent schema for a track (track was part of a live event).
 * Helps capture venue-based search queries for individual tracks.
 */
export function generateTrackMusicEventSchema(
  track: Track,
  artistSlug: string,
  albumSlug: string,
  baseUrl: string
): Record<string, unknown> | null {
  const primarySong = track.songs?.[0];

  if (!primarySong?.showVenue) {
    return null;
  }

  const placeSchema = buildPlaceSchema(primarySong.showVenue, primarySong.showLocation);

  return cleanUndefined({
    '@type': 'MusicEvent',
    name: `${track.artistName} Live at ${primarySong.showVenue}`,
    startDate: primarySong.showDate,
    location: placeSchema,
    performer: {
      '@type': 'MusicGroup',
      name: track.artistName,
      url: `${baseUrl}/artists/${artistSlug}`,
    },
    recordedIn: {
      '@type': 'MusicRecording',
      name: track.title,
      url: `${baseUrl}/artists/${artistSlug}/album/${albumSlug}/track/${track.slug}`,
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/artists/${artistSlug}/album/${albumSlug}/track/${track.slug}`,
      description: 'Free streaming from Archive.org',
    },
  }) as Record<string, unknown>;
}

/**
 * Generate WebSite schema for the home page.
 */
export function generateWebSiteSchema(baseUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '8pm.me',
    url: baseUrl,
    description: 'Stream live concert recordings from Archive.org',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/find?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Combine multiple schemas using @graph (Google's preferred format).
 */
export function combineSchemas(
  ...schemas: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown> {
  const validSchemas = schemas.filter(
    (s): s is Record<string, unknown> => s !== null && s !== undefined
  );

  return {
    '@context': 'https://schema.org',
    '@graph': validSchemas,
  };
}

/**
 * Generate FAQPage schema for artist pages.
 * Targets voice search queries and featured snippets.
 */
export function generateArtistFAQSchema(
  artistName: string,
  totalShows?: number,
  yearsActive?: string,
  originLocation?: string,
  mostPlayedTrack?: string
): Record<string, unknown> {
  const faqs: Array<{ question: string; answer: string }> = [];

  // How to listen
  faqs.push({
    question: `How can I listen to ${artistName} live recordings for free?`,
    answer: `8pm.me streams ${totalShows ? `${totalShows.toLocaleString()} ` : ''}${artistName} concert recordings for free, sourced from Archive.org. No subscription or account required. Simply browse to the ${artistName} artist page and select any show to start listening instantly.`,
  });

  // Best shows
  faqs.push({
    question: `What are the best ${artistName} live shows to listen to?`,
    answer: `The best ${artistName} shows often feature extended improvisational jams and high-energy performances. ${mostPlayedTrack ? `"${mostPlayedTrack}" is one of the most popular tracks. ` : ''}Check the ratings and download counts on each recording - shows with higher ratings typically represent standout performances.`,
  });

  // Legal question
  faqs.push({
    question: `Are these ${artistName} live recordings legal to stream?`,
    answer: `Yes! All ${artistName} recordings on 8pm.me are sourced from Archive.org, which hosts concerts with permission from artists who allow fan taping and trading.`,
  });

  // Formation/origin (if data exists)
  if (yearsActive || originLocation) {
    faqs.push({
      question: `When was ${artistName} formed and where are they from?`,
      answer: `${artistName}${originLocation ? ` is from ${originLocation}` : ''}${yearsActive ? ` and has been active ${yearsActive}` : ''}.`,
    });
  }

  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
