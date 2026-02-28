'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { VenueArtist } from '@/lib/types';

interface ArtistCloudProps {
  artists: VenueArtist[];
}

export default function ArtistCloud({ artists }: ArtistCloudProps) {
  const { minCount, maxCount, sortedArtists } = useMemo(() => {
    if (artists.length === 0) return { minCount: 0, maxCount: 0, sortedArtists: [] };
    const counts = artists.map(a => a.show_count);
    return {
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts),
      sortedArtists: [...artists].sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [artists]);

  if (artists.length === 0) return null;

  const minFontSize = 12;
  const maxFontSize = 36;

  function getFontSize(count: number): number {
    if (maxCount === minCount) return (minFontSize + maxFontSize) / 2;
    const ratio = (count - minCount) / (maxCount - minCount);
    return minFontSize + ratio * (maxFontSize - minFontSize);
  }

  function getColor(count: number): string {
    if (maxCount === minCount) return 'var(--secondary)';
    const ratio = (count - minCount) / (maxCount - minCount);
    const opacity = 0.5 + ratio * 0.5;
    return `color-mix(in srgb, var(--secondary) ${Math.round(opacity * 100)}%, var(--text-subdued, #8a7a68))`;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent-primary) 25%, transparent))' }}
        />
        <h2 className="text-secondary text-[11px] tracking-[4px] uppercase">
          Artists Who Played Here
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--accent-primary) 25%, transparent), transparent)' }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-4">
        {sortedArtists.map((artist) => {
          const fontSize = getFontSize(artist.show_count);
          const color = getColor(artist.show_count);
          const tooltip = `${artist.name} - ${artist.show_count} show${artist.show_count !== 1 ? 's' : ''}`;

          return (
            <Link
              key={artist.slug}
              href={`/artists/${artist.slug}`}
              className="hover:underline transition-all hover:scale-110 inline-block"
              style={{ fontSize: `${fontSize}px`, color }}
              title={tooltip}
            >
              {artist.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
