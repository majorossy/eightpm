'use client';

import { useState } from 'react';
import Image from 'next/image';
import { QualityPopup, getQualityBadge } from '@/components/player/QualityPopup';
import { formatLineage } from '@/lib/lineageUtils';
import RecSourceIcon from '@/components/RecSourceIcon';
import type { QueueItem } from '@/lib/queueTypes';
import type { AudioQuality } from '@/lib/types';
import QueueAccordion from '@/components/player/QueueAccordion';
import { RecordingRow } from '@/components/version-row';
import { computeSignalInfo } from '@/lib/signalUtils';
import SignalStrengthIcon from '@/components/player/SignalStrengthIcon';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}

interface MobileMiniPlayerProps {
  currentSong: {
    id: string;
    title: string;
    artistName: string;
    lineage?: string;
    qualityUrls?: Record<string, string>;
    streamUrl: string;
  };
  currentItem: QueueItem | null;
  isPlaying: boolean;
  isBuffering: boolean;
  progress: number;
  bufferedPercent: number;
  reducedMotion: boolean;
  isPulsing: boolean;
  imageLoaded: boolean;
  onImageLoad: () => void;
  // Quality
  preferredQuality: AudioQuality;
  showQualityPopup: boolean;
  onToggleQualityPopup: () => void;
  onSelectQuality: (quality: AudioQuality) => void;
  onCloseQualityPopup: () => void;
  qualityPopupRef: React.RefObject<HTMLDivElement>;
  // Actions
  onExpandPlayer: () => void;
  onTogglePlay: () => void;
  onMinimize: () => void;
  // Swipe
  swipeHandlers: SwipeHandlers;
  // Streaming stats
  streamingStats: {
    networkType: string | null;
    downlinkMbps: number | null;
    bufferedAhead: number;
    bufferedPercent: number;
    isLoading: boolean;
    isOnline: boolean;
  };
  // Announcement
  announcement: string;
  // Queue strip
  queueChips: { item: QueueItem; absoluteIndex: number; isPlayed: boolean; isCurrent: boolean }[];
  totalUpcoming: number;
  onChipPlay: (index: number) => void;
  onRemoveItem: (id: string) => void;
  onRemoveBatch: (batchId: string) => void;
  onSelectVersion: (itemId: string, song: import('@/lib/types').Song) => void;
  chipGlow?: import('@/lib/chipGlow').ChipGlow;
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onDetachItem: (queueId: string, targetIndex: number) => void;
  onRestoreFromHistory: (queueId: string, targetIndex: number) => void;
}

export default function MobileMiniPlayer({
  currentSong,
  currentItem,
  isPlaying,
  isBuffering,
  progress,
  bufferedPercent,
  reducedMotion,
  isPulsing,
  imageLoaded,
  onImageLoad,
  preferredQuality,
  showQualityPopup,
  onToggleQualityPopup,
  onSelectQuality,
  onCloseQualityPopup,
  qualityPopupRef,
  onExpandPlayer,
  onTogglePlay,
  onMinimize,
  streamingStats,
  swipeHandlers,
  announcement,
  queueChips,
  totalUpcoming,
  onChipPlay,
  onRemoveItem,
  onRemoveBatch,
  onSelectVersion,
  chipGlow,
  onMoveItem,
  onDetachItem,
  onRestoreFromHistory,
}: MobileMiniPlayerProps) {
  const [queueStripOpen, setQueueStripOpen] = useState(true);
  const qualityInfo = getQualityBadge(preferredQuality);
  const recordingType = currentItem?.song?.recordingType;

  return (
    <>
      {/* ARIA Live Region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div id="bottom-player-bar" className="fixed left-0 right-0 z-[40]" style={{ bottom: 'calc(50px + env(safe-area-inset-bottom, 0px))' }}>
        <div className={`border-t border-accent/20 bg-surface-card ${reducedMotion ? 'reduce-motion' : ''}`}>
          {/* Mini player card with swipe gesture */}
          <div
            onTouchStart={swipeHandlers.onTouchStart}
            onTouchMove={swipeHandlers.onTouchMove}
            onTouchEnd={swipeHandlers.onTouchEnd}
            className={`overflow-hidden mini-player touch-action-pan-y prevent-overscroll ${
              isPulsing && !reducedMotion ? 'pulse-glow' : ''
            } ${swipeHandlers.isDragging ? 'dragging' : ''}`}
            style={{
              transform: swipeHandlers.isDragging
                ? `translateY(${Math.min(0, swipeHandlers.dragOffset.y)}px)`
                : undefined,
              willChange: swipeHandlers.isDragging ? 'transform' : 'auto',
              background: 'transparent',
              boxShadow: 'none',
              borderRadius: 0,
            }}
          >
            {/* Drag hint pill */}
            <div className="drag-hint" />

            {/* Progress bar */}
            <div className="h-[2px] bg-border relative">
              {/* Buffer bar */}
              <div
                className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-300"
                style={{ width: `${bufferedPercent}%` }}
              />
              <div
                className={`h-full bg-white relative z-[1] transition-all duration-150 ${isBuffering ? 'animate-pulse' : ''}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center p-2 gap-3">
              {/* Tappable area to expand */}
              <button
                onClick={onExpandPlayer}
                className="flex items-center gap-3 flex-1 min-w-0 text-left btn-touch"
                aria-label="Expand player"
              >
                {/* Album art */}
                <div className="w-10 h-10 bg-surface-elevated flex-shrink-0 rounded relative">
                  {currentItem?.albumSource?.coverArt ? (
                    <Image
                      src={currentItem.albumSource.coverArt}
                      alt={currentItem?.albumSource?.albumName || 'Album cover'}
                      width={40}
                      height={40}
                      quality={80}
                      onLoad={onImageLoad}
                      className={`w-full h-full object-cover rounded transition-opacity duration-300 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-border" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Title/Artist + Metadata */}
                <div className="flex-1 min-w-0">
                  {currentItem?.song ? (
                    <RecordingRow
                      song={currentItem.song}
                      size="sm"
                      trackNumber={currentItem?.albumSource ? (currentItem.albumSource.originalTrackIndex ?? 0) + 1 : undefined}
                      showMediumIcon={false}
                      showLocation={false}
                      showTaper={false}
                      showDownloads={false}
                      showBadges={false}
                    />
                  ) : (
                    <>
                      <p className="text-sm text-white font-medium truncate">
                        {currentSong.title}
                      </p>
                      <p className="text-xs text-white/70 truncate">{currentSong.artistName}</p>
                    </>
                  )}
                </div>
              </button>

              {/* Quality badge - clickable, positioned after song info */}
              <div className="relative flex-shrink-0" ref={qualityPopupRef}>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onToggleQualityPopup();
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-surface-card/90 border border-default rounded-md hover:border-accent transition-colors active:scale-95"
                    aria-label="Change audio quality"
                    type="button"
                  >
                    <RecSourceIcon type={recordingType} lineage={currentSong?.lineage} size={20} />
                  </button>

                  {/* Source + signal icon */}
                  <span className="flex items-center gap-1">
                    <span
                      className="text-[9px] text-tertiary italic leading-tight truncate max-w-[100px]"
                      title={currentSong?.lineage || 'Source not specified'}
                    >
                      {formatLineage(currentSong?.lineage, 30)}
                    </span>
                    <SignalStrengthIcon
                      size={14}
                      {...computeSignalInfo(
                        streamingStats.networkType,
                        streamingStats.downlinkMbps,
                        streamingStats.bufferedAhead,
                        streamingStats.isOnline,
                      )}
                      streamingStats={streamingStats}
                    />
                  </span>
                </div>

                {/* Quality popup menu */}
                {showQualityPopup && (
                  <QualityPopup
                    preferredQuality={preferredQuality}
                    onSelect={onSelectQuality}
                    onClose={onCloseQualityPopup}
                    position="fixed"
                    style={{ bottom: '160px', right: 'calc(8px + env(safe-area-inset-right, 0px))' }}
                    className="z-[60]"
                    availableQualities={currentSong?.qualityUrls}
                  />
                )}
              </div>

              {/* Play/Pause button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                className="w-10 h-10 flex items-center justify-center text-white flex-shrink-0 btn-touch btn-ripple"
                aria-label={isBuffering ? 'Buffering' : isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering ? (
                  <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Dismiss button — three-cycle: close queue → minimize player */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (queueStripOpen && queueChips.length > 0) {
                    setQueueStripOpen(false);
                  } else {
                    onMinimize();
                  }
                }}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 flex-shrink-0 transition-colors"
                aria-label={queueStripOpen && queueChips.length > 0 ? 'Close queue' : 'Hide player'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Queue strip — compact accordion album groups */}
          {queueStripOpen && queueChips.length > 0 && (
            <div style={{ background: 'var(--player-surface-queue)' }}>
              <div className="px-3 pb-2">
                <QueueAccordion
                  queueChips={queueChips}
                  totalUpcoming={totalUpcoming}
                  playedCount={queueChips.filter(c => c.isPlayed).length}
                  onChipPlay={onChipPlay}
                  onRemoveItem={onRemoveItem}
                  onRemoveBatch={onRemoveBatch}
                  onSelectVersion={onSelectVersion}
                  onMoveItem={onMoveItem}
                  onDetachItem={onDetachItem}
                  onRestoreFromHistory={onRestoreFromHistory}
                  preferredQuality={preferredQuality}
                  compact
                  chipGlow={chipGlow}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
