'use client';

// EightPmFullPlayer - Spotify-style full-screen mobile player

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useWishlist } from '@/context/WishlistContext';
import { useMobileUI } from '@/context/MobileUIContext';
import { useQuality } from '@/context/QualityContext';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useBatteryOptimization } from '@/hooks/useBatteryOptimization';
import { useSleepTimer, SleepTimerPreset } from '@/hooks/useSleepTimer';
import { useShare } from '@/hooks/useShare';
import { useHaptic } from '@/hooks/useHaptic';
import { formatDuration } from '@/lib/api';
import Link from 'next/link';
import ShareModal from '@/components/ShareModal';
import { formatLineage } from '@/lib/lineageUtils';
import { useStreamingStats } from '@/hooks/useStreamingStats';

export default function EightPmFullPlayer() {
  const { isPlayerExpanded, collapsePlayer, isTransitioning } = useMobileUI();
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

  if (!currentSong || !isPlayerExpanded) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Quality options data
  const qualityOptions = [
    { value: 'high' as const, label: 'High', format: 'FLAC', bitrate: 'Lossless', size: '~45MB' },
    { value: 'medium' as const, label: 'Medium', format: 'MP3', bitrate: '320kbps', size: '~10MB', recommended: true },
    { value: 'low' as const, label: 'Low', format: 'MP3', bitrate: '128kbps', size: '~4MB' }
  ];

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

  return (
    <div
      {...swipeHandlers}
      className={`fixed inset-0 z-50 bg-gradient-to-b from-[#3a3632] to-[#1c1a17] flex flex-col md:hidden safe-top safe-bottom full-screen-player prevent-overscroll touch-action-pan-y ${
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
          <p className="text-[10px] text-[#8a8478] uppercase tracking-wider">Playing from</p>
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
            className={`p-2 -mr-2 btn-touch ${isSettingsOpen ? 'text-[#d4a060]' : 'text-white'}`}
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
            <div className="w-full h-full bg-[#2d2a26] flex items-center justify-center" aria-hidden="true">
              <svg className="w-24 h-24 text-[#3a3632]" fill="currentColor" viewBox="0 0 24 24">
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
              {currentItem?.albumSource ? <><span className="text-[#6a6458]">{(currentItem.albumSource.originalTrackIndex ?? 0) + 1}.</span> {currentSong.title}</> : currentSong.title}
            </h2>
            <Link
              href={`/artists/${currentSong.artistSlug || ''}`}
              onClick={() => {
                vibrate(BUTTON_PRESS);
                collapsePlayer();
              }}
              className="text-[#8a8478] hover:text-white hover:underline truncate block mb-2"
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2a2520] border border-[#4a3a28] rounded-md hover:border-[#d4a060] transition-colors btn-touch"
                  aria-label="Change audio quality"
                >
                  <div className="w-1.5 h-1.5 bg-[#d4a060] rounded-full animate-pulse" />
                  <span className="text-[11px] font-semibold text-[#d4a060] uppercase tracking-wide">
                    {qualityInfo.format}
                  </span>
                  <span className="text-[11px] text-[#8a8478]">
                    {qualityInfo.bitrate}
                  </span>
                </button>

                {/* Source - ALWAYS VISIBLE */}
                <span
                  className="text-[9px] text-[#6a6458] italic leading-tight truncate max-w-[200px]"
                  title={currentSong?.lineage || 'Source not specified'}
                >
                  {formatLineage(currentSong?.lineage, 60)}
                </span>
              </div>

              {/* Quality popup menu */}
              {showQualityPopup && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#1c1a17] border border-[#4a3a28] rounded-lg shadow-2xl overflow-hidden z-50 animate-fadeIn">
                  {qualityOptions.map((option, index) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        vibrate(BUTTON_PRESS);
                        setPreferredQuality(option.value);
                        setShowQualityPopup(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-[#2a2520] transition-colors btn-touch ${
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
              currentSong && isInWishlist(currentSong.id) ? 'text-[#d4a060]' : 'text-[#8a8478]'
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
          className="w-full h-1 bg-[#3a3632] rounded-full cursor-pointer group relative"
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
          <span className="text-[11px] text-[#8a8478] font-mono">
            {formatDuration(Math.floor(currentTime))}
          </span>

          {/* Streaming stats (centered) */}
          {(streamingStats.networkType || streamingStats.downlinkMbps !== null || streamingStats.bufferedAhead > 0) && (
            <span className="text-[9px] text-[#6a6458] font-mono">
              {[
                streamingStats.networkType?.toUpperCase(),
                streamingStats.downlinkMbps !== null ? `${streamingStats.downlinkMbps} Mbps` : null,
                streamingStats.bufferedAhead > 0 ? `${streamingStats.bufferedAhead.toFixed(1)}s buf` : null,
              ].filter(Boolean).join(' · ')}
            </span>
          )}

          <span className="text-[11px] text-[#8a8478] font-mono">
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
            className={`p-3 btn-touch ${queue.repeat === 'off' ? 'text-[#8a8478]' : 'text-[#d4a060]'}`}
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
      {(() => {
        // Get upcoming items from flat queue
        const upcomingItems = queue.items.slice(queue.cursorIndex + 1);
        const displayItems = isQueueExpanded ? upcomingItems.slice(0, 10) : upcomingItems.slice(0, 3);
        const hasMoreItems = upcomingItems.length > displayItems.length;

        if (upcomingItems.length === 0) return null;

        return (
          <div className="px-4 pb-4">
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                setIsQueueExpanded(!isQueueExpanded);
              }}
              className="w-full flex items-center justify-between py-2 text-left"
            >
              <span className="text-xs text-[#8a8478] uppercase tracking-wider">
                Up Next ({upcomingItems.length})
              </span>
              <svg
                className={`w-4 h-4 text-[#8a8478] transition-transform ${isQueueExpanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>

            <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isQueueExpanded ? 'max-h-80' : 'max-h-32'}`}>
              {displayItems.map((item, index) => (
                <button
                  key={item.queueId}
                  onClick={() => {
                    vibrate(BUTTON_PRESS);
                    const actualIndex = queue.cursorIndex + 1 + index;
                    playFromQueue(actualIndex);
                  }}
                  className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#2d2a26] active:bg-[#3a3632] transition-colors text-left"
                >
                  <span className="text-xs text-[#6a6458] w-5 text-center font-mono">
                    {item.albumSource ? (item.albumSource.originalTrackIndex ?? 0) + 1 : index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.albumSource ? <><span className="text-[#6a6458]">{(item.albumSource.originalTrackIndex ?? 0) + 1}.</span> {item.trackTitle}</> : item.trackTitle}</p>
                    <p className="text-xs text-[#8a8478] truncate">{item.song.artistName}</p>
                  </div>
                  <span className="text-xs text-[#6a6458] font-mono flex-shrink-0">
                    {formatDuration(item.song.duration)}
                  </span>
                </button>
              ))}

              {hasMoreItems && !isQueueExpanded && (
                <p className="text-[10px] text-[#6a6458] text-center py-1 italic">
                  +{upcomingItems.length - 3} more • tap to expand
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Bottom Actions */}
      <div className="px-8 pb-6">
        <div className="flex items-center justify-between">
          {/* Device */}
          <button className="p-2 text-[#8a8478] btn-touch" aria-label="Connect to a device">
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
            className={`p-2 btn-touch ${isQueueOpen ? 'text-[#d4a060]' : 'text-[#8a8478]'}`}
            aria-label="Open full queue"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center md:justify-center" onClick={() => setIsSettingsOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="bg-[#2d2a26] w-full md:w-96 md:rounded-lg p-6 space-y-4 safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="settings-title" className="text-white text-lg font-bold">Sleep Timer</h3>
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  setIsSettingsOpen(false);
                }}
                className="p-2 text-[#8a8478] hover:text-white"
                aria-label="Close settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Active timer display */}
            {sleepTimer.isActive && (
              <div className="bg-[#d4a060]/20 border border-[#d4a060] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#d4a060] text-sm font-medium">Timer Active</p>
                    <p className="text-white text-2xl font-bold font-mono mt-1">
                      {Math.floor(sleepTimer.timeRemaining / 60)}:{(sleepTimer.timeRemaining % 60).toString().padStart(2, '0')}
                    </p>
                    <p className="text-[#8a8478] text-xs mt-1">
                      Music will stop in {Math.floor(sleepTimer.timeRemaining / 60)} minute{Math.floor(sleepTimer.timeRemaining / 60) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      vibrate(BUTTON_PRESS);
                      sleepTimer.cancelTimer();
                    }}
                    className="px-4 py-2 bg-[#8a8478]/20 text-white rounded-full text-sm font-medium hover:bg-[#8a8478]/30"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Timer presets */}
            <div className="space-y-2">
              <p className="text-[#8a8478] text-sm mb-3">Set a timer to automatically stop music</p>
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  sleepTimer.startTimer('5min');
                  setIsSettingsOpen(false);
                }}
                className="w-full px-4 py-3 bg-[#3a3632] hover:bg-[#3a3632] text-white rounded-lg text-left font-medium transition-colors"
              >
                5 minutes
              </button>
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  sleepTimer.startTimer('15min');
                  setIsSettingsOpen(false);
                }}
                className="w-full px-4 py-3 bg-[#3a3632] hover:bg-[#3a3632] text-white rounded-lg text-left font-medium transition-colors"
              >
                15 minutes
              </button>
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  sleepTimer.startTimer('30min');
                  setIsSettingsOpen(false);
                }}
                className="w-full px-4 py-3 bg-[#3a3632] hover:bg-[#3a3632] text-white rounded-lg text-left font-medium transition-colors"
              >
                30 minutes
              </button>
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  sleepTimer.startTimer('1hr');
                  setIsSettingsOpen(false);
                }}
                className="w-full px-4 py-3 bg-[#3a3632] hover:bg-[#3a3632] text-white rounded-lg text-left font-medium transition-colors"
              >
                1 hour
              </button>
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  sleepTimer.startTimer('end-of-track');
                  setIsSettingsOpen(false);
                }}
                className="w-full px-4 py-3 bg-[#3a3632] hover:bg-[#3a3632] text-white rounded-lg text-left font-medium transition-colors"
              >
                End of current track
              </button>
            </div>

            {/* Crossfade Settings */}
            <div className="border-t border-[#3a3632] pt-4 mt-4">
              <h4 className="text-white text-sm font-medium mb-3">Crossfade</h4>
              <p className="text-[#8a8478] text-xs mb-3">Seamless transition between songs</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#8a8478] text-sm">
                    {crossfadeDuration === 0 ? 'Off' : `${crossfadeDuration} second${crossfadeDuration !== 1 ? 's' : ''}`}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={crossfadeDuration}
                  onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                  className="w-full h-1 bg-[#3a3632] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #d4a060 0%, #d4a060 ${(crossfadeDuration / 12) * 100}%, #3a3632 ${(crossfadeDuration / 12) * 100}%, #3a3632 100%)`
                  }}
                />

                <div className="flex justify-between text-[10px] text-[#8a8478]">
                  <span>Off</span>
                  <span>12s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timer notification (1 minute warning) */}
      {showTimerNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#d4a060] text-white px-6 py-3 rounded-full shadow-lg animate-fade-in">
          <p className="text-sm font-medium">Music will stop in 1 minute</p>
        </div>
      )}

      {/* Active timer indicator (bottom of screen when not in settings) */}
      {sleepTimer.isActive && !isSettingsOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#2d2a26]/95 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg">
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
