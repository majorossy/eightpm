import { Metadata } from 'next';
import { getPodcasts } from '@/lib/api';
import PodcastsGrid from '@/components/PodcastsGrid';
import StructuredData from '@/components/StructuredData';
import { generateSeoMetadata, getBaseUrl } from '@/lib/seo';
import { generateBreadcrumbSchema } from '@/lib/schema';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Podcasts | 8PM Archive';
  const description = 'Browse and stream podcasts from Archive.org. Free streaming, no signup required.';
  const keywords = 'podcasts, free podcasts, streaming podcasts, archive.org podcasts';

  return generateSeoMetadata({
    title,
    description,
    keywords,
    path: '/podcasts',
    type: 'website',
  });
}

export default async function PodcastsPage() {
  const podcasts = await getPodcasts();
  const baseUrl = getBaseUrl();

  // Breadcrumb schema for navigation
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Podcasts', url: `${baseUrl}/podcasts` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      <PodcastsGrid podcasts={podcasts} />
    </>
  );
}
