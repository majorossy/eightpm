'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Track, Song, formatDuration } from '@/lib/api';
import { useQueue } from '@/context/QueueContext';
import { Waveform } from '@/components/AudioVisualizations';
import { getBestVersion } from '@/lib/queueTypes';
import VersionPickerModal from '@/components/VersionPickerModal';
import { RecordingRow } from '@/components/version-row';

interface TrackRowProps {
  track: Track;
  displayIndex: number;
  onPlay: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  waveform?: number[];
  preferredSongId?: string | null;
  onSwapVersion?: (songId: string) => void;
  artistName: string;
  coverArt?: string;
}

export const TrackRow = React.memo(function TrackRow({
  track,
  displayIndex,
  onPlay,
  currentSong,
  isPlaying,
  waveform = [],
  preferredSongId,
  onSwapVersion,
  artistName,
  coverArt,
}: TrackRowProps) {
  const [hovered, setHovered] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [justSwapped, setJustSwapped] = useState(false);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToQueue, trackToItem } = useQueue();
  const isCurrentTrack = track.songs.some(s => s.id === currentSong?.id);
  const hasMultipleVersions = track.songs.length > 1;

  // Best version for display
  const bestSong = useMemo(() => getBestVersion(track.songs), [track.songs]);

  // Stored preference (if any)
  const preferredSong = preferredSongId
    ? track.songs.find(s => s.id === preferredSongId) ?? null
    : null;

  // Song to show in the chip: currently playing > stored preference > best version
  const chipSong = isCurrentTrack && currentSong
    ? track.songs.find(s => s.id === currentSong.id) || preferredSong || bestSong
    : preferredSong || bestSong;

  const handleSwapVersion = useCallback((songId: string) => {
    onSwapVersion?.(songId);
    setJustSwapped(true);
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    swapTimerRef.current = setTimeout(() => setJustSwapped(false), 1800);
  }, [onSwapVersion]);

  const handleRowClick = () => {
    if (hasMultipleVersions) {
      setShowVersionModal(true);
    } else if (chipSong) {
      onPlay(chipSong);
    }
  };

  return (
    <div
      className={`group rounded-lg mb-2 ${justSwapped ? 'overflow-visible' : 'overflow-hidden'} transition-all ${justSwapped ? 'swap-glow' : ''}`}
      style={{
        background: isCurrentTrack
          ? 'color-mix(in srgb, var(--secondary) 8%, transparent)'
          : 'color-mix(in srgb, var(--text) 3%, transparent)',
        border: isCurrentTrack
          ? '1px solid color-mix(in srgb, var(--secondary) 30%, transparent)'
          : '1px solid color-mix(in srgb, var(--text) 8%, transparent)',
      }}
    >
      {/* Clickable row */}
      <div
        onClick={handleRowClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: 'pointer',
          borderLeft: isCurrentTrack
            ? '3px solid var(--secondary)'
            : hovered
              ? '3px solid var(--secondary-muted)'
              : '3px solid transparent',
          background: hovered && !isCurrentTrack
            ? 'color-mix(in srgb, var(--text) 2%, transparent)'
            : 'transparent',
          transition: 'all 0.2s',
          padding: '14px 20px',
        }}
      >
        {/* Row 1: track number/play + title + versions pill + time */}
        <div className="flex items-baseline gap-1.5 mb-1">
          {isCurrentTrack && isPlaying ? (
            <div className="flex-shrink-0 self-center" style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
              <Waveform waveform={waveform} size="small" />
            </div>
          ) : (
            <span className="font-jb-mono text-[11px] font-medium flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              {displayIndex}
            </span>
          )}
          <span className="text-[13.5px] font-serif font-semibold text-primary truncate" style={{ lineHeight: '1.3' }}>
            {track.title}
          </span>
          {/* Version count pill */}
          {hasMultipleVersions && (
            <span
              className="font-jb-mono text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--tertiary) 15%, transparent)',
                color: 'var(--tertiary)',
                border: '1px solid color-mix(in srgb, var(--tertiary) 20%, transparent)',
              }}
            >
              {track.songs.length} versions
            </span>
          )}
          <div className="flex items-center gap-2.5 flex-shrink-0 ml-auto">
            <span className="font-jb-mono text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{formatDuration(track.totalDuration)}</span>
          </div>
        </div>

        {/* Metadata rows for the chipSong */}
        {chipSong && (
          <div className="mt-2" style={{ paddingLeft: 34 }}>
            <RecordingRow
              song={chipSong}
              showTitle={false}
              actions={hasMultipleVersions ? ['swap', 'play', 'play-next', 'queue', 'favorite'] : ['play', 'play-next', 'queue', 'favorite']}
              onSwap={hasMultipleVersions ? () => setShowVersionModal(true) : undefined}
              onPlay={onPlay}
              isCurrentlyPlaying={isCurrentTrack && isPlaying}
            />
          </div>
        )}
      </div>

      {/* Version Picker Modal */}
      {hasMultipleVersions && (
        <VersionPickerModal
          isOpen={showVersionModal}
          onClose={() => setShowVersionModal(false)}
          trackTitle={track.title}
          trackNumber={displayIndex}
          artistName={artistName}
          currentSongId={chipSong?.id ?? ''}
          versions={track.songs}
          coverArt={coverArt}
          onSwapVersion={(song) => {
            handleSwapVersion(song.id);
          }}
          onPlayVersion={(song) => onPlay(song)}
          onQueueVersion={(song) => addToQueue(trackToItem(song))}
        />
      )}
    </div>
  );
});
