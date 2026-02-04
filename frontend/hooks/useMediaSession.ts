import { useEffect, useRef } from 'react';
import { Song } from '@/lib/types';

interface UseMediaSessionProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
}

/**
 * useMediaSession - Integrates with the Media Session API for lock screen controls
 * and system notification integration
 *
 * Provides:
 * - Lock screen playback controls (play/pause/next/previous/seek)
 * - System notification with album art, title, artist
 * - Progress bar and position updates
 * - Keyboard media key support
 */
export function useMediaSession({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
}: UseMediaSessionProps) {
  const artworkLoadedRef = useRef<Set<string>>(new Set());
  const lastPositionUpdateRef = useRef<number>(0);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);

  // Keep refs in sync without triggering re-renders
  currentTimeRef.current = currentTime;
  durationRef.current = duration;

  // Feature detection
  const isSupported = typeof window !== 'undefined' && 'mediaSession' in navigator;

  // Update metadata when song changes
  useEffect(() => {
    if (!isSupported || !currentSong) {
      // Clear metadata when no song is playing
      if (isSupported && !currentSong) {
        navigator.mediaSession.metadata = null;
      }
      return;
    }

    // Prepare artwork array
    const artwork: MediaImage[] = [];

    if (currentSong.albumArt) {
      // Check if artwork has loaded successfully before
      const artworkKey = currentSong.albumArt;

      // Try to use the album art
      const artworkSizes = ['96x96', '128x128', '192x192', '256x256', '384x384', '512x512'];
      artworkSizes.forEach(size => {
        artwork.push({
          src: currentSong.albumArt,
          sizes: size,
          type: 'image/jpeg',
        });
      });

      // Preload artwork to detect errors
      if (!artworkLoadedRef.current.has(artworkKey)) {
        const img = new Image();
        img.onload = () => {
          artworkLoadedRef.current.add(artworkKey);
        };
        img.onerror = () => {
          console.warn('[MediaSession] Failed to load artwork:', artworkKey);
          // Don't add to loaded set - will retry next time
        };
        img.src = artworkKey;
      }
    }

    // Set metadata
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artistName,
        album: currentSong.albumName,
        artwork: artwork.length > 0 ? artwork : undefined,
      });
    } catch (error) {
      console.error('[MediaSession] Failed to set metadata:', error);
    }
  }, [currentSong, isSupported]);

  // Update playback state when playing/paused
  useEffect(() => {
    if (!isSupported) return;

    try {
      if (currentSong) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } else {
        navigator.mediaSession.playbackState = 'none';
      }
    } catch (error) {
      console.error('[MediaSession] Failed to set playback state:', error);
    }
  }, [isPlaying, currentSong, isSupported]);

  // Register action handlers
  useEffect(() => {
    if (!isSupported) return;

    try {
      navigator.mediaSession.setActionHandler('play', onPlay);
      navigator.mediaSession.setActionHandler('pause', onPause);
      navigator.mediaSession.setActionHandler('nexttrack', onNext);
      navigator.mediaSession.setActionHandler('previoustrack', onPrevious);

      // Seek support
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          onSeek(details.seekTime);
        }
      });

      // Optional: seek forward/backward by 10 seconds (read from refs to avoid re-registering on every time update)
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        onSeek(Math.min(currentTimeRef.current + skipTime, durationRef.current));
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        onSeek(Math.max(currentTimeRef.current - skipTime, 0));
      });
    } catch (error) {
      console.error('[MediaSession] Failed to register action handlers:', error);
    }

    // Cleanup action handlers
    return () => {
      if (!isSupported) return;

      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [isSupported, onPlay, onPause, onNext, onPrevious, onSeek]);

  // Update position state (progress bar in lock screen) - throttled to max 1x/second
  useEffect(() => {
    if (!isSupported || !currentSong || !duration || duration <= 0) return;

    const now = Date.now();
    if (now - lastPositionUpdateRef.current < 1000) return;
    lastPositionUpdateRef.current = now;

    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1.0,
        position: Math.min(currentTime, duration),
      });
    } catch (error) {
      // Some browsers don't support position state or throw errors
      // with invalid values - silently ignore
      console.debug('[MediaSession] Position state error:', error);
    }
  }, [currentTime, duration, currentSong, isSupported]);

  return {
    isSupported,
  };
}
