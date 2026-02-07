'use client';

import { VenueDetail } from '@/lib/types';

interface VenueStatsProps {
  venue: VenueDetail;
}

export default function VenueStats({ venue }: VenueStatsProps) {
  const stats = [
    { label: 'Shows', value: venue.total_shows.toLocaleString() },
    { label: 'Artists', value: venue.total_artists.toLocaleString() },
    { label: 'Tracks', value: venue.total_tracks.toLocaleString() },
  ];

  return (
    <div className="flex gap-6 mb-8 pb-6 border-b border-[#2d2a26]">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="text-2xl font-bold text-[#d4a060]">{stat.value}</div>
          <div className="text-xs text-[var(--text-subdued)] uppercase tracking-wider">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
