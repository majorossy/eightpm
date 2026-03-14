import { getArtists, getArtistAlbums } from '@/lib/api';
import { fetchWikipediaSummary } from '@/lib/wikipedia';
import DebugImagesClient from './DebugImagesClient';

export default async function DebugImagesPage() {
  const artists = await getArtists();

  // Enrich each artist with albums + Wikipedia in parallel
  const enriched = await Promise.all(
    artists.map(async (artist) => {
      const [albumData, wikiSummary] = await Promise.all([
        getArtistAlbums(artist.slug),
        fetchWikipediaSummary(artist.name.replace(/ /g, '_')),
      ]);
      return {
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        image: artist.image,
        bandImageUrl: albumData?.artist.bandImageUrl || artist.bandImageUrl,
        albums: albumData?.albums || [],
        wikiSummary,
      };
    })
  );

  // Sort alphabetically
  enriched.sort((a, b) => a.name.localeCompare(b.name));

  return <DebugImagesClient initialArtists={enriched} />;
}
