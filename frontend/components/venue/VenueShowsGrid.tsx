'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VenueShow } from '@/lib/types';
import { getVenueShows } from '@/lib/api';
import { getRecordingBadge } from '@/lib/lineageUtils';

interface VenueShowsGridProps {
  venueSlug: string;
  initialShows?: VenueShow[];
  initialTotalCount?: number;
}

type SortField = 'date' | 'artist' | 'tracks';
type SortDirection = 'asc' | 'desc';

export default function VenueShowsGrid({ venueSlug, initialShows = [], initialTotalCount = 0 }: VenueShowsGridProps) {
  const [shows, setShows] = useState<VenueShow[]>(initialShows);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(!initialShows.length);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const pageSize = 50;

  useEffect(() => {
    if (initialShows.length > 0) return;
    loadShows(1);
  }, [venueSlug]);

  async function loadShows(page: number) {
    setLoading(true);
    try {
      const result = await getVenueShows(venueSlug, pageSize, page);
      setShows(result.items);
      setTotalCount(result.total_count);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load shows:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
  }

  const sortedShows = [...shows].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'date':
        return dir * ((a.show_date || '').localeCompare(b.show_date || ''));
      case 'artist':
        return dir * a.artist_name.localeCompare(b.artist_name);
      case 'tracks':
        return dir * (a.track_count - b.track_count);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="text-[#6a5a48] ml-1">-</span>;
    return <span className="text-[#d4a060] ml-1">{sortDirection === 'asc' ? '\u25B2' : '\u25BC'}</span>;
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-[var(--text-subdued)]">
        Loading shows...
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--text-subdued)]">
        No shows found for this venue.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--text)] mb-4">
        Shows ({totalCount.toLocaleString()})
      </h2>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_1fr_auto_auto] gap-2 px-4 py-2 text-xs text-[var(--text-subdued)] uppercase tracking-wider border-b border-[#2d2a26]">
        <button onClick={() => handleSort('date')} className="text-left flex items-center hover:text-[var(--text)]">
          Date <SortIcon field="date" />
        </button>
        <button onClick={() => handleSort('artist')} className="text-left flex items-center hover:text-[var(--text)] hidden sm:flex">
          Artist <SortIcon field="artist" />
        </button>
        <button onClick={() => handleSort('tracks')} className="text-right flex items-center hover:text-[var(--text)]">
          Tracks <SortIcon field="tracks" />
        </button>
        <div className="w-16" />
      </div>

      {/* Show rows */}
      <div className="divide-y divide-[#2d2a26]/50">
        {sortedShows.map((show) => {
          const primaryType = show.recording_types?.[0];
          const badge = primaryType ? getRecordingBadge(primaryType) : null;

          return (
            <Link
              key={show.identifier}
              href={`/artists/${show.artist_slug}/${show.identifier}`}
              className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_1fr_auto_auto] gap-2 px-4 py-3 hover:bg-[#2d2a26]/50 transition-colors items-center"
            >
              <div>
                <div className="text-[var(--text)] text-sm">
                  {show.show_date || 'Unknown date'}
                </div>
                <div className="text-[var(--text-subdued)] text-xs sm:hidden">
                  {show.artist_name}
                </div>
              </div>
              <div className="text-[var(--text-dim)] text-sm hidden sm:block truncate">
                {show.artist_name}
              </div>
              <div className="text-[var(--text-subdued)] text-sm text-right">
                {show.track_count}
              </div>
              <div className="w-16 flex justify-end">
                {badge && badge.show && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
                  >
                    {badge.text}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-[#2d2a26]">
          <button
            onClick={() => loadShows(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 text-sm rounded bg-[#2d2a26] text-[var(--text)] disabled:opacity-40 hover:bg-[#3a3632] transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-[var(--text-subdued)]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => loadShows(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 text-sm rounded bg-[#2d2a26] text-[var(--text)] disabled:opacity-40 hover:bg-[#3a3632] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
