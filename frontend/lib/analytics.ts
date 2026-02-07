/**
 * Analytics utilities for Google Analytics 4 event tracking.
 *
 * Events are tracked for user engagement metrics:
 * - Song plays (most important - measures content consumption)
 * - Playlist interactions (measures engagement depth)
 * - Search activity (measures discovery patterns)
 * - Share actions (measures viral potential)
 * - Core Web Vitals (measures performance)
 *
 * @see CARD-7C for implementation details
 */

import type { Song, Album, Artist } from './types';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      action: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Check if analytics is available (GA4 loaded and configured)
 */
export function isAnalyticsAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Get the current GA measurement ID from environment
 */
export function getGAMeasurementId(): string | undefined {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
}

/**
 * Core event tracking function
 * Sends events to Google Analytics 4 with structured parameters
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });

    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Event: ${action}`, { category, label, value });
    }
  }
}

// ============================================
// Audio Events
// ============================================

/**
 * Track when a song starts playing
 */
export function trackSongPlay(song: Song): void {
  trackEvent('play', 'Audio', `${song.artistName} - ${song.trackTitle}`);

  // Also track with structured params for GA4 analysis
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'song_play', {
      artist_name: song.artistName,
      track_title: song.trackTitle,
      album_name: song.albumName,
      show_venue: song.showVenue,
      show_date: song.showDate,
    });
  }
}

/**
 * Track when a song completes (listened to >90%)
 */
export function trackSongComplete(song: Song): void {
  trackEvent('complete', 'Audio', `${song.artistName} - ${song.trackTitle}`);
}

/**
 * Track seeking within a song
 */
export function trackSeek(song: Song, seekToPercent: number): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'seek', {
      event_category: 'Audio',
      artist_name: song.artistName,
      track_title: song.trackTitle,
      seek_percent: Math.round(seekToPercent),
    });
  }
}

// ============================================
// Playlist Events
// ============================================

/**
 * Track adding a song to a playlist
 */
export function trackAddToPlaylist(song: Song, playlistName?: string): void {
  trackEvent('add_to_playlist', 'Engagement', song.trackTitle);

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_playlist', {
      artist_name: song.artistName,
      track_title: song.trackTitle,
      playlist_name: playlistName || 'default',
    });
  }
}

/**
 * Track adding a song to the queue
 */
export function trackAddToQueue(song: Song): void {
  trackEvent('add_to_queue', 'Engagement', song.trackTitle);
}

/**
 * Track "Play Next" action (insert after cursor)
 */
export function trackPlayNext(song: Song): void {
  trackEvent('play_next', 'Engagement', `${song.artistName} - ${song.trackTitle}`);
}

/**
 * Track version change in queue
 */
export function trackVersionChange(trackTitle: string, newVersionId: string): void {
  trackEvent('version_change', 'Engagement', trackTitle);
}

/**
 * Track queue reorder (drag-and-drop)
 */
export function trackQueueReorder(action: 'move_item' | 'move_block'): void {
  trackEvent('queue_reorder', 'Engagement', action);
}

/**
 * Track liking/favoriting a song
 */
export function trackLike(song: Song): void {
  trackEvent('like', 'Engagement', `${song.artistName} - ${song.trackTitle}`);
}

/**
 * Track unliking a song
 */
export function trackUnlike(song: Song): void {
  trackEvent('unlike', 'Engagement', `${song.artistName} - ${song.trackTitle}`);
}

// ============================================
// Search Events
// ============================================

/**
 * Track search queries and result counts
 */
export function trackSearch(query: string, resultsCount: number): void {
  trackEvent('search', 'Discovery', query, resultsCount);

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: query,
      results_count: resultsCount,
    });
  }
}

/**
 * Track when user clicks a search result
 */
export function trackSearchResultClick(
  query: string,
  resultType: 'artist' | 'album' | 'track' | 'song',
  resultName: string,
  position: number
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search_result_click', {
      search_term: query,
      result_type: resultType,
      result_name: resultName,
      position: position,
    });
  }
}

// ============================================
// Share Events
// ============================================

/**
 * Track share actions
 */
export function trackShare(
  contentType: 'song' | 'track' | 'album' | 'artist' | 'playlist',
  contentName: string,
  method?: 'copy_link' | 'native_share' | 'twitter' | 'facebook'
): void {
  trackEvent('share', 'Social', `${contentType}: ${contentName}`);

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'share', {
      content_type: contentType,
      item_id: contentName,
      method: method || 'unknown',
    });
  }
}

// ============================================
// Navigation Events
// ============================================

/**
 * Track artist page views
 */
export function trackArtistView(artist: Artist): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_artist', {
      artist_name: artist.name,
      artist_id: artist.id,
      album_count: artist.albumCount,
    });
  }
}

/**
 * Track album page views
 */
export function trackAlbumView(album: Album): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_album', {
      artist_name: album.artistName,
      album_name: album.name,
      show_venue: album.showVenue,
      show_date: album.showDate,
      track_count: album.totalTracks,
    });
  }
}

// ============================================
// Error Events
// ============================================

/**
 * Track playback errors
 */
export function trackPlaybackError(song: Song, errorType: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'playback_error', {
      event_category: 'Error',
      artist_name: song.artistName,
      track_title: song.trackTitle,
      stream_url: song.streamUrl,
      error_type: errorType,
    });
  }
}

/**
 * Track general errors
 */
export function trackError(errorType: string, errorMessage: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: `${errorType}: ${errorMessage}`,
      fatal: false,
    });
  }
}

// ============================================
// Core Web Vitals Events
// ============================================

/**
 * Web Vitals metric data structure
 */
export interface WebVitalMetric {
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

/**
 * Track Core Web Vitals metrics to GA4
 * Sends metrics with proper thresholds for monitoring
 */
export function trackWebVitals(metric: WebVitalMetric): void {
  if (typeof window !== 'undefined' && window.gtag) {
    // Send to GA4 with structured data for analysis
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      // Custom dimensions for detailed analysis
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      metric_navigation_type: metric.navigationType || 'navigate',
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      const color = metric.rating === 'good' ? '32' : metric.rating === 'needs-improvement' ? '33' : '31';
      console.log(
        `[Analytics] Web Vital: \x1b[${color}m${metric.name}\x1b[0m = ${metric.value.toFixed(2)} (${metric.rating})`
      );
    }
  }
}

// ============================================
// Page View Events
// ============================================

/**
 * Track page views (for SPA navigation)
 * Next.js handles initial page view, this is for client-side navigation
 */
export function trackPageView(url: string, title?: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_location: url,
      page_title: title || document.title,
    });
  }
}

// ============================================
// Engagement Events
// ============================================

/**
 * Track time spent on page (for engagement metrics)
 */
export function trackTimeOnPage(seconds: number, pagePath: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'time_on_page', {
      event_category: 'Engagement',
      page_path: pagePath,
      engagement_time_seconds: seconds,
      non_interaction: true,
    });
  }
}

/**
 * Track scroll depth (for content engagement)
 */
export function trackScrollDepth(percentage: number, pagePath: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    // Only track at 25%, 50%, 75%, 90% thresholds
    const thresholds = [25, 50, 75, 90];
    const threshold = thresholds.find(t => percentage >= t && percentage < t + 25);

    if (threshold) {
      window.gtag('event', 'scroll', {
        event_category: 'Engagement',
        page_path: pagePath,
        percent_scrolled: threshold,
        non_interaction: true,
      });
    }
  }
}

/**
 * Track user sign-up
 */
export function trackSignUp(method: 'email' | 'google' | 'apple' | 'anonymous'): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method,
    });
  }
}

/**
 * Track user login
 */
export function trackLogin(method: 'email' | 'google' | 'apple' | 'anonymous'): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'login', {
      method,
    });
  }
}

// ============================================
// Playlist Events (Extended)
// ============================================

/**
 * Track playlist creation
 */
export function trackPlaylistCreate(playlistName: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'playlist_create', {
      event_category: 'Engagement',
      playlist_name: playlistName,
    });
  }
}

/**
 * Track playlist deletion
 */
export function trackPlaylistDelete(playlistName: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'playlist_delete', {
      event_category: 'Engagement',
      playlist_name: playlistName,
    });
  }
}

/**
 * Track removing a song from playlist
 */
export function trackRemoveFromPlaylist(song: Song, playlistName?: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'remove_from_playlist', {
      event_category: 'Engagement',
      artist_name: song.artistName,
      track_title: song.trackTitle,
      playlist_name: playlistName || 'default',
    });
  }
}

// ============================================
// Follow Events
// ============================================

/**
 * Track following an artist
 */
export function trackFollowArtist(artistName: string, artistSlug: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'follow_artist', {
      event_category: 'Engagement',
      artist_name: artistName,
      artist_slug: artistSlug,
    });
  }
}

/**
 * Track unfollowing an artist
 */
export function trackUnfollowArtist(artistName: string, artistSlug: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'unfollow_artist', {
      event_category: 'Engagement',
      artist_name: artistName,
      artist_slug: artistSlug,
    });
  }
}

/**
 * Track following an album
 */
export function trackFollowAlbum(albumName: string, artistName: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'follow_album', {
      event_category: 'Engagement',
      album_name: albumName,
      artist_name: artistName,
    });
  }
}

/**
 * Track unfollowing an album
 */
export function trackUnfollowAlbum(albumName: string, artistName: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'unfollow_album', {
      event_category: 'Engagement',
      album_name: albumName,
      artist_name: artistName,
    });
  }
}

// ============================================
// Audio Quality Events
// ============================================

/**
 * Track audio quality change
 */
export function trackQualityChange(
  quality: 'high' | 'medium' | 'low',
  previousQuality?: string
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'quality_change', {
      event_category: 'Audio',
      quality: quality,
      previous_quality: previousQuality,
    });
  }
}

/**
 * Track repeat mode change
 */
export function trackRepeatChange(mode: 'off' | 'all' | 'one'): void {
  trackEvent(`repeat_${mode}`, 'Audio');
}

// ============================================
// Download Events
// ============================================

/**
 * Track download initiation
 */
export function trackDownload(song: Song): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'download', {
      event_category: 'Audio',
      artist_name: song.artistName,
      track_title: song.trackTitle,
      album_name: song.albumName,
    });
  }
}

// ============================================
// PWA Events
// ============================================

/**
 * Track PWA install prompt shown
 */
export function trackPWAInstallPrompt(): void {
  trackEvent('pwa_install_prompt', 'PWA');
}

/**
 * Track PWA installation
 */
export function trackPWAInstall(): void {
  trackEvent('pwa_install', 'PWA');
}

/**
 * Track PWA install dismissed
 */
export function trackPWAInstallDismissed(): void {
  trackEvent('pwa_install_dismissed', 'PWA');
}

// ============================================
// Utility: Batch Event Tracking
// ============================================

/**
 * Track multiple events at once (useful for complex interactions)
 */
export function trackEvents(
  events: Array<{ action: string; category: string; label?: string; value?: number }>
): void {
  events.forEach(event => {
    trackEvent(event.action, event.category, event.label, event.value);
  });
}
