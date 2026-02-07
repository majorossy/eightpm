import { getArtists, getArtistAlbums } from '@/lib/api';
import { fetchWikipediaSummary } from '@/lib/wikipedia';
import { WikipediaSummary, Album } from '@/lib/types';

interface EnrichedArtist {
  id: string;
  name: string;
  slug: string;
  image: string;
  bandImageUrl?: string;
  albums: Album[];
  wikiSummary: WikipediaSummary | null;
}

function ImageSlot({ label, src }: { label: string; src?: string | null }) {
  const present = !!src;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-neutral-400 uppercase tracking-wide">{label}</span>
      <div className="relative w-24 h-24 rounded border border-neutral-700 overflow-hidden bg-neutral-900 flex items-center justify-center">
        {present ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src!} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-red-500 font-bold text-xs">MISSING</span>
        )}
        <span
          className={`absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
            present ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {present ? '\u2713' : '\u2717'}
        </span>
      </div>
      {src && (
        <span className="text-[10px] text-neutral-500 max-w-[6rem] truncate" title={src}>
          {src}
        </span>
      )}
    </div>
  );
}

export default async function DebugImagesPage() {
  const artists = await getArtists();

  // Enrich each artist with albums + Wikipedia in parallel
  const enriched: EnrichedArtist[] = await Promise.all(
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
        bandImageUrl: artist.bandImageUrl,
        albums: albumData?.albums || [],
        wikiSummary,
      };
    })
  );

  // Sort alphabetically
  enriched.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-[#1c1a17] text-neutral-200 p-6">
      <h1 className="text-2xl font-bold mb-1">Image Sources Debug</h1>
      <p className="text-neutral-400 mb-6 text-sm">{enriched.length} artists</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {enriched.map((artist) => (
          <div
            key={artist.id}
            className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4"
          >
            <h2 className="font-semibold text-lg mb-3 text-[#d4a060]">{artist.name}</h2>

            {/* Image sources row */}
            <div className="flex gap-4 mb-3">
              <ImageSlot label="Category Image" src={artist.image} />
              <ImageSlot label="Band Image URL" src={artist.bandImageUrl} />
              <ImageSlot
                label="Wikipedia Thumb"
                src={artist.wikiSummary?.thumbnail?.source}
              />
            </div>

            {/* Album covers */}
            {artist.albums.length > 0 && (
              <div>
                <span className="text-xs text-neutral-400 uppercase tracking-wide">
                  Album Covers ({artist.albums.filter((a) => a.coverArt).length}/
                  {artist.albums.length})
                </span>
                <div className="flex gap-2 mt-1 overflow-x-auto pb-2">
                  {artist.albums.slice(0, 30).map((album) => (
                    <div
                      key={album.id}
                      className="flex-shrink-0 w-10 h-10 rounded border border-neutral-700 overflow-hidden bg-neutral-900 flex items-center justify-center"
                      title={`${album.name}\n${album.coverArt || 'No cover'}`}
                    >
                      {album.coverArt ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={album.coverArt}
                          alt={album.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-red-500 text-[8px] font-bold">X</span>
                      )}
                    </div>
                  ))}
                  {artist.albums.length > 30 && (
                    <span className="text-xs text-neutral-500 self-center pl-1">
                      +{artist.albums.length - 30}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
