'use client';

import { useState } from 'react';
import { VenueSongStat } from '@/lib/types';

interface VenueSetlistTabProps {
  songs: VenueSongStat[];
}

type SortField = 'rank' | 'title' | 'plays' | 'first' | 'last';
type SortDir = 'asc' | 'desc';

export default function VenueSetlistTab({ songs }: VenueSetlistTabProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  if (songs.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--text-subdued)]">
        No setlist data available for this venue.
      </div>
    );
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'rank' || field === 'plays' ? 'asc' : 'asc');
    }
  }

  const maxCount = songs[0]?.play_count || 1;

  // Songs come pre-sorted by play_count desc, so rank = original index + 1
  const indexed = songs.map((s, i) => ({ ...s, rank: i + 1 }));

  const sorted = [...indexed].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'rank':
        return dir * (a.rank - b.rank);
      case 'title':
        return dir * a.song_title.localeCompare(b.song_title);
      case 'plays':
        return dir * (a.play_count - b.play_count);
      case 'first':
        return dir * ((a.first_played || '').localeCompare(b.first_played || ''));
      case 'last':
        return dir * ((a.last_played || '').localeCompare(b.last_played || ''));
      default:
        return 0;
    }
  });

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="text-[var(--text-subdued)] ml-1">-</span>;
    return <span className="text-accent ml-1">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--text)] mb-4">
        Setlist ({songs.length} songs)
      </h2>

      {/* Table header */}
      <div className="grid grid-cols-[36px_1fr_60px_1fr_80px_80px] gap-2 px-4 py-2 text-xs text-[var(--text-subdued)] uppercase tracking-wider border-b border-default">
        <button onClick={() => handleSort('rank')} className="text-left flex items-center hover:text-[var(--text)]">
          # <SortIcon field="rank" />
        </button>
        <button onClick={() => handleSort('title')} className="text-left flex items-center hover:text-[var(--text)]">
          Song <SortIcon field="title" />
        </button>
        <button onClick={() => handleSort('plays')} className="text-right flex items-center justify-end hover:text-[var(--text)]">
          Plays <SortIcon field="plays" />
        </button>
        <div className="text-left hidden sm:block">Artists</div>
        <button onClick={() => handleSort('first')} className="text-left flex items-center hover:text-[var(--text)] hidden md:flex">
          First <SortIcon field="first" />
        </button>
        <button onClick={() => handleSort('last')} className="text-left flex items-center hover:text-[var(--text)] hidden md:flex">
          Last <SortIcon field="last" />
        </button>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {sorted.map((song) => (
          <div
            key={song.song_title}
            className="grid grid-cols-[36px_1fr_60px_1fr_80px_80px] gap-2 px-4 py-2.5 hover:bg-surface-elevated/50 transition-colors items-center"
          >
            <span className="text-[var(--text-subdued)] text-xs font-mono">
              {song.rank}
            </span>
            <div className="min-w-0">
              <span className="text-[var(--text)] text-sm truncate block font-medium">
                {song.song_title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <div className="w-8 h-1.5 bg-surface-elevated rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(song.play_count / maxCount) * 100}%`,
                    backgroundColor: 'var(--secondary)',
                  }}
                />
              </div>
              <span className="text-[var(--text)] text-sm font-mono text-right">
                {song.play_count}
              </span>
            </div>
            <div className="text-[var(--text-subdued)] text-xs truncate hidden sm:block">
              {song.artists?.join(', ')}
            </div>
            <div className="text-[var(--text-subdued)] text-xs hidden md:block">
              {song.first_played}
            </div>
            <div className="text-[var(--text-subdued)] text-xs hidden md:block">
              {song.last_played}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
