'use client';

// QueueChip - Compact card for the queue strip under the bottom player.
// Dense chip design: small art area + text stack + teal FLAC badge.
// Includes a versions button (bottom-right) to open VersionPickerModal.

import { useState, useRef } from 'react';
import { formatDuration } from '@/lib/api';
import RecSourceIcon from '@/components/RecSourceIcon';
import VersionPickerModal, { VersionsIcon } from '@/components/VersionPickerModal';
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
}: QueueChipProps) {
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const modalClosedAtRef = useRef(0);

  const song = item.song;
  const rawVenue = song.showVenue || item.albumSource?.showVenue || '';
  const venueName = rawVenue
    ? rawVenue.replace(/(^|\s)\w/g, c => c.toUpperCase())
    : '';
  const locationStr = song.showLocation || item.albumSource?.showLocation || '';
  const stateAbbr = locationStr.match(/,\s*([A-Z]{2})$/)?.[1] || '';
  const venue = venueName && stateAbbr ? `${venueName}, ${stateAbbr}` : venueName;
  const dateStr = song.showDate || item.albumSource?.showDate || '';
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const formattedDate = dateMatch
    ? `${dateMatch[2]}/${dateMatch[3]}/${dateMatch[1]}`
    : dateStr;

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
          rounded-lg overflow-hidden select-none
          transition-all duration-200 ease-out
          ${compact ? 'w-[200px] pl-[16px] pr-1 py-1.5' : 'w-[293px] pl-[20px] pr-2 py-2'}
          ${isPlayed
            ? 'opacity-40 bg-surface-player-chip'
            : isDragging
              ? 'shadow-[0_8px_24px_rgba(0,0,0,0.5)] scale-[1.03] bg-surface-player-chip-hover'
              : isActive
                ? 'bg-surface-player-chip-hover'
                : 'bg-surface-player-chip hover:bg-surface-player-chip-hover hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
          }
        `}
        style={{
          border: isDragging
            ? '1px solid var(--quinary)'
            : isActive
              ? '1px solid transparent'
              : '1px solid var(--border-subtle-player)',
        }}
      >
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
              : isDragging ? 'var(--quinary)' : undefined,
          }}
        />

        {/* Track number — top-left in the drag grip space */}
        <span className="absolute top-1 left-[4px] font-jb-mono text-[10px] font-medium text-tertiary z-10">
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

          {/* Info stack: title / venue / date / length + type */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className={`${compact ? 'text-[11px]' : 'text-[12.5px]'} font-semibold text-white truncate`} style={{ lineHeight: '1.3' }}>
              {item.trackTitle}
            </p>
            {venue && (
              <p className={`${compact ? 'text-[9px]' : 'text-[10.5px]'} text-tertiary truncate`} style={{ lineHeight: '1.3' }}>
                {venue}
              </p>
            )}
            {!compact && formattedDate && (
              <p className="font-jb-mono text-[10px] text-tertiary" style={{ lineHeight: '1.3' }}>
                {formattedDate}
              </p>
            )}
            <div className="flex items-center gap-1 mt-px">
              {song.duration > 0 && (
                <span className={`font-jb-mono ${compact ? 'text-[9px]' : 'text-[10px]'} text-accent-secondary`}>
                  {formatDuration(song.duration)}
                </span>
              )}
              <RecSourceIcon type={recordingType} lineage={song.lineage} size={compact ? 18 : 18} />
              {/* Versions pill — inline on compact, pushed right */}
              {compact && !isPlayed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasMultipleVersions) setShowVersionPicker(true);
                  }}
                  className={`inline inline-flex items-center gap-[2px] px-0.5 rounded-sm text-[6px] font-jb-mono font-semibold ml-auto transition-all overflow-hidden ${
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

        {/* Drag grip — 2x3 dot grid on left edge, always visible on non-played chips */}
        {!isPlayed && (
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
            className={`absolute top-0.5 right-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-surface-player-deep/80 text-tertiary hover:!text-white hover:!bg-border transition-all z-10 ${
              isActive ? 'opacity-70' : 'opacity-40 group-hover/chip:opacity-100'
            }`}
            aria-label={`Remove ${item.trackTitle}`}
          >
            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
