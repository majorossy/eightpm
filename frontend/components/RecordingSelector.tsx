'use client';

import { useState, useMemo } from 'react';
import { Song } from '@/lib/types';
import { getSourceFormat } from './recording/recordingUtils';
import { SortableHeader } from './recording/RecordingBadges';
import { RecordingCard } from './recording/RecordingCard';
import { CompactRow } from './recording/CompactRow';

// ============ Props ============

interface RecordingSelectorProps {
  songs: Song[];
  currentSongId: string | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onQueue: (song: Song) => void;
}

// ============ SortBar ============

function SortBar({ sortBy, sortDir, viewMode, onSort }: {
  sortBy: string;
  sortDir: 'asc' | 'desc';
  viewMode: 'cards' | 'compact';
  onSort: (field: string) => void;
}) {
  if (viewMode !== 'cards') return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
      <span style={{ color: 'var(--text-subdued)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginRight: 2 }}>SORT</span>
      {['rating', 'downloads', 'date', 'length'].map(s => {
        const active = sortBy === s;
        return (
          <button key={s} onClick={() => onSort(s)} style={{
            padding: '4px 10px', borderRadius: 6,
            border: active ? '1px solid var(--neon-pink)33' : '1px solid var(--overlay-light)',
            background: active ? 'var(--overlay-medium)' : 'transparent',
            color: active ? 'var(--neon-pink)' : 'var(--text-subdued)',
            fontSize: 11, cursor: 'pointer', fontWeight: active ? 600 : 400,
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}{active && <span style={{ fontSize: 9 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ============ Constants ============

const GRID_COLS = '20px 72px 1fr 44px 52px 56px 58px 70px 56px 28px';
const GRID_COLS_MOBILE = '20px 72px 1fr 44px 52px 56px 70px 28px';
const COMPACT_ROW_HEIGHT = 42;
const COMPACT_MAX_ROWS = 8;

// ============ Main RecordingSelector ============

export default function RecordingSelector({ songs, currentSongId, isPlaying, onPlay, onQueue }: RecordingSelectorProps) {
  const viewMode = 'compact' as const;
  const [sortBy, setSortBy] = useState('rating');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Top-rated song id
  const topRatedId = useMemo(() => {
    let best: Song | null = null;
    for (const s of songs) {
      if (s.avgRating != null && (!best || (s.avgRating > (best.avgRating ?? 0)))) {
        best = s;
      }
    }
    return best?.id ?? null;
  }, [songs]);

  // Sorted songs
  const sorted = useMemo(() => {
    const strFields: Record<string, (s: Song) => string> = {
      venue: s => s.showVenue || '',
      type: s => s.recordingType || '',
      src: s => getSourceFormat(s) || '',
      taper: s => s.taper || '',
    };
    const numFields: Record<string, (s: Song) => number> = {
      rating: s => s.avgRating || 0,
      downloads: s => s.downloads || 0,
      date: s => s.showDate ? new Date(s.showDate + 'T00:00:00').getTime() || 0 : 0,
      length: s => s.duration || 0,
    };
    return [...songs].sort((a, b) => {
      const m = sortDir === 'desc' ? -1 : 1;
      if (strFields[sortBy]) {
        const fn = strFields[sortBy];
        return fn(a).localeCompare(fn(b)) * m;
      }
      const fn = numFields[sortBy];
      if (fn) return (fn(a) - fn(b)) * m;
      return 0;
    });
  }, [songs, sortBy, sortDir]);

  if (songs.length === 0) return null;

  return (
    <div style={{
      fontFamily: "var(--font-instrument-sans), 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <style>{`
        .compact-row-grid {
          grid-template-columns: ${GRID_COLS};
        }
        @media (max-width: 767px) {
          .compact-row-grid {
            grid-template-columns: ${GRID_COLS_MOBILE};
          }
          .compact-col-taper,
          .compact-col-downloads {
            display: none;
          }
          .compact-detail-panel {
            padding-left: 12px !important;
          }
          .compact-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .sortable-header:hover {
          color: var(--neon-pink) !important;
        }
        .recording-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .recording-scroll::-webkit-scrollbar-thumb {
          background: var(--text-subdued);
          border-radius: 3px;
        }
        .recording-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <SortBar
        sortBy={sortBy}
        sortDir={sortDir}
        viewMode={viewMode}
        onSort={handleSort}
      />

      {viewMode === 'cards' ? (
        <div className="recording-scroll" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 10,
          overflowY: 'auto'
        }}>
          {sorted.map(song => (
            <RecordingCard
              key={song.id}
              song={song}
              topRatedId={topRatedId}
              isSongPlaying={song.id === currentSongId && isPlaying}
              expanded={expanded.has(song.id)}
              onToggleExpand={() => toggleExpand(song.id)}
              onPlay={() => onPlay(song)}
              onQueue={() => onQueue(song)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          background: '#15120d',
          borderRadius: 10,
          border: '1px solid #ffffff08',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Column headers - pinned, clickable to sort */}
          <div className="compact-row-grid" style={{
            display: 'grid',
            gap: 8,
            padding: '6px 12px',
            borderBottom: '1px solid #ffffff0a',
            color: '#4a4030',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            flexShrink: 0,
            background: '#15120d'
          }}>
            <span></span>
            <SortableHeader label="DATE" field="date" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="VENUE" field="venue" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="TYPE" field="type" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="SRC" field="src" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="TIME" field="length" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="compact-col-time" style={{ textAlign: 'right', justifyContent: 'flex-end' }} />
            <SortableHeader label="TAPER" field="taper" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="compact-col-taper" />
            <SortableHeader label="RATING" field="rating" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right', justifyContent: 'flex-end' }} />
            <SortableHeader label="DLS" field="downloads" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="compact-col-downloads" style={{ textAlign: 'right', justifyContent: 'flex-end' }} />
            <span></span>
          </div>
          {/* Scrollable rows */}
          <div className="recording-scroll" style={{
            maxHeight: COMPACT_ROW_HEIGHT * COMPACT_MAX_ROWS,
            overflowY: 'auto'
          }}>
            {sorted.map(song => (
              <CompactRow
                key={song.id}
                song={song}
                isTopRated={song.id === topRatedId}
                isSongPlaying={song.id === currentSongId && isPlaying}
                expanded={expanded.has(song.id)}
                onToggle={() => toggleExpand(song.id)}
                onPlay={() => onPlay(song)}
                onQueue={() => onQueue(song)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
