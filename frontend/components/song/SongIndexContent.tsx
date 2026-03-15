'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Artist, SongItem } from '@/lib/types';
import { getTrackCatalog, getVersionsForTrack } from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { formatDurationDisplay } from '@/lib/formatDuration';

type SortField = 'VERSION_COUNT' | 'TITLE' | 'AVG_RATING' | 'TOTAL_DOWNLOADS' | 'LAST_PLAYED';
type SortDir = 'ASC' | 'DESC';

const PAGE_SIZE = 20;

interface SongIndexContentProps {
  artist: Artist;
  initialData: {
    items: SongItem[];
    totalCount: number;
    totalPages: number;
  };
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="opacity-30 ml-1">&#x25B4;&#x25BE;</span>;
  return <span className="ml-1 text-[var(--secondary)]">{dir === 'ASC' ? '\u25B4' : '\u25BE'}</span>;
}

export default function SongIndexContent({ artist, initialData }: SongIndexContentProps) {
  const [songs, setSongs] = useState<SongItem[]>(initialData.items);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('VERSION_COUNT');
  const [sortDir, setSortDir] = useState<SortDir>('DESC');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const { playSong } = usePlayer();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: artist.name, shortLabel: artist.shortName, href: `/artists/${artist.slug}`, type: 'artist' },
      { label: 'Songs', type: 'track' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, artist.name, artist.shortName, artist.slug]);

  const fetchSongs = useCallback(async (page: number, sort: SortField, dir: SortDir, searchTerm: string) => {
    setLoading(true);
    const result = await getTrackCatalog({
      artistSlug: artist.slug,
      search: searchTerm || undefined,
      sortBy: sort,
      sortDir: dir,
      pageSize: PAGE_SIZE,
      currentPage: page,
    });
    setSongs(result.items);
    setTotalCount(result.totalCount);
    setTotalPages(result.pageInfo.totalPages);
    setLoading(false);
  }, [artist.slug]);

  const handleSort = (field: SortField) => {
    const newDir: SortDir = sortBy === field
      ? (sortDir === 'DESC' ? 'ASC' : 'DESC')
      : (field === 'TITLE' ? 'ASC' : 'DESC');
    setSortBy(field);
    setSortDir(newDir);
    setCurrentPage(1);
    fetchSongs(1, field, newDir, search);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
      fetchSongs(1, sortBy, sortDir, value);
    }, 300);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    fetchSongs(page, sortBy, sortDir, search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayBest = async (song: SongItem) => {
    const categoryUid = btoa(String(song.categoryId));
    const versions = await getVersionsForTrack(categoryUid);
    if (versions.length === 0) return;

    const best = [...versions]
      .filter(v => v.isStreamable !== false)
      .sort((a, b) => {
        const ratingDiff = (b.avgRating || 0) - (a.avgRating || 0);
        if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
        return (b.downloads || 0) - (a.downloads || 0);
      })[0];

    if (best) playSong(best);
  };

  const colHeaders: { field: SortField; label: string; className?: string }[] = [
    { field: 'TITLE', label: 'Song' },
    { field: 'VERSION_COUNT', label: 'Versions' },
    { field: 'AVG_RATING', label: 'Rating', className: 'hidden md:block' },
    { field: 'TOTAL_DOWNLOADS', label: 'Downloads', className: 'hidden lg:block' },
    { field: 'LAST_PLAYED', label: 'Last Played', className: 'hidden md:block' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <Link href={`/artists/${artist.slug}`} className="text-sm text-[var(--tertiary)] hover:underline">
          {artist.name}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mt-1">
          Songs
        </h1>
        <p className="text-sm text-[var(--text-subdued)] mt-1">
          {totalCount} compositions with live recordings
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search songs..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-surface-card border border-default text-[var(--text)] placeholder:text-[var(--text-subdued)] focus:outline-none focus:border-[var(--secondary)] text-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-default overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_70px] md:grid-cols-[1fr_80px_70px_90px_90px] lg:grid-cols-[1fr_80px_70px_90px_90px] gap-3 px-4 py-2 bg-[color-mix(in_srgb,var(--primary)_85%,black)] border-b border-default text-xs text-[var(--text-subdued)] uppercase tracking-wider">
          {colHeaders.map(({ field, label, className }) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`flex items-center text-left hover:text-[var(--text)] transition-colors ${className || ''}`}
            >
              {label}
              <SortIcon active={sortBy === field} dir={sortDir} />
            </button>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--text-subdued)]">
            Loading...
          </div>
        ) : songs.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-[var(--text-subdued)]">
            No songs found
          </div>
        ) : (
          <div>
            {songs.map((song) => (
              <div
                key={`${song.categoryId}-${song.urlKey}`}
                className="grid grid-cols-[1fr_70px] md:grid-cols-[1fr_80px_70px_90px_90px] lg:grid-cols-[1fr_80px_70px_90px_90px] gap-3 px-4 py-3 border-b border-default hover:bg-[color-mix(in_srgb,var(--primary)_90%,white)] transition-colors group items-center"
              >
                {/* Song title + play button */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handlePlayBest(song)}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--secondary)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    title="Play best version"
                  >
                    &#9654;
                  </button>
                  <div className="min-w-0">
                    <Link
                      href={`/artists/${artist.slug}/songs/${song.urlKey}`}
                      className="text-sm font-medium text-[var(--text)] hover:text-[var(--secondary)] transition-colors truncate block"
                    >
                      {song.title}
                    </Link>
                    {song.avgDuration && (
                      <span className="text-xs text-[var(--text-subdued)]">
                        avg {formatDurationDisplay(song.avgDuration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Versions pill */}
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[color-mix(in_srgb,var(--tertiary)_20%,transparent)] text-[var(--tertiary)]">
                    {song.versionCount}
                  </span>
                </div>

                {/* Rating */}
                <div className="hidden md:block text-sm text-[var(--text-subdued)]">
                  {song.avgRating ? `${song.avgRating.toFixed(1)}` : '-'}
                </div>

                {/* Downloads */}
                <div className="hidden lg:block text-sm text-[var(--text-subdued)]">
                  {song.totalDownloads ? song.totalDownloads.toLocaleString() : '-'}
                </div>

                {/* Last Played */}
                <div className="hidden md:block text-sm text-[var(--text-subdued)]">
                  {song.lastPlayed || '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 text-sm rounded border border-default text-[var(--text-subdued)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-[var(--text-subdued)]">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 text-sm rounded border border-default text-[var(--text-subdued)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
