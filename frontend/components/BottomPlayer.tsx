'use client';

// BottomPlayer - orchestrator that routes to sub-components

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useWishlist } from '@/context/WishlistContext';
import { useMobileUI } from '@/context/MobileUIContext';
import { useQuality } from '@/context/QualityContext';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useBatteryOptimization } from '@/hooks/useBatteryOptimization';
import { useHaptic } from '@/hooks/useHaptic';
import { useStreamingStats } from '@/hooks/useStreamingStats';
import { usePlayerAnnouncements } from '@/components/player/usePlayerAnnouncements';
import type { QueueItem } from '@/lib/queueTypes';
import type { AudioQuality } from '@/lib/types';
import ResumeBar from '@/components/player/ResumeBar';
// DesktopMinimizedTag removed — minimize state handled by pull-tab in DesktopPlayerBar
import MobileMiniPlayer from '@/components/player/MobileMiniPlayer';
import MobileMinimizedTag from '@/components/player/MobileMinimizedTag';
import DesktopPlayerBar from '@/components/player/DesktopPlayerBar';

export default function BottomPlayer() {
  const { isMobile, expandPlayer, isPlayerExpanded, isTransitioning, isPlayerMinimized, minimizePlayer, restorePlayer } = useMobileUI();
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
    savedProgress,
    resumeSavedProgress,
    clearSavedProgress,
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
    detachItem,
    restoreFromHistory,
    removeItem,
    removeBatch,
    selectVersion,
    chipGlow,
  } = useQueue();

  const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } = useWishlist();

  // Detect iOS — programmatic volume control doesn't work on iOS Safari
  const isIOS = useMemo(() => typeof navigator !== 'undefined' && (/(iPad|iPhone|iPod)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)), []);

  // Image loading state for lazy loading
  const [imageLoaded, setImageLoaded] = useState(false);

  // Pulse animation on track change - skip if reduced motion
  const [isPulsing, setIsPulsing] = useState(false);

  // Quality selector popup state
  const [showQualityPopup, setShowQualityPopup] = useState(false);
  const qualityPopupRef = useRef<HTMLDivElement>(null);

  // Queue preview hover state
  const [showQueuePreview, setShowQueuePreview] = useState(false);
  const queuePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentSong && !reducedMotion) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 800);
      return () => clearTimeout(timer);
    }
  }, [currentSong?.id, reducedMotion]);

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

  // Cleanup queue preview timeout on unmount
  useEffect(() => {
    return () => {
      if (queuePreviewTimeoutRef.current) {
        clearTimeout(queuePreviewTimeoutRef.current);
      }
    };
  }, []);

  // Hide queue preview when queue drawer opens
  useEffect(() => {
    if (isQueueOpen) {
      setShowQueuePreview(false);
    }
  }, [isQueueOpen]);

  // Swipe gesture for expanding player (mobile only)
  const swipeHandlers = useSwipeGesture({
    onSwipeUp: () => {
      if (isMobile && !isTransitioning) {
        vibrate(SWIPE_COMPLETE);
        expandPlayer();
      }
    },
    threshold: 50,
    velocityThreshold: 0.5,
    direction: 'vertical',
  });

  // Screen reader announcements
  const announcement = usePlayerAnnouncements(currentSong, isPlaying);

  // Compute queue chips: played items + upcoming (capped)
  const queueChips: { item: QueueItem; absoluteIndex: number; isPlayed: boolean; isCurrent: boolean }[] = useMemo(() => {
    if (queue.cursorIndex < 0) return [];
    const maxUpcoming = isMobile ? 10 : 555;
    const chips: { item: QueueItem; absoluteIndex: number; isPlayed: boolean; isCurrent: boolean }[] = [];

    // Include recent played items (before cursor), capped at 42
    const maxHistory = 42;
    const historyStart = Math.max(0, queue.cursorIndex - maxHistory);
    for (let i = historyStart; i < queue.cursorIndex; i++) {
      chips.push({ item: queue.items[i], absoluteIndex: i, isPlayed: true, isCurrent: false });
    }

    // Include the currently-playing track
    if (queue.cursorIndex < queue.items.length) {
      chips.push({ item: queue.items[queue.cursorIndex], absoluteIndex: queue.cursorIndex, isPlayed: false, isCurrent: true });
    }

    // Include upcoming items (cursor + 1 onward, capped)
    let upcomingCount = 0;
    for (let i = queue.cursorIndex + 1; i < queue.items.length && upcomingCount < maxUpcoming; i++) {
      chips.push({ item: queue.items[i], absoluteIndex: i, isPlayed: false, isCurrent: false });
      upcomingCount++;
    }

    return chips;
  }, [queue.items, queue.cursorIndex, isMobile]);

  // Total upcoming count (not capped by maxChips)
  const totalUpcoming = queue.cursorIndex >= 0
    ? queue.items.length - queue.cursorIndex - 1
    : 0;

  const handleChipPlay = useCallback((index: number) => {
    vibrate(BUTTON_PRESS);
    playFromQueue(index);
  }, [vibrate, BUTTON_PRESS, playFromQueue]);

  // Haptic-wrapped callbacks for sub-components
  const handleResume = useCallback(() => {
    vibrate(BUTTON_PRESS);
    resumeSavedProgress();
  }, [vibrate, BUTTON_PRESS, resumeSavedProgress]);

  const handleDismiss = useCallback(() => {
    vibrate(BUTTON_PRESS);
    clearSavedProgress();
  }, [vibrate, BUTTON_PRESS, clearSavedProgress]);

  const handleRestore = useCallback(() => {
    vibrate(BUTTON_PRESS);
    restorePlayer();
  }, [vibrate, BUTTON_PRESS, restorePlayer]);

  const handleTogglePlay = useCallback(() => {
    vibrate(BUTTON_PRESS);
    togglePlay();
  }, [vibrate, BUTTON_PRESS, togglePlay]);

  const handleToggleQualityPopup = useCallback(() => {
    vibrate(BUTTON_PRESS);
    setShowQualityPopup(prev => !prev);
  }, [vibrate, BUTTON_PRESS]);

  const handleSelectQuality = useCallback((q: AudioQuality) => {
    vibrate(BUTTON_PRESS);
    setPreferredQuality(q);
  }, [vibrate, BUTTON_PRESS, setPreferredQuality]);

  const handleCloseQualityPopup = useCallback(() => {
    setShowQualityPopup(false);
  }, []);

  const handleMinimize = useCallback(() => {
    vibrate(BUTTON_PRESS);
    if (isPlayerMinimized) {
      restorePlayer();
    } else {
      minimizePlayer();
    }
  }, [vibrate, BUTTON_PRESS, isPlayerMinimized, minimizePlayer, restorePlayer]);

  const handlePlayNext = useCallback(() => {
    vibrate(BUTTON_PRESS);
    playNext();
  }, [vibrate, BUTTON_PRESS, playNext]);

  const handlePlayPrev = useCallback(() => {
    vibrate(BUTTON_PRESS);
    playPrev();
  }, [vibrate, BUTTON_PRESS, playPrev]);

  const handleSetVolume = useCallback((v: number) => {
    vibrate(BUTTON_PRESS);
    setVolume(v);
  }, [vibrate, BUTTON_PRESS, setVolume]);

  const handleToggleQueue = useCallback(() => {
    vibrate(BUTTON_PRESS);
    setShowQueuePreview(false);
    toggleQueue();
  }, [vibrate, BUTTON_PRESS, toggleQueue]);

  // Show resume UI when there's saved progress but no current song
  if (!currentSong && savedProgress) {
    return (
      <ResumeBar
        savedProgress={savedProgress}
        isMobile={isMobile}
        onResume={handleResume}
        onDismiss={handleDismiss}
      />
    );
  }

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // MOBILE: Mini player (Spotify-style) - anchored to bottom as unified dock
  if (isMobile) {
    if (isPlayerExpanded) return null;

    if (isPlayerMinimized) {
      return (
        <MobileMinimizedTag
          currentSong={currentSong}
          isPlaying={isPlaying}
          reducedMotion={reducedMotion}
          onRestore={handleRestore}
          onTogglePlay={handleTogglePlay}
        />
      );
    }

    return (
      <MobileMiniPlayer
        currentSong={currentSong}
        currentItem={currentItem}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        progress={progress}
        bufferedPercent={streamingStats.bufferedPercent}
        reducedMotion={reducedMotion}
        isPulsing={isPulsing}
        imageLoaded={imageLoaded}
        onImageLoad={() => setImageLoaded(true)}
        preferredQuality={preferredQuality}
        showQualityPopup={showQualityPopup}
        onToggleQualityPopup={handleToggleQualityPopup}
        onSelectQuality={handleSelectQuality}
        onCloseQualityPopup={handleCloseQualityPopup}
        qualityPopupRef={qualityPopupRef}
        onTogglePlay={handleTogglePlay}
        onMinimize={handleMinimize}
        streamingStats={streamingStats}
        swipeHandlers={swipeHandlers}
        announcement={announcement}
        queueChips={queueChips}
        totalUpcoming={totalUpcoming}
        onChipPlay={handleChipPlay}
        onRemoveItem={removeItem}
        onRemoveBatch={removeBatch}
        onSelectVersion={selectVersion}
        chipGlow={chipGlow}
        onMoveItem={moveItem}
        onDetachItem={detachItem}
        onRestoreFromHistory={restoreFromHistory}
      />
    );
  }

  // DESKTOP: Full player bar with minimized tag
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

      {/* Minimized state handled by pull-tab in DesktopPlayerBar */}

      {/* Full desktop player bar */}
      <DesktopPlayerBar
        currentSong={currentSong}
        currentItem={currentItem}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        isPlayerMinimized={isPlayerMinimized}
        reducedMotion={reducedMotion}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isIOS={isIOS}
        isFirstItem={isFirstItem}
        isLastItem={isLastItem}
        onTogglePlay={handleTogglePlay}
        onPlayNext={handlePlayNext}
        onPlayPrev={handlePlayPrev}
        onSetVolume={handleSetVolume}
        onSeek={seek}
        imageLoaded={imageLoaded}
        onImageLoad={() => setImageLoaded(true)}
        preferredQuality={preferredQuality}
        showQualityPopup={showQualityPopup}
        onToggleQualityPopup={handleToggleQualityPopup}
        onSelectQuality={handleSelectQuality}
        onCloseQualityPopup={handleCloseQualityPopup}
        qualityPopupRef={qualityPopupRef}
        isQueueOpen={isQueueOpen}
        onToggleQueue={handleToggleQueue}
        showQueuePreview={showQueuePreview}
        onSetShowQueuePreview={setShowQueuePreview}
        queuePreviewTimeoutRef={queuePreviewTimeoutRef}
        queueChips={queueChips}
        totalUpcoming={totalUpcoming}
        onChipPlay={handleChipPlay}
        onRemoveItem={removeItem}
        onRemoveBatch={removeBatch}
        onSelectVersion={selectVersion}
        chipGlow={chipGlow}
        onMoveItem={moveItem}
        onDetachItem={detachItem}
        onRestoreFromHistory={restoreFromHistory}
        isInWishlist={isInWishlist}
        wishlistItems={wishlist.items}
        onAddToWishlist={addToWishlist}
        onRemoveFromWishlist={removeFromWishlist}
        onMinimize={handleMinimize}
        streamingStats={streamingStats}
        announcement={announcement}
      />
    </>
  );
}
