import { Metadata } from 'next';
import { getPodcastEpisodes, getPodcasts } from '@/lib/api';
import { notFound } from 'next/navigation';
import PodcastPageContent from '@/components/PodcastPageContent';
import StructuredData from '@/components/StructuredData';
import { generateSeoMetadata, getBaseUrl } from '@/lib/seo';
import { generateBreadcrumbSchema } from '@/lib/schema';

interface PodcastPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PodcastPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPodcastEpisodes(slug);

  if (!result) {
    return { title: 'Podcast Not Found' };
  }

  const { podcast } = result;

  // SEO-optimized title
  const title = `${podcast.name} - Podcast Episodes | 8PM Archive`;

  // SEO-optimized description with episode count
  const episodeCount = podcast.episodeCount || 0;
  const episodeCountText = episodeCount > 100 ? `${Math.floor(episodeCount / 100) * 100}+` : episodeCount.toString();
  const description = podcast.description
    ? `${podcast.description.substring(0, 120)}... Stream ${episodeCountText} episodes free.`
    : `Stream and download ${episodeCountText} episodes of ${podcast.name}. Free streaming, no signup required.`;

  // Build keywords
  const keywords = [
    podcast.name,
    `${podcast.name} podcast`,
    `${podcast.name} episodes`,
    'podcast streaming',
    'free podcasts',
  ].join(', ');

  return generateSeoMetadata({
    title,
    description,
    keywords,
    path: `/podcasts/${slug}`,
    image: podcast.image,
    type: 'website',
  });
}

export async function generateStaticParams() {
  const podcasts = await getPodcasts();
  return podcasts.map((podcast) => ({
    slug: podcast.slug,
  }));
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const { slug } = await params;
  const result = await getPodcastEpisodes(slug);

  if (!result) {
    notFound();
  }

  const { podcast, episodes } = result;
  const baseUrl = getBaseUrl();

  // Breadcrumb schema for navigation
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Podcasts', url: `${baseUrl}/podcasts` },
    { name: podcast.name, url: `${baseUrl}/podcasts/${slug}` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      <PodcastPageContent podcast={podcast} episodes={episodes} />
    </>
  );
}
