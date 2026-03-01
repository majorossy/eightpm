'use client';

// QueueChip - Compact card for the queue strip under the bottom player.
// Dense chip design: small art area + text stack + teal FLAC badge.
// Includes a versions button (bottom-right) to open VersionPickerModal.

import { useState, useRef } from 'react';
import { formatDuration } from '@/lib/api';
import { getRecTypeBadgeConfig } from '@/lib/recTypeUtils';
import VersionPickerModal, { VersionsIcon } from '@/components/VersionPickerModal';
import CassetteTape from '@/components/CassetteTape';
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
}: QueueChipProps) {
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const modalClosedAtRef = useRef(0);

  const song = item.song;
  const rawVenue = song.showVenue || item.albumSource?.showVenue || '';
  const venueName = rawVenue
    ? rawVenue.replace(/\b\w/g, c => c.toUpperCase())
    : '';
  const locationStr = song.showLocation || item.albumSource?.showLocation || '';
  const stateAbbr = locationStr.match(/,\s*([A-Z]{2})$/)?.[1] || '';
  const venue = venueName && stateAbbr ? `${venueName}, ${stateAbbr}` : venueName;
  const dateStr = song.showDate || item.albumSource?.showDate || '';
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const formattedDate = dateMatch
    ? `${dateMatch[2]}.${dateMatch[3]}.${dateMatch[1]}`
    : dateStr;

  const recBadge = getRecTypeBadgeConfig(song.recordingType);

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
          w-[293px] pl-[20px] pr-2 py-2
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

        {/* Card content: track number + jewel case + info */}
        <div className="flex gap-[9px] min-w-0 items-center">
          {/* Track number */}
          <span className="font-jb-mono text-[11px] font-medium text-tertiary w-[14px] text-center flex-shrink-0">
            {item.albumSource ? (item.albumSource.originalTrackIndex ?? 0) + 1 : chipIndex}
          </span>
          {/* Jewel case album art */}
          <div className="relative flex-shrink-0">
            <CassetteTape coverArt={item.albumSource?.coverArt} label={item.song.artistName} size={48} />
          </div>

          {/* Info stack: title / venue / date / length + type */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-[12.5px] font-semibold text-white truncate" style={{ lineHeight: '1.3' }}>
              {item.trackTitle}
            </p>
            {venue && (
              <p className="text-[10.5px] text-tertiary truncate" style={{ lineHeight: '1.3' }}>
                {venue}
              </p>
            )}
            {formattedDate && (
              <p className="font-jb-mono text-[10px] text-tertiary" style={{ lineHeight: '1.3' }}>
                {formattedDate}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-px">
              {song.duration > 0 && (
                <span className="font-jb-mono text-[10px] text-accent-secondary">
                  {formatDuration(song.duration)}
                </span>
              )}
              <span
                className="font-jb-mono text-[8.5px] font-semibold px-[5px] py-px rounded-[2px] leading-[14px]"
                style={{
                  color: recBadge.color,
                  background: recBadge.bg,
                  border: `1px solid ${recBadge.border}`,
                }}
                title={recBadge.title}
              >
                {recBadge.label}
              </span>
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

        {/* Versions button — bottom-right, hover-reveal lavender pill */}
        {!isPlayed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasMultipleVersions) setShowVersionPicker(true);
            }}
            className={`absolute bottom-1 right-1 flex items-center gap-[3px] px-1.5 py-[2px] rounded-[4px] transition-all z-10 font-jb-mono text-[8px] font-semibold ${
              hasMultipleVersions
                ? 'cursor-pointer opacity-0 group-hover/chip:opacity-100'
                : 'cursor-default opacity-0 group-hover/chip:opacity-40'
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
            <VersionsIcon className="w-2.5 h-2.5" />
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
            preferredQuality={preferredQuality}
          />
        )}
      </div>
  );
}
