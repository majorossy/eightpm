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
 * @deprecated Use trackAddToMiniDisc
 * Track adding a song to a playlist (legacy alias)
 */
export function trackAddToPlaylist(song: Song, playlistName?: string): void {
  trackAddToMiniDisc(song, playlistName);
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
  trackEvent('version_change', 'Engagement', `${trackTitle}|${newVersionId}`);
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
// MiniDisc Events (replaced Playlist events)
// ============================================

/**
 * Track MiniDisc creation
 */
export function trackMiniDiscCreate(name: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'minidisc_create', {
      event_category: 'Engagement',
      minidisc_name: name,
    });
  }
}

/**
 * Track MiniDisc deletion
 */
export function trackMiniDiscDelete(name: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'minidisc_delete', {
      event_category: 'Engagement',
      minidisc_name: name,
    });
  }
}

/**
 * Track adding a song to a MiniDisc
 */
export function trackAddToMiniDisc(song: Song, minidiscName?: string): void {
  trackEvent('add_to_minidisc', 'Engagement', song.trackTitle);

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_minidisc', {
      artist_name: song.artistName,
      track_title: song.trackTitle,
      minidisc_name: minidiscName || 'default',
    });
  }
}

/**
 * Track removing a song from a MiniDisc
 */
export function trackRemoveFromMiniDisc(song: Song, minidiscName?: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'remove_from_minidisc', {
      event_category: 'Engagement',
      artist_name: song.artistName,
      track_title: song.trackTitle,
      minidisc_name: minidiscName || 'default',
    });
  }
}

// ============================================
// Cassette Events
// ============================================

/**
 * Track saving a Cassette (version selection snapshot)
 */
export function trackCassetteSave(name: string, artistName: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'cassette_save', {
      event_category: 'Engagement',
      cassette_name: name,
      artist_name: artistName,
    });
  }
}

/**
 * Track Cassette deletion
 */
export function trackCassetteDelete(name: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'cassette_delete', {
      event_category: 'Engagement',
      cassette_name: name,
    });
  }
}

// ============================================
// Legacy aliases (kept for backward compat)
// ============================================

/** @deprecated Use trackMiniDiscCreate */
export const trackPlaylistCreate = trackMiniDiscCreate;
/** @deprecated Use trackMiniDiscDelete */
export const trackPlaylistDelete = trackMiniDiscDelete;
/** @deprecated Use trackRemoveFromMiniDisc */
export const trackRemoveFromPlaylist = trackRemoveFromMiniDisc;

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
// Playback Control Events
// ============================================

/**
 * Track skip (next track)
 */
export function trackSkip(song: Song, percentPlayed: number): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'track_skip', {
      event_category: 'Audio',
      artist_name: song.artistName,
      track_title: song.trackTitle,
      percent_played: Math.round(percentPlayed),
    });
  }
}

/**
 * Track previous (restart or actual prev)
 */
export function trackPrevious(song: Song, percentPlayed: number, wasRestart: boolean): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'track_previous', {
      event_category: 'Audio',
      artist_name: song.artistName,
      track_title: song.trackTitle,
      percent_played: Math.round(percentPlayed),
      was_restart: wasRestart,
    });
  }
}

/**
 * Track shuffle toggle
 */
export function trackShuffleToggle(enabled: boolean, queueSize: number): void {
  trackEvent(enabled ? 'shuffle_on' : 'shuffle_off', 'Audio', undefined, queueSize);
}

/**
 * Track buffering events (non-interaction)
 */
export function trackBuffer(song: Song, bufferDurationMs: number): void {
  if (typeof window !== 'undefined' && window.gtag) {
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    window.gtag('event', 'audio_buffer', {
      event_category: 'Audio',
      artist_name: song.artistName,
      track_title: song.trackTitle,
      buffer_duration_ms: bufferDurationMs,
      connection_type: conn?.effectiveType || 'unknown',
      non_interaction: true,
    });
  }
}

/**
 * Track listening session summary (fired on page unload)
 */
export function trackListeningSession(tracksPlayed: number, totalSeconds: number, uniqueArtists: number): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'listening_session_end', {
      event_category: 'Audio',
      tracks_played: tracksPlayed,
      total_listening_seconds: totalSeconds,
      unique_artists: uniqueArtists,
      non_interaction: true,
    });
  }
}

// ============================================
// Feature Adoption Events
// ============================================

export function trackSleepTimerStart(preset: string): void {
  trackEvent('sleep_timer_start', 'Feature', preset);
}

export function trackSleepTimerCancel(): void {
  trackEvent('sleep_timer_cancel', 'Feature');
}

export function trackSleepTimerComplete(): void {
  trackEvent('sleep_timer_complete', 'Feature');
}

export function trackThemeChange(fromTheme: string, toTheme: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'theme_change', {
      event_category: 'Feature',
      from_theme: fromTheme,
      to_theme: toTheme,
    });
  }
}

export function trackKeyboardShortcut(key: string, action: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'keyboard_shortcut', {
      event_category: 'Feature',
      key,
      action,
    });
  }
}

export function trackVenueClick(venueName: string, venueSlug: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'venue_click', {
      event_category: 'Discovery',
      venue_name: venueName,
      venue_slug: venueSlug,
    });
  }
}

export function trackResumeBar(action: 'shown' | 'clicked' | 'dismissed'): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', `resume_bar_${action}`, {
      event_category: 'Engagement',
      non_interaction: action === 'shown',
    });
  }
}

export function trackCrossfadeChange(durationSeconds: number): void {
  trackEvent('crossfade_change', 'Feature', durationSeconds === 0 ? 'off' : `${durationSeconds}s`);
}

export function trackSharedCassetteImport(cassetteName: string, sharedBy: string, artistName: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'shared_cassette_import', {
      event_category: 'Social',
      cassette_name: cassetteName,
      shared_by: sharedBy,
      artist_name: artistName,
    });
  }
}

// ============================================
// User Properties
// ============================================

export function setUserProperties(properties: Record<string, string | number>): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', properties);
  }
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
