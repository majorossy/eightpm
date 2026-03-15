import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSongDetail } from '@/lib/api';
import { formatDurationDisplay } from '@/lib/formatDuration';
import { generateSeoMetadata, getBaseUrl } from '@/lib/seo';
import { generateBreadcrumbSchema, combineSchemas } from '@/lib/schema';
import StructuredData from '@/components/StructuredData';
import SongDetailContent from '@/components/song/SongDetailContent';

interface SongDetailPageProps {
  params: Promise<{ slug: string; song: string }>;
}

export async function generateMetadata({ params }: SongDetailPageProps): Promise<Metadata> {
  const { slug, song: songSlug } = await params;
  const songDetail = await getSongDetail(slug, songSlug);

  if (!songDetail) {
    return { title: 'Song Not Found' };
  }

  const durationText = songDetail.avgDuration
    ? ` avg ${formatDurationDisplay(songDetail.avgDuration)}`
    : '';
  const title = `Best Live ${songDetail.title} by ${songDetail.artistName} — ${songDetail.versionCount} Recordings | 8PM`;
  const description = `Compare ${songDetail.versionCount} live recordings of ${songDetail.title} by ${songDetail.artistName}.${durationText}. ${songDetail.firstPlayed ? `First played ${songDetail.firstPlayed}.` : ''} Stream free, no signup.`;

  return generateSeoMetadata({
    title,
    description,
    keywords: `best ${songDetail.title} ${songDetail.artistName}, ${songDetail.title} live, ${songDetail.artistName} ${songDetail.title} soundboard`,
    path: `/artists/${slug}/songs/${songSlug}`,
  });
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const { slug, song: songSlug } = await params;
  const songDetail = await getSongDetail(slug, songSlug);

  if (!songDetail) {
    notFound();
  }

  const baseUrl = getBaseUrl();

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Artists', url: `${baseUrl}/artists` },
    { name: songDetail.artistName, url: `${baseUrl}/artists/${slug}` },
    { name: 'Songs', url: `${baseUrl}/artists/${slug}/songs` },
    { name: songDetail.title, url: `${baseUrl}/artists/${slug}/songs/${songSlug}` },
  ]);

  const compositionSchema = {
    '@type': 'MusicComposition',
    name: songDetail.title,
    url: `${baseUrl}/artists/${slug}/songs/${songSlug}`,
    composer: {
      '@type': 'MusicGroup',
      name: songDetail.artistName,
      url: `${baseUrl}/artists/${slug}`,
    },
    ...(songDetail.firstPlayed && { dateCreated: songDetail.firstPlayed }),
  };

  const combinedSchema = combineSchemas(breadcrumbSchema, compositionSchema);

  return (
    <>
      <StructuredData data={combinedSchema} />
      <SongDetailContent songDetail={songDetail} />
    </>
  );
}
