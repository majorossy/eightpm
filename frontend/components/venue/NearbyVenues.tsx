'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VenueDetail } from '@/lib/types';
import { getNearbyVenues } from '@/lib/api';

interface NearbyVenuesProps {
  venueSlug: string;
}

export default function NearbyVenues({ venueSlug }: NearbyVenuesProps) {
  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const nearby = await getNearbyVenues(venueSlug, 100);
        setVenues(nearby);
      } catch (error) {
        console.error('Failed to load nearby venues:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [venueSlug]);

  if (loading) return null;
  if (venues.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-[var(--text)] mb-4">
        Nearby Venues
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {venues.map((venue) => {
          const location = [venue.city, venue.state].filter(Boolean).join(', ');
          return (
            <Link
              key={venue.slug}
              href={`/venues/${venue.slug}`}
              className="bg-[#252220] hover:bg-[#2d2a26] rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-[#2d2a26] flex items-center justify-center flex-shrink-0 group-hover:bg-[#3a3632]">
                  <svg className="w-4 h-4 text-[#d4a060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[var(--text)] font-medium text-sm truncate group-hover:text-[#d4a060] transition-colors">
                    {venue.normalized_name}
                  </div>
                  {location && (
                    <div className="text-[var(--text-subdued)] text-xs mt-0.5 truncate">
                      {location}
                    </div>
                  )}
                  <div className="text-[var(--text-subdued)] text-xs mt-1">
                    {venue.total_shows} {venue.total_shows === 1 ? 'show' : 'shows'}
                    {venue.total_artists > 0 && <> / {venue.total_artists} artists</>}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
