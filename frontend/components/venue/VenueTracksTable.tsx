'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import { getVenueTracks, formatDuration } from '@/lib/api';
import type { VenueTrackSortField, VenueTrackItem } from '@/lib/api';
import RecTypeBadge from '@/components/version-row/atoms/RecTypeBadge';
import StarRating from '@/components/version-row/atoms/StarRating';
import DownloadCount from '@/components/version-row/atoms/DownloadCount';

interface VenueTracksTableProps {
  venueSlug: string;
}

type SortDir = 'ASC' | 'DESC';

export default function VenueTracksTable({ venueSlug }: VenueTracksTableProps) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const [tracks, setTracks] = useState<VenueTrackItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<VenueTrackSortField>('DATE');
  const [sortDir, setSortDir] = useState<SortDir>('DESC');
  const [loading, setLoading] = useState(true);
  const pageSize = 50;

  const loadTracks = useCallback(async (page: number, sort: VenueTrackSortField, dir: SortDir) => {
    setLoading(true);
    try {
      const result = await getVenueTracks(venueSlug, {
        pageSize,
        currentPage: page,
        sortBy: sort,
        sortDir: dir,
      });
      setTracks(result.items);
      setTotalCount(result.total_count);
      setTotalPages(result.page_info.total_pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load venue tracks:', error);
    } finally {
      setLoading(false);
    }
  }, [venueSlug]);

  useEffect(() => {
    loadTracks(1, sortBy, sortDir);
  }, [venueSlug]);

  function handleSort(field: VenueTrackSortField) {
    const newDir: SortDir = sortBy === field
      ? (sortDir === 'ASC' ? 'DESC' : 'ASC')
      : (field === 'TITLE' || field === 'ARTIST' ? 'ASC' : 'DESC');
    setSortBy(field);
    setSortDir(newDir);
    loadTracks(1, field, newDir);
  }

  function SortIcon({ field }: { field: VenueTrackSortField }) {
    if (sortBy !== field) return <span className="text-tertiary ml-1">-</span>;
    return <span className="text-accent ml-1">{sortDir === 'ASC' ? '\u25B2' : '\u25BC'}</span>;
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-[var(--text-subdued)]">
        Loading tracks...
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--text-subdued)]">
        No tracks found for this venue.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--text)] mb-4">
        Tracks ({totalCount.toLocaleString()})
      </h2>

      {/* Table header — desktop */}
      <div className="hidden sm:grid grid-cols-[24px_1fr_1fr_90px_50px_70px_60px_70px] gap-2 px-4 py-2 text-xs text-[var(--text-subdued)] uppercase tracking-wider border-b border-default">
        <div />
        <button onClick={() => handleSort('TITLE')} className="text-left flex items-center hover:text-[var(--text)]">
          Title <SortIcon field="TITLE" />
        </button>
        <button onClick={() => handleSort('ARTIST')} className="text-left flex items-center hover:text-[var(--text)]">
          Artist <SortIcon field="ARTIST" />
        </button>
        <button onClick={() => handleSort('DATE')} className="text-left flex items-center hover:text-[var(--text)]">
          Date <SortIcon field="DATE" />
        </button>
        <div className="text-center">Type</div>
        <button onClick={() => handleSort('RATING')} className="text-left flex items-center hover:text-[var(--text)]">
          Rating <SortIcon field="RATING" />
        </button>
        <div className="text-right">Dur.</div>
        <button onClick={() => handleSort('DOWNLOADS')} className="text-right flex items-center justify-end hover:text-[var(--text)]">
          DLs <SortIcon field="DOWNLOADS" />
        </button>
      </div>

      {/* Table header — mobile */}
      <div className="sm:hidden grid grid-cols-[24px_1fr_70px_50px] gap-2 px-4 py-2 text-xs text-[var(--text-subdued)] uppercase tracking-wider border-b border-default">
        <div />
        <button onClick={() => handleSort('TITLE')} className="text-left flex items-center hover:text-[var(--text)]">
          Title <SortIcon field="TITLE" />
        </button>
        <button onClick={() => handleSort('DATE')} className="text-left flex items-center hover:text-[var(--text)]">
          Date <SortIcon field="DATE" />
        </button>
        <div className="text-center">Type</div>
      </div>

      {/* Track rows */}
      <div className="divide-y divide-border/50">
        {tracks.map(({ song, raw }) => {
          const isCurrent = currentSong?.id === song.id;
          const isCurrentPlaying = isCurrent && isPlaying;

          return (
            <div
              key={song.id}
              className={`group transition-colors ${
                isCurrent
                  ? 'bg-surface-elevated/80'
                  : 'hover:bg-surface-elevated/50'
              }`}
            >
              {/* Desktop row */}
              <div className="hidden sm:grid grid-cols-[24px_1fr_1fr_90px_50px_70px_60px_70px] gap-2 px-4 py-2.5 items-center">
                <button
                  onClick={() => playSong(song)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-border transition-colors"
                  aria-label={isCurrentPlaying ? 'Pause' : `Play ${song.title}`}
                >
                  {isCurrentPlaying ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" className="text-accent" fill="currentColor">
                      <rect x="1" y="1" width="3" height="8" rx="0.5" />
                      <rect x="6" y="1" width="3" height="8" rx="0.5" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" className={isCurrent ? 'text-accent' : 'text-[var(--text-subdued)] group-hover:text-[var(--text)]'} fill="currentColor">
                      <path d="M2 1l7 4-7 4V1z" />
                    </svg>
                  )}
                </button>

                <div className="truncate">
                  <span className={`text-sm ${isCurrent ? 'text-accent font-medium' : 'text-[var(--text)]'}`}>
                    {song.title}
                  </span>
                </div>

                <Link
                  href={`/artists/${raw.artist_slug}`}
                  className="text-sm text-[var(--text-dim)] truncate hover:text-accent transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {raw.artist_name || 'Unknown'}
                </Link>

                <div className="text-sm text-[var(--text-subdued)]">
                  {raw.show_date || '—'}
                </div>

                <div className="flex justify-center">
                  <RecTypeBadge type={raw.recording_type || undefined} />
                </div>

                <StarRating
                  rating={raw.archive_avg_rating ? parseFloat(raw.archive_avg_rating) : undefined}
                  starSize="w-2 h-2"
                />

                <div className="text-xs text-[var(--text-subdued)] text-right font-jb-mono">
                  {song.duration ? formatDuration(song.duration) : '—'}
                </div>

                <div className="flex justify-end">
                  <DownloadCount
                    downloads={raw.archive_downloads || undefined}
                    format="compact"
                    iconSize={10}
                    identifier={raw.identifier || undefined}
                  />
                </div>
              </div>

              {/* Mobile row */}
              <div className="sm:hidden grid grid-cols-[24px_1fr_70px_50px] gap-2 px-4 py-2.5 items-center">
                <button
                  onClick={() => playSong(song)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-border transition-colors"
                  aria-label={isCurrentPlaying ? 'Pause' : `Play ${song.title}`}
                >
                  {isCurrentPlaying ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" className="text-accent" fill="currentColor">
                      <rect x="1" y="1" width="3" height="8" rx="0.5" />
                      <rect x="6" y="1" width="3" height="8" rx="0.5" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" className={isCurrent ? 'text-accent' : 'text-[var(--text-subdued)]'} fill="currentColor">
                      <path d="M2 1l7 4-7 4V1z" />
                    </svg>
                  )}
                </button>

                <div className="truncate">
                  <div className={`text-sm truncate ${isCurrent ? 'text-accent font-medium' : 'text-[var(--text)]'}`}>
                    {song.title}
                  </div>
                  <div className="text-xs text-[var(--text-subdued)] truncate">
                    {raw.artist_name || 'Unknown'}
                  </div>
                </div>

                <div className="text-xs text-[var(--text-subdued)]">
                  {raw.show_date || '—'}
                </div>

                <div className="flex justify-center">
                  <RecTypeBadge type={raw.recording_type || undefined} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-default">
          <button
            onClick={() => loadTracks(currentPage - 1, sortBy, sortDir)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 text-sm rounded bg-surface-elevated text-[var(--text)] disabled:opacity-40 hover:bg-border transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-[var(--text-subdued)]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => loadTracks(currentPage + 1, sortBy, sortDir)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 text-sm rounded bg-surface-elevated text-[var(--text)] disabled:opacity-40 hover:bg-border transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
