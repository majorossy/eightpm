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
  const [buttonHovered, setButtonHovered] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [justSwapped, setJustSwapped] = useState(false);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToQueue, trackToItem } = useQueue();
  const isCurrentTrack = track.songs.some(s => s.id === currentSong?.id);
  const hasMultipleVersions = track.songs.length > 1;

  // Best version for display
  const bestSong = useMemo(() => getBestVersion(track.songs), [track.songs]);
  const isEmpty = !bestSong;

  // Stored preference (if any)
  const preferredSong = preferredSongId
    ? track.songs.find(s => s.id === preferredSongId) ?? null
    : null;

  // Song to show in the chip: currently playing > stored preference > best version
  // For multi-version tracks with no preference, show nothing (blank tape state)
  const chipSong = isCurrentTrack && currentSong
    ? track.songs.find(s => s.id === currentSong.id) || preferredSong || bestSong
    : preferredSong || (hasMultipleVersions ? null : bestSong);

  const handleSwapVersion = useCallback((songId: string) => {
    onSwapVersion?.(songId);
    setJustSwapped(true);
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    swapTimerRef.current = setTimeout(() => setJustSwapped(false), 1800);
  }, [onSwapVersion]);

  // Empty track — grayed-out row with "no recordings found" subtext
  if (isEmpty) {
    return (
      <div
        className="rounded-lg mb-2 overflow-hidden select-none"
        style={{
          background: 'color-mix(in srgb, var(--text) 2%, transparent)',
          border: '1px solid color-mix(in srgb, var(--text) 6%, transparent)',
        }}
      >
        <div className="px-2 sm:px-[10px] py-3.5" style={{ opacity: 0.45 }}>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-jb-mono text-[11px] font-medium flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{displayIndex}</span>
            <span className="text-[13.5px] font-serif font-semibold truncate" style={{ color: 'var(--text-tertiary)', lineHeight: '1.3' }}>{track.title}</span>
            {track.totalDuration > 0 && (
              <span className="font-jb-mono text-[11px] font-medium flex-shrink-0 ml-auto" style={{ color: 'var(--text-tertiary)' }}>{formatDuration(track.totalDuration)}</span>
            )}
          </div>
          <div className="text-[11px] italic pl-5" style={{ color: 'var(--text-tertiary)' }}>no recordings found</div>
        </div>
      </div>
    );
  }

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
            : hovered && !buttonHovered
              ? hasMultipleVersions
                ? '3px solid var(--quaternary-muted)'
                : '3px solid var(--secondary-muted)'
              : '3px solid transparent',
          background: hovered && !buttonHovered && !isCurrentTrack
            ? hasMultipleVersions
              ? 'color-mix(in srgb, var(--quaternary) 6%, transparent)'
              : 'color-mix(in srgb, var(--text) 2%, transparent)'
            : 'transparent',
          transition: 'all 0.2s',
        }}
        className="px-2 sm:px-[10px] py-3.5"
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
          <div className="mt-2">
            <RecordingRow
              song={chipSong}
              showTitle={false}
              iconScale={1.2}
              taperLinkToArchive
              actionsAlign="start"
              swapLabel="swap out"
              swapHighlighted={hovered && hasMultipleVersions}
              actions={hasMultipleVersions ? ['swap', 'play', 'play-next', 'queue', 'playlist', 'favorite'] : ['play', 'play-next', 'queue', 'playlist', 'favorite']}
              onSwap={hasMultipleVersions ? () => setShowVersionModal(true) : undefined}
              onPlay={onPlay}
              isCurrentlyPlaying={isCurrentTrack && isPlaying}
              onActionHover={setButtonHovered}
              availableVersions={track.songs}
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
