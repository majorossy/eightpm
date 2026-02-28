'use client';

// QueueChip - Compact card for the queue strip under the bottom player.
// Dense chip design: small art area + text stack + teal FLAC badge.

import Image from 'next/image';
import { formatDuration } from '@/lib/api';
import { getQualityLabel, getEffectiveQuality } from '@/lib/qualityUtils';
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
}

export default function QueueChip({
  item,
  chipIndex,
  onPlay,
  onRemove,
  preferredQuality = 'medium',
  absoluteIndex,
  isDragging,
  isActive,
  isPlayed,
}: QueueChipProps) {
  const song = item.song;
  const venue = song.showVenue;
  const subtitle = venue
    ? venue + (song.showDate ? ` · ${song.showDate}` : '')
    : song.artistName;

  const effectiveQuality = getEffectiveQuality(song, preferredQuality);
  const qualityLabel = getQualityLabel(effectiveQuality);

  return (
    <div
      onClick={() => onPlay(absoluteIndex)}
      className={`
        group/chip relative flex flex-shrink-0 cursor-pointer
        rounded-lg overflow-hidden select-none
        transition-all duration-200 ease-out
        w-[194px] pl-[20px] pr-2 py-2
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
        border: isPlayed
          ? '1px solid var(--border-subtle-player)'
          : isActive || isDragging
            ? '1px solid var(--quinary)'
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
            : isDragging || isActive ? 'var(--quinary)' : undefined,
        }}
      />

      {/* Card content: art + info */}
      <div className="flex gap-[9px] min-w-0">
        {/* Art area — 48x48 with cover art or vinyl fallback */}
        <div
          className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--player-surface-chip-hover), var(--player-surface-deep))',
          }}
        >
          {item.albumSource?.coverArt ? (
            <Image
              src={item.albumSource.coverArt}
              alt=""
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" />
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
            </svg>
          )}

          {/* Track number overlay */}
          <span className="absolute top-0.5 left-1 font-jb-mono text-[9px] font-semibold text-accent-secondary opacity-60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {chipIndex}
          </span>
        </div>

        {/* Info stack */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-[12.5px] font-semibold text-white truncate" style={{ lineHeight: '1.3' }}>
            {item.trackTitle}
          </p>
          <p className="text-[10.5px] text-tertiary truncate" style={{ lineHeight: '1.3' }}>
            {subtitle}
          </p>
          {/* Meta row: duration + quality badge */}
          <div className="flex items-center gap-1 mt-px">
            {song.duration > 0 && (
              <span className="font-jb-mono text-[10px] text-accent-secondary">
                {formatDuration(song.duration)}
              </span>
            )}
            <span
              className="font-jb-mono text-[8.5px] font-semibold px-[5px] py-px rounded-[2px] text-accent-secondary leading-[14px]"
              style={{
                background: 'color-mix(in srgb, var(--accent-secondary) 20%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-secondary) 15%, transparent)',
              }}
            >
              {qualityLabel}
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
            isActive ? 'opacity-70' : 'opacity-0 group-hover/chip:opacity-100'
          }`}
          aria-label={`Remove ${item.trackTitle}`}
        >
          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
