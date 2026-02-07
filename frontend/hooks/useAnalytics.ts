'use client';

/**
 * useAnalytics - Custom hook for analytics event tracking
 *
 * Provides convenient methods for tracking user interactions throughout the app.
 * Wraps the analytics utility functions with proper typing and error handling.
 *
 * @example
 * ```tsx
 * const { trackPlay, trackSearchQuery, trackShareAction } = useAnalytics();
 *
 * // Track song play
 * trackPlay(song);
 *
 * // Track search
 * trackSearchQuery('grateful dead', 150);
 *
 * // Track share
 * trackShareAction('song', 'Fire on the Mountain');
 * ```
 *
 * @see CARD-7C for analytics implementation details
 */

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { Song, Album, Artist } from '@/lib/types';
import {
  trackSongPlay,
  trackSongComplete,
  trackSeek,
  trackAddToPlaylist,
  trackAddToQueue,
  trackLike,
  trackUnlike,
  trackSearch,
  trackSearchResultClick,
  trackShare,
  trackArtistView,
  trackAlbumView,
  trackPlaybackError,
  trackError,
  trackPageView,
  trackTimeOnPage,
  trackScrollDepth,
  trackPlaylistCreate,
  trackPlaylistDelete,
  trackRemoveFromPlaylist,
  trackFollowArtist,
  trackUnfollowArtist,
  trackFollowAlbum,
  trackUnfollowAlbum,
  trackQualityChange,
  trackRepeatChange,
  trackDownload,
  trackPWAInstallPrompt,
  trackPWAInstall,
  trackPWAInstallDismissed,
  trackSignUp,
  trackLogin,
  isAnalyticsAvailable,
} from '@/lib/analytics';

export function useAnalytics() {
  const pathname = usePathname();
  const pageLoadTimeRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);
  const scrollDepthTrackedRef = useRef<Set<number>>(new Set());

  // Track page views on route change (for SPA navigation)
  useEffect(() => {
    // Reset tracking state on page change
    pageLoadTimeRef.current = Date.now();
    maxScrollDepthRef.current = 0;
    scrollDepthTrackedRef.current = new Set();

    // Track page view
    if (pathname) {
      trackPageView(pathname);
    }

    // Track time on page when leaving
    return () => {
      const timeSpent = Math.round((Date.now() - pageLoadTimeRef.current) / 1000);
      if (timeSpent > 5 && pathname) {
        // Only track if user spent more than 5 seconds
        trackTimeOnPage(timeSpent, pathname);
      }
    };
  }, [pathname]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      // Track at 25%, 50%, 75%, 90% thresholds
      const thresholds = [25, 50, 75, 90];
      for (const threshold of thresholds) {
        if (scrollPercent >= threshold && !scrollDepthTrackedRef.current.has(threshold)) {
          scrollDepthTrackedRef.current.add(threshold);
          if (pathname) {
            trackScrollDepth(threshold, pathname);
          }
        }
      }

      maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, scrollPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Memoized tracking functions
  const trackPlay = useCallback((song: Song) => {
    trackSongPlay(song);
  }, []);

  const trackComplete = useCallback((song: Song) => {
    trackSongComplete(song);
  }, []);

  const trackSongSeek = useCallback((song: Song, seekToPercent: number) => {
    trackSeek(song, seekToPercent);
  }, []);

  const trackPlaylistAdd = useCallback((song: Song, playlistName?: string) => {
    trackAddToPlaylist(song, playlistName);
  }, []);

  const trackQueueAdd = useCallback((song: Song) => {
    trackAddToQueue(song);
  }, []);

  const trackSongLike = useCallback((song: Song) => {
    trackLike(song);
  }, []);

  const trackSongUnlike = useCallback((song: Song) => {
    trackUnlike(song);
  }, []);

  const trackSearchQuery = useCallback((query: string, resultsCount: number) => {
    trackSearch(query, resultsCount);
  }, []);

  const trackSearchClick = useCallback(
    (
      query: string,
      resultType: 'artist' | 'album' | 'track' | 'song',
      resultName: string,
      position: number
    ) => {
      trackSearchResultClick(query, resultType, resultName, position);
    },
    []
  );

  const trackShareAction = useCallback(
    (
      contentType: 'song' | 'album' | 'artist' | 'playlist',
      contentName: string,
      method?: 'copy_link' | 'native_share' | 'twitter' | 'facebook'
    ) => {
      trackShare(contentType, contentName, method);
    },
    []
  );

  const trackArtistPageView = useCallback((artist: Artist) => {
    trackArtistView(artist);
  }, []);

  const trackAlbumPageView = useCallback((album: Album) => {
    trackAlbumView(album);
  }, []);

  const trackAudioError = useCallback((song: Song, errorType: string) => {
    trackPlaybackError(song, errorType);
  }, []);

  const trackGeneralError = useCallback((errorType: string, errorMessage: string) => {
    trackError(errorType, errorMessage);
  }, []);

  const trackCreatePlaylist = useCallback((name: string) => {
    trackPlaylistCreate(name);
  }, []);

  const trackDeletePlaylist = useCallback((name: string) => {
    trackPlaylistDelete(name);
  }, []);

  const trackPlaylistRemove = useCallback((song: Song, playlistName?: string) => {
    trackRemoveFromPlaylist(song, playlistName);
  }, []);

  const trackArtistFollow = useCallback((artistName: string, artistSlug: string) => {
    trackFollowArtist(artistName, artistSlug);
  }, []);

  const trackArtistUnfollow = useCallback((artistName: string, artistSlug: string) => {
    trackUnfollowArtist(artistName, artistSlug);
  }, []);

  const trackAlbumFollow = useCallback((albumName: string, artistName: string) => {
    trackFollowAlbum(albumName, artistName);
  }, []);

  const trackAlbumUnfollow = useCallback((albumName: string, artistName: string) => {
    trackUnfollowAlbum(albumName, artistName);
  }, []);

  const trackQuality = useCallback(
    (quality: 'high' | 'medium' | 'low', previousQuality?: string) => {
      trackQualityChange(quality, previousQuality);
    },
    []
  );

  const trackRepeat = useCallback((mode: 'off' | 'all' | 'one') => {
    trackRepeatChange(mode);
  }, []);

  const trackSongDownload = useCallback((song: Song) => {
    trackDownload(song);
  }, []);

  const trackPWAPrompt = useCallback(() => {
    trackPWAInstallPrompt();
  }, []);

  const trackPWAInstalled = useCallback(() => {
    trackPWAInstall();
  }, []);

  const trackPWADismissed = useCallback(() => {
    trackPWAInstallDismissed();
  }, []);

  const trackUserSignUp = useCallback(
    (method: 'email' | 'google' | 'apple' | 'anonymous') => {
      trackSignUp(method);
    },
    []
  );

  const trackUserLogin = useCallback(
    (method: 'email' | 'google' | 'apple' | 'anonymous') => {
      trackLogin(method);
    },
    []
  );

  return {
    // Status
    isAvailable: isAnalyticsAvailable,

    // Audio events
    trackPlay,
    trackComplete,
    trackSongSeek,
    trackAudioError,

    // Engagement events
    trackPlaylistAdd,
    trackQueueAdd,
    trackSongLike,
    trackSongUnlike,
    trackCreatePlaylist,
    trackDeletePlaylist,
    trackPlaylistRemove,

    // Discovery events
    trackSearchQuery,
    trackSearchClick,

    // Social events
    trackShareAction,

    // Navigation events
    trackArtistPageView,
    trackAlbumPageView,

    // Follow events
    trackArtistFollow,
    trackArtistUnfollow,
    trackAlbumFollow,
    trackAlbumUnfollow,

    // Settings events
    trackQuality,
    trackRepeat,
    trackSongDownload,

    // PWA events
    trackPWAPrompt,
    trackPWAInstalled,
    trackPWADismissed,

    // Auth events
    trackUserSignUp,
    trackUserLogin,

    // Error tracking
    trackGeneralError,
  };
}

export default useAnalytics;
