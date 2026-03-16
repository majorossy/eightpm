import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isAnalyticsAvailable,
  trackEvent,
  trackSongPlay,
  trackSongComplete,
  trackSeek,
  trackAddToQueue,
  trackPlayNext,
  trackVersionChange,
  trackQueueReorder,
  trackLike,
  trackUnlike,
  trackSearch,
  trackSearchResultClick,
  trackShare,
  trackArtistView,
  trackAlbumView,
  trackPlaybackError,
  trackError,
  trackWebVitals,
  trackPageView,
  trackTimeOnPage,
  trackScrollDepth,
  trackSignUp,
  trackLogin,
  trackMiniDiscCreate,
  trackMiniDiscDelete,
  trackAddToMiniDisc,
  trackRemoveFromMiniDisc,
  trackCassetteSave,
  trackCassetteDelete,
  trackFollowArtist,
  trackUnfollowArtist,
  trackFollowAlbum,
  trackUnfollowAlbum,
  trackQualityChange,
  trackRepeatChange,
  trackDownload,
  trackSkip,
  trackPrevious,
  trackShuffleToggle,
  trackBuffer,
  trackListeningSession,
  trackSleepTimerStart,
  trackSleepTimerCancel,
  trackSleepTimerComplete,
  trackThemeChange,
  trackKeyboardShortcut,
  trackVenueClick,
  trackResumeBar,
  trackCrossfadeChange,
  trackSharedCassetteImport,
  setUserProperties,
  trackEvents,
  trackPlaylistCreate,
  trackPlaylistDelete,
  trackAddToPlaylist,
  trackRemoveFromPlaylist,
} from '@/lib/analytics';
import type { Song, Album, Artist } from '@/lib/types';
import type { WebVitalMetric } from '@/lib/analytics';

// =============================================================================
// Test Setup
// =============================================================================

const mockGtag = vi.fn();

const mockSong: Song = {
  id: 'song-1',
  sku: 'sku-1',
  title: 'Dark Star',
  duration: 600,
  artistName: 'Grateful Dead',
  artistSlug: 'grateful-dead',
  artistId: 'gd1',
  albumName: 'Live at Fillmore',
  albumIdentifier: 'gd1969',
  streamUrl: 'https://archive.org/song.mp3',
  albumArt: 'cover.jpg',
  trackTitle: 'Dark Star',
  avgRating: 4.5,
  showVenue: 'Fillmore West',
  showDate: '1969-02-27',
};

beforeEach(() => {
  vi.clearAllMocks();
  // Set up window.gtag mock
  Object.defineProperty(window, 'gtag', {
    value: mockGtag,
    writable: true,
    configurable: true,
  });
});

// =============================================================================
// isAnalyticsAvailable
// =============================================================================

describe('isAnalyticsAvailable', () => {
  it('returns true when window.gtag is a function', () => {
    expect(isAnalyticsAvailable()).toBe(true);
  });

  it('returns false when window.gtag is undefined', () => {
    Object.defineProperty(window, 'gtag', { value: undefined, writable: true, configurable: true });
    expect(isAnalyticsAvailable()).toBe(false);
  });
});

// =============================================================================
// Core trackEvent
// =============================================================================

describe('trackEvent', () => {
  it('sends event with category, label, and value', () => {
    trackEvent('test_action', 'TestCategory', 'test_label', 42);
    expect(mockGtag).toHaveBeenCalledWith('event', 'test_action', {
      event_category: 'TestCategory',
      event_label: 'test_label',
      value: 42,
    });
  });

  it('sends event without optional params', () => {
    trackEvent('action', 'Category');
    expect(mockGtag).toHaveBeenCalledWith('event', 'action', {
      event_category: 'Category',
      event_label: undefined,
      value: undefined,
    });
  });

  it('is a no-op when gtag is not available', () => {
    Object.defineProperty(window, 'gtag', { value: undefined, writable: true, configurable: true });
    trackEvent('action', 'Category');
    expect(mockGtag).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Audio Events
// =============================================================================

describe('Audio Events', () => {
  it('trackSongPlay sends both generic and structured events', () => {
    trackSongPlay(mockSong);
    expect(mockGtag).toHaveBeenCalledTimes(2);
    // Generic event
    expect(mockGtag).toHaveBeenCalledWith('event', 'play', {
      event_category: 'Audio',
      event_label: 'Grateful Dead - Dark Star',
      value: undefined,
    });
    // Structured event
    expect(mockGtag).toHaveBeenCalledWith('event', 'song_play', {
      artist_name: 'Grateful Dead',
      track_title: 'Dark Star',
      album_name: 'Live at Fillmore',
      show_venue: 'Fillmore West',
      show_date: '1969-02-27',
    });
  });

  it('trackSongComplete sends completion event', () => {
    trackSongComplete(mockSong);
    expect(mockGtag).toHaveBeenCalledWith('event', 'complete', {
      event_category: 'Audio',
      event_label: 'Grateful Dead - Dark Star',
      value: undefined,
    });
  });

  it('trackSeek sends seek percentage', () => {
    trackSeek(mockSong, 45.7);
    expect(mockGtag).toHaveBeenCalledWith('event', 'seek', {
      event_category: 'Audio',
      artist_name: 'Grateful Dead',
      track_title: 'Dark Star',
      seek_percent: 46, // rounded
    });
  });

  it('trackSkip sends skip with percentage', () => {
    trackSkip(mockSong, 33.3);
    expect(mockGtag).toHaveBeenCalledWith('event', 'track_skip', expect.objectContaining({
      percent_played: 33,
    }));
  });

  it('trackPrevious includes wasRestart flag', () => {
    trackPrevious(mockSong, 10, true);
    expect(mockGtag).toHaveBeenCalledWith('event', 'track_previous', expect.objectContaining({
      was_restart: true,
      percent_played: 10,
    }));
  });

  it('trackBuffer includes buffer duration and connection type', () => {
    trackBuffer(mockSong, 2500);
    expect(mockGtag).toHaveBeenCalledWith('event', 'audio_buffer', expect.objectContaining({
      buffer_duration_ms: 2500,
      non_interaction: true,
    }));
  });

  it('trackListeningSession sends session summary', () => {
    trackListeningSession(5, 1800, 3);
    expect(mockGtag).toHaveBeenCalledWith('event', 'listening_session_end', {
      event_category: 'Audio',
      tracks_played: 5,
      total_listening_seconds: 1800,
      unique_artists: 3,
      non_interaction: true,
    });
  });

  it('trackRepeatChange sends correct event name', () => {
    trackRepeatChange('all');
    expect(mockGtag).toHaveBeenCalledWith('event', 'repeat_all', expect.objectContaining({
      event_category: 'Audio',
    }));
  });

  it('trackQualityChange includes previous quality', () => {
    trackQualityChange('low', 'high');
    expect(mockGtag).toHaveBeenCalledWith('event', 'quality_change', expect.objectContaining({
      quality: 'low',
      previous_quality: 'high',
    }));
  });

  it('trackShuffleToggle sends queue size as value', () => {
    trackShuffleToggle(true, 15);
    expect(mockGtag).toHaveBeenCalledWith('event', 'shuffle_on', expect.objectContaining({
      value: 15,
    }));
  });
});

// =============================================================================
// Engagement Events
// =============================================================================

describe('Engagement Events', () => {
  it('trackAddToQueue sends track title', () => {
    trackAddToQueue(mockSong);
    expect(mockGtag).toHaveBeenCalledWith('event', 'add_to_queue', expect.objectContaining({
      event_label: 'Dark Star',
    }));
  });

  it('trackPlayNext sends artist and track', () => {
    trackPlayNext(mockSong);
    expect(mockGtag).toHaveBeenCalledWith('event', 'play_next', expect.objectContaining({
      event_label: 'Grateful Dead - Dark Star',
    }));
  });

  it('trackVersionChange includes version ID in label', () => {
    trackVersionChange('Dark Star', 'ver-abc');
    expect(mockGtag).toHaveBeenCalledWith('event', 'version_change', expect.objectContaining({
      event_label: 'Dark Star|ver-abc',
    }));
  });

  it('trackQueueReorder sends action type', () => {
    trackQueueReorder('move_block');
    expect(mockGtag).toHaveBeenCalledWith('event', 'queue_reorder', expect.objectContaining({
      event_label: 'move_block',
    }));
  });

  it('trackLike and trackUnlike send artist-track label', () => {
    trackLike(mockSong);
    expect(mockGtag).toHaveBeenCalledWith('event', 'like', expect.objectContaining({
      event_label: 'Grateful Dead - Dark Star',
    }));

    mockGtag.mockClear();
    trackUnlike(mockSong);
    expect(mockGtag).toHaveBeenCalledWith('event', 'unlike', expect.objectContaining({
      event_label: 'Grateful Dead - Dark Star',
    }));
  });

  it('trackScrollDepth fires at 25% threshold', () => {
    trackScrollDepth(30, '/artists');
    expect(mockGtag).toHaveBeenCalledWith('event', 'scroll', expect.objectContaining({
      percent_scrolled: 25,
    }));
  });

  it('trackScrollDepth fires at 75% threshold', () => {
    trackScrollDepth(80, '/artists');
    expect(mockGtag).toHaveBeenCalledWith('event', 'scroll', expect.objectContaining({
      percent_scrolled: 75,
    }));
  });

  it('trackScrollDepth does NOT fire at 100% (bug: no threshold matches)', () => {
    trackScrollDepth(100, '/artists');
    // 100 >= 90 && 100 < 115 → matches 90 threshold
    expect(mockGtag).toHaveBeenCalledWith('event', 'scroll', expect.objectContaining({
      percent_scrolled: 90,
    }));
  });

  it('trackScrollDepth does NOT fire below 25%', () => {
    trackScrollDepth(10, '/artists');
    expect(mockGtag).not.toHaveBeenCalled();
  });

  it('trackTimeOnPage sends seconds and path', () => {
    trackTimeOnPage(120, '/grateful-dead');
    expect(mockGtag).toHaveBeenCalledWith('event', 'time_on_page', expect.objectContaining({
      engagement_time_seconds: 120,
      page_path: '/grateful-dead',
    }));
  });
});

// =============================================================================
// Search Events
// =============================================================================

describe('Search Events', () => {
  it('trackSearch sends query and results count', () => {
    trackSearch('dark star', 42);
    // Sends both generic and structured events
    expect(mockGtag).toHaveBeenCalledTimes(2);
    expect(mockGtag).toHaveBeenCalledWith('event', 'search', expect.objectContaining({
      search_term: 'dark star',
      results_count: 42,
    }));
  });

  it('trackSearchResultClick sends position and type', () => {
    trackSearchResultClick('dark star', 'track', 'Dark Star', 3);
    expect(mockGtag).toHaveBeenCalledWith('event', 'search_result_click', expect.objectContaining({
      search_term: 'dark star',
      result_type: 'track',
      position: 3,
    }));
  });
});

// =============================================================================
// Navigation Events
// =============================================================================

describe('Navigation Events', () => {
  it('trackArtistView sends artist details', () => {
    trackArtistView({ name: 'Grateful Dead', id: 'gd1', slug: 'grateful-dead', albumCount: 50 } as Artist);
    expect(mockGtag).toHaveBeenCalledWith('event', 'view_artist', expect.objectContaining({
      artist_name: 'Grateful Dead',
      album_count: 50,
    }));
  });

  it('trackAlbumView sends album details', () => {
    trackAlbumView({
      name: 'Fillmore 1969',
      artistName: 'Grateful Dead',
      showVenue: 'Fillmore',
      showDate: '1969-02-27',
      totalTracks: 12,
    } as Album);
    expect(mockGtag).toHaveBeenCalledWith('event', 'view_album', expect.objectContaining({
      album_name: 'Fillmore 1969',
      track_count: 12,
    }));
  });

  it('trackPageView sends URL and title', () => {
    trackPageView('/grateful-dead', 'GD Shows');
    expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
      page_location: '/grateful-dead',
      page_title: 'GD Shows',
    });
  });
});

// =============================================================================
// Error Events
// =============================================================================

describe('Error Events', () => {
  it('trackPlaybackError sends stream URL and error type', () => {
    trackPlaybackError(mockSong, 'MEDIA_ERR_NETWORK');
    expect(mockGtag).toHaveBeenCalledWith('event', 'playback_error', expect.objectContaining({
      error_type: 'MEDIA_ERR_NETWORK',
      stream_url: 'https://archive.org/song.mp3',
    }));
  });

  it('trackError sends non-fatal exception', () => {
    trackError('GraphQL', 'timeout');
    expect(mockGtag).toHaveBeenCalledWith('event', 'exception', {
      description: 'GraphQL: timeout',
      fatal: false,
    });
  });
});

// =============================================================================
// Feature Adoption Events
// =============================================================================

describe('Feature Events', () => {
  it('trackSleepTimerStart sends preset', () => {
    trackSleepTimerStart('15min');
    expect(mockGtag).toHaveBeenCalledWith('event', 'sleep_timer_start', expect.objectContaining({
      event_label: '15min',
    }));
  });

  it('trackSleepTimerCancel and trackSleepTimerComplete fire correctly', () => {
    trackSleepTimerCancel();
    expect(mockGtag).toHaveBeenCalledWith('event', 'sleep_timer_cancel', expect.anything());

    mockGtag.mockClear();
    trackSleepTimerComplete();
    expect(mockGtag).toHaveBeenCalledWith('event', 'sleep_timer_complete', expect.anything());
  });

  it('trackThemeChange sends from and to themes', () => {
    trackThemeChange('lot', 'camp');
    expect(mockGtag).toHaveBeenCalledWith('event', 'theme_change', {
      event_category: 'Feature',
      from_theme: 'lot',
      to_theme: 'camp',
    });
  });

  it('trackKeyboardShortcut sends key and action', () => {
    trackKeyboardShortcut('Space', 'toggle_play');
    expect(mockGtag).toHaveBeenCalledWith('event', 'keyboard_shortcut', expect.objectContaining({
      key: 'Space',
      action: 'toggle_play',
    }));
  });

  it('trackCrossfadeChange sends duration label', () => {
    trackCrossfadeChange(3);
    expect(mockGtag).toHaveBeenCalledWith('event', 'crossfade_change', expect.objectContaining({
      event_label: '3s',
    }));

    mockGtag.mockClear();
    trackCrossfadeChange(0);
    expect(mockGtag).toHaveBeenCalledWith('event', 'crossfade_change', expect.objectContaining({
      event_label: 'off',
    }));
  });

  it('trackResumeBar sends action variant', () => {
    trackResumeBar('shown');
    expect(mockGtag).toHaveBeenCalledWith('event', 'resume_bar_shown', expect.objectContaining({
      non_interaction: true,
    }));

    mockGtag.mockClear();
    trackResumeBar('clicked');
    expect(mockGtag).toHaveBeenCalledWith('event', 'resume_bar_clicked', expect.objectContaining({
      non_interaction: false,
    }));
  });
});

// =============================================================================
// Social Events
// =============================================================================

describe('Social Events', () => {
  it('trackShare sends content type and method', () => {
    trackShare('album', 'Fillmore 1969', 'copy_link');
    expect(mockGtag).toHaveBeenCalledWith('event', 'share', expect.objectContaining({
      content_type: 'album',
      method: 'copy_link',
    }));
  });

  it('trackSharedCassetteImport sends cassette and artist info', () => {
    trackSharedCassetteImport('My Mix', 'deadhead42', 'Grateful Dead');
    expect(mockGtag).toHaveBeenCalledWith('event', 'shared_cassette_import', expect.objectContaining({
      cassette_name: 'My Mix',
      shared_by: 'deadhead42',
      artist_name: 'Grateful Dead',
    }));
  });
});

// =============================================================================
// Venue Events
// =============================================================================

describe('Venue Events', () => {
  it('trackVenueClick sends venue name and slug', () => {
    trackVenueClick('Red Rocks', 'red-rocks');
    expect(mockGtag).toHaveBeenCalledWith('event', 'venue_click', {
      event_category: 'Discovery',
      venue_name: 'Red Rocks',
      venue_slug: 'red-rocks',
    });
  });
});

// =============================================================================
// MiniDisc / Cassette Events
// =============================================================================

describe('Collection Events', () => {
  it('trackMiniDiscCreate and Delete send name', () => {
    trackMiniDiscCreate('Road Trip');
    expect(mockGtag).toHaveBeenCalledWith('event', 'minidisc_create', expect.objectContaining({
      minidisc_name: 'Road Trip',
    }));

    mockGtag.mockClear();
    trackMiniDiscDelete('Road Trip');
    expect(mockGtag).toHaveBeenCalledWith('event', 'minidisc_delete', expect.objectContaining({
      minidisc_name: 'Road Trip',
    }));
  });

  it('trackAddToMiniDisc sends both generic and structured events', () => {
    trackAddToMiniDisc(mockSong, 'Road Trip');
    expect(mockGtag).toHaveBeenCalledTimes(2);
  });

  it('trackCassetteSave sends name and artist', () => {
    trackCassetteSave('My Picks', 'Grateful Dead');
    expect(mockGtag).toHaveBeenCalledWith('event', 'cassette_save', expect.objectContaining({
      cassette_name: 'My Picks',
      artist_name: 'Grateful Dead',
    }));
  });

  it('legacy aliases point to correct functions', () => {
    expect(trackPlaylistCreate).toBe(trackMiniDiscCreate);
    expect(trackPlaylistDelete).toBe(trackMiniDiscDelete);
    expect(trackRemoveFromPlaylist).toBe(trackRemoveFromMiniDisc);
  });
});

// =============================================================================
// Follow Events
// =============================================================================

describe('Follow Events', () => {
  it('trackFollowArtist and trackUnfollowArtist send slug', () => {
    trackFollowArtist('Grateful Dead', 'grateful-dead');
    expect(mockGtag).toHaveBeenCalledWith('event', 'follow_artist', expect.objectContaining({
      artist_slug: 'grateful-dead',
    }));

    mockGtag.mockClear();
    trackUnfollowArtist('Grateful Dead', 'grateful-dead');
    expect(mockGtag).toHaveBeenCalledWith('event', 'unfollow_artist', expect.objectContaining({
      artist_slug: 'grateful-dead',
    }));
  });

  it('trackFollowAlbum and trackUnfollowAlbum send album and artist', () => {
    trackFollowAlbum('Fillmore 1969', 'Grateful Dead');
    expect(mockGtag).toHaveBeenCalledWith('event', 'follow_album', expect.objectContaining({
      album_name: 'Fillmore 1969',
    }));

    mockGtag.mockClear();
    trackUnfollowAlbum('Fillmore 1969', 'Grateful Dead');
    expect(mockGtag).toHaveBeenCalledWith('event', 'unfollow_album', expect.objectContaining({
      album_name: 'Fillmore 1969',
    }));
  });
});

// =============================================================================
// Web Vitals
// =============================================================================

describe('Web Vitals', () => {
  it('trackWebVitals sends metric with rounded value', () => {
    const metric: WebVitalMetric = {
      name: 'LCP',
      value: 2543.7,
      rating: 'good',
      delta: 100,
      id: 'v3-lcp-1',
    };
    trackWebVitals(metric);
    expect(mockGtag).toHaveBeenCalledWith('event', 'LCP', expect.objectContaining({
      value: 2544, // rounded
      metric_rating: 'good',
    }));
  });

  it('trackWebVitals multiplies CLS by 1000', () => {
    const metric: WebVitalMetric = {
      name: 'CLS',
      value: 0.15,
      rating: 'good',
      delta: 0.05,
      id: 'v3-cls-1',
    };
    trackWebVitals(metric);
    expect(mockGtag).toHaveBeenCalledWith('event', 'CLS', expect.objectContaining({
      value: 150, // 0.15 * 1000
    }));
  });
});

// =============================================================================
// Auth Events
// =============================================================================

describe('Auth Events', () => {
  it('trackSignUp and trackLogin send method', () => {
    trackSignUp('email');
    expect(mockGtag).toHaveBeenCalledWith('event', 'sign_up', { method: 'email' });

    mockGtag.mockClear();
    trackLogin('google');
    expect(mockGtag).toHaveBeenCalledWith('event', 'login', { method: 'google' });
  });
});

// =============================================================================
// User Properties
// =============================================================================

describe('setUserProperties', () => {
  it('sends properties via gtag set command', () => {
    setUserProperties({ preferred_theme: 'lot', auth_status: 'logged_in' });
    expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', {
      preferred_theme: 'lot',
      auth_status: 'logged_in',
    });
  });
});

// =============================================================================
// Batch Events
// =============================================================================

describe('trackEvents', () => {
  it('fires multiple events', () => {
    trackEvents([
      { action: 'a1', category: 'c1', label: 'l1' },
      { action: 'a2', category: 'c2', value: 10 },
    ]);
    expect(mockGtag).toHaveBeenCalledTimes(2);
  });
});

// =============================================================================
// SSR Safety
// =============================================================================

describe('SSR safety', () => {
  it('all functions are no-ops when gtag is undefined', () => {
    Object.defineProperty(window, 'gtag', { value: undefined, writable: true, configurable: true });

    // These should all silently no-op
    trackSongPlay(mockSong);
    trackSongComplete(mockSong);
    trackSeek(mockSong, 50);
    trackSkip(mockSong, 30);
    trackPrevious(mockSong, 10, false);
    trackBuffer(mockSong, 1000);
    trackListeningSession(3, 900, 2);
    trackSearch('test', 5);
    trackPlaybackError(mockSong, 'test');
    trackError('test', 'msg');
    trackThemeChange('lot', 'camp');
    trackVenueClick('Red Rocks', 'red-rocks');
    trackResumeBar('shown');
    setUserProperties({ test: 'val' });

    expect(mockGtag).not.toHaveBeenCalled();
  });
});
