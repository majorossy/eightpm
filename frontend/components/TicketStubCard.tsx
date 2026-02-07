'use client';

// TicketStubCard - Flip card styled as a concert ticket stub
// Used in all 3 queue locations: bottom player chips, left drawer queue, full-screen mobile queue

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { formatDuration } from '@/lib/api';
import { formatLineage, getRecordingBadge } from '@/lib/lineageUtils';
import type { QueueItem } from '@/lib/queueTypes';
import type { Song } from '@/lib/types';

export type TicketStubVariant = 'horizontal' | 'vertical-compact' | 'vertical';

export interface TicketStubCardProps {
  item: QueueItem;
  index: number;
  absoluteIndex: number;
  onPlay: (index: number) => void;
  onSelectVersion?: (queueId: string, song: Song) => void;
  onRemove?: (queueId: string) => void;
  variant: TicketStubVariant;
  dragHandleRef?: React.Ref<HTMLButtonElement>;
  dragHandleProps?: Record<string, unknown>;
}

export default function TicketStubCard({
  item,
  index,
  absoluteIndex,
  onPlay,
  onSelectVersion,
  onRemove,
  variant,
  dragHandleRef,
  dragHandleProps,
}: TicketStubCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const song = item.song;
  const versions = item.availableVersions;
  const hasVersions = !item.played && versions.length > 1 && !!onSelectVersion;
  const vIdx = versions.findIndex((v) => v.id === song.id);
  const badge = getRecordingBadge(song.lineage, song.recordingType);

  const year = song.showDate?.split('-')[0] || '\u2014';
  let formattedDate = song.showDate || null;
  if (formattedDate && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = formattedDate.split('-');
    formattedDate = `${m}/${d}/${y.slice(-2)}`;
  }

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasVersions || vIdx <= 0) return;
      onSelectVersion!(item.queueId, versions[vIdx - 1]);
    },
    [hasVersions, vIdx, onSelectVersion, item.queueId, versions],
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasVersions || vIdx >= versions.length - 1) return;
      onSelectVersion!(item.queueId, versions[vIdx + 1]);
    },
    [hasVersions, vIdx, onSelectVersion, item.queueId, versions],
  );

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPlay(absoluteIndex);
    },
    [onPlay, absoluteIndex],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.(item.queueId);
    },
    [onRemove, item.queueId],
  );

  // Variant-specific dimensions and styles
  const isHorizontal = variant === 'horizontal';
  const isCompact = variant === 'vertical-compact';

  // Horizontal variant (bottom player chips): compact by default, expand when flipped
  const cardClass = isHorizontal
    ? isFlipped
      ? 'w-[200px] h-[130px] flex-shrink-0'
      : 'w-[200px] h-[80px] flex-shrink-0'
    : 'w-full';

  // Vertical variant expands when flipped
  const innerHeight = isHorizontal
    ? isFlipped
      ? 'h-[130px]'
      : 'h-[80px]'
    : isCompact
      ? 'min-h-[80px]'
      : isFlipped
        ? 'min-h-[90px]'
        : 'min-h-[60px]';

  return (
    <div className={`${cardClass} [perspective:600px]`}>
      <div
        onClick={handleFlip}
        className={`relative ${innerHeight} w-full cursor-pointer transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* FRONT FACE */}
        <div className={`absolute inset-0 [backface-visibility:hidden] rounded-lg overflow-hidden border border-white/5 bg-[#252220]`}>
          <div className="flex h-full">
            {/* Drag handle (vertical variants only) */}
            {!isHorizontal && dragHandleRef && (
              <button
                ref={dragHandleRef}
                {...(dragHandleProps || {})}
                className="flex-shrink-0 w-6 flex items-center justify-center text-[#3a3632] hover:text-[#8a8478] cursor-grab active:cursor-grabbing touch-none"
                aria-label={`Reorder ${item.trackTitle}`}
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5" cy="3" r="1.5" />
                  <circle cx="11" cy="3" r="1.5" />
                  <circle cx="5" cy="8" r="1.5" />
                  <circle cx="11" cy="8" r="1.5" />
                  <circle cx="5" cy="13" r="1.5" />
                  <circle cx="11" cy="13" r="1.5" />
                </svg>
              </button>
            )}

            {/* Main ticket body */}
            <div className="flex-1 min-w-0 flex flex-col justify-between p-2">
              {/* Top row: track number + art + title */}
              <div className="flex items-start gap-2">
                <span className={`font-mono text-[#6a6458] flex-shrink-0 leading-none ${isHorizontal ? 'text-[10px] mt-0.5' : isCompact ? 'text-xs' : 'text-sm'}`}>
                  {index}
                </span>
                {/* Album art */}
                <div className={`flex-shrink-0 rounded overflow-hidden ${isHorizontal ? 'w-7 h-7' : isCompact ? 'w-8 h-8' : 'w-10 h-10'}`}>
                  {item.albumSource?.coverArt ? (
                    <Image
                      src={item.albumSource.coverArt}
                      alt=""
                      width={isHorizontal ? 28 : isCompact ? 32 : 40}
                      height={isHorizontal ? 28 : isCompact ? 32 : 40}
                      quality={60}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2d2a26] flex items-center justify-center">
                      <svg className={`${isHorizontal ? 'w-3 h-3' : 'w-4 h-4'} text-[#3a3632]`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Title + venue */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-white truncate ${isHorizontal ? 'text-[11px]' : isCompact ? 'text-xs' : 'text-sm'}`}>
                    {item.trackTitle}
                  </p>
                  <p className={`font-mono text-[#8a8478] truncate ${isHorizontal ? 'text-[9px]' : 'text-[10px]'}`}>
                    {song.showVenue ? `${song.showVenue}` : song.artistName}
                    {song.showVenue && year !== '\u2014' ? ` \u00b7 ${year}` : ''}
                  </p>
                </div>
              </div>

              {/* Bottom row: duration + badge + flip hint */}
              <div className="flex items-center gap-2 mt-auto">
                {song.duration > 0 && (
                  <span className={`font-mono text-[#6a6458] ${isHorizontal ? 'text-[9px]' : 'text-[10px]'}`}>
                    {formatDuration(song.duration)}
                  </span>
                )}
                {badge && badge.show && (
                  <span
                    className="px-1 py-0.5 text-[7px] font-bold rounded uppercase tracking-wider leading-none"
                    style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
                  >
                    {badge.text}
                  </span>
                )}
                <span className={`text-[#5a5650] ml-auto ${isHorizontal ? 'text-[8px]' : 'text-[9px]'}`}>
                  FLIP
                </span>
              </div>
            </div>

            {/* Dashed separator + stub */}
            {hasVersions && (
              <>
                <div className="w-px border-l border-dashed border-[#d4a060]/20 self-stretch my-2" />
                <div className={`flex-shrink-0 flex flex-col items-center justify-center ${isHorizontal ? 'w-8' : 'w-10'} bg-[#2d2a26]/50`}>
                  <span className={`text-[#d4a060] font-bold font-mono leading-none ${isHorizontal ? 'text-sm' : 'text-base'}`}>
                    {versions.length}
                  </span>
                  <span className="text-[7px] text-[#8a8478] uppercase tracking-wider mt-0.5">VER</span>
                </div>
              </>
            )}

            {/* Remove button (vertical variants) */}
            {!isHorizontal && onRemove && (
              <button
                onClick={handleRemove}
                className="flex-shrink-0 w-6 flex items-center justify-center text-[#3a3632] hover:text-[#8a8478] transition-colors"
                aria-label={`Remove ${item.trackTitle} from queue`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* BACK FACE */}
        <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg overflow-hidden border border-[#d4a060]/15 bg-[#1c1a17]`}>
          <div className="flex flex-col h-full">
            {/* Version header */}
            <div className={`flex items-center gap-2 bg-[#252220] border-b border-[#3a3632]/40 ${isHorizontal ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
              {hasVersions && (
                <button
                  onClick={handlePrev}
                  disabled={vIdx <= 0}
                  className="text-[#8a8478] hover:text-[#d4a060] disabled:opacity-20 disabled:text-[#3a3632] transition-colors flex-shrink-0"
                  aria-label="Previous version"
                >
                  <svg className={`${isHorizontal ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <span className={`font-mono font-bold text-[#d4a060] tracking-wider ${isHorizontal ? 'text-[9px]' : 'text-[10px]'}`}>
                VERSION {vIdx + 1} / {versions.length}
              </span>
              {hasVersions && (
                <button
                  onClick={handleNext}
                  disabled={vIdx >= versions.length - 1}
                  className="text-[#8a8478] hover:text-[#d4a060] disabled:opacity-20 disabled:text-[#3a3632] transition-colors flex-shrink-0"
                  aria-label="Next version"
                >
                  <svg className={`${isHorizontal ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Key/value rows */}
            <div className={`flex-1 overflow-hidden ${isHorizontal ? 'px-2 py-1 text-[8px]' : isCompact ? 'px-2.5 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]'} space-y-0.5`}>
              <BackRow label="Year" value={year} isHorizontal={isHorizontal} />
              <BackRow label="Venue" value={song.showVenue} truncLen={isHorizontal ? 16 : isCompact ? 22 : 28} isHorizontal={isHorizontal} />
              <BackRow label="Date" value={formattedDate} isHorizontal={isHorizontal} />
              {!isHorizontal && <BackRow label="Taper" value={song.taper} truncLen={isCompact ? 18 : 24} isHorizontal={false} />}
              <BackRow label="Source" value={song.source} truncLen={isHorizontal ? 14 : isCompact ? 20 : 30} isHorizontal={isHorizontal} />
              {!isHorizontal && song.lineage && (
                <div className="flex justify-between gap-1">
                  <span className="text-[#d4a060] flex-shrink-0">Lineage</span>
                  <span className="text-[#6a6458] font-mono truncate text-right" title={song.lineage}>
                    {formatLineage(song.lineage, isCompact ? 20 : 30)}
                  </span>
                </div>
              )}
            </div>

            {/* Play button */}
            <div className={`${isHorizontal ? 'px-2 pb-1.5' : 'px-3 pb-2'}`}>
              <button
                onClick={handlePlay}
                className={`w-full bg-[#d4a060] hover:bg-[#c08a40] text-[#1c1a17] rounded-md font-bold uppercase tracking-wider transition-colors ${
                  isHorizontal ? 'py-1 text-[8px]' : 'py-1.5 text-[10px]'
                }`}
              >
                Play This Version
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Key/value row for the back face
function BackRow({
  label,
  value,
  truncLen,
  isHorizontal,
}: {
  label: string;
  value?: string | null;
  truncLen?: number;
  isHorizontal: boolean;
}) {
  if (!value) return null;
  const display = truncLen && value.length > truncLen ? value.slice(0, truncLen) + '\u2026' : value;
  return (
    <div className="flex justify-between gap-1">
      <span className="text-[#d4a060] flex-shrink-0">{label}</span>
      <span className={`${isHorizontal ? 'text-[#8a8478]' : 'text-[#a89a8c]'} truncate text-right`} title={value}>
        {display}
      </span>
    </div>
  );
}
