'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArtistVenueCount } from '@/lib/types';
import { getArtistVenues } from '@/lib/api';

interface VenueCloudProps {
  artistId: string;
  artistName: string;
}

export default function VenueCloud({ artistId, artistName }: VenueCloudProps) {
  const [venues, setVenues] = useState<ArtistVenueCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getArtistVenues(artistId);
        setVenues(data);
      } catch (error) {
        console.error('Failed to load artist venues:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [artistId]);

  const { minCount, maxCount, sortedVenues } = useMemo(() => {
    if (venues.length === 0) return { minCount: 0, maxCount: 0, sortedVenues: [] };
    const counts = venues.map(v => v.recording_count);
    return {
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts),
      sortedVenues: [...venues].sort((a, b) => a.venue_name.localeCompare(b.venue_name)),
    };
  }, [venues]);

  if (loading) return null;
  if (venues.length === 0) return null;

  const minFontSize = 12;
  const maxFontSize = 36;

  function getFontSize(count: number): number {
    if (maxCount === minCount) return (minFontSize + maxFontSize) / 2;
    const ratio = (count - minCount) / (maxCount - minCount);
    return minFontSize + ratio * (maxFontSize - minFontSize);
  }

  // Generate warm color tones based on count
  function getColor(count: number): string {
    if (maxCount === minCount) return '#d4a060';
    const ratio = (count - minCount) / (maxCount - minCount);
    // From subdued (#8a7a68) to bright (#e8a050)
    const r = Math.round(138 + ratio * (232 - 138));
    const g = Math.round(122 + ratio * (160 - 122));
    const b = Math.round(104 + ratio * (80 - 104));
    return `rgb(${r}, ${g}, ${b})`;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-4 mb-4">
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(168,128,96,0.25))' }}
        />
        <h2 className="text-[#8a7a68] text-[11px] tracking-[4px] uppercase">
          Venues Played
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(90deg, rgba(168,128,96,0.25), transparent)' }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-4">
        {sortedVenues.map((venue) => {
          const fontSize = getFontSize(venue.recording_count);
          const color = getColor(venue.recording_count);
          const tooltip = [
            venue.venue_name,
            venue.city && venue.state ? `${venue.city}, ${venue.state}` : venue.city || venue.state,
            `${venue.recording_count} recording${venue.recording_count !== 1 ? 's' : ''}`,
          ].filter(Boolean).join(' - ');

          return (
            <Link
              key={venue.venue_slug}
              href={`/venues/${venue.venue_slug}`}
              className="hover:underline transition-all hover:scale-110 inline-block"
              style={{ fontSize: `${fontSize}px`, color }}
              title={tooltip}
            >
              {venue.venue_name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
