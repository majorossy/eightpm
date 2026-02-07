'use client';

import Link from 'next/link';
import { VenueArtist } from '@/lib/types';

interface VenueArtistsGridProps {
  artists: VenueArtist[];
}

export default function VenueArtistsGrid({ artists }: VenueArtistsGridProps) {
  if (artists.length === 0) return null;

  const sorted = [...artists].sort((a, b) => b.show_count - a.show_count);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-[var(--text)] mb-4">
        Artists ({artists.length})
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sorted.map((artist) => (
          <Link
            key={artist.slug}
            href={`/artists/${artist.slug}`}
            className="bg-[#252220] hover:bg-[#2d2a26] rounded-lg p-4 transition-colors group"
          >
            <div className="text-[var(--text)] font-medium text-sm truncate group-hover:text-[#d4a060] transition-colors">
              {artist.name}
            </div>
            <div className="text-[var(--text-subdued)] text-xs mt-1">
              {artist.show_count} {artist.show_count === 1 ? 'show' : 'shows'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
