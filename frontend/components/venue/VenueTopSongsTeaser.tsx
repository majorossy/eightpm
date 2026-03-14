'use client';

import { VenueSongStat } from '@/lib/types';

interface VenueTopSongsTeaserProps {
  songs: VenueSongStat[];
  onViewAll: () => void;
}

export default function VenueTopSongsTeaser({ songs, onViewAll }: VenueTopSongsTeaserProps) {
  if (songs.length === 0) return null;

  const top5 = songs.slice(0, 5);
  const maxCount = top5[0]?.play_count || 1;

  return (
    <div className="mb-6 bg-surface-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider">
          Top Songs at This Venue
        </h3>
        {songs.length > 5 && (
          <button
            onClick={onViewAll}
            className="text-xs text-accent hover:underline"
          >
            View full setlist
          </button>
        )}
      </div>

      <div className="space-y-2">
        {top5.map((song, i) => (
          <div key={song.song_title} className="flex items-center gap-3">
            <span className="text-[var(--text-subdued)] text-xs w-5 text-right font-mono">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text)] text-sm truncate font-medium">
                  {song.song_title}
                </span>
                {song.artists && song.artists.length > 0 && (
                  <span className="text-[var(--text-subdued)] text-[11px] truncate flex-shrink-0">
                    {song.artists.join(', ')}
                  </span>
                )}
              </div>
              {/* Play count bar */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(song.play_count / maxCount) * 100}%`,
                      backgroundColor: 'var(--secondary)',
                    }}
                  />
                </div>
                <span className="text-[var(--text-subdued)] text-[11px] font-mono w-6 text-right flex-shrink-0">
                  {song.play_count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
