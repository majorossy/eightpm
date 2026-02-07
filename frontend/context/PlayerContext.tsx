'use client';

// PlayerContext = Audio playback only
// Queue management is handled by QueueContext

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Song, Album } from '@/lib/types';
import { getBestVersion } from '@/lib/queueTypes';
import { useQueue } from './QueueContext';
import { useRecentlyPlayed } from './RecentlyPlayedContext';
import { useQuality } from './QualityContext';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useCrossfade } from '@/hooks/useCrossfade';
import { useToast } from '@/hooks/useToast';
import { useAudioAnalyzer, AudioAnalyzerData } from '@/hooks/useAudioAnalyzer';
import { trackSongPlay, trackSongComplete, trackPlaybackError } from '@/lib/analytics';

interface PlayerState {
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isQueueOpen: boolean;  // UI state for queue drawer
  crossfadeDuration: number;
  announcement: string; // ARIA live region announcement
}

interface PlayerContextType extends PlayerState {
  // Current song comes from QueueContext
  currentSong: Song | null;


  // Playback controls
  playSong: (song: Song) => void;
  togglePlay: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  playNext: () => void;
  playPrev: () => void;

  // Queue UI
  toggleQueue: () => void;

  // Play from queue (by track index in album)
  playFromQueue: (index: number) => void;

  // Album/track playback - delegates to QueueContext
  playAlbum: (album: Album, startIndex?: number) => void;

  // Play a specific version of a track within an album (for album page recording selection)
  playAlbumFromTrack: (album: Album, trackIndex: number, song: Song) => void;

  // Crossfade controls
  setCrossfadeDuration: (duration: number) => void;

  // Audio analyzer data for visualizations
  analyzerData: AudioAnalyzerData;

  // Audio element ref for streaming stats
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;

  // Legacy queue access for compatibility (maps from QueueContext)
  queue: Song[];
  queueIndex: number;

  // Saved playback progress (for resuming)
  savedProgress: {
    songId: string;
    position: number;
    title: string;
    artistName: string;
  } | null;
  resumeSavedProgress: () => void;
  clearSavedProgress: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const queueContext = useQueue();
  const { trackPlay } = useRecentlyPlayed();
  const { getStreamUrl, getLowerQualityUrl } = useQuality();
  const trackedSongsRef = useRef<Set<string>>(new Set()); // Track which songs we've already counted
  const completedSongsRef = useRef<Set<string>>(new Set()); // Track which songs completed (>90%)

  // Toast notifications for playback errors
  // Note: useToast may throw if not in ToastProvider - we handle this gracefully
  let toast: ReturnType<typeof useToast> | null = null;
  try {
    toast = useToast();
  } catch {
    // ToastProvider not available yet - this is fine during initial render
  }

  // Build legacy queue from QueueContext for compatibility
  const legacyQueue: Song[] = queueContext.queue.items.map(item => item.song);
  const legacyQueueIndex = queueContext.queue.cursorIndex;

  // Load crossfade duration from localStorage
  const [crossfadeDuration, setCrossfadeDurationState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crossfadeDuration');
      return saved ? parseInt(saved, 10) : 3;
    }
    return 3;
  });

  // Playback progress persistence
  const PROGRESS_STORAGE_KEY = '8pm_playback_progress';
  const progressSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save playback progress to localStorage
  const savePlaybackProgress = useCallback((song: Song, position: number, duration: number) => {
    // Don't save if position is too small (just started) or near end (almost finished)
    if (position < 5 || (duration > 0 && position > duration * 0.95)) {
      return;
    }

    try {
      const checkpoint = {
        songId: song.id,
        position,
        duration,
        timestamp: Date.now(),
        title: song.title,
        artistName: song.artistName,
        albumName: song.albumName,
        streamUrl: song.streamUrl,
      };
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(checkpoint));
    } catch (error) {
      console.error('Failed to save playback progress:', error);
    }
  }, []);

  // Clear saved progress (when song completes normally)
  const clearPlaybackProgress = useCallback(() => {
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear playback progress:', error);
    }
  }, []);

  // Load saved progress on mount
  const [savedProgress, setSavedProgress] = useState<{
    songId: string;
    position: number;
    duration: number;
    timestamp: number;
    title: string;
    artistName: string;
    albumName?: string;
    streamUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
        if (saved) {
          const checkpoint = JSON.parse(saved);
          // Only restore if less than 7 days old
          const ageInDays = (Date.now() - checkpoint.timestamp) / (1000 * 60 * 60 * 24);
          if (ageInDays < 7) {
            setSavedProgress(checkpoint);
          } else {
            localStorage.removeItem(PROGRESS_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to load playback progress:', error);
      }
    }
  }, []);

  // Track whether user has initiated playback this session.
  // Prevents auto-loading audio src from localStorage-restored queue on page load,
  // which would cascade through error-skip logic when backend is unreachable.
  const userInitiatedRef = useRef(false);

  // Retry state for playback error handling
  const retryCountRef = useRef(0);
  const retryingSongIdRef = useRef<string | null>(null);
  const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const waitingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearStallTimers = useCallback(() => {
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
  }, []);

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    isBuffering: false,
    volume: 0.7,
    currentTime: 0,
    duration: 0,
    isQueueOpen: false,
    crossfadeDuration,
    announcement: '',
  });

  // Single source of truth for current song from QueueContext
  const currentSong = queueContext.currentSong;

  // Crossfade hook setup
  const crossfade = useCrossfade({
    crossfadeDuration,
    onTrackEnd: () => {
      const nextItem = queueContext.advanceCursor();
      if (!nextItem) {
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    },
    getCurrentTime: () => state.currentTime,
    getDuration: () => state.duration,
  });

  // Helper to get current audio element
  const getAudio = () => crossfade.getCurrentAudio();

  // Audio analyzer for visualizations
  const { analyzerData, connectAudioElement, setVolume: setAnalyzerVolume } = useAudioAnalyzer();

  // Connect analyzer to active audio element when it changes or playback starts
  useEffect(() => {
    const audio = getAudio();
    if (audio && state.isPlaying) {
      console.log('[PlayerContext] Connecting analyzer to audio element');
      connectAudioElement(audio).then(() => {
        // Set initial volume on the GainNode after connection
        setAnalyzerVolume(state.volume);
      });
    }
  }, [crossfade.state.activeElement, state.isPlaying, connectAudioElement, setAnalyzerVolume, state.volume]);

  // Helper to handle playback errors with retry logic
  const handlePlaybackError = useCallback((failedSong: Song | null, error: Error | MediaError | Event) => {
    const songTitle = failedSong?.title || 'Unknown track';
    const errorMessage = error instanceof Error
      ? error.message
      : (error as MediaError)?.message || 'Stream unavailable';

    // Don't retry on MEDIA_ERR_ABORTED (code 1) - user-initiated
    const mediaError = error as MediaError;
    if (mediaError?.code === 1) {
      console.log(`[PlayerContext] Playback aborted for "${songTitle}" (user-initiated), ignoring`);
      return;
    }

    console.error(`[PlayerContext] Playback error for "${songTitle}":`, errorMessage);

    const audio = getAudio();
    if (!audio || !failedSong) {
      setState(prev => ({ ...prev, isPlaying: false, isBuffering: false }));
      return;
    }

    // Initialize retry tracking for this song
    if (retryingSongIdRef.current !== failedSong.id) {
      retryingSongIdRef.current = failedSong.id;
      retryCountRef.current = 0;
    }

    const currentRetry = retryCountRef.current;

    if (currentRetry === 0) {
      // Retry 1: Same URL after 1.5s delay
      retryCountRef.current = 1;
      trackPlaybackError(failedSong, `retry_1_same_url: ${errorMessage}`);
      if (toast) toast.showInfo('Connection issue - retrying...');
      setState(prev => ({ ...prev, isBuffering: true }));

      setTimeout(() => {
        const currentAudio = getAudio();
        if (!currentAudio) return;
        const url = currentAudio.src || getStreamUrl(failedSong);
        currentAudio.src = '';
        currentAudio.src = url;
        currentAudio.play().catch(() => {
          // Will trigger handleError again with retryCount=1
        });
      }, 1500);
    } else if (currentRetry === 1) {
      // Retry 2: Lower quality URL after 1.5s delay
      retryCountRef.current = 2;
      const currentUrl = audio.src || getStreamUrl(failedSong);
      const lowerUrl = getLowerQualityUrl(failedSong, currentUrl);

      if (lowerUrl) {
        trackPlaybackError(failedSong, `retry_2_lower_quality: ${errorMessage}`);
        if (toast) toast.showInfo('Retrying with lower quality...');
        setState(prev => ({ ...prev, isBuffering: true }));

        setTimeout(() => {
          const currentAudio = getAudio();
          if (!currentAudio) return;
          currentAudio.src = '';
          currentAudio.src = lowerUrl;
          currentAudio.play().catch(() => {
            // Will trigger handleError again with retryCount=2
          });
        }, 1500);
      } else {
        // No lower quality available, skip directly
        retryCountRef.current = 2;
        handlePlaybackError(failedSong, error);
        return;
      }
    } else {
      // Retries exhausted - skip to next track
      trackPlaybackError(failedSong, `final_skip: ${errorMessage}`);
      retryCountRef.current = 0;
      retryingSongIdRef.current = null;
      clearStallTimers();
      setState(prev => ({ ...prev, isBuffering: false }));

      if (toast) {
        const nextItem = queueContext.peekNext();
        if (nextItem) {
          toast.showError(`Couldn't play "${songTitle}", skipping...`);
        } else {
          toast.showError(`Couldn't play "${songTitle}"`);
        }
      }

      // Skip to next track
      const advancedItem = queueContext.advanceCursor();
      if (advancedItem) {
        console.log(`[PlayerContext] Skipping to next track: "${advancedItem.song.title}"`);
        audio.src = '';
        audio.src = getStreamUrl(advancedItem.song);
        audio.play().catch((err) => {
          console.error('[PlayerContext] Next track also failed:', err);
          setState(prev => ({ ...prev, isPlaying: false }));
        });
      } else {
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    }
  }, [queueContext, toast, getStreamUrl, getLowerQualityUrl, clearStallTimers]);

  // Initialize audio element event handlers
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    audio.volume = state.volume;

    const handleTimeUpdate = () => {
      clearStallTimers();
      setState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        isBuffering: false,
      }));
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleEnded = () => {
      // Clear saved progress - track completed normally
      clearPlaybackProgress();

      const nextItem = queueContext.advanceCursor();
      if (nextItem && nextItem.song.isStreamable !== false) {
        const currentAudio = getAudio();
        if (currentAudio) {
          currentAudio.src = getStreamUrl(nextItem.song);
          currentAudio.play().catch(console.error);
        }
      } else if (nextItem) {
        // Skip unavailable - advance again with safety limit
        let skipped = 0;
        let item: ReturnType<typeof queueContext.advanceCursor> = nextItem;
        while (item && item.song.isStreamable === false && skipped < 20) {
          item = queueContext.advanceCursor();
          skipped++;
        }
        if (item && item.song.isStreamable !== false) {
          const currentAudio = getAudio();
          if (currentAudio) {
            currentAudio.src = getStreamUrl(item.song);
            currentAudio.play().catch(console.error);
          }
        } else {
          setState(prev => ({ ...prev, isPlaying: false }));
        }
      } else {
        // Nothing more to play
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    };

    // Handle audio loading/streaming errors
    const handleError = (event: Event) => {
      const audioElement = event.target as HTMLAudioElement;
      const error = audioElement.error;

      // Get the current song that failed
      const failedSong = currentSong;

      // Log detailed error info
      if (error) {
        console.error('[PlayerContext] Audio error:', {
          code: error.code,
          message: error.message,
          // MediaError codes: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
          type: ['', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED'][error.code] || 'UNKNOWN',
        });
      }

      handlePlaybackError(failedSong, error || new Error('Unknown audio error'));
    };

    // Handle stalled/stuck streams - start 10s timeout
    const handleStalled = () => {
      console.warn('[PlayerContext] Audio stream stalled');
      clearStallTimers();
      stallTimeoutRef.current = setTimeout(() => {
        console.error('[PlayerContext] Stall timeout (10s) - triggering retry');
        handlePlaybackError(currentSong, new Error('Stream stalled for 10 seconds'));
      }, 10000);
    };

    // Handle waiting (buffering) - show UI + start 15s timeout
    const handleWaiting = () => {
      console.log('[PlayerContext] Audio buffering...');
      setState(prev => ({ ...prev, isBuffering: true }));
      clearStallTimers();
      waitingTimeoutRef.current = setTimeout(() => {
        console.error('[PlayerContext] Buffering timeout (15s) - triggering retry');
        handlePlaybackError(currentSong, new Error('Buffering timeout after 15 seconds'));
      }, 15000);
    };

    // Sync isPlaying state with actual audio element (handles phone calls, Siri, alarms, etc.)
    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    const handlePlay = () => {
      retryCountRef.current = 0;
      retryingSongIdRef.current = null;
      clearStallTimers();
      queueContext.markPlayed(); // Mark current item as played (locks version)
      setState(prev => ({ ...prev, isPlaying: true, isBuffering: false }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      clearStallTimers();
    };
  }, [crossfade.state.activeElement, currentSong, handlePlaybackError, clearPlaybackProgress, clearStallTimers, queueContext]);

  // When currentSong changes (from QueueContext), update audio
  useEffect(() => {
    const audio = getAudio();
    if (!audio || !currentSong) return;

    // Don't auto-load audio for localStorage-restored queue on page load.
    // Wait for user to explicitly press play first.
    if (!userInitiatedRef.current) return;

    // Check if we need to load a new source
    const currentSrc = audio.src;
    const newSrc = getStreamUrl(currentSong);

    // Only reload if the source URL changed
    if (!currentSrc.endsWith(new URL(newSrc, window.location.origin).pathname)) {
      audio.src = newSrc;
      if (state.isPlaying) {
        audio.play().catch(console.error);
      }
    }
  }, [currentSong, crossfade.state.activeElement, getStreamUrl]);

  // Preload next track when 30 seconds remaining (or immediately if song is short)
  const preloadedSongIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Clear preload if user skips to a different song
    if (currentSong && preloadedSongIdRef.current && preloadedSongIdRef.current !== currentSong.id) {
      crossfade.clearPreload();
      preloadedSongIdRef.current = null;
    }

    // Don't preload if not playing
    if (!currentSong || !state.isPlaying) return;

    const timeRemaining = state.duration - state.currentTime;

    // Preload when 30s remaining OR if song is very short (< 30s)
    const shouldPreload = (timeRemaining <= 30 && timeRemaining > 0) || (state.duration > 0 && state.duration <= 30 && state.currentTime < 1);

    if (shouldPreload) {
      const nextItem = queueContext.peekNext();

      // Only preload if:
      // 1. There is a next track
      // 2. We haven't already preloaded it
      // 3. Next track is different from current (handles repeat one)
      if (nextItem && nextItem.song.id !== preloadedSongIdRef.current && nextItem.song.id !== currentSong.id) {
        console.log('[PlayerContext] Preloading next track:', nextItem.song.title);
        // Set ref BEFORE calling preload to prevent duplicate calls
        const songToPreload = nextItem.song.id;
        preloadedSongIdRef.current = songToPreload;
        crossfade.preloadNextTrack(getStreamUrl(nextItem.song));
      }
    }
  }, [state.currentTime, state.duration, state.isPlaying, currentSong, queueContext, crossfade, getStreamUrl]);

  // Clear preload when queue structure changes (repeat, queue cleared)
  useEffect(() => {
    return () => {
      if (preloadedSongIdRef.current) {
        crossfade.clearPreload();
        preloadedSongIdRef.current = null;
      }
    };
  }, [queueContext.queue.repeat, queueContext.queue.items.length, crossfade]);

  // Track song as "played" after 30 seconds of playback
  useEffect(() => {
    if (!currentSong || !state.isPlaying) return;

    // Check if we've already tracked this song
    if (trackedSongsRef.current.has(currentSong.id)) return;

    // Check if playback has reached 30 seconds
    if (state.currentTime >= 30) {
      console.log('[PlayerContext] Tracking song:', currentSong.title, 'at', Math.floor(state.currentTime), 'seconds');
      trackPlay(currentSong);
      trackedSongsRef.current.add(currentSong.id);
    }
  }, [currentSong, state.isPlaying, state.currentTime, trackPlay]);

  // Track song completion (when user listens to >90% of the song)
  useEffect(() => {
    if (!currentSong || !state.isPlaying || state.duration === 0) return;

    // Check if we've already tracked completion for this song
    if (completedSongsRef.current.has(currentSong.id)) return;

    // Check if playback has reached 90% of the song
    const completionThreshold = state.duration * 0.9;
    if (state.currentTime >= completionThreshold) {
      console.log('[PlayerContext] Song completed:', currentSong.title, 'at', Math.floor(state.currentTime), 'seconds');
      trackSongComplete(currentSong);
      completedSongsRef.current.add(currentSong.id);
    }
  }, [currentSong, state.isPlaying, state.currentTime, state.duration]);

  // Clear tracked songs and retry state when song changes
  useEffect(() => {
    if (currentSong) {
      // Reset tracking for new song (allow same song to be tracked again if replayed later)
      trackedSongsRef.current.delete(currentSong.id);
      completedSongsRef.current.delete(currentSong.id);
      // Reset retry state for new song
      retryCountRef.current = 0;
      retryingSongIdRef.current = null;
      clearStallTimers();
      // Announce song change for screen readers
      setState(prev => ({
        ...prev,
        isBuffering: false,
        announcement: `Now playing ${currentSong.title} by ${currentSong.artistName}`
      }));
    }
  }, [currentSong, clearStallTimers]);

  // Announce playback state changes for screen readers
  useEffect(() => {
    if (currentSong) {
      setState(prev => ({
        ...prev,
        announcement: state.isPlaying ? 'Playing' : 'Paused'
      }));
    }
  }, [state.isPlaying, currentSong]);

  // Periodically save playback progress while playing (every 30 seconds)
  useEffect(() => {
    if (!currentSong || !state.isPlaying) {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
        progressSaveIntervalRef.current = null;
      }
      return;
    }

    progressSaveIntervalRef.current = setInterval(() => {
      const audio = getAudio();
      if (audio && currentSong) {
        savePlaybackProgress(currentSong, audio.currentTime, audio.duration);
      }
    }, 30000); // Save every 30 seconds

    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
        progressSaveIntervalRef.current = null;
      }
    };
  }, [currentSong, state.isPlaying, savePlaybackProgress]);

  // Fix ghost playback: pause audio when queue is cleared
  useEffect(() => {
    if (!queueContext.hasItems && state.isPlaying) {
      const audio = getAudio();
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [queueContext.hasItems]);

  const playSong = useCallback((song: Song) => {
    userInitiatedRef.current = true;
    // Skip unavailable tracks
    if (song.isStreamable === false) {
      if (toast) {
        toast.showInfo('This recording is stream-only on Archive.org');
      }
      // Try to skip to next available track in queue
      const nextItem = queueContext.advanceCursor();
      if (nextItem) {
        const audio = getAudio();
        if (audio) {
          audio.src = getStreamUrl(nextItem.song);
          audio.play().catch(console.error);
          setState(prev => ({ ...prev, isPlaying: true }));
        }
      }
      return;
    }

    const audio = getAudio();
    if (!audio) return;

    // Insert after cursor and advance to play it
    const item = queueContext.trackToItem(song);
    queueContext.playNext(item);
    queueContext.setCursor(queueContext.queue.cursorIndex + 1);

    setState(prev => ({
      ...prev,
      isPlaying: true,
    }));

    // Track analytics event
    trackSongPlay(song);

    // Play first (synchronously in user gesture handler for mobile compatibility)
    audio.src = getStreamUrl(song);
    audio.play().catch(err => {
      console.error('Audio play error:', err);
      handlePlaybackError(song, err);
    });

    // Connect analyzer after play (audio plays via HTML element until context resumes)
    connectAudioElement(audio).then(() => {
      setAnalyzerVolume(state.volume);
    });
  }, [queueContext, crossfade, handlePlaybackError, connectAudioElement, setAnalyzerVolume, state.volume, getStreamUrl, toast]);

  const pause = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;

    // Save progress before pausing
    if (currentSong && audio.currentTime > 0) {
      savePlaybackProgress(currentSong, audio.currentTime, audio.duration);
    }

    audio.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [crossfade, currentSong, savePlaybackProgress]);

  const togglePlay = useCallback(() => {
    userInitiatedRef.current = true;
    const audio = getAudio();
    if (!audio || !currentSong) return;

    if (state.isPlaying) {
      audio.pause();
    } else {
      // Play first (synchronously in user gesture handler for mobile compatibility)
      audio.play().catch(console.error);
      // Connect analyzer after play
      connectAudioElement(audio).then(() => {
        setAnalyzerVolume(state.volume);
      });
    }
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [state.isPlaying, currentSong, crossfade, connectAudioElement, setAnalyzerVolume, state.volume]);

  const isIOS = typeof navigator !== 'undefined' && /(iPad|iPhone|iPod)/.test(navigator.userAgent);

  const setVolume = useCallback((volume: number) => {
    // iOS Safari ignores programmatic volume changes -- hardware buttons handle volume
    if (!isIOS) {
      setAnalyzerVolume(volume);
    }
    setState(prev => ({ ...prev, volume }));
  }, [setAnalyzerVolume, isIOS]);

  const seek = useCallback((time: number) => {
    const audio = getAudio();
    if (!audio) return;
    audio.currentTime = time;
    setState(prev => ({ ...prev, currentTime: time }));
  }, [crossfade]);

  const playNextHandler = useCallback(() => {
    let nextItem = queueContext.advanceCursor();
    const audio = getAudio();

    // Skip unavailable tracks
    let skipped = 0;
    while (nextItem && nextItem.song.isStreamable === false && skipped < 20) {
      nextItem = queueContext.advanceCursor();
      skipped++;
    }

    if (nextItem && nextItem.song.isStreamable !== false && audio) {
      // Play first (synchronously in user gesture handler for mobile compatibility)
      audio.src = getStreamUrl(nextItem.song);
      audio.play().catch(console.error);
      setState(prev => ({ ...prev, isPlaying: true }));
      // Connect analyzer after play
      connectAudioElement(audio).then(() => {
        setAnalyzerVolume(state.volume);
      });
    }
  }, [queueContext, crossfade, connectAudioElement, setAnalyzerVolume, state.volume, getStreamUrl]);

  const playPrev = useCallback(() => {
    const audio = getAudio();

    // If more than 3 seconds into song, restart it
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    queueContext.retreatCursor();
    // After retreat, the currentSong from context will update and trigger the currentSong effect
  }, [queueContext, crossfade]);

  const toggleQueue = useCallback(() => {
    setState(prev => ({ ...prev, isQueueOpen: !prev.isQueueOpen }));
  }, []);

  const setCrossfadeDuration = useCallback((duration: number) => {
    setCrossfadeDurationState(duration);
    setState(prev => ({ ...prev, crossfadeDuration: duration }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('crossfadeDuration', duration.toString());
    }
  }, []);

  // Resume playback from saved progress
  const resumeSavedProgress = useCallback(() => {
    userInitiatedRef.current = true;
    if (!savedProgress || !savedProgress.streamUrl) return;

    const audio = getAudio();
    if (!audio) return;

    // Create a minimal Song object to resume playback
    const resumeSong: Song = {
      id: savedProgress.songId,
      sku: savedProgress.songId,
      title: savedProgress.title,
      artistId: '',
      artistName: savedProgress.artistName,
      artistSlug: '',
      duration: savedProgress.duration,
      streamUrl: savedProgress.streamUrl,
      albumArt: '',
      qualityUrls: {},
      albumIdentifier: '',
      albumName: savedProgress.albumName || '',
      trackTitle: savedProgress.title,
    };

    // Insert into queue and set cursor so it becomes the current song
    const item = queueContext.trackToItem(resumeSong);
    queueContext.playNext(item);
    queueContext.setCursor(queueContext.queue.cursorIndex + 1);

    // Play first (synchronously in user gesture handler for mobile compatibility)
    audio.src = savedProgress.streamUrl;
    audio.currentTime = savedProgress.position;
    audio.play().catch(console.error);

    setState(prev => ({
      ...prev,
      isPlaying: true,
    }));

    // Connect analyzer after play
    connectAudioElement(audio).then(() => {
      setAnalyzerVolume(state.volume);
    });

    // Clear saved progress after resuming
    setSavedProgress(null);
    clearPlaybackProgress();
  }, [savedProgress, queueContext, connectAudioElement, setAnalyzerVolume, state.volume, clearPlaybackProgress]);

  const playFromQueue = useCallback((index: number) => {
    userInitiatedRef.current = true;
    queueContext.setCursor(index);
    const item = queueContext.queue.items[index];
    const audio = getAudio();

    if (item && audio) {
      // Play first (synchronously in user gesture handler for mobile compatibility)
      audio.src = getStreamUrl(item.song);
      audio.play().catch(console.error);
      setState(prev => ({ ...prev, isPlaying: true }));
      // Connect analyzer after play
      connectAudioElement(audio).then(() => {
        setAnalyzerVolume(state.volume);
      });
    }
  }, [queueContext, crossfade, connectAudioElement, setAnalyzerVolume, state.volume, getStreamUrl]);

  // Play all songs from an album, starting at a specific track index
  const playAlbum = useCallback((album: Album, startIndex: number = 0) => {
    userInitiatedRef.current = true;
    if (album.tracks.length === 0) return;

    queueContext.playAlbum(album, startIndex);

    // Get the song to play directly from the album tracks
    const trackToPlay = album.tracks[startIndex];
    if (!trackToPlay || trackToPlay.songs.length === 0) return;

    // getBestVersion selects the highest-rated version
    const song = getBestVersion(trackToPlay.songs);
    const audio = getAudio();
    if (song && audio) {
      audio.src = getStreamUrl(song);
      audio.play().catch(console.error);
      setState(prev => ({ ...prev, isPlaying: true }));
      // Connect analyzer after play
      connectAudioElement(audio).then(() => {
        setAnalyzerVolume(state.volume);
      });
    }
  }, [queueContext, crossfade, connectAudioElement, setAnalyzerVolume, state.volume, getStreamUrl]);

  // Play a specific version of a track within an album
  // This ensures track advancement works correctly (plays next track, not next version)
  const playAlbumFromTrack = useCallback((album: Album, trackIndex: number, song: Song) => {
    userInitiatedRef.current = true;
    // Create version overrides map with the specific version
    const versionOverrides = new Map<string, string>();
    const track = album.tracks[trackIndex];
    if (track) {
      versionOverrides.set(track.id, song.id);
    }

    // Load album into queue with version override
    queueContext.playAlbum(album, trackIndex, versionOverrides);

    // Play the song
    const audio = getAudio();
    if (audio) {
      audio.src = getStreamUrl(song);
      audio.play().catch(console.error);
      setState(prev => ({ ...prev, isPlaying: true }));
      // Connect analyzer after play
      connectAudioElement(audio).then(() => {
        setAnalyzerVolume(state.volume);
      });
    }
  }, [queueContext, crossfade, connectAudioElement, setAnalyzerVolume, state.volume, getStreamUrl]);

  // Media Session API integration for lock screen controls
  useMediaSession({
    currentSong,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    onPlay: togglePlay,
    onPause: pause,
    onNext: playNextHandler,
    onPrevious: playPrev,
    onSeek: seek,
  });

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        currentSong,
        playSong,
        togglePlay,
        pause,
        setVolume,
        seek,
        playNext: playNextHandler,
        playPrev,
        toggleQueue,
        playFromQueue,
        playAlbum,
        playAlbumFromTrack,
        setCrossfadeDuration,
        analyzerData,
        audioRef: crossfade.activeAudioRef,
        queue: legacyQueue,
        queueIndex: legacyQueueIndex,
        savedProgress: savedProgress ? {
          songId: savedProgress.songId,
          position: savedProgress.position,
          title: savedProgress.title,
          artistName: savedProgress.artistName,
        } : null,
        resumeSavedProgress,
        clearSavedProgress: clearPlaybackProgress,
      }}
    >
      {/* ARIA live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state.announcement}
      </div>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
