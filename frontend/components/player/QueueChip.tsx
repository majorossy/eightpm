'use client';

// QueueChip - Compact card for the queue strip under the bottom player.
// Dense chip design: small art area + text stack + teal FLAC badge.
// Includes a versions button (bottom-right) to open VersionPickerModal.

import { useState, useRef } from 'react';
import VersionPickerModal from '@/components/VersionPickerModal';
import { RecordingRow } from '@/components/version-row';
import type { QueueItem } from '@/lib/queueTypes';
import type { ChipGlowType } from '@/lib/chipGlow';
import { glowClassName } from '@/lib/chipGlow';
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
  /** Glow type to apply (swap=purple, play-next=coral, queued=gold), null=none */
  glowType?: ChipGlowType | null;
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
  glowType,
}: QueueChipProps) {
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const modalClosedAtRef = useRef(0);

  const song = item.song;

  const versionCount = item.availableVersions.length;
  const hasMultipleVersions = versionCount > 1;

  return (
      <div
        data-queue-id={item.queueId}
        data-queue-active={isActive || undefined}
        onClick={() => {
          // Guard against click pass-through from Radix Dialog overlay close
          if (Date.now() - modalClosedAtRef.current < 300) return;
          onPlay(absoluteIndex);
        }}
        className={`
          group/chip relative flex flex-shrink-0 ${inSortable ? '' : 'cursor-pointer'}
          rounded-lg select-none ${isActive && !isPlayed || glowType ? 'overflow-visible' : 'overflow-hidden'}
          transition-all duration-200 ease-out ${glowType ? glowClassName(glowType) : ''}
          ${compact ? 'w-[230px] pl-[16px] pr-1 py-1.5' : 'w-[337px] pl-[20px] pr-2 py-2'}
          ${isPlayed
            ? 'opacity-40 bg-surface-player-chip'
            : isDragging
              ? 'shadow-[0_8px_24px_rgba(0,0,0,0.5)] scale-[1.03]'
              : isActive
                ? 'bg-surface-player-chip-hover queue-chip-now-playing'
                : 'bg-surface-player-chip hover:bg-surface-player-chip-hover hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
          }
        `}
        style={{
          border: isDragging
            ? '2px dashed color-mix(in srgb, var(--quinary) 70%, transparent)'
            : isActive
              ? '1px solid var(--secondary)'
              : '1px solid var(--border-subtle-player)',
          ...(isDragging ? { background: 'color-mix(in srgb, var(--quinary) 15%, var(--player-surface-chip))' } : {}),
          ...(isActive && !isPlayed ? { zIndex: 2 } : {}),
        }}
      >
        {/* NOW PLAYING indicator — coral pill tag */}
        {isActive && !isPlayed && (
          <div
            className="absolute -top-[13px] left-2 z-20 flex items-center px-2.5 h-[20px] rounded-full select-none pointer-events-none"
            style={{
              background: 'var(--secondary)',
            }}
          >
            <span className="text-[9px] font-jb-mono font-semibold uppercase tracking-[0.12em] leading-none text-white whitespace-nowrap">Now Playing</span>
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
              ? 'color-mix(in srgb, var(--senary) 40%, transparent)'
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

        {/* Card content: RecordingRow */}
        <div className="flex-1 min-w-0 flex items-center">
          <RecordingRow
            song={song}
            size={compact ? 'sm' : 'md'}
            trackNumber={item.albumSource ? (item.albumSource.originalTrackIndex ?? 0) + 1 : chipIndex}
            showLocation={!compact}
            showTaper={!compact}
            showDownloads={!compact}
            downloadFormat="compact"
            actions={compact && hasMultipleVersions && !isPlayed ? ['swap'] : undefined}
            onSwap={compact && hasMultipleVersions && !isPlayed
              ? () => setShowVersionPicker(true)
              : undefined
            }
            isPlaying={isActive && !isPlayed}
            className="flex-1 min-w-0"
          />
        </div>

        {/* Drag grip — 2x3 dot grid on left edge, hidden when active (EQ bars replace it) */}
        {!isPlayed && !isActive && (
          <div className="absolute top-1/2 left-[5px] -translate-y-1/2 grid grid-cols-2 gap-[3px] opacity-30 group-hover/chip:opacity-50 transition-opacity">
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--quinary)]" />
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--quinary)]" />
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--quinary)]" />
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--quinary)]" />
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--quinary)]" />
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--quinary)]" />
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

        {/* Swap button — bottom-right (desktop only) */}
        {!isPlayed && !compact && hasMultipleVersions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowVersionPicker(true);
            }}
            className="absolute bottom-1 right-1 z-10"
            style={{
              fontFamily: 'var(--font-jb-mono), monospace',
              fontSize: '9px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '5px',
              letterSpacing: '0.04em',
              transition: 'all 0.15s',
              lineHeight: 1,
              cursor: 'pointer',
              color: '#c0a8e0',
              background: 'rgba(160,130,200,0.14)',
              border: '1px solid rgba(160,130,200,0.25)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(160,130,200,0.24)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(160,130,200,0.14)'; }}
            aria-label="Swap version"
          >
            swap
          </button>
        )}
        {/* Version picker modal — Radix portals to document.body, safe inside overflow-hidden */}
        {showVersionPicker && hasMultipleVersions && onSelectVersion && (
          <VersionPickerModal
            isOpen={showVersionPicker}
            onClose={() => { modalClosedAtRef.current = Date.now(); setShowVersionPicker(false); }}
            trackTitle={item.trackTitle}
            trackNumber={item.albumSource ? (item.albumSource.originalTrackIndex ?? 0) + 1 : null}
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
