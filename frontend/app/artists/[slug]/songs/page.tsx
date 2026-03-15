import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArtist, getTrackCatalog } from '@/lib/api';
import { generateSeoMetadata, getBaseUrl } from '@/lib/seo';
import { generateBreadcrumbSchema, combineSchemas } from '@/lib/schema';
import StructuredData from '@/components/StructuredData';
import SongIndexContent from '@/components/song/SongIndexContent';

interface SongIndexPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SongIndexPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtist(slug);

  if (!artist) {
    return { title: 'Artist Not Found' };
  }

  const title = `${artist.name} Songs — Complete Live Recording Catalog | 8PM`;
  const description = `Browse all ${artist.name} songs with live recording versions. Find the best performances, compare recordings, and stream instantly. Free, no signup.`;

  return generateSeoMetadata({
    title,
    description,
    keywords: `${artist.name} songs, ${artist.name} setlist, ${artist.name} live recordings, best ${artist.name} versions`,
    path: `/artists/${slug}/songs`,
    image: artist.bandImageUrl || artist.image,
  });
}

export default async function SongIndexPage({ params }: SongIndexPageProps) {
  const { slug } = await params;
  const [artist, initialSongs] = await Promise.all([
    getArtist(slug),
    getTrackCatalog({ artistSlug: slug, pageSize: 20, sortBy: 'VERSION_COUNT', sortDir: 'DESC' }),
  ]);

  if (!artist) {
    notFound();
  }

  const baseUrl = getBaseUrl();

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Artists', url: `${baseUrl}/artists` },
    { name: artist.name, url: `${baseUrl}/artists/${slug}` },
    { name: 'Songs', url: `${baseUrl}/artists/${slug}/songs` },
  ]);

  const itemListSchema = {
    '@type': 'ItemList',
    name: `${artist.name} Songs`,
    numberOfItems: initialSongs.totalCount,
    itemListElement: initialSongs.items.slice(0, 10).map((song, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'MusicComposition',
        name: song.title,
        url: `${baseUrl}/artists/${slug}/songs/${song.urlKey}`,
        composer: { '@type': 'MusicGroup', name: artist.name },
      },
    })),
  };

  const combinedSchema = combineSchemas(breadcrumbSchema, itemListSchema);

  return (
    <>
      <StructuredData data={combinedSchema} />
      <SongIndexContent
        artist={artist}
        initialData={{
          items: initialSongs.items,
          totalCount: initialSongs.totalCount,
          totalPages: initialSongs.pageInfo.totalPages,
        }}
      />
    </>
  );
}
