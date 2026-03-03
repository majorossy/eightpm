'use client';

// EightPmFullPlayer - Spotify-style full-screen mobile player

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useWishlist } from '@/context/WishlistContext';
import { useMobileUI } from '@/context/MobileUIContext';
import { useQuality } from '@/context/QualityContext';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useBatteryOptimization } from '@/hooks/useBatteryOptimization';
import { useSleepTimer } from '@/hooks/useSleepTimer';
import { useShare } from '@/hooks/useShare';
import { useHaptic } from '@/hooks/useHaptic';
import { formatDuration } from '@/lib/api';
import Link from 'next/link';
import ShareModal from '@/components/ShareModal';
import { formatLineage } from '@/lib/lineageUtils';
import { useStreamingStats } from '@/hooks/useStreamingStats';
import { useBackToClose } from '@/hooks/useBackToClose';
import { computeSignalInfo } from '@/lib/signalUtils';
import SignalStrengthIcon from '@/components/player/SignalStrengthIcon';
import type { QueueItem } from '@/lib/queueTypes';
import {
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { QualityPopup, getQualityBadge } from '@/components/player/QualityPopup';
import { SettingsPanel } from '@/components/player/SettingsPanel';
import { MiniQueue } from '@/components/player/MiniQueue';

export default function EightPmFullPlayer() {
  const { isPlayerExpanded, collapsePlayer, isTransitioning } = useMobileUI();
  useBackToClose(isPlayerExpanded, collapsePlayer);
  const { reducedMotion } = useBatteryOptimization();
  const { vibrate, BUTTON_PRESS, SWIPE_COMPLETE } = useHaptic();
  const { preferredQuality, setPreferredQuality, getStreamUrl } = useQuality();
  const {
    currentSong,
    isPlaying,
    isBuffering,
    volume,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrev,
    setVolume,
    seek,
    toggleQueue,
    isQueueOpen,
    pause,
    crossfadeDuration,
    setCrossfadeDuration,
    playFromQueue,
    audioRef,
  } = usePlayer();

  const streamingStats = useStreamingStats(audioRef);

  const {
    queue,
    currentItem,
    hasItems,
    isFirstItem,
    isLastItem,
    setRepeat,
    moveItem,
    selectVersion,
  } = useQueue();

  const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } = useWishlist();

  const {
    showShareModal,
    shareUrl,
    shareTitle,
    copiedToClipboard,
    openShareModal,
    closeShareModal,
    copyToClipboard,
    nativeShare,
    shareableSong,
  } = useShare();

  // Settings panel state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const handleCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const [showTimerNotification, setShowTimerNotification] = useState(false);

  // Mini queue expanded state
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);

  // Quality selector popup state
  const [showQualityPopup, setShowQualityPopup] = useState(false);
  const qualityPopupRef = useRef<HTMLDivElement>(null);

  // Sleep timer
  const sleepTimer = useSleepTimer({
    onTimerComplete: () => {
      pause();
      setShowTimerNotification(false);
    },
    onOneMinuteWarning: () => {
      setShowTimerNotification(true);
      setTimeout(() => setShowTimerNotification(false), 5000); // Hide after 5 seconds
    },
    currentSongDuration: duration - currentTime,
    currentSongProgress: currentTime,
  });

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);

  // Image loading state for lazy loading
  const [imageLoaded, setImageLoaded] = useState(false);

  // Swipe down gesture to collapse player
  const swipeHandlers = useSwipeGesture({
    onSwipeDown: () => {
      if (!isTransitioning) {
        vibrate(SWIPE_COMPLETE);
        collapsePlayer();
      }
    },
    threshold: 50,
    velocityThreshold: 0.5,
    direction: 'vertical',
  });

  // Trigger slide-up animation on mount - skip if reduced motion
  useEffect(() => {
    if (isPlayerExpanded && !reducedMotion) {
      setIsAnimating(true);
    }
  }, [isPlayerExpanded, reducedMotion]);

  // Close quality popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (qualityPopupRef.current && !qualityPopupRef.current.contains(event.target as Node)) {
        setShowQualityPopup(false);
      }
    };

    if (showQualityPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQualityPopup]);

  // DnD for mini queue reordering
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const miniQueuePointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const miniQueueTouchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const miniQueueSensors = useSensors(miniQueuePointerSensor, miniQueueTouchSensor);

  const upcomingForDnd = useMemo(() => {
    if (queue.cursorIndex < 0) return [];
    const items: { item: QueueItem; absoluteIndex: number }[] = [];
    const max = isQueueExpanded ? 10 : 3;
    for (let i = queue.cursorIndex + 1; i < queue.items.length && items.length < max; i++) {
      items.push({ item: queue.items[i], absoluteIndex: i });
    }
    return items;
  }, [queue.items, queue.cursorIndex, isQueueExpanded]);

  const miniQueueSortableIds = useMemo(
    () => upcomingForDnd.map(({ item }) => item.queueId),
    [upcomingForDnd],
  );

  const activeDragItem = useMemo(() => {
    if (!activeDragId) return null;
    return upcomingForDnd.find(({ item }) => item.queueId === activeDragId) ?? null;
  }, [activeDragId, upcomingForDnd]);

  const handleMiniDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleMiniDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromEntry = upcomingForDnd.find(({ item }) => item.queueId === String(active.id));
    const toEntry = upcomingForDnd.find(({ item }) => item.queueId === String(over.id));
    if (fromEntry && toEntry) {
      moveItem(fromEntry.absoluteIndex, toEntry.absoluteIndex);
    }
  }, [upcomingForDnd, moveItem]);

  if (!currentSong || !isPlayerExpanded) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const qualityInfo = getQualityBadge(preferredQuality);

  return (
    <div
      {...swipeHandlers}
      className={`fixed inset-0 z-50 bg-gradient-to-b from-border to-surface-base flex flex-col md:hidden safe-top safe-bottom full-screen-player prevent-overscroll touch-action-pan-y ${
        isAnimating && !reducedMotion ? 'player-slide-up' : ''
      } ${swipeHandlers.isDragging ? 'dragging' : ''} ${reducedMotion ? 'reduce-motion' : ''}`}
      style={{
        transform: swipeHandlers.isDragging
          ? `translateY(${Math.max(0, swipeHandlers.dragOffset.y)}px)`
          : undefined,
        willChange: swipeHandlers.isDragging ? 'transform' : 'auto',
      }}
    >
      {/* Drag hint pill */}
      <div className="drag-hint" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Collapse button */}
        <button
          onClick={() => {
            vibrate(BUTTON_PRESS);
            collapsePlayer();
          }}
          className="p-2 -ml-2 text-white btn-touch"
          aria-label="Minimize player and return to library"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Now playing from */}
        <div className="text-center">
          <p className="text-[10px] text-secondary uppercase tracking-wider">Playing from</p>
          <p className="text-xs text-white font-medium truncate max-w-[200px]">
            {currentItem?.albumSource?.albumName || 'Unknown'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Share button */}
          <button
            onClick={() => {
              vibrate(BUTTON_PRESS);
              currentSong && openShareModal(shareableSong(currentSong));
            }}
            className="p-2 text-white btn-touch"
            aria-label={`Share ${currentSong.title}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          {/* Settings button */}
          <button
            onClick={() => {
              vibrate(BUTTON_PRESS);
              setIsSettingsOpen(!isSettingsOpen);
            }}
            className={`p-2 -mr-2 btn-touch ${isSettingsOpen ? 'text-accent' : 'text-white'}`}
            aria-label={isSettingsOpen ? 'Close settings' : 'Open settings menu'}
            aria-expanded={isSettingsOpen}
            aria-haspopup="dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Album Art */}
      <div className="flex-1 flex items-center justify-center px-8 py-4">
        <div className="w-full max-w-[320px] aspect-square rounded-lg overflow-hidden shadow-2xl relative">
          {currentItem?.albumSource?.coverArt ? (
            <Image
              src={currentItem.albumSource!.coverArt}
              alt={`${currentItem?.albumSource?.albumName} by ${currentSong.artistName}`}
              fill
              sizes="320px"
              priority
              quality={90}
              onLoad={() => setImageLoaded(true)}
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="w-full h-full bg-surface-elevated flex items-center justify-center" aria-hidden="true">
              <svg className="w-24 h-24 text-border" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Song Info */}
      <div className="px-8 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-xl font-bold text-white truncate">
              {currentItem?.albumSource ? <><span className="text-tertiary">{(currentItem.albumSource.originalTrackIndex ?? 0) + 1}.</span> {currentSong.title}</> : currentSong.title}
            </h2>
            <Link
              href={`/artists/${currentSong.artistSlug || ''}`}
              onClick={() => {
                vibrate(BUTTON_PRESS);
                collapsePlayer();
              }}
              className="text-secondary hover:text-white hover:underline truncate block mb-2"
            >
              {currentSong.artistName}
            </Link>
            {/* Quality indicator - clickable */}
            <div className="relative inline-block" ref={qualityPopupRef}>
              <div className="flex flex-col items-start gap-1">
                <button
                  onClick={() => {
                    vibrate(BUTTON_PRESS);
                    setShowQualityPopup(!showQualityPopup);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-card border border-default rounded-md hover:border-accent transition-colors btn-touch"
                  aria-label="Change audio quality"
                >
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                  <span className="text-[11px] font-semibold text-accent uppercase tracking-wide">
                    {qualityInfo.format}
                  </span>
                  <span className="text-[11px] text-secondary">
                    {qualityInfo.bitrate}
                  </span>
                </button>

                {/* Source - ALWAYS VISIBLE */}
                <span
                  className="text-[9px] text-tertiary italic leading-tight truncate max-w-[200px]"
                  title={currentSong?.lineage || 'Source not specified'}
                >
                  {formatLineage(currentSong?.lineage, 60)}
                </span>
              </div>

              {/* Quality popup menu */}
              {showQualityPopup && (
                <QualityPopup
                  preferredQuality={preferredQuality}
                  onSelect={(q) => { vibrate(BUTTON_PRESS); setPreferredQuality(q); }}
                  onClose={() => setShowQualityPopup(false)}
                  position="absolute"
                  className="w-72"
                  style={{ bottom: '100%', left: 0, marginBottom: '8px' }}
                  availableQualities={currentSong?.qualityUrls}
                />
              )}
            </div>
          </div>
          {/* Like button */}
          <button
            onClick={() => {
              vibrate(BUTTON_PRESS);
              if (currentSong) {
                if (isInWishlist(currentSong.id)) {
                  const item = wishlist.items.find(i => i.song.id === currentSong.id);
                  if (item) removeFromWishlist(item.id);
                } else {
                  addToWishlist(currentSong);
                }
              }
            }}
            className={`p-2 btn-touch btn-ripple ${
              currentSong && isInWishlist(currentSong.id) ? 'text-accent' : 'text-secondary'
            }`}
            aria-label={currentSong && isInWishlist(currentSong.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            {currentSong && isInWishlist(currentSong.id) ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-8 mb-4">
        <div
          className="w-full h-1 bg-border rounded-full cursor-pointer group relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            seek(percent * duration);
          }}
        >
          {/* Buffer bar */}
          <div
            className="absolute inset-y-0 left-0 bg-white/15 rounded-full transition-all duration-300"
            style={{ width: `${streamingStats.bufferedPercent}%` }}
          />
          <div
            className={`h-full bg-white rounded-full relative z-[1] ${isBuffering ? 'animate-pulse' : ''}`}
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-active:opacity-100" />
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[11px] text-secondary font-mono">
            {formatDuration(Math.floor(currentTime))}
          </span>

          {/* Signal strength icon (centered) */}
          <SignalStrengthIcon
            size={16}
            {...computeSignalInfo(
              streamingStats.networkType,
              streamingStats.downlinkMbps,
              streamingStats.bufferedAhead,
              streamingStats.isOnline,
            )}
            streamingStats={streamingStats}
          />

          <span className="text-[11px] text-secondary font-mono">
            {formatDuration(Math.floor(duration))}
          </span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="px-8 mb-6">
        <div className="flex items-center justify-between">
          {/* Previous */}
          <button
            onClick={() => {
              vibrate(BUTTON_PRESS);
              playPrev();
            }}
            disabled={isFirstItem}
            className="p-3 text-white disabled:opacity-30 btn-touch"
            aria-label="Previous track"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => {
              vibrate(BUTTON_PRESS);
              togglePlay();
            }}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black btn-touch btn-ripple"
            aria-label={isBuffering ? 'Buffering' : isPlaying ? 'Pause' : 'Play'}
          >
            {isBuffering ? (
              <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={() => {
              vibrate(BUTTON_PRESS);
              playNext();
            }}
            disabled={isLastItem}
            className="p-3 text-white disabled:opacity-30 btn-touch"
            aria-label="Next track"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* Repeat */}
          <button
            onClick={() => {
              vibrate(BUTTON_PRESS);
              const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
              const currentIndex = modes.indexOf(queue.repeat);
              const nextIndex = (currentIndex + 1) % modes.length;
              setRepeat(modes[nextIndex]);
            }}
            className={`p-3 btn-touch ${queue.repeat === 'off' ? 'text-secondary' : 'text-accent'}`}
            aria-label={`Repeat: ${queue.repeat}`}
          >
            {queue.repeat === 'one' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mini Queue / Up Next */}
      <MiniQueue
        upcomingItems={upcomingForDnd}
        totalUpcoming={queue.cursorIndex >= 0 ? queue.items.length - queue.cursorIndex - 1 : 0}
        isExpanded={isQueueExpanded}
        onToggleExpand={() => setIsQueueExpanded(!isQueueExpanded)}
        sortableIds={miniQueueSortableIds}
        sensors={miniQueueSensors}
        activeDragItem={activeDragItem}
        onDragStart={handleMiniDragStart}
        onDragEnd={handleMiniDragEnd}
        onPlay={(idx) => { vibrate(BUTTON_PRESS); playFromQueue(idx); }}
        onSelectVersion={selectVersion}
        vibrate={vibrate}
        BUTTON_PRESS={BUTTON_PRESS}
      />

      {/* Bottom Actions */}
      <div className="px-8 pb-6">
        <div className="flex items-center justify-between">
          {/* Device */}
          <button className="p-2 text-secondary btn-touch" aria-label="Connect to a device">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
            </svg>
          </button>

          {/* Full Queue (opens drawer) */}
          <button
            onClick={() => {
              vibrate(BUTTON_PRESS);
              collapsePlayer();
              setTimeout(() => toggleQueue(), 100);
            }}
            className={`p-2 btn-touch ${isQueueOpen ? 'text-accent' : 'text-secondary'}`}
            aria-label="Open full queue"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        sleepTimer={sleepTimer}
        crossfadeDuration={crossfadeDuration}
        setCrossfadeDuration={setCrossfadeDuration}
        vibrate={vibrate}
        BUTTON_PRESS={BUTTON_PRESS}
      />

      {/* Timer notification (1 minute warning) */}
      {showTimerNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-accent text-white px-6 py-3 rounded-full shadow-lg animate-fade-in">
          <p className="text-sm font-medium">Music will stop in 1 minute</p>
        </div>
      )}

      {/* Active timer indicator (bottom of screen when not in settings) */}
      {sleepTimer.isActive && !isSettingsOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-surface-elevated/95 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg">
          <p className="text-xs font-medium text-center">
            Sleep timer: {Math.floor(sleepTimer.timeRemaining / 60)}:{(sleepTimer.timeRemaining % 60).toString().padStart(2, '0')} remaining
          </p>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={closeShareModal}
        url={shareUrl}
        title={shareTitle}
        onCopy={copyToClipboard}
        onNativeShare={nativeShare}
        copiedToClipboard={copiedToClipboard}
      />
    </div>
  );
}
