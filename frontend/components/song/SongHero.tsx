'use client';

import Link from 'next/link';
import { SongDetailData } from '@/lib/types';
import { formatDurationDisplay } from '@/lib/formatDuration';

interface SongHeroProps {
  songDetail: SongDetailData;
  onPlayBest: () => void;
  bestVersionLoaded: boolean;
}

export default function SongHero({ songDetail, onPlayBest, bestVersionLoaded }: SongHeroProps) {
  const stats: string[] = [];
  stats.push(`${songDetail.versionCount} recording${songDetail.versionCount !== 1 ? 's' : ''}`);
  if (songDetail.avgDuration) stats.push(`avg ${formatDurationDisplay(songDetail.avgDuration)}`);
  if (songDetail.firstPlayed) stats.push(`First: ${songDetail.firstPlayed}`);
  if (songDetail.lastPlayed) stats.push(`Last: ${songDetail.lastPlayed}`);

  return (
    <div className="text-center">
      <Link
        href={`/artists/${songDetail.artistSlug}`}
        className="text-sm text-[var(--tertiary)] hover:underline"
      >
        {songDetail.artistName}
      </Link>

      <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)] mt-1">
        {songDetail.title}
      </h1>

      <p className="text-sm text-[var(--text-subdued)] mt-2">
        {stats.join(' \u00B7 ')}
      </p>

      {/* Year badges */}
      {songDetail.yearsPlayed.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-3 max-w-xl mx-auto">
          {songDetail.yearsPlayed.map(year => (
            <span
              key={year}
              className="px-1.5 py-0.5 text-[10px] rounded bg-[color-mix(in_srgb,var(--senary)_40%,transparent)] text-[var(--text-subdued)]"
            >
              {year}
            </span>
          ))}
        </div>
      )}

      {/* Play Best CTA */}
      <div className="mt-5">
        <button
          onClick={onPlayBest}
          disabled={!bestVersionLoaded}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--secondary)] text-white font-medium text-sm hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-base">&#9654;</span>
          Play Best Version
        </button>
      </div>
    </div>
  );
}
