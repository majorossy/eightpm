'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Track, Song, formatDuration } from '@/lib/api';
import { useQueue } from '@/context/QueueContext';
import { Waveform } from '@/components/AudioVisualizations';
import { getBestVersion } from '@/lib/queueTypes';
import { StarRating, RecTypeBadge } from '@/components/VersionPickerModal';
import VersionPickerModal from '@/components/VersionPickerModal';

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
      className={`rounded-lg mb-2 ${justSwapped ? 'overflow-visible' : 'overflow-hidden'} transition-all ${justSwapped ? 'swap-glow' : ''}`}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {isCurrentTrack && isPlaying ? (
              <div style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
                <Waveform waveform={waveform} size="small" />
              </div>
            ) : (
              <span className="font-jb-mono text-[14px] w-5 text-right" style={{ color: 'var(--text-subdued)' }}>
                {displayIndex}.
              </span>
            )}
            <span className="text-primary" style={{ fontWeight: 500, fontSize: 16 }}>
              {track.title}
            </span>
            {/* Version count pill */}
            {hasMultipleVersions && (
              <span
                className="font-jb-mono text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--tertiary) 15%, transparent)',
                  color: 'var(--tertiary)',
                  border: '1px solid color-mix(in srgb, var(--tertiary) 20%, transparent)',
                }}
              >
                {track.songs.length} versions
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-[14px] flex-shrink-0" style={{ color: 'var(--text-subdued)' }}>
            <span>{formatDuration(track.totalDuration)}</span>
          </div>
        </div>

        {/* Metadata rows for the chipSong */}
        {chipSong && (
          <div className="flex flex-col gap-1 mt-2" style={{ paddingLeft: 34 }}>
            {/* Date + Venue */}
            <div className="flex items-baseline gap-2">
              {chipSong.showDate && (
                <span className="font-jb-mono text-[13px] font-semibold text-primary leading-tight tracking-wide">
                  {chipSong.showDate.replace(/-/g, '/')}
                </span>
              )}
              <span className="text-[13px] font-medium truncate" style={{ color: 'var(--tertiary)' }}>
                {chipSong.showVenue || chipSong.albumName || 'Unknown venue'}
              </span>
            </div>
            {/* Location */}
            {chipSong.showLocation && (
              <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {chipSong.showLocation}
              </span>
            )}

            {/* Taper */}
            {chipSong.taper && (
              <div className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <circle cx="10" cy="5" r="3" fill="#b8d0dc"/>
                  <path d="M10 8c-3.5 0-6 2-6 5v2h12v-2c0-3-2.5-5-6-5z" fill="#3a5060"/>
                  <line x1="17" y1="3" x2="17" y2="19" stroke="#90b4c4" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="15" y="0.5" width="4" height="4.5" rx="1.5" fill="#b8d0dc"/>
                  <path d="M13 11l4-3.5" stroke="#5a7888" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="font-jb-mono text-[11px] font-medium truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {chipSong.taper}
                </span>
              </div>
            )}

            {/* Source badge + Stars + Downloads */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <RecTypeBadge type={chipSong.recordingType} />
              <StarRating rating={chipSong.avgRating} count={chipSong.numReviews} />
              {chipSong.downloads != null && chipSong.downloads > 0 && (
                <span className="font-jb-mono text-[11px] flex items-center gap-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <path d="M12 2L2 7v1h20V7L12 2z" fill="rgba(200,180,140,0.55)"/>
                    <rect x="4.5" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="9" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="13" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="17.5" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="2" y="17" width="20" height="2" rx="0.5" fill="rgba(200,180,140,0.45)"/>
                  </svg>
                  <svg width="7" height="12" viewBox="0 0 10 16" fill="none" className="flex-shrink-0">
                    <path d="M5 1v11M5 12l-3.5-3.5M5 12l3.5-3.5" stroke="#8fa8b3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {chipSong.downloads.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Version Picker Modal */}
      {hasMultipleVersions && (
        <VersionPickerModal
          isOpen={showVersionModal}
          onClose={() => setShowVersionModal(false)}
          trackTitle={track.title}
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
