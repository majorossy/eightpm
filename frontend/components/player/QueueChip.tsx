'use client';

// QueueChip - Compact card for the queue strip under the bottom player.
// Dense chip design: small art area + text stack + teal FLAC badge.
// Includes a versions button (bottom-right) to open VersionPickerModal.

import { useState, useRef } from 'react';
import { formatDuration } from '@/lib/api';
import VersionPickerModal, { VersionsIcon, StarRating, RecTypeBadge } from '@/components/VersionPickerModal';
import RecordingMediumIcon from '@/components/RecordingMediumIcon';
import type { QueueItem } from '@/lib/queueTypes';
import type { Song, AudioQuality } from '@/lib/types';

export interface QueueChipProps {
  item: QueueItem;
  chipIndex: number;
  onPlay: (index: number) => void;
  onRemove?: (queueId: string) => void;
  onSelectVersion?: (queueId: string, song: Song) => void;
  preferredQuality?: AudioQuality;
  absoluteIndex: number;
  isDragging?: boolean;
  isActive?: boolean;
  isPlayed?: boolean;
  /** When true, suppresses cursor-pointer so the parent's cursor-grab shows through */
  inSortable?: boolean;
  /** Compact mode for mobile — smaller chip, reduced padding/fonts */
  compact?: boolean;
  /** When true, apply gold glow animation after version swap */
  isJustSwapped?: boolean;
}

export default function QueueChip({
  item,
  chipIndex,
  onPlay,
  onRemove,
  onSelectVersion,
  preferredQuality = 'medium',
  absoluteIndex,
  isDragging,
  isActive,
  isPlayed,
  inSortable,
  compact,
  isJustSwapped,
}: QueueChipProps) {
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const modalClosedAtRef = useRef(0);

  const song = item.song;

  const rawVenue = song.showVenue || item.albumSource?.showVenue || '';
  const venueName = rawVenue
    ? rawVenue.replace(/(^|\s)\w/g, c => c.toUpperCase())
    : '';
  const locationStr = song.showLocation || item.albumSource?.showLocation || '';
  const dateStr = song.showDate || item.albumSource?.showDate || '';
  const formattedDate = dateStr
    ? dateStr.replace(/-/g, '/')
    : '';

  const recordingType = song.recordingType;

  const versionCount = item.availableVersions.length;
  const hasMultipleVersions = versionCount > 1;

  return (
      <div
        data-queue-active={isActive || undefined}
        onClick={() => {
          // Guard against click pass-through from Radix Dialog overlay close
          if (Date.now() - modalClosedAtRef.current < 300) return;
          onPlay(absoluteIndex);
        }}
        className={`
          group/chip relative flex flex-shrink-0 ${inSortable ? '' : 'cursor-pointer'}
          rounded-lg select-none ${isActive && !isPlayed || isJustSwapped ? 'overflow-visible' : 'overflow-hidden'}
          transition-all duration-200 ease-out ${isJustSwapped ? 'swap-glow' : ''}
          ${compact ? 'w-[230px] pl-[16px] pr-1 py-1.5' : 'w-[337px] pl-[20px] pr-2 py-2'}
          ${isPlayed
            ? 'opacity-40 bg-surface-player-chip'
            : isDragging
              ? 'shadow-[0_8px_24px_rgba(0,0,0,0.5)] scale-[1.03] bg-surface-player-chip-hover'
              : isActive
                ? 'bg-surface-player-chip-hover queue-chip-now-playing'
                : 'bg-surface-player-chip hover:bg-surface-player-chip-hover hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
          }
        `}
        style={{
          border: isDragging
            ? '1px solid var(--quinary)'
            : isActive
              ? '1px solid var(--secondary)'
              : '1px solid var(--border-subtle-player)',
          ...(isActive && !isPlayed ? { zIndex: 2 } : {}),
        }}
      >
        {/* NOW PLAYING badge — floats above the active chip, left-aligned */}
        {isActive && !isPlayed && (
          <div
            className="absolute -top-[13px] left-[42px] -translate-x-1/2 z-20 flex items-center gap-1 px-1.5 py-[1px] rounded-t-md font-jb-mono text-[8px] font-bold uppercase tracking-[1.5px] leading-none select-none pointer-events-none"
            style={{
              background: 'var(--player-surface-chip)',
              border: '1px solid var(--secondary)',
              borderBottom: 'none',
              color: 'var(--secondary)',
            }}
          >
            <span className="text-[7px]">▶</span>
            <span>Now Playing</span>
          </div>
        )}

        {/* Left-edge color bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-md transition-colors duration-200 ${
            isPlayed
              ? ''
              : isDragging || isActive
                ? ''
                : 'bg-transparent group-hover/chip:bg-accent-secondary'
          }`}
          style={{
            backgroundColor: isPlayed
              ? 'color-mix(in srgb, var(--quinary) 25%, transparent)'
              : isDragging
                ? 'var(--quinary)'
                : isActive
                  ? 'var(--secondary)'
                  : undefined,
            ...(isActive && !isPlayed && !isDragging ? {
              background: 'linear-gradient(to bottom, var(--secondary), color-mix(in srgb, var(--secondary) 50%, white), var(--secondary))',
              backgroundSize: '100% 200%',
              animation: 'chip-left-bar-shimmer 2s ease-in-out infinite',
            } : {}),
          }}
        />

        {/* Track number — top-left */}
        <span className={`absolute top-1 left-[42px] -translate-x-1/2 font-jb-mono text-[10px] font-medium z-10 ${isActive && !isPlayed ? 'text-accent-secondary' : 'text-tertiary'}`}>
          {item.albumSource ? (item.albumSource.originalTrackIndex ?? 0) + 1 : chipIndex}
        </span>

        {/* Card content: icon + info */}
        <div className={`flex flex-1 min-w-0 items-center ${compact ? 'gap-1.5' : 'gap-[9px]'}`}>
          {/* Medium icon */}
          <div className={`${compact ? 'h-[40px]' : 'h-[60px]'} flex items-center justify-center flex-shrink-0`}>
            <RecordingMediumIcon
              medium={song.recordingMedium}
              lineage={song.lineage}
              source={song.source}
              size={compact ? 0.55 : 0.85}
            />
          </div>

          {/* Info stack: title / date·venue·location / taper / badges */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-px">
            {/* Title + duration row */}
            <div className="flex items-baseline gap-1">
              <p className={`${compact ? 'text-[11px]' : 'text-[12.5px]'} font-semibold text-white truncate flex-1 min-w-0`} style={{ lineHeight: '1.3' }}>
                {item.trackTitle}
              </p>
              {song.duration > 0 && (
                <span className={`font-jb-mono ${compact ? 'text-[9px]' : 'text-[10px]'} flex-shrink-0`} style={{ color: 'var(--text-tertiary)' }}>
                  {formatDuration(song.duration)}
                </span>
              )}
            </div>

            {/* Row 1: Date · Venue */}
            <div className={`flex items-baseline ${compact ? 'gap-0.5' : 'gap-1'} truncate`}>
              {formattedDate && (
                <span className={`font-jb-mono ${compact ? 'text-[9px]' : 'text-[10px]'} font-semibold text-primary leading-tight tracking-wide flex-shrink-0`}>
                  {formattedDate}
                </span>
              )}
              {venueName && (
                <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-medium truncate`} style={{ color: 'var(--tertiary)' }}>
                  {venueName}
                </span>
              )}
            </div>
            {/* Location */}
            {!compact && locationStr && (
              <span className="font-jb-mono text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                {locationStr}
              </span>
            )}

            {/* Row 2: Taper (hidden on compact if no taper) */}
            {song.taper && !compact && (
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <circle cx="10" cy="5" r="3" fill="#b8d0dc"/>
                  <path d="M10 8c-3.5 0-6 2-6 5v2h12v-2c0-3-2.5-5-6-5z" fill="#3a5060"/>
                  <line x1="17" y1="3" x2="17" y2="19" stroke="#90b4c4" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="15" y="0.5" width="4" height="4.5" rx="1.5" fill="#b8d0dc"/>
                  <path d="M13 11l4-3.5" stroke="#5a7888" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="font-jb-mono text-[9px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {song.taper}
                </span>
              </div>
            )}

            {/* Row 3: RecType badge · Stars · Downloads */}
            <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5'} flex-wrap`}>
              <RecTypeBadge type={recordingType} />
              <StarRating rating={song.avgRating} count={song.numReviews} />
              {!compact && song.downloads != null && song.downloads > 0 && (
                <span className="font-jb-mono text-[9px] flex items-center gap-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <path d="M12 2L2 7v1h20V7L12 2z" fill="rgba(200,180,140,0.55)"/>
                    <rect x="4.5" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="9" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="13" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="17.5" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="2" y="17" width="20" height="2" rx="0.5" fill="rgba(200,180,140,0.45)"/>
                  </svg>
                  <svg width="6" height="9" viewBox="0 0 10 16" fill="none" className="flex-shrink-0">
                    <path d="M5 1v11M5 12l-3.5-3.5M5 12l3.5-3.5" stroke="#8fa8b3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {song.downloads >= 1000 ? `${(song.downloads / 1000).toFixed(1)}k` : song.downloads.toLocaleString()}
                </span>
              )}
              {/* Versions pill — inline on compact, pushed right */}
              {compact && !isPlayed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasMultipleVersions) setShowVersionPicker(true);
                  }}
                  className={`inline-flex items-center gap-[2px] px-0.5 rounded-sm text-[6px] font-jb-mono font-semibold ml-auto transition-all overflow-hidden ${
                    hasMultipleVersions ? 'cursor-pointer' : 'cursor-default opacity-40'
                  }`}
                  style={{
                    height: '11px',
                    background: 'color-mix(in srgb, var(--quaternary) 15%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--quaternary) 30%, transparent)',
                    color: 'var(--quaternary)',
                  }}
                  aria-label={`${versionCount} version${versionCount !== 1 ? 's' : ''} available`}
                  disabled={!hasMultipleVersions}
                >
                  <VersionsIcon className="w-[6px] h-[6px] flex-shrink-0" />
                  <span className="leading-none">{versionCount} ver</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drag grip — 2x3 dot grid on left edge, hidden when active (EQ bars replace it) */}
        {!isPlayed && !isActive && (
          <div className="absolute top-1/2 left-[5px] -translate-y-1/2 grid grid-cols-2 gap-[3px] opacity-30 group-hover/chip:opacity-50 transition-opacity">
            <span className="w-[3px] h-[3px] rounded-full bg-accent-secondary" />
            <span className="w-[3px] h-[3px] rounded-full bg-accent-secondary" />
            <span className="w-[3px] h-[3px] rounded-full bg-accent-secondary" />
            <span className="w-[3px] h-[3px] rounded-full bg-accent-secondary" />
            <span className="w-[3px] h-[3px] rounded-full bg-accent-secondary" />
            <span className="w-[3px] h-[3px] rounded-full bg-accent-secondary" />
          </div>
        )}

        {/* Remove button — visible on active card or hover */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.queueId);
            }}
            className={`inline absolute top-0.5 right-0.5 ${compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} flex items-center justify-center rounded-full bg-surface-player-deep/80 text-tertiary hover:!text-white hover:!bg-border transition-all z-10 ${
              isActive ? 'opacity-70' : 'opacity-40 group-hover/chip:opacity-100'
            }`}
            aria-label={`Remove ${item.trackTitle}`}
          >
            <svg className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Versions button — bottom-right, hover-reveal lavender pill (desktop only) */}
        {!isPlayed && !compact && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasMultipleVersions) setShowVersionPicker(true);
            }}
            className={`absolute ${compact ? 'bottom-0.5 right-0.5 gap-[2px] px-1 py-0 rounded-[3px] text-[7px]' : 'bottom-1 right-1 gap-[3px] px-1.5 py-[2px] rounded-[4px] text-[8px]'} flex items-center transition-all z-10 font-jb-mono font-semibold leading-none ${
              hasMultipleVersions
                ? 'cursor-pointer'
                : 'cursor-default opacity-40'
            }`}
            style={{
              background: 'color-mix(in srgb, var(--quaternary) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--quaternary) 30%, transparent)',
              color: 'var(--quaternary)',
            }}
            onMouseEnter={(e) => {
              if (hasMultipleVersions) {
                e.currentTarget.style.background = 'var(--quaternary)';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'color-mix(in srgb, var(--quaternary) 15%, transparent)';
              e.currentTarget.style.color = 'var(--quaternary)';
            }}
            aria-label={`${versionCount} version${versionCount !== 1 ? 's' : ''} available`}
            disabled={!hasMultipleVersions}
          >
            <VersionsIcon className={compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
            <span>{versionCount} ver</span>
          </button>
        )}
        {/* Version picker modal — Radix portals to document.body, safe inside overflow-hidden */}
        {showVersionPicker && hasMultipleVersions && onSelectVersion && (
          <VersionPickerModal
            isOpen={showVersionPicker}
            onClose={() => { modalClosedAtRef.current = Date.now(); setShowVersionPicker(false); }}
            trackTitle={item.trackTitle}
            artistName={song.artistName}
            currentSongId={song.id}
            versions={item.availableVersions}
            coverArt={item.albumSource?.coverArt}
            onSwapVersion={(newSong) => onSelectVersion(item.queueId, newSong)}
          />
        )}
      </div>
  );
}
