'use client';

// BottomPlayer - fixed audio player bar (Jamify/Spotify theme)

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useWishlist } from '@/context/WishlistContext';
import { useMobileUI } from '@/context/MobileUIContext';
import { useQuality } from '@/context/QualityContext';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useBatteryOptimization } from '@/hooks/useBatteryOptimization';
import { useHaptic } from '@/hooks/useHaptic';
import { formatDuration } from '@/lib/api';
import { formatLineage, getRecordingBadge } from '@/lib/lineageUtils';
import { useStreamingStats } from '@/hooks/useStreamingStats';
import ShareButton from '@/components/ShareButton';
import DownloadButton from '@/components/DownloadButton';
import QueuePreview from '@/components/QueuePreview';
import type { QueueItem } from '@/lib/queueTypes';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePlayerAnnouncements } from '@/components/player/usePlayerAnnouncements';
import { QualityPopup, getQualityBadge, qualityOptions } from '@/components/player/QualityPopup';
import { SortableQueueChip } from '@/components/player/QueueStrip';
import QueueChip from '@/components/player/QueueChip';

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
    removeItem,
    selectVersion,
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

  // Compute upcoming tracks for queue strip
  // NOTE: All hooks must be above early returns to avoid "Rendered more hooks" error
  const upcomingTracks: { item: QueueItem; absoluteIndex: number }[] = useMemo(() => {
    if (queue.cursorIndex < 0) return [];
    const maxChips = isMobile ? 10 : 20;
    const upcoming: { item: QueueItem; absoluteIndex: number }[] = [];
    for (let i = queue.cursorIndex + 1; i < queue.items.length && upcoming.length < maxChips; i++) {
      upcoming.push({ item: queue.items[i], absoluteIndex: i });
    }
    return upcoming;
  }, [queue.items, queue.cursorIndex, isMobile]);

  // Total upcoming count (not capped by maxChips)
  const totalUpcoming = queue.cursorIndex >= 0
    ? queue.items.length - queue.cursorIndex - 1
    : 0;

  // DnD for reordering queue chips
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const dndSensors = useSensors(pointerSensor);

  const sortableIds = useMemo(
    () => upcomingTracks.map(({ item }) => item.queueId),
    [upcomingTracks]
  );

  const activeDragItem = useMemo(() => {
    if (!activeDragId) return null;
    return upcomingTracks.find(({ item }) => item.queueId === activeDragId) ?? null;
  }, [activeDragId, upcomingTracks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromEntry = upcomingTracks.find(({ item }) => item.queueId === String(active.id));
    const toEntry = upcomingTracks.find(({ item }) => item.queueId === String(over.id));
    if (fromEntry && toEntry) {
      moveItem(fromEntry.absoluteIndex, toEntry.absoluteIndex);
    }
  }, [upcomingTracks, moveItem]);

  const handleChipPlay = useCallback((index: number) => {
    vibrate(BUTTON_PRESS);
    playFromQueue(index);
  }, [vibrate, BUTTON_PRESS, playFromQueue]);

  // Show resume UI when there's saved progress but no current song
  if (!currentSong && savedProgress) {
    return (
      <div
        className={`fixed left-0 right-0 z-[40] ${isMobile ? '' : 'bottom-0'}`}
        style={isMobile ? { bottom: 'calc(50px + env(safe-area-inset-bottom, 0px))' } : undefined}
      >
        <div className={`${isMobile ? 'border-t border-accent/20 bg-gradient-to-b from-surface-elevated to-surface-card backdrop-blur-lg px-3 pt-3' : 'bg-surface-card border-t border-default px-4'}`}>
          <div className={`flex items-center gap-4 ${isMobile ? '' : 'max-w-xl mx-auto h-[90px]'}`}>
            {/* Resume info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-secondary mb-1">Continue where you left off</p>
              <p className="text-sm text-white font-medium truncate">{savedProgress.title}</p>
              <p className="text-xs text-secondary truncate">{savedProgress.artistName} • {formatDuration(Math.floor(savedProgress.position))}</p>
            </div>

            {/* Resume button */}
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                resumeSavedProgress();
              }}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-full transition-colors flex-shrink-0"
            >
              Resume
            </button>

            {/* Dismiss button */}
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                clearSavedProgress();
              }}
              className="p-2 text-secondary hover:text-white transition-colors flex-shrink-0"
              aria-label="Dismiss"
              title="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Check if current track has multiple versions
  const hasVersions = currentItem && currentItem.availableVersions.length > 1;

  const qualityInfo = getQualityBadge(preferredQuality);

  // Jamify/Spotify style - horizontal bottom player bar
  // MOBILE: Mini player (Spotify-style) - anchored to bottom as unified dock
  if (isMobile) {
    // Don't render mini player if full player is expanded
    if (isPlayerExpanded) return null;

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

        <div className="fixed left-0 right-0 z-[40]" style={{ bottom: 'calc(50px + env(safe-area-inset-bottom, 0px))' }}>
          <div className={`border-t border-accent/20 bg-gradient-to-b from-surface-elevated to-surface-card backdrop-blur-lg ${reducedMotion ? 'reduce-motion' : ''}`}>
            {/* Mini player card with swipe gesture */}
            <div
              {...swipeHandlers}
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
                  style={{ width: `${streamingStats.bufferedPercent}%` }}
                />
                <div
                  className={`h-full bg-white relative z-[1] transition-all duration-150 ${isBuffering ? 'animate-pulse' : ''}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center p-2 gap-3">
                {/* Tappable area to expand */}
                <button
                  onClick={() => {
                    vibrate(BUTTON_PRESS);
                    expandPlayer();
                  }}
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
                        onLoad={() => setImageLoaded(true)}
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

                  {/* Title/Artist */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{currentItem?.albumSource ? <><span className="text-tertiary">{(currentItem.albumSource.originalTrackIndex ?? 0) + 1}.</span> {currentSong.title}</> : currentSong.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-white/70 truncate flex-shrink">{currentSong.artistName}</p>
                    </div>
                  </div>
                </button>

                {/* Quality badge - clickable, positioned after song info */}
                <div className="relative flex-shrink-0" ref={qualityPopupRef}>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        vibrate(BUTTON_PRESS);
                        setShowQualityPopup(!showQualityPopup);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-surface-card/90 border border-default rounded-md hover:border-accent transition-colors active:scale-95"
                      aria-label="Change audio quality"
                      type="button"
                    >
                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                      <span className="text-[10px] font-semibold text-accent uppercase tracking-wide">
                        {qualityInfo.format}
                      </span>
                    </button>

                    {/* Source - ALWAYS VISIBLE */}
                    <span
                      className="text-[9px] text-tertiary italic leading-tight truncate max-w-[120px]"
                      title={currentSong?.lineage || 'Source not specified'}
                    >
                      {formatLineage(currentSong?.lineage, 35)}
                    </span>
                  </div>

                  {/* Quality popup menu */}
                  {showQualityPopup && (
                    <QualityPopup
                      preferredQuality={preferredQuality}
                      onSelect={(q) => { vibrate(BUTTON_PRESS); setPreferredQuality(q); }}
                      onClose={() => setShowQualityPopup(false)}
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
                    vibrate(BUTTON_PRESS);
                    togglePlay();
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
              </div>
            </div>

            {/* Queue strip hidden on mobile — takes up too much space. Queue accessible via full player. */}
          </div>
        </div>
      </>
    );
  }

  // DESKTOP: Redesigned layout — progress on top, 3-column content, queue strip below
  const recordingBadge = getRecordingBadge(currentSong.lineage, currentSong.recordingType);

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

      {/* Minimized tag bar — shown when player is minimized */}
      {isPlayerMinimized && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[40] flex justify-end pr-4 pointer-events-none"
          style={{
            animation: reducedMotion ? 'none' : 'minimizedTagSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        >
          <div className="pointer-events-auto flex items-center gap-1 rounded-t-xl bg-surface-elevated border border-b-0 border-accent/30 hover:border-accent shadow-lg shadow-black/40 transition-colors">
            {/* Restore area — click to expand */}
            <button
              onClick={() => { vibrate(BUTTON_PRESS); restorePlayer(); }}
              className="flex items-center gap-3 pl-4 pr-2 py-2"
              aria-label="Restore player"
            >
              <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
              <span className="text-xs text-white truncate max-w-[200px]">
                {currentSong.title}
              </span>
              <span className="text-xs text-tertiary">&middot;</span>
              <span className="text-xs text-secondary truncate max-w-[120px]">
                {currentSong.artistName}
              </span>
            </button>

            {/* Play/Pause — separate click target */}
            <button
              onClick={(e) => { e.stopPropagation(); vibrate(BUTTON_PRESS); togglePlay(); }}
              className="flex items-center justify-center w-8 h-8 mr-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-[40] bg-surface-player-deep player-glow-line shadow-[0_-8px_40px_rgba(0,0,0,0.4)] ${isPlayerMinimized ? 'pointer-events-none' : ''}`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          borderTop: '1px solid color-mix(in srgb, var(--border-default) 19%, transparent)',
          transform: isPlayerMinimized ? 'translateY(100%)' : 'translateY(0)',
          transition: reducedMotion ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Pull-tab — right-aligned above player (open state) */}
        {!isPlayerMinimized && (
          <button
            onClick={() => { vibrate(BUTTON_PRESS); minimizePlayer(); }}
            className="absolute -top-7 right-4 px-4 py-1 rounded-t-lg
                       bg-surface-player-bar border border-b-0 border-border/30
                       hover:border-accent-secondary text-secondary hover:text-accent-secondary
                       transition-colors flex items-center gap-2 z-50 shadow-md shadow-black/20"
            aria-label="Minimize player"
            title="Minimize player (M)"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-[10px] font-jb-mono uppercase tracking-widest font-semibold">
              Now Playing
            </span>
          </button>
        )}

        {/* Now-playing bar — 3-layer structure */}
        <div className="relative" style={{ background: 'var(--player-surface-deep)', borderBottom: '1px solid color-mix(in srgb, var(--border-default) 19%, transparent)' }}>
          {/* Layer 2: Gradient shadow overlay — bar color at varying opacity over deep base */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--player-surface-bar) 95%, transparent) 0%, color-mix(in srgb, var(--player-surface-bar) 75%, transparent) 50%, color-mix(in srgb, var(--player-surface-bar) 85%, transparent) 100%)' }}
          />
          {/* Glow line at top */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent-secondary) 35%, transparent), color-mix(in srgb, var(--accent-secondary) 15%, transparent), transparent)' }}
          />
          {/* Layer 3: Controls and content */}
          <div
            id="player-controls"
            className="relative px-6 py-3.5 flex items-center gap-[18px]"
            role="region"
            aria-label="Audio player"
          >
          {/* Left section — Album art + track meta + action buttons */}
          <div className="flex items-center gap-4 min-w-0 flex-shrink-0 w-[260px]">
            {/* Album art — with teal gradient overlay */}
            <div className="w-[60px] h-[60px] bg-surface-elevated flex-shrink-0 rounded-lg relative overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              {currentItem?.albumSource?.coverArt ? (
                <Image
                  src={currentItem.albumSource.coverArt}
                  alt={`${currentItem?.albumSource?.albumName} by ${currentSong.artistName}`}
                  width={60}
                  height={60}
                  quality={85}
                  onLoad={() => setImageLoaded(true)}
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
              {/* EQ bars overlay */}
              {isPlaying && (
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
              {/* Recording badge overlay */}
              {recordingBadge && recordingBadge.show && (
                <span
                  className="absolute top-1 right-1 px-1 py-0.5 text-[7px] font-bold rounded uppercase tracking-wider leading-none"
                  style={{ backgroundColor: recordingBadge.bgColor, color: recordingBadge.textColor }}
                >
                  {recordingBadge.text}
                </span>
              )}
            </div>

            {/* Track meta */}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-white font-semibold truncate hover:underline cursor-pointer leading-tight">
                {currentItem?.albumSource ? <><span className="text-tertiary">{(currentItem.albumSource.originalTrackIndex ?? 0) + 1}.</span> {currentSong.title}</> : currentSong.title}
              </p>
              <p className="text-[13px] text-accent-secondary truncate hover:underline cursor-pointer leading-tight mt-0.5">
                {currentSong.artistName}
              </p>
              {/* Venue + date line */}
              {(currentSong.showVenue || currentSong.showDate) && (
                <p className="text-[11.5px] text-tertiary truncate mt-0.5">
                  {currentSong.showVenue}{currentSong.showVenue && currentSong.showDate ? ' \u00b7 ' : ''}{currentSong.showDate}
                </p>
              )}
              {/* Action buttons row */}
              <div className="flex items-center gap-2 mt-1">
                {/* Like */}
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
                  className={`transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-accent rounded ${
                    currentSong && isInWishlist(currentSong.id) ? 'text-accent' : 'text-tertiary hover:text-accent-secondary'
                  }`}
                  aria-label={currentSong && isInWishlist(currentSong.id) ? 'Remove from favorites' : 'Add to favorites'}
                  title={currentSong && isInWishlist(currentSong.id) ? 'Unlike (L)' : 'Like (L)'}
                >
                  {currentSong && isInWishlist(currentSong.id) ? (
                    <svg className="w-[15px] h-[15px]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
                {/* Share */}
                <ShareButton title={currentSong.title} artistName={currentSong.artistName} />
                {/* Download */}
                <DownloadButton streamUrl={currentSong.streamUrl} title={currentSong.title} artistName={currentSong.artistName} />
              </div>
            </div>
          </div>

          {/* Center section — Transport controls + progress bar below */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            {/* Transport controls row */}
            <div className="flex items-center gap-5">
              {/* Previous */}
              <button
                onClick={() => { vibrate(BUTTON_PRESS); playPrev(); }}
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
                onClick={() => { vibrate(BUTTON_PRESS); togglePlay(); }}
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
                onClick={() => { vibrate(BUTTON_PRESS); playNext(); }}
                disabled={isLastItem}
                className="text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded"
                aria-label="Next track"
                title="Next (N)"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              {/* Repeat — hidden from transport row, accessible via keyboard shortcut (R) */}
            </div>

            {/* Progress bar row — below transport controls */}
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
                  seek(percent * duration);
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
                  style={{ width: `${streamingStats.bufferedPercent}%` }}
                />
                <div
                  className={`h-full rounded-full relative z-[1] transition-colors ${isBuffering ? 'animate-pulse' : ''}`}
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, var(--accent-secondary), var(--quinary))',
                  }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--quinary)' }} />
                </div>
              </div>
              <span className="text-[11px] text-tertiary font-jb-mono w-10 flex-shrink-0">
                {formatDuration(Math.floor(duration))}
              </span>
            </div>
          </div>

          {/* Right section — Quality + source info + volume + queue toggle */}
          <div className="w-[30%] min-w-[200px] flex items-center justify-end gap-4">
            {/* Quality + source column */}
            <div className="relative" ref={qualityPopupRef}>
              <div className="flex flex-col items-end gap-px">
                <button
                  onClick={() => { vibrate(BUTTON_PRESS); setShowQualityPopup(!showQualityPopup); }}
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
                {/* Source lineage */}
                <span
                  className="text-[10px] text-secondary font-jb-mono leading-tight truncate max-w-[200px]"
                  title={currentSong?.lineage || 'Source not specified'}
                >
                  {formatLineage(currentSong?.lineage, 40)}
                </span>
                {/* Streaming stats */}
                {(streamingStats.networkType || streamingStats.downlinkMbps !== null || streamingStats.bufferedAhead > 0) && (
                  <span className="text-[9px] text-tertiary font-jb-mono leading-tight truncate max-w-[180px]">
                    {[
                      streamingStats.networkType?.toUpperCase(),
                      streamingStats.downlinkMbps !== null ? `${streamingStats.downlinkMbps} Mbps` : null,
                      streamingStats.bufferedAhead > 0 ? `${streamingStats.bufferedAhead.toFixed(1)}s buf` : null,
                    ].filter(Boolean).join(' \u00b7 ')}
                  </span>
                )}
              </div>

              {/* Quality popup menu */}
              {showQualityPopup && (
                <QualityPopup
                  preferredQuality={preferredQuality}
                  onSelect={(q) => { vibrate(BUTTON_PRESS); setPreferredQuality(q); }}
                  onClose={() => setShowQualityPopup(false)}
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
                  onClick={() => { vibrate(BUTTON_PRESS); setVolume(volume === 0 ? 0.7 : 0); }}
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
                <div className="w-20 group relative">
                  <div className="absolute top-1/2 left-0 h-1 rounded-full w-full -translate-y-1/2 pointer-events-none" style={{ backgroundColor: 'color-mix(in srgb, var(--border-default) 25%, transparent)' }}>
                    <div
                      className="h-full rounded-full transition-colors"
                      style={{ backgroundColor: 'var(--text-secondary)', width: `${volume * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    aria-label="Volume control"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(volume * 100)}
                    aria-valuetext={`${Math.round(volume * 100)} percent`}
                    className="w-full h-1 bg-transparent rounded-full appearance-none cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:shadow-md"
                  />
                </div>
              </>
            )}

            {/* NOW PLAYING toggle — pill button */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (queuePreviewTimeoutRef.current) clearTimeout(queuePreviewTimeoutRef.current);
                queuePreviewTimeoutRef.current = setTimeout(() => {
                  if (!isQueueOpen) setShowQueuePreview(true);
                }, 300);
              }}
              onMouseLeave={() => {
                if (queuePreviewTimeoutRef.current) clearTimeout(queuePreviewTimeoutRef.current);
                setShowQueuePreview(false);
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate(BUTTON_PRESS);
                  setShowQueuePreview(false);
                  toggleQueue();
                }}
                className={`flex items-center gap-[5px] px-3 py-[5px] rounded font-jb-mono text-[10px] font-medium uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
                  isQueueOpen
                    ? 'text-accent-secondary'
                    : 'text-secondary hover:text-white'
                }`}
                style={{ backgroundColor: 'color-mix(in srgb, var(--border-default) 25%, transparent)', border: '1px solid color-mix(in srgb, var(--border-default) 19%, transparent)', borderRadius: '4px' }}
                aria-label={isQueueOpen ? 'Close queue' : 'Open queue'}
                title="Queue (Q)"
              >
                <svg className={`w-3 h-3 transition-transform ${isQueueOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
                <span>Now Playing</span>
              </button>

              {/* Queue preview tooltip */}
              {showQueuePreview && !isQueueOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-80 bg-surface-base border border-default rounded-lg shadow-2xl overflow-hidden z-50 animate-fadeIn">
                  <QueuePreview />
                  <div className="px-3 py-2 bg-surface-card border-t border-default">
                    <p className="text-[10px] text-tertiary text-center">
                      Click to open full queue
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Queue strip — draggable cards with grip handles */}
        {upcomingTracks.length > 0 && (
          <div className="px-6 pt-2.5 pb-3.5" style={{ background: 'var(--player-surface-queue)', borderTop: '1px solid color-mix(in srgb, var(--player-surface-bar) 20%, transparent)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-jb-mono font-bold uppercase tracking-widest" style={{ color: 'var(--quinary)' }}>Up</span>
              <span className="text-[10px] font-jb-mono uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>Next</span>
              <span className="text-[10px] text-tertiary font-jb-mono uppercase tracking-wider">&middot; {totalUpcoming} tracks</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(200,180,104,0.25), transparent)' }} />
              <span className="text-[10px] text-tertiary italic">drag to reorder</span>
            </div>
            <div className="relative">
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
                  <div className="flex gap-2 overflow-x-auto queue-scrollbar pb-1">
                    {upcomingTracks.map(({ item, absoluteIndex }, i) => (
                      <SortableQueueChip
                        key={item.queueId}
                        item={item}
                        chipIndex={i + 1}
                        absoluteIndex={absoluteIndex}
                        onPlay={handleChipPlay}
                        onRemove={removeItem}
                        onSelectVersion={(queueId, song) => selectVersion(queueId, song)}
                        preferredQuality={preferredQuality}
                        isActive={i === 0}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {activeDragItem ? (
                    <QueueChip
                      item={activeDragItem.item}
                      chipIndex={upcomingTracks.findIndex(t => t.item.queueId === activeDragItem.item.queueId) + 1}
                      absoluteIndex={activeDragItem.absoluteIndex}
                      onPlay={() => {}}
                      preferredQuality={preferredQuality}
                      isDragging
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
              {/* Right fade mask */}
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface-player-queue to-transparent pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
