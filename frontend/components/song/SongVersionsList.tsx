'use client';

import { useState, useMemo } from 'react';
import { Song } from '@/lib/types';
import { formatDurationDisplay } from '@/lib/formatDuration';

type SortField = 'date' | 'rating' | 'duration' | 'downloads';
type SortDir = 'asc' | 'desc';
type RecTypeFilter = 'ALL' | 'SBD' | 'AUD' | 'MX';

interface SongVersionsListProps {
  versions: Song[];
  loading: boolean;
  onPlay: (song: Song) => void;
  onQueue: (song: Song) => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="opacity-30 ml-0.5">&#x25B4;&#x25BE;</span>;
  return <span className="ml-0.5 text-[var(--secondary)]">{dir === 'asc' ? '\u25B4' : '\u25BE'}</span>;
}

function RecTypeBadge({ type }: { type?: string }) {
  if (!type || type === 'UNKNOWN') return null;
  const colors: Record<string, string> = {
    SBD: 'bg-[color-mix(in_srgb,var(--quinary)_25%,transparent)] text-[var(--quinary)]',
    AUD: 'bg-[color-mix(in_srgb,var(--tertiary)_25%,transparent)] text-[var(--tertiary)]',
    MX: 'bg-[color-mix(in_srgb,var(--quaternary)_25%,transparent)] text-[var(--quaternary)]',
    FM: 'bg-[color-mix(in_srgb,var(--secondary)_25%,transparent)] text-[var(--secondary)]',
    WEBCAST: 'bg-[color-mix(in_srgb,var(--tertiary)_25%,transparent)] text-[var(--tertiary)]',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${colors[type] || colors.AUD}`}>
      {type}
    </span>
  );
}

export default function SongVersionsList({ versions, loading, onPlay, onQueue }: SongVersionsListProps) {
  const [sortField, setSortField] = useState<SortField>('rating');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [recFilter, setRecFilter] = useState<RecTypeFilter>('ALL');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'date' ? 'desc' : 'desc');
    }
  };

  const filteredSorted = useMemo(() => {
    let result = [...versions];

    // Filter by recording type
    if (recFilter !== 'ALL') {
      result = result.filter(v => {
        const type = v.recordingType?.toUpperCase() || '';
        if (recFilter === 'SBD') return type === 'SBD';
        if (recFilter === 'AUD') return type === 'AUD' || type === 'UNKNOWN' || type === '';
        if (recFilter === 'MX') return type === 'MX' || type === 'MATRIX';
        return true;
      });
    }

    // Sort
    const dir = sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      switch (sortField) {
        case 'date':
          return dir * (a.showDate || '').localeCompare(b.showDate || '');
        case 'rating':
          return dir * ((b.avgRating || 0) - (a.avgRating || 0));
        case 'duration':
          return dir * ((a.duration || 0) - (b.duration || 0));
        case 'downloads':
          return dir * ((b.downloads || 0) - (a.downloads || 0));
        default:
          return 0;
      }
    });

    return result;
  }, [versions, recFilter, sortField, sortDir]);

  const filterButtons: { key: RecTypeFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'SBD', label: 'SBD' },
    { key: 'AUD', label: 'AUD' },
    { key: 'MX', label: 'Matrix' },
  ];

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Recording type filter */}
        <div className="flex gap-1">
          {filterButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRecFilter(key)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                recFilter === key
                  ? 'border-[var(--secondary)] text-[var(--secondary)] bg-[color-mix(in_srgb,var(--secondary)_10%,transparent)]'
                  : 'border-default text-[var(--text-subdued)] hover:text-[var(--text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort buttons */}
        <div className="flex gap-2 text-xs text-[var(--text-subdued)]">
          <span className="self-center">Sort:</span>
          {([
            ['rating', 'Rating'],
            ['date', 'Date'],
            ['duration', 'Duration'],
            ['downloads', 'DLs'],
          ] as [SortField, string][]).map(([field, label]) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`flex items-center hover:text-[var(--text)] transition-colors ${
                sortField === field ? 'text-[var(--text)]' : ''
              }`}
            >
              {label}
              <SortIcon active={sortField === field} dir={sortDir} />
            </button>
          ))}
        </div>
      </div>

      {/* Versions list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--text-subdued)]">
          Loading versions...
        </div>
      ) : filteredSorted.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-[var(--text-subdued)]">
          No recordings match the selected filter
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSorted.map((version) => (
            <div
              key={version.id}
              className="rounded-lg border border-default bg-surface-card px-4 py-3 hover:border-[color-mix(in_srgb,var(--secondary)_40%,transparent)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                {/* Play button */}
                <button
                  onClick={() => onPlay(version)}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--secondary)] text-white flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity text-xs"
                  title="Play this version"
                >
                  &#9654;
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-1 sm:gap-4 items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--text)]">
                        {version.showDate || 'Unknown date'}
                      </span>
                      <RecTypeBadge type={version.recordingType} />
                      {version.avgRating && version.avgRating > 0 && (
                        <span className="text-xs text-[var(--quinary)]">
                          {'★'} {version.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-subdued)] truncate mt-0.5">
                      {version.venueNormalizedName || version.showVenue || 'Unknown venue'}
                      {version.showLocation && ` — ${version.showLocation}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[var(--text-subdued)]">
                    <span>{formatDurationDisplay(version.duration)}</span>
                    {version.downloads && version.downloads > 0 && (
                      <span>{version.downloads.toLocaleString()} DLs</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onQueue(version); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--quinary)] hover:text-[var(--text)]"
                      title="Add to queue"
                    >
                      +Q
                    </button>
                  </div>
                </div>
              </div>

              {/* Taper info */}
              {version.taper && (
                <div className="mt-1 ml-12 text-[10px] text-[var(--text-subdued)] truncate">
                  Taper: {version.taper}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
