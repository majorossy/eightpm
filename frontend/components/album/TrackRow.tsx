'use client';

import React, { useMemo } from 'react';
import { Track, Song, formatDuration } from '@/lib/api';
import { useQueue } from '@/context/QueueContext';
import { Waveform } from '@/components/AudioVisualizations';
import RecordingSelector from '@/components/RecordingSelector';
import { getBestVersion } from '@/lib/queueTypes';

interface TrackRowProps {
  track: Track;
  displayIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlay: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  waveform?: number[];
}

export const TrackRow = React.memo(function TrackRow({
  track,
  displayIndex,
  isExpanded,
  onToggle,
  onPlay,
  currentSong,
  isPlaying,
  waveform = [],
}: TrackRowProps) {
  const { addToQueue, trackToItem } = useQueue();
  const isCurrentTrack = track.songs.some(s => s.id === currentSong?.id);

  // Best version for header display
  const bestSong = useMemo(() => getBestVersion(track.songs), [track.songs]);
  const bestYear = bestSong?.showDate?.split('-')[0] || '';
  const bestVenue = bestSong?.showVenue || '';
  const bestRating = bestSong?.avgRating;
  const bestReviews = bestSong?.numReviews;

  // Truncate venue for header
  const truncateVenue = (venue: string, max: number) => {
    if (!venue) return '';
    return venue.length > max ? venue.slice(0, max) + '\u2026' : venue;
  };

  return (
    <div
      className={`track-row-wrapper ${isExpanded ? 'expanded rounded-xl mb-2' : ''}`}
    >
      {/* Track row */}
      <div
        onClick={onToggle}
        className={`
          track-row grid grid-cols-[44px_1fr_auto] items-center py-4 cursor-pointer
          ${isExpanded ? 'expanded rounded-t-xl' : ''}
        `}
      >
        <div className={`text-lg flex items-center justify-center ${isExpanded || isCurrentTrack ? 'text-[var(--neon-pink)]' : 'text-[var(--text-subdued)]'}`}>
          {isCurrentTrack && isPlaying ? (
            <Waveform waveform={waveform} size="small" />
          ) : isExpanded ? (
            '▶'
          ) : (
            `${displayIndex}.`
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-lg font-serif mb-1 ${isExpanded || isCurrentTrack ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}`}>
            {track.title}
          </div>
          {/* Best version info */}
          <div className="flex items-center gap-2 flex-wrap text-sm">
            {bestYear && (
              <span className="text-[var(--neon-pink)] font-semibold">{bestYear}</span>
            )}
            {bestVenue && (
              <>
                <span className="text-[var(--text-subdued)] opacity-50">•</span>
                <span className="text-[var(--text-dim)] truncate max-w-[180px] sm:max-w-[280px]">
                  {truncateVenue(bestVenue, 35)}
                </span>
              </>
            )}
            {bestRating && (
              <>
                <span className="text-[var(--text-subdued)] opacity-50">•</span>
                <span className="text-[var(--neon-pink)]">
                  {'★'.repeat(Math.round(bestRating))}
                  <span className="text-[var(--text-subdued)] ml-0.5">({bestReviews || 0})</span>
                </span>
              </>
            )}
            <span className="text-[var(--text-subdued)] opacity-50">•</span>
            <span className="text-[var(--campfire-teal)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--campfire-teal)]" />
              {track.songCount} recordings
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 text-[var(--text-subdued)] text-base pl-3">
          {isExpanded && <span className="text-[var(--neon-pink)] text-base">+</span>}
          {formatDuration(track.totalDuration)}
          <span className={`text-[11px] ${isExpanded ? 'text-[var(--neon-pink)]' : 'text-[var(--text-subdued)] opacity-50'}`}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Expanded recordings panel */}
      {isExpanded && (
        <div className="px-1.5 py-1.5" style={{ borderTop: '1px solid var(--overlay-light)' }}>
          <RecordingSelector
            songs={track.songs}
            currentSongId={currentSong?.id ?? null}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onQueue={(song) => addToQueue(trackToItem(song))}
          />
        </div>
      )}
    </div>
  );
});

export function SideDivider({ side }: { side: 'A' | 'B' }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--overlay-light))' }}
      />
      <div className="text-[var(--text-subdued)] text-[11px] tracking-[4px] flex items-center gap-2.5">
        <span className={side === 'A' ? 'text-[var(--neon-pink)]' : 'text-[var(--campfire-teal)]'}>
          {side === 'A' ? '✧' : '☽'}
        </span>
        SIDE {side}
        <span className={side === 'A' ? 'text-[var(--neon-pink)]' : 'text-[var(--campfire-teal)]'}>
          {side === 'A' ? '✧' : '☽'}
        </span>
      </div>
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(90deg, var(--overlay-light), transparent)' }}
      />
    </div>
  );
}
