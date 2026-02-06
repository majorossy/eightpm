import { Metadata } from 'next';
import { getAlbum, getArtists, getArtistAlbums } from '@/lib/api';
import { notFound } from 'next/navigation';
import AlbumPageContent from '@/components/AlbumPageContent';
import StructuredData from '@/components/StructuredData';
import { generateSeoMetadata, getBaseUrl } from '@/lib/seo';
import {
  generateMusicAlbumSchema,
  generateMusicEventSchema,
  generateBreadcrumbSchema,
  combineSchemas,
  getShowMetadataFromAlbum,
} from '@/lib/schema';
import { getRecordingType } from '@/lib/lineageUtils';

interface AlbumPageProps {
  params: Promise<{ slug: string; album: string }>;
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { slug, album: albumSlug } = await params;
  const album = await getAlbum(slug, albumSlug);

  if (!album) {
    return { title: 'Album Not Found' };
  }

  // Get show metadata from tracks (albums are categories, show data comes from tracks)
  const showMetadata = getShowMetadataFromAlbum(album);
  const venue = album.showVenue || showMetadata.showVenue;
  const showDate = album.showDate || showMetadata.showDate;

  // Detect recording type from track lineage data
  let recordingType: string | null = null;
  for (const track of album.tracks) {
    for (const song of track.songs) {
      if (song.lineage) {
        recordingType = getRecordingType(song.lineage);
        if (recordingType) break;
      }
    }
    if (recordingType) break;
  }
  const recordingLabel = recordingType === 'soundboard' ? 'Soundboard Recording'
    : recordingType === 'matrix' ? 'Matrix Recording'
    : 'Concert Recording';

  // SEO-optimized title: "{Artist} Live at {Venue} ({Date}) - Soundboard Recording | 8PM"
  // Fallback if venue unknown: "{Artist} Live ({Date}) - Free Streaming & Downloads | 8PM Archive"
  let title: string;
  if (venue && showDate) {
    title = `${album.artistName} Live at ${venue} (${showDate}) - ${recordingLabel} | 8PM`;
  } else if (venue) {
    title = `${album.artistName} Live at ${venue} - ${recordingLabel} | 8PM Archive`;
  } else if (showDate) {
    title = `${album.artistName} Live (${showDate}) - Free Streaming & Downloads | 8PM Archive`;
  } else {
    title = `${album.artistName} - ${album.name} | 8PM Archive`;
  }

  // Keep title under ~70 characters for optimal SERP display
  if (title.length > 70) {
    // Shorten by removing "Recording" or "Archive"
    title = title.replace(' Recording', '').replace(' Archive', '');
  }

  // SEO-optimized description: "Stream {Artist}'s {Date} show at {Venue}. Complete {recording_type} recording with {track_count} tracks. Free streaming."
  const recordingTypeText = recordingType || 'concert';
  let description: string;
  if (venue && showDate) {
    description = `Stream ${album.artistName}'s ${showDate} show at ${venue}. Complete ${recordingTypeText} recording with ${album.totalTracks} tracks. Free streaming.`;
  } else if (showDate) {
    description = `Stream ${album.artistName}'s ${showDate} performance. ${album.totalTracks} tracks available. High-quality ${recordingTypeText} recording. Free streaming, no signup.`;
  } else {
    description = `Stream ${album.name} by ${album.artistName}. ${album.totalTracks} tracks available. Free streaming, no signup required.`;
  }

  return generateSeoMetadata({
    title,
    description: description.substring(0, 160),
    path: `/artists/${slug}/album/${albumSlug}`,
    image: album.coverArt || album.wikipediaArtworkUrl,
    type: 'music.album',
  });
}

export async function generateStaticParams() {
  const artists = await getArtists();
  const params: { slug: string; album: string }[] = [];

  for (const artist of artists) {
    const result = await getArtistAlbums(artist.slug);
    if (result) {
      result.albums.forEach((album) => {
        params.push({ slug: artist.slug, album: album.slug });
      });
    }
  }

  return params;
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug, album: albumSlug } = await params;
  const album = await getAlbum(slug, albumSlug);

  if (!album) {
    notFound();
  }

  // Fetch artist albums for discography section
  const artistResult = await getArtistAlbums(slug);

  const baseUrl = getBaseUrl();

  // Generate Schema.org structured data using centralized utilities
  // MusicAlbum schema includes AggregateRating if sufficient reviews exist
  const musicAlbumSchema = generateMusicAlbumSchema(album, slug, baseUrl);

  // Breadcrumb schema for navigation
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: album.artistName, url: `${baseUrl}/artists/${slug}` },
    { name: album.name, url: `${baseUrl}/artists/${slug}/album/${albumSlug}` },
  ]);

  // MusicEvent schema for local SEO (venue-based searches)
  // This helps capture queries like "grateful dead red rocks 1978"
  const musicEventSchema = generateMusicEventSchema(album, slug, baseUrl);

  // Combine schemas using @graph (Google's preferred format)
  const combinedSchema = combineSchemas(
    musicAlbumSchema,
    breadcrumbSchema,
    musicEventSchema
  );

  return (
    <>
      <StructuredData data={combinedSchema} />
      <AlbumPageContent
        album={album}
        artistAlbums={artistResult?.albums}
        artist={artistResult?.artist}
      />
    </>
  );
}
