'use client';

import { SongDetailData } from '@/lib/types';
import { formatDurationDisplay } from '@/lib/formatDuration';

interface SongStatsPanelProps {
  songDetail: SongDetailData;
  versionCount: number;
}

function StatRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between items-baseline py-1.5">
      <span className="text-xs text-[var(--text-subdued)] uppercase tracking-wider">{label}</span>
      <span className="text-sm text-[var(--text)] font-medium">{value}</span>
    </div>
  );
}

export default function SongStatsPanel({ songDetail, versionCount }: SongStatsPanelProps) {
  const yearsSpan = songDetail.yearsPlayed.length > 0
    ? `${songDetail.yearsPlayed[0]} - ${songDetail.yearsPlayed[songDetail.yearsPlayed.length - 1]}`
    : null;

  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      {/* Performance Stats */}
      <div className="rounded-lg border border-default bg-surface-card p-4">
        <h3 className="text-xs font-semibold text-[var(--text-subdued)] uppercase tracking-wider mb-3">
          Performance
        </h3>
        <div className="divide-y divide-[color-mix(in_srgb,var(--primary)_80%,white)]">
          <StatRow label="Recordings" value={versionCount} />
          {songDetail.avgRating && (
            <StatRow
              label="Avg Rating"
              value={`${'★'.repeat(Math.round(songDetail.avgRating))} ${songDetail.avgRating.toFixed(1)}`}
            />
          )}
          {songDetail.totalDownloads && (
            <StatRow label="Downloads" value={songDetail.totalDownloads.toLocaleString()} />
          )}
          <StatRow label="Years Active" value={yearsSpan} />
          {songDetail.yearsPlayed.length > 0 && (
            <StatRow label="Years Played" value={`${songDetail.yearsPlayed.length} years`} />
          )}
        </div>
      </div>

      {/* Duration Stats */}
      <div className="rounded-lg border border-default bg-surface-card p-4">
        <h3 className="text-xs font-semibold text-[var(--text-subdued)] uppercase tracking-wider mb-3">
          Duration
        </h3>
        <div className="divide-y divide-[color-mix(in_srgb,var(--primary)_80%,white)]">
          <StatRow label="Average" value={formatDurationDisplay(songDetail.avgDuration)} />
          <StatRow label="Longest" value={formatDurationDisplay(songDetail.longestDuration)} />
          <StatRow label="Shortest" value={formatDurationDisplay(songDetail.shortestDuration)} />
        </div>
      </div>
    </div>
  );
}
