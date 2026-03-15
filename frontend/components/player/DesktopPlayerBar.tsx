'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { formatDuration } from '@/lib/api';
import { formatLineage } from '@/lib/lineageUtils';
import RecSourceIcon from '@/components/RecSourceIcon';
import { RecordingRow } from '@/components/version-row';
import { getQualityBadge } from '@/components/player/QualityPopup';
import { QualityPopup } from '@/components/player/QualityPopup';
import ShareButton from '@/components/ShareButton';
import DownloadButton from '@/components/DownloadButton';
import QueuePreview from '@/components/QueuePreview';
import type { QueueItem } from '@/lib/queueTypes';
import QueueAccordion from '@/components/player/QueueAccordion';
import type { AudioQuality } from '@/lib/types';
import { computeSignalInfo } from '@/lib/signalUtils';
import SignalStrengthIcon from '@/components/player/SignalStrengthIcon';

interface StreamingStats {
  bufferedPercent: number;
  networkType: string | null;
  downlinkMbps: number | null;
  bufferedAhead: number;
  isLoading: boolean;
  isOnline: boolean;
}

interface DesktopPlayerBarProps {
  currentSong: {
    id: string;
    title: string;
    artistName: string;
    lineage?: string;
    recordingType?: string;
    showVenue?: string;
    showDate?: string;
    streamUrl: string;
    archiveDetailUrl?: string;
    qualityUrls?: Record<string, string>;
  };
  currentItem: QueueItem | null;
  isPlaying: boolean;
  isBuffering: boolean;
  isPlayerMinimized: boolean;
  reducedMotion: boolean;
  // Transport
  currentTime: number;
  duration: number;
  volume: number;
  isIOS: boolean;
  isFirstItem: boolean;
  isLastItem: boolean;
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onSetVolume: (v: number) => void;
  onSeek: (t: number) => void;
  // Image
  imageLoaded: boolean;
  onImageLoad: () => void;
  // Quality
  preferredQuality: AudioQuality;
  showQualityPopup: boolean;
  onToggleQualityPopup: () => void;
  onSelectQuality: (quality: AudioQuality) => void;
  onCloseQualityPopup: () => void;
  qualityPopupRef: React.RefObject<HTMLDivElement>;
  // Queue
  isQueueOpen: boolean;
  onToggleQueue: () => void;
  showQueuePreview: boolean;
  onSetShowQueuePreview: (show: boolean) => void;
  queuePreviewTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  // Queue strip
  queueChips: { item: QueueItem; absoluteIndex: number; isPlayed: boolean; isCurrent: boolean }[];
  totalUpcoming: number;
  onChipPlay: (index: number) => void;
  onRemoveItem: (queueId: string) => void;
  onRemoveBatch: (batchId: string) => void;
  onSelectVersion: (queueId: string, song: any) => void;
  chipGlow?: import('@/lib/chipGlow').ChipGlow;
  onMoveItem: (from: number, to: number) => void;
  onDetachItem: (queueId: string, targetIndex: number) => void;
  onRestoreFromHistory: (queueId: string, targetIndex: number) => void;
  // Wishlist
  isInWishlist: (id: string) => boolean;
  wishlistItems: { id: string; song: { id: string } }[];
  onAddToWishlist: (song: any) => void;
  onRemoveFromWishlist: (id: string) => void;
  // Minimize
  onMinimize: () => void;
  // Streaming stats
  streamingStats: StreamingStats;
  // Announcement
  announcement: string;
}

export default function DesktopPlayerBar(props: DesktopPlayerBarProps) {
  const {
    currentSong,
    currentItem,
    isPlaying,
    isBuffering,
    isPlayerMinimized,
    reducedMotion,
    currentTime,
    duration,
    volume,
    isIOS,
    isFirstItem,
    isLastItem,
    onTogglePlay,
    onPlayNext,
    onPlayPrev,
    onSetVolume,
    onSeek,
    imageLoaded,
    onImageLoad,
    preferredQuality,
    showQualityPopup,
    onToggleQualityPopup,
    onSelectQuality,
    onCloseQualityPopup,
    qualityPopupRef,
    isQueueOpen,
    onToggleQueue,
    showQueuePreview,
    onSetShowQueuePreview,
    queuePreviewTimeoutRef,
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
    isInWishlist,
    wishlistItems,
    onAddToWishlist,
    onRemoveFromWishlist,
    onMinimize,
    streamingStats,
    announcement,
  } = props;

  const [queueStripOpen, setQueueStripOpen] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('8pm_queue_strip') !== 'false'
      : true
  );
  const [summaryDismissed, setSummaryDismissed] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const recordingType = currentSong.recordingType;
  const qualityInfo = getQualityBadge(preferredQuality);

  const playedCount = useMemo(() => queueChips.filter(c => c.isPlayed).length, [queueChips]);

  return (
    <div
      id="bottom-player-bar"
      className="fixed left-0 right-0 z-[40] bg-surface-player-deep player-glow-line"
      style={{
        bottom: 'calc(50px + env(safe-area-inset-bottom, 0px))',
        borderTop: isPlayerMinimized ? 'none' : '1px solid color-mix(in srgb, var(--border-default) 19%, transparent)',
        boxShadow: isPlayerMinimized ? 'none' : '0 -8px 40px color-mix(in srgb, black 40%, transparent)',
        transform: isPlayerMinimized ? 'translateY(100%)' : 'none',
        transition: reducedMotion ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'visible',
      }}
    >
      {/* Pull-tab — 3 states: open (▼), minimized+summary (▲ + song + X), minimized+dismissed (▲) */}
      {isPlayerMinimized && !summaryDismissed ? (
        <button
          onClick={onMinimize}
          className="absolute -top-7 left-4 h-7 rounded-t-lg
                     flex items-center gap-2 px-2.5 z-50 pointer-events-auto
                     transition-all"
          style={{
            backgroundColor: 'var(--secondary)',
            color: 'white',
            borderBottom: 'none',
          }}
          aria-label="Restore player"
          title="Restore player (M)"
        >
          <svg className="w-3 h-3 rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-[11px] font-medium truncate max-w-[200px] leading-none">
            {currentSong.title} — {currentSong.artistName}
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setSummaryDismissed(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); setSummaryDismissed(true); } }}
            className="flex-shrink-0 ml-0.5 rounded-full hover:bg-white/20 p-0.5 transition-colors"
            aria-label="Dismiss song summary"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        </button>
      ) : (
        <div className="absolute -top-7 left-4 flex items-stretch z-50 pointer-events-auto">
          <button
            onClick={onMinimize}
            className="w-8 h-7 rounded-t-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--secondary)',
              color: 'white',
              borderBottom: 'none',
              borderTopRightRadius: isPlayerMinimized && summaryDismissed ? 0 : undefined,
            }}
            aria-label={isPlayerMinimized ? 'Restore player' : 'Minimize player'}
            title={isPlayerMinimized ? 'Restore player (M)' : 'Minimize player (M)'}
          >
            <svg className={`w-3 h-3 transition-transform ${isPlayerMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isPlayerMinimized && summaryDismissed && (
            <button
              onClick={() => setSummaryDismissed(false)}
              className="h-7 px-1.5 flex items-center justify-center rounded-tr-lg transition-colors hover:brightness-110"
              style={{
                backgroundColor: 'var(--secondary)',
                color: 'white',
                borderBottom: 'none',
              }}
              aria-label="Show song summary"
              title="Show song info"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Now-playing bar — 3-layer structure */}
      <div className="relative" style={{ background: 'var(--player-surface-deep)', borderBottom: '1px solid color-mix(in srgb, var(--border-default) 19%, transparent)' }}>
        {/* Layer 2: Uniform bar background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'var(--player-surface-bar)' }}
        />
        {/* Glow line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent-secondary) 35%, transparent), color-mix(in srgb, var(--accent-secondary) 15%, transparent), transparent)' }}
        />
        {/* Layer 3: Controls and content */}
        <div
          id="player-controls"
          className="relative px-6 py-3.5 flex items-center"
          role="region"
          aria-label="Audio player"
        >
          {/* Left section — Album art + track meta + action buttons */}
          <DesktopLeftSection
            currentSong={currentSong}
            currentItem={currentItem}
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            recordingType={recordingType}
            imageLoaded={imageLoaded}
            onImageLoad={onImageLoad}
          />

          {/* Center section — Transport controls + progress bar */}
          <DesktopCenterSection
            currentTime={currentTime}
            duration={duration}
            progress={progress}
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            isFirstItem={isFirstItem}
            isLastItem={isLastItem}
            bufferedPercent={streamingStats.bufferedPercent}
            onTogglePlay={onTogglePlay}
            onPlayNext={onPlayNext}
            onPlayPrev={onPlayPrev}
            onSeek={onSeek}
          />

          {/* Right section — Quality + volume + queue */}
          <DesktopRightSection
            currentSong={currentSong}
            volume={volume}
            isIOS={isIOS}
            isQueueOpen={isQueueOpen}
            preferredQuality={preferredQuality}
            qualityInfo={qualityInfo}
            showQualityPopup={showQualityPopup}
            onToggleQualityPopup={onToggleQualityPopup}
            onSelectQuality={onSelectQuality}
            onCloseQualityPopup={onCloseQualityPopup}
            qualityPopupRef={qualityPopupRef}
            onSetVolume={onSetVolume}
            onToggleQueue={onToggleQueue}
            showQueuePreview={showQueuePreview}
            onSetShowQueuePreview={onSetShowQueuePreview}
            queuePreviewTimeoutRef={queuePreviewTimeoutRef}
            streamingStats={streamingStats}
          />
        </div>
      </div>

      {/* Queue strip — toggle handle + accordion album groups */}
      {queueChips.length > 0 && (
        <div style={{ background: 'var(--player-surface-queue)' }}>
          {/* Toggle handle — slim pill overlapping the border */}
          <div className="flex justify-center -mt-[7px] relative z-[3]">
            <button
              onClick={() => setQueueStripOpen(prev => {
                const next = !prev;
                localStorage.setItem('8pm_queue_strip', String(next));
                return next;
              })}
              className="flex items-center gap-1 px-3 h-[14px] rounded-full transition-all"
              style={{
                background: 'var(--player-surface-bar)',
                border: '1px solid color-mix(in srgb, var(--tertiary) 30%, transparent)',
                color: 'var(--text-tertiary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'color-mix(in srgb, var(--tertiary) 15%, var(--player-surface-bar))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--tertiary) 30%, transparent)';
                e.currentTarget.style.color = 'var(--text-tertiary)';
                e.currentTarget.style.background = 'var(--player-surface-bar)';
              }}
              aria-label={queueStripOpen ? 'Hide queue strip' : 'Show queue strip'}
            >
              <span className="w-3 h-[1.5px] rounded-full" style={{ background: 'currentColor', opacity: 0.5 }} />
              <svg
                className={`w-2.5 h-2.5 transition-transform ${queueStripOpen ? '' : 'rotate-180'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="w-3 h-[1.5px] rounded-full" style={{ background: 'currentColor', opacity: 0.5 }} />
            </button>
          </div>
          {queueStripOpen && (
            <div className="px-6 pb-3.5">
              <QueueAccordion
                queueChips={queueChips}
                totalUpcoming={totalUpcoming}
                playedCount={playedCount}
                onChipPlay={onChipPlay}
                onRemoveItem={onRemoveItem}
                onRemoveBatch={onRemoveBatch}
                onSelectVersion={onSelectVersion}
                onMoveItem={onMoveItem}
                onDetachItem={onDetachItem}
                onRestoreFromHistory={onRestoreFromHistory}
                preferredQuality={preferredQuality}
                chipGlow={chipGlow}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Local Sub-Components (not exported) ───────────────────────────

function DesktopLeftSection({
  currentSong,
  currentItem,
  isPlaying,
  isBuffering,
  recordingType,
  imageLoaded,
  onImageLoad,
}: {
  currentSong: DesktopPlayerBarProps['currentSong'];
  currentItem: QueueItem | null;
  isPlaying: boolean;
  isBuffering: boolean;
  recordingType: string | undefined;
  imageLoaded: boolean;
  onImageLoad: () => void;
}) {
  return (
    <div className="flex items-start gap-3 min-w-0 flex-1 max-w-[380px] z-20">
      {/* Album art — with teal gradient overlay */}
      <div className="w-[60px] h-[60px] bg-surface-elevated flex-shrink-0 rounded-lg relative overflow-hidden" style={{ boxShadow: '0 2px 12px color-mix(in srgb, black 30%, transparent)' }}>
        {currentItem?.albumSource?.coverArt ? (
          <Image
            src={currentItem.albumSource.coverArt}
            alt={`${currentItem?.albumSource?.albumName} by ${currentSong.artistName}`}
            width={60}
            height={60}
            quality={85}
            onLoad={onImageLoad}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
            <svg className="w-7 h-7 text-border" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
        {/* Teal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-secondary/15 to-transparent pointer-events-none" />
        {/* EQ bars overlay — only when actually playing (not buffering) */}
        {isPlaying && !isBuffering && (
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[3px] h-5 px-2 pb-1 bg-gradient-to-t from-black/60 to-transparent">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-[3px] bg-accent rounded-t-sm animate-eq-bar"
                style={{
                  animationDelay: `${i * 0.12}s`,
                  height: '60%',
                }}
              />
            ))}
          </div>
        )}
        {/* Buffering spinner overlay */}
        {isPlaying && isBuffering && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center h-5 px-2 pb-1 bg-gradient-to-t from-black/60 to-transparent">
            <svg className="w-3.5 h-3.5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        {/* Recording type icon overlay */}
        <span className="absolute top-1 right-1">
          <RecSourceIcon type={recordingType} lineage={currentSong.lineage} size={20} />
        </span>
      </div>

      {/* Track meta — multi-row layout matching queue track rows */}
      <div className="min-w-0 flex-1 flex flex-col">
        <RecordingRow
          song={currentItem?.song ?? currentSong as any}
          size="sm"
          trackNumber={currentItem?.albumSource ? (currentItem.albumSource.originalTrackIndex ?? 0) + 1 : undefined}
          showBadges={false}
          showMediumIcon={false}
          showDuration={false}
          actions={['favorite']}
        />

        {/* Row 4: Share + Download buttons */}
        <div className="flex items-center gap-2 mt-1">
          <ShareButton title={currentSong.title} artistName={currentSong.artistName} />
          <DownloadButton archiveUrl={currentSong.archiveDetailUrl} title={currentSong.title} artistName={currentSong.artistName} />
        </div>
      </div>
    </div>
  );
}

function DesktopCenterSection({
  currentTime,
  duration,
  progress,
  isPlaying,
  isBuffering,
  isFirstItem,
  isLastItem,
  bufferedPercent,
  onTogglePlay,
  onPlayNext,
  onPlayPrev,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  progress: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isFirstItem: boolean;
  isLastItem: boolean;
  bufferedPercent: number;
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onSeek: (t: number) => void;
}) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10 pointer-events-auto" style={{ width: 'min(50%, 540px)' }}>
      {/* Transport controls row */}
      <div className="flex items-center gap-5">
        {/* Previous */}
        <button
          onClick={onPlayPrev}
          disabled={isFirstItem}
          className="text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded"
          aria-label="Previous track"
          title="Previous (P)"
        >
          <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Pause — branded color */}
        <button
          onClick={onTogglePlay}
          className="w-11 h-11 rounded-full flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-player-deep"
          style={{
            backgroundColor: 'var(--player-play-btn)',
            color: `rgb(var(--player-play-btn-text))`,
            boxShadow: '0 4px 20px var(--player-play-btn-shadow)',
          }}
          aria-label={isBuffering ? 'Buffering' : isPlaying ? 'Pause' : 'Play'}
          title={isBuffering ? 'Buffering...' : isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isBuffering ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={onPlayNext}
          disabled={isLastItem}
          className="text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded"
          aria-label="Next track"
          title="Next (N)"
        >
          <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      {/* Progress bar row */}
      <div className="w-full max-w-[500px] flex items-center gap-2.5">
        <span className="text-[11px] text-tertiary font-jb-mono w-10 text-right flex-shrink-0">
          {formatDuration(Math.floor(currentTime))}
        </span>
        <div
          className="flex-1 h-1 rounded-full cursor-pointer group relative hover:h-1.5 transition-all"
          style={{ backgroundColor: 'color-mix(in srgb, var(--border-default) 35%, transparent)' }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            onSeek(percent * duration);
          }}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuenow={Math.floor(currentTime)}
        >
          {/* Buffer bar */}
          <div
            className="absolute inset-y-0 left-0 bg-white/10 rounded-full transition-all duration-300"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className={`h-full rounded-full relative z-[1] transition-colors ${isBuffering ? 'animate-pulse' : ''}`}
            style={{
              width: `${progress}%`,
              background: 'var(--secondary)',
            }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--secondary)' }} />
          </div>
        </div>
        <span className="text-[11px] text-tertiary font-jb-mono w-10 flex-shrink-0">
          {formatDuration(Math.floor(duration))}
        </span>
      </div>
    </div>
  );
}

function DesktopRightSection({
  currentSong,
  volume,
  isIOS,
  isQueueOpen,
  preferredQuality,
  qualityInfo,
  showQualityPopup,
  onToggleQualityPopup,
  onSelectQuality,
  onCloseQualityPopup,
  qualityPopupRef,
  onSetVolume,
  onToggleQueue,
  showQueuePreview,
  onSetShowQueuePreview,
  queuePreviewTimeoutRef,
  streamingStats,
}: {
  currentSong: DesktopPlayerBarProps['currentSong'];
  volume: number;
  isIOS: boolean;
  isQueueOpen: boolean;
  preferredQuality: AudioQuality;
  qualityInfo: ReturnType<typeof getQualityBadge>;
  showQualityPopup: boolean;
  onToggleQualityPopup: () => void;
  onSelectQuality: (quality: AudioQuality) => void;
  onCloseQualityPopup: () => void;
  qualityPopupRef: React.RefObject<HTMLDivElement>;
  onSetVolume: (v: number) => void;
  onToggleQueue: () => void;
  showQueuePreview: boolean;
  onSetShowQueuePreview: (show: boolean) => void;
  queuePreviewTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  streamingStats: StreamingStats;
}) {
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const getVolumeFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!volumeBarRef.current) return volume;
    const rect = volumeBarRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }, [volume]);

  const handleVolumeMouseDown = useCallback((e: React.MouseEvent) => {
    onSetVolume(getVolumeFromEvent(e));
    const onMove = (ev: MouseEvent) => onSetVolume(getVolumeFromEvent(ev));
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [getVolumeFromEvent, onSetVolume]);

  return (
    <div className="ml-auto flex items-center justify-end gap-3 z-20">
      {/* Quality + source column */}
      <div className="relative" ref={qualityPopupRef}>
        <div className="flex flex-col items-end gap-px">
          <button
            onClick={onToggleQualityPopup}
            className="flex items-center gap-1.5 px-2.5 py-1 border rounded hover:border-accent-secondary transition-colors cursor-pointer"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent-secondary) 80%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--accent-secondary) 20%, transparent)',
            }}
            title="Change audio quality"
            aria-label="Change audio quality"
          >
            <div className="w-1.5 h-1.5 bg-accent-secondary rounded-full animate-pulse" />
            <span className="text-[10.5px] font-semibold text-accent-secondary font-jb-mono uppercase tracking-wide">
              {qualityInfo.format}
            </span>
            <span className="text-[10px] text-accent-secondary/70 font-jb-mono">
              {qualityInfo.bitrate}
            </span>
          </button>
          {/* Source lineage + signal icon */}
          <span className="flex items-center gap-1.5">
            <span
              className="text-[10px] text-secondary font-jb-mono leading-tight truncate max-w-[200px]"
              title={currentSong?.lineage || 'Source not specified'}
            >
              {formatLineage(currentSong?.lineage, 35)}
            </span>
            <SignalStrengthIcon
              size={16}
              {...computeSignalInfo(
                streamingStats.networkType,
                streamingStats.downlinkMbps,
                streamingStats.bufferedAhead,
                streamingStats.isOnline ?? true,
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
            position="absolute"
            style={{ bottom: '100%', right: 0, marginBottom: '8px' }}
            availableQualities={currentSong?.qualityUrls}
          />
        )}
      </div>

      {/* Volume */}
      {isIOS ? (
        <span className="text-[10px] text-secondary whitespace-nowrap">Use device buttons</span>
      ) : (
        <>
          <button
            onClick={() => onSetVolume(volume === 0 ? 0.7 : 0)}
            className="text-secondary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded"
            aria-label={volume === 0 ? 'Unmute' : `Mute (current volume ${Math.round(volume * 100)}%)`}
          >
            {volume === 0 ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : volume < 0.5 ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
          {/* Volume slider — div-based like seek bar to avoid global range CSS */}
          <div
            ref={volumeBarRef}
            className="w-20 h-4 relative flex items-center cursor-pointer"
            onMouseDown={handleVolumeMouseDown}
            role="slider"
            aria-label="Volume control"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(volume * 100)}
            aria-valuetext={`${Math.round(volume * 100)} percent`}
          >
            {/* Track background */}
            <div className="h-1 rounded-full w-full" style={{ backgroundColor: 'color-mix(in srgb, var(--border-default) 25%, transparent)' }}>
              {/* Filled portion */}
              <div className="h-full rounded-full" style={{ backgroundColor: 'color-mix(in srgb, white 70%, transparent)', width: `${volume * 100}%` }} />
            </div>
            {/* Thumb dot — hidden on hover-only, matches goal design */}
          </div>
        </>
      )}

      {/* NOW PLAYING button moved to pull-tab above player bar */}
    </div>
  );
}
