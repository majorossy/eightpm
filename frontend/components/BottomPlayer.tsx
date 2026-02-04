'use client';

// BottomPlayer - fixed audio player bar (Jamify/Spotify theme)

import { useState, useEffect, useRef, useMemo } from 'react';
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
import { getSelectedSong } from '@/lib/queueTypes';
import { formatLineage } from '@/lib/lineageUtils';
import ShareButton from '@/components/ShareButton';
import DownloadButton from '@/components/DownloadButton';
import QueuePreview from '@/components/QueuePreview';

// Custom hook for screen reader announcements
function usePlayerAnnouncements(
  currentSong: { title: string; artistName: string; id: string } | null,
  isPlaying: boolean
) {
  const [announcement, setAnnouncement] = useState('');
  const prevSongIdRef = useRef<string | null>(null);
  const prevIsPlayingRef = useRef<boolean | null>(null);

  // Announce track changes
  useEffect(() => {
    if (currentSong && currentSong.id !== prevSongIdRef.current) {
      setAnnouncement(`Now playing: ${currentSong.title} by ${currentSong.artistName}`);
      prevSongIdRef.current = currentSong.id;
      const timer = setTimeout(() => setAnnouncement(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentSong]);

  // Announce play/pause state changes (only after initial load)
  useEffect(() => {
    if (currentSong && prevIsPlayingRef.current !== null && isPlaying !== prevIsPlayingRef.current) {
      setAnnouncement(isPlaying ? 'Playing' : 'Paused');
      const timer = setTimeout(() => setAnnouncement(''), 2000);
      return () => clearTimeout(timer);
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying, currentSong]);

  return announcement;
}

export default function BottomPlayer() {
  const { isMobile, expandPlayer, isPlayerExpanded, isTransitioning } = useMobileUI();
  const { reducedMotion } = useBatteryOptimization();
  const { vibrate, BUTTON_PRESS, SWIPE_COMPLETE } = useHaptic();
  const { preferredQuality, setPreferredQuality, getStreamUrl } = useQuality();
  const {
    currentSong,
    isPlaying,
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
  } = usePlayer();

  const {
    queue,
    currentTrack,
    hasAlbum,
    totalTracks,
    isFirstTrack,
    isLastTrack,
    hasUpNext,
    selectVersion,
    setRepeat,
    setShuffle,
  } = useQueue();

  const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } = useWishlist();

  // Detect iOS — programmatic volume control doesn't work on iOS Safari
  const isIOS = useMemo(() => typeof navigator !== 'undefined' && /(iPad|iPhone|iPod)/.test(navigator.userAgent), []);

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

  // Show resume UI when there's saved progress but no current song
  if (!currentSong && savedProgress) {
    return (
      <div className={`fixed ${isMobile ? 'bottom-[50px] left-2 right-2' : 'bottom-[50px] left-0 right-0 h-[90px] px-4'} z-50`}>
        <div className={`${isMobile ? 'bg-[#5c4d3d] rounded-lg p-3' : 'bg-[#252220] border-t border-[#2d2a26] h-full flex items-center justify-center'}`}>
          <div className={`flex items-center gap-4 ${isMobile ? '' : 'max-w-xl'}`}>
            {/* Resume info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#8a8478] mb-1">Continue where you left off</p>
              <p className="text-sm text-white font-medium truncate">{savedProgress.title}</p>
              <p className="text-xs text-[#8a8478] truncate">{savedProgress.artistName} • {formatDuration(Math.floor(savedProgress.position))}</p>
            </div>

            {/* Resume button */}
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                resumeSavedProgress();
              }}
              className="px-4 py-2 bg-[#d4a060] hover:bg-[#c08a40] text-white text-sm font-semibold rounded-full transition-colors flex-shrink-0"
            >
              Resume
            </button>

            {/* Dismiss button */}
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                clearSavedProgress();
              }}
              className="p-2 text-[#8a8478] hover:text-white transition-colors flex-shrink-0"
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
  const hasVersions = currentTrack && currentTrack.availableVersions.length > 1;

  // Get quality badge based on user's SELECTED preference
  const getQualityBadge = () => {
    // Show selected quality preference (applies to next track)
    if (preferredQuality === 'high') {
      return { format: 'FLAC', bitrate: 'Lossless', label: 'High' };
    } else if (preferredQuality === 'low') {
      return { format: 'MP3', bitrate: '128k', label: 'Low' };
    } else {
      return { format: 'MP3', bitrate: '320k', label: 'Medium' };
    }
  };

  const qualityInfo = getQualityBadge();

  // Quality options data
  const qualityOptions = [
    { value: 'high' as const, label: 'High', format: 'FLAC', bitrate: 'Lossless', size: '~45MB' },
    { value: 'medium' as const, label: 'Medium', format: 'MP3', bitrate: '320kbps', size: '~10MB', recommended: true },
    { value: 'low' as const, label: 'Low', format: 'MP3', bitrate: '128kbps', size: '~4MB' }
  ];

  // Jamify/Spotify style - horizontal bottom player bar
  // MOBILE: Mini player (Spotify-style) - positioned above bottom tabs
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

        <div className="fixed bottom-[50px] left-2 right-2 z-50">
          {/* Mini player card with swipe gesture */}
          <div
            {...swipeHandlers}
            className={`bg-[#5c4d3d] rounded-lg overflow-hidden mini-player touch-action-pan-y prevent-overscroll ${
              isPulsing && !reducedMotion ? 'pulse-glow' : ''
            } ${swipeHandlers.isDragging ? 'dragging' : ''} ${reducedMotion ? 'reduce-motion' : ''}`}
            style={{
              transform: swipeHandlers.isDragging
                ? `translateY(${Math.min(0, swipeHandlers.dragOffset.y)}px)`
                : undefined,
              willChange: swipeHandlers.isDragging ? 'transform' : 'auto',
            }}
          >
            {/* Drag hint pill */}
            <div className="drag-hint" />

            {/* Progress bar */}
            <div className="h-[2px] bg-[#3a3632]">
              <div
                className="h-full bg-white transition-all duration-150"
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
                <div className="w-10 h-10 bg-[#2d2a26] flex-shrink-0 rounded relative">
                  {queue.album?.coverArt ? (
                    <Image
                      src={queue.album.coverArt}
                      alt={queue.album.name || 'Album cover'}
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
                      <svg className="w-4 h-4 text-[#3a3632]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Title/Artist */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{currentSong.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-white/70 truncate flex-shrink">{currentSong.artistName}</p>
                  </div>
                </div>
              </button>

              {/* Quality badge - clickable, positioned after song info */}
              <div className="relative flex-shrink-0 z-[100]" ref={qualityPopupRef}>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      vibrate(BUTTON_PRESS);
                      setShowQualityPopup(!showQualityPopup);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-[#2a2520]/90 border border-[#4a3a28] rounded-md hover:border-[#d4a060] transition-colors active:scale-95"
                    aria-label="Change audio quality"
                    type="button"
                  >
                    <div className="w-1.5 h-1.5 bg-[#d4a060] rounded-full animate-pulse" />
                    <span className="text-[10px] font-semibold text-[#d4a060] uppercase tracking-wide">
                      {qualityInfo.format}
                    </span>
                  </button>

                  {/* Source - ALWAYS VISIBLE */}
                  <span
                    className="text-[9px] text-[#6a6458] italic leading-tight truncate max-w-[120px]"
                    title={currentSong?.lineage || 'Source not specified'}
                  >
                    {formatLineage(currentSong?.lineage, 35)}
                  </span>
                </div>

                {/* Quality popup menu */}
                {showQualityPopup && (
                  <div className="fixed bottom-[120px] right-[calc(8px+env(safe-area-inset-right,0px))] w-64 bg-[#1c1a17] border border-[#4a3a28] rounded-lg shadow-2xl overflow-visible z-[9999] animate-fadeIn">
                    {qualityOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          vibrate(BUTTON_PRESS);
                          setPreferredQuality(option.value);
                          setShowQualityPopup(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-[#2a2520] transition-colors ${
                          option.value === preferredQuality ? 'bg-[#2a2520]' : ''
                        } ${index !== qualityOptions.length - 1 ? 'border-b border-[#2a2520]' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-[#d4a060]">{option.label}</span>
                              {option.recommended && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-[#d4a060] text-[#1c1a17] rounded-full">
                                  Recommended
                                </span>
                              )}
                              {option.value === preferredQuality && (
                                <svg className="w-4 h-4 text-[#d4a060]" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="text-xs text-[#a89080] space-y-0.5">
                              <div>{option.format} • {option.bitrate} • {option.size}</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {/* Notice about quality change timing */}
                    <div className="px-4 py-2 bg-[#1c1a17] border-t border-[#2a2520]">
                      <p className="text-[10px] text-[#6a6458] text-center italic">
                        Quality changes apply to next track
                      </p>
                    </div>
                  </div>
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
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
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
      </div>
      </>
    );
  }

  // DESKTOP: Full 3-column layout - positioned above bottom nav (50px)
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

      <div id="player-controls" className="fixed bottom-[50px] left-0 right-0 h-[90px] bg-[#252220] border-t border-[#2d2a26] z-50 px-4 flex items-center" role="region" aria-label="Audio player">
        {/* Left section - Now playing info (30%) */}
        <div className="w-[30%] min-w-[180px] flex items-center gap-3">
          {/* Album art */}
          <div className="w-14 h-14 bg-[#2d2a26] flex-shrink-0 rounded relative">
            {queue.album?.coverArt ? (
              <Image
                src={queue.album.coverArt}
                alt={`${queue.album.name} by ${currentSong.artistName}`}
                width={56}
                height={56}
                quality={85}
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-cover rounded transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
                <svg className="w-6 h-6 text-[#3a3632]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          {/* Song info */}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white font-medium truncate hover:underline cursor-pointer">
              {currentSong.title}
            </p>
            <p className="text-xs text-[#8a8478] truncate hover:underline cursor-pointer">
              {currentSong.artistName}
            </p>
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
            className={`transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#d4a060] focus:ring-offset-2 focus:ring-offset-[#252220] rounded ${
              currentSong && isInWishlist(currentSong.id) ? 'text-[#d4a060]' : 'text-[#8a8478] hover:text-white'
            }`}
            aria-label={currentSong && isInWishlist(currentSong.id) ? 'Remove from favorites' : 'Add to favorites'}
            title={currentSong && isInWishlist(currentSong.id) ? 'Unlike (L)' : 'Like (L)'}
          >
            {currentSong && isInWishlist(currentSong.id) ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>

          {/* Share button */}
          <ShareButton
            title={currentSong.title}
            artistName={currentSong.artistName}
          />

          {/* Download button */}
          <DownloadButton
            streamUrl={currentSong.streamUrl}
            title={currentSong.title}
            artistName={currentSong.artistName}
          />
        </div>

        {/* Center section - Player controls (40%) */}
        <div className="w-[40%] max-w-[722px] flex flex-col items-center justify-center">
          {/* Controls */}
          <div className="flex items-center gap-4 mb-2">
            {/* Shuffle */}
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                setShuffle(!queue.shuffle);
              }}
              className={`transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a060] rounded ${
                queue.shuffle ? 'text-[#d4a060]' : 'text-[#8a8478] hover:text-white'
              }`}
              aria-label={queue.shuffle ? 'Disable shuffle' : 'Enable shuffle'}
              title={queue.shuffle ? 'Shuffle on (S)' : 'Shuffle off (S)'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
              </svg>
            </button>

            {/* Previous */}
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                playPrev();
              }}
              disabled={isFirstTrack && !hasUpNext}
              className="text-[#8a8478] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a060] rounded"
              aria-label="Previous track"
              title="Previous (P)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                togglePlay();
              }}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-[#d4a060] focus:ring-offset-2 focus:ring-offset-[#252220]"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
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

            {/* Next */}
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                playNext();
              }}
              disabled={isLastTrack && !hasUpNext}
              className="text-[#8a8478] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a060] rounded"
              aria-label="Next track"
              title="Next (N)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
              className={`transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a060] rounded ${
                queue.repeat === 'off' ? 'text-[#8a8478] hover:text-white' : 'text-[#d4a060]'
              }`}
              aria-label={`Repeat: ${queue.repeat}`}
              title={`Repeat: ${queue.repeat} (R)`}
            >
              {queue.repeat === 'one' ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                </svg>
              )}
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[11px] text-[#8a8478] font-mono w-10 text-right">
              {formatDuration(Math.floor(currentTime))}
            </span>
            <div
              className="flex-1 h-1 bg-[#3a3632] rounded-full cursor-pointer group relative"
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
              <div
                className="h-full bg-white group-hover:bg-[#d4a060] rounded-full relative transition-colors"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-[11px] text-[#8a8478] font-mono w-10">
              {formatDuration(Math.floor(duration))}
            </span>
          </div>
        </div>

        {/* Right section - Volume and queue (30%) */}
        <div className="w-[30%] min-w-[180px] flex items-center justify-end gap-3">
          {/* Quality indicator - clickable */}
          <div className="relative" ref={qualityPopupRef}>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  setShowQualityPopup(!showQualityPopup);
                }}
                className="flex items-center gap-1.5 px-2 py-1 bg-[#2a2520] border border-[#4a3a28] rounded-md hover:border-[#d4a060] transition-colors cursor-pointer"
                title="Change audio quality"
                aria-label="Change audio quality"
              >
                <div className="w-1.5 h-1.5 bg-[#d4a060] rounded-full animate-pulse" />
                <span className="text-[10px] font-semibold text-[#d4a060] uppercase tracking-wide">
                  {qualityInfo.format}
                </span>
                <span className="text-[10px] text-[#8a8478]">
                  {qualityInfo.bitrate}
                </span>
              </button>

              {/* Source - ALWAYS VISIBLE */}
              <span
                className="text-[9px] text-[#6a6458] italic leading-tight truncate max-w-[180px]"
                title={currentSong?.lineage || 'Source not specified'}
              >
                {formatLineage(currentSong?.lineage, 50)}
              </span>
            </div>

            {/* Quality popup menu */}
            {showQualityPopup && (
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-[#1c1a17] border border-[#4a3a28] rounded-lg shadow-2xl overflow-hidden z-50 animate-fadeIn">
                {qualityOptions.map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      vibrate(BUTTON_PRESS);
                      setPreferredQuality(option.value);
                      setShowQualityPopup(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-[#2a2520] transition-colors ${
                      option.value === preferredQuality ? 'bg-[#2a2520]' : ''
                    } ${index !== qualityOptions.length - 1 ? 'border-b border-[#2a2520]' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[#d4a060]">{option.label}</span>
                          {option.recommended && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-[#d4a060] text-[#1c1a17] rounded-full">
                              Recommended
                            </span>
                          )}
                          {option.value === preferredQuality && (
                            <svg className="w-4 h-4 text-[#d4a060]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="text-xs text-[#a89080]">
                          {option.format} • {option.bitrate} • {option.size}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {/* Notice about quality change timing */}
                <div className="px-4 py-2 bg-[#1c1a17] border-t border-[#2a2520]">
                  <p className="text-[10px] text-[#6a6458] text-center italic">
                    Quality changes apply to next track
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Queue button with preview */}
          <div
            className="relative"
            onMouseEnter={() => {
              if (queuePreviewTimeoutRef.current) {
                clearTimeout(queuePreviewTimeoutRef.current);
              }
              queuePreviewTimeoutRef.current = setTimeout(() => {
                if (!isQueueOpen) setShowQueuePreview(true);
              }, 300);
            }}
            onMouseLeave={() => {
              if (queuePreviewTimeoutRef.current) {
                clearTimeout(queuePreviewTimeoutRef.current);
              }
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
              className={`transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a060] rounded ${
                isQueueOpen ? 'text-[#d4a060]' : 'text-[#8a8478] hover:text-white'
              }`}
              aria-label={isQueueOpen ? 'Close queue' : 'Open queue'}
              title="Queue (Q)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
              </svg>
            </button>

            {/* Queue preview tooltip */}
            {showQueuePreview && !isQueueOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-80 bg-[#1c1a17] border border-[#2d2a26] rounded-lg shadow-2xl overflow-hidden z-50 animate-fadeIn">
                <QueuePreview />
                <div className="px-3 py-2 bg-[#252220] border-t border-[#2d2a26]">
                  <p className="text-[10px] text-[#6a6458] text-center">
                    Click to open full queue
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Volume — hidden on iOS where programmatic volume doesn't work */}
          {isIOS ? (
            <span className="text-[10px] text-[#8a8478] whitespace-nowrap">Use device buttons for volume</span>
          ) : (
            <>
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  setVolume(volume === 0 ? 0.7 : 0);
                }}
                className="text-[#8a8478] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a060] rounded"
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
              <div className="w-24 group relative">
                {/* Volume fill track */}
                <div className="absolute top-1/2 left-0 h-1 bg-[#3a3632] rounded-full w-full -translate-y-1/2 pointer-events-none">
                  <div
                    className="h-full bg-white group-hover:bg-[#d4a060] rounded-full transition-colors"
                    style={{ width: `${volume * 100}%` }}
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
      </div>
    </div>
    </>
  );
}
