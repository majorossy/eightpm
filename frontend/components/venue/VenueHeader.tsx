'use client';

import { VenueDetail } from '@/lib/types';

interface VenueHeaderProps {
  venue: VenueDetail;
}

export default function VenueHeader({ venue }: VenueHeaderProps) {
  const locationParts = [venue.city, venue.state, venue.country].filter(Boolean);
  const location = locationParts.join(', ');

  const dateRange = [venue.first_show_date, venue.last_show_date]
    .filter(Boolean)
    .join(' - ');

  return (
    <div className="mb-8">
      {/* Venue icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-[#2d2a26] flex items-center justify-center">
          <svg className="w-6 h-6 text-[#d4a060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="text-[var(--campfire-teal)] text-[10px] tracking-[3px] uppercase">
          Venue
        </div>
      </div>

      {/* Venue name */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl text-[var(--text)] font-bold mb-2 leading-tight">
        {venue.normalized_name}
      </h1>

      {/* Location */}
      {location && (
        <p className="text-lg text-[var(--text-dim)] mb-1">
          {location}
        </p>
      )}

      {/* Date range */}
      {dateRange && (
        <p className="text-sm text-[var(--text-subdued)]">
          Recordings from {dateRange}
        </p>
      )}
    </div>
  );
}
