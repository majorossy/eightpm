/**
 * Integration test: GA4 analytics event tracking
 *
 * Tests from lib/analytics.ts:
 * - isAnalyticsAvailable: checks for window.gtag
 * - trackEvent: sends structured events to GA4
 * - trackSongPlay: sends play + song_play events
 * - trackSearch: sends search event with results count
 * - trackShare: sends share event with content type
 * - trackWebVitals: sends CWV metrics (CLS multiplied by 1000)
 * - No-op when gtag unavailable
 * - trackEvents batch helper
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Song } from '@/lib/types';
import {
  isAnalyticsAvailable,
  trackEvent,
  trackSongPlay,
  trackSongComplete,
  trackSearch,
  trackShare,
  trackWebVitals,
  trackAddToQueue,
  trackLike,
  trackUnlike,
  trackEvents,
  trackRepeatChange,
  trackShuffleToggle,
  trackMiniDiscCreate,
  trackCassetteSave,
  trackPageView,
  type WebVitalMetric,
} from '@/lib/analytics';

function buildSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-1',
    sku: 'song-1',
    title: 'Bird on a Wire',
    artistId: 'a1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroadearth',
    duration: 300,
    streamUrl: 'https://example.com/test.mp3',
    albumArt: '',
    qualityUrls: {},
    albumIdentifier: 'rre-2024',
    albumName: 'Red Rocks 2024',
    trackTitle: 'Bird on a Wire',
    ...overrides,
  };
}

describe('Analytics Integration', () => {
  let gtagMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagMock = vi.fn();
    (window as any).gtag = gtagMock;
  });

  afterEach(() => {
    delete (window as any).gtag;
  });

  describe('isAnalyticsAvailable', () => {
    it('returns true when gtag exists', () => {
      expect(isAnalyticsAvailable()).toBe(true);
    });

    it('returns false when gtag missing', () => {
      delete (window as any).gtag;
      expect(isAnalyticsAvailable()).toBe(false);
    });
  });

  describe('trackEvent', () => {
    it('sends event with category and label', () => {
      trackEvent('play', 'Audio', 'Railroad Earth - Bird on a Wire');

      expect(gtagMock).toHaveBeenCalledWith('event', 'play', {
        event_category: 'Audio',
        event_label: 'Railroad Earth - Bird on a Wire',
        value: undefined,
      });
    });

    it('sends event with numeric value', () => {
      trackEvent('search', 'Discovery', 'phish', 42);

      expect(gtagMock).toHaveBeenCalledWith('event', 'search', {
        event_category: 'Discovery',
        event_label: 'phish',
        value: 42,
      });
    });

    it('no-ops when gtag is undefined', () => {
      delete (window as any).gtag;
      // Should not throw
      trackEvent('play', 'Audio', 'test');
    });
  });

  describe('trackSongPlay', () => {
    it('sends both play and song_play events', () => {
      const song = buildSong();
      trackSongPlay(song);

      // First call: trackEvent('play', ...)
      expect(gtagMock).toHaveBeenCalledWith('event', 'play', expect.objectContaining({
        event_category: 'Audio',
      }));

      // Second call: structured song_play event
      expect(gtagMock).toHaveBeenCalledWith('event', 'song_play', expect.objectContaining({
        artist_name: 'Railroad Earth',
        track_title: 'Bird on a Wire',
        album_name: 'Red Rocks 2024',
      }));
    });
  });

  describe('trackSongComplete', () => {
    it('sends complete event', () => {
      trackSongComplete(buildSong());
      expect(gtagMock).toHaveBeenCalledWith('event', 'complete', expect.objectContaining({
        event_category: 'Audio',
      }));
    });
  });

  describe('trackSearch', () => {
    it('sends search with results count', () => {
      trackSearch('railroad earth red rocks', 15);

      expect(gtagMock).toHaveBeenCalledWith('event', 'search', expect.objectContaining({
        search_term: 'railroad earth red rocks',
        results_count: 15,
      }));
    });
  });

  describe('trackShare', () => {
    it('sends share with content type and method', () => {
      trackShare('song', 'Bird on a Wire', 'copy_link');

      expect(gtagMock).toHaveBeenCalledWith('event', 'share', expect.objectContaining({
        content_type: 'song',
        item_id: 'Bird on a Wire',
        method: 'copy_link',
      }));
    });
  });

  describe('trackWebVitals', () => {
    it('sends CLS value multiplied by 1000', () => {
      const metric: WebVitalMetric = {
        name: 'CLS',
        value: 0.125,
        rating: 'good',
        delta: 0.01,
        id: 'v1-123',
      };

      trackWebVitals(metric);

      expect(gtagMock).toHaveBeenCalledWith('event', 'CLS', expect.objectContaining({
        event_category: 'Web Vitals',
        value: 125, // 0.125 * 1000, rounded
        metric_rating: 'good',
      }));
    });

    it('sends LCP value as-is (rounded)', () => {
      const metric: WebVitalMetric = {
        name: 'LCP',
        value: 2345.6,
        rating: 'needs-improvement',
        delta: 100,
        id: 'v1-456',
      };

      trackWebVitals(metric);

      expect(gtagMock).toHaveBeenCalledWith('event', 'LCP', expect.objectContaining({
        value: 2346, // rounded
        metric_rating: 'needs-improvement',
      }));
    });
  });

  describe('engagement events', () => {
    it('trackAddToQueue sends event', () => {
      trackAddToQueue(buildSong());
      expect(gtagMock).toHaveBeenCalledWith('event', 'add_to_queue', expect.any(Object));
    });

    it('trackLike and trackUnlike send events', () => {
      trackLike(buildSong());
      expect(gtagMock).toHaveBeenCalledWith('event', 'like', expect.any(Object));

      trackUnlike(buildSong());
      expect(gtagMock).toHaveBeenCalledWith('event', 'unlike', expect.any(Object));
    });

    it('trackMiniDiscCreate sends event', () => {
      trackMiniDiscCreate('Summer Jams');
      expect(gtagMock).toHaveBeenCalledWith('event', 'minidisc_create', expect.objectContaining({
        minidisc_name: 'Summer Jams',
      }));
    });

    it('trackCassetteSave sends event', () => {
      trackCassetteSave('My Tape', 'Railroad Earth');
      expect(gtagMock).toHaveBeenCalledWith('event', 'cassette_save', expect.objectContaining({
        cassette_name: 'My Tape',
        artist_name: 'Railroad Earth',
      }));
    });
  });

  describe('playback control events', () => {
    it('trackRepeatChange sends repeat mode', () => {
      trackRepeatChange('all');
      expect(gtagMock).toHaveBeenCalledWith('event', 'repeat_all', expect.any(Object));
    });

    it('trackShuffleToggle sends state and queue size', () => {
      trackShuffleToggle(true, 15);
      expect(gtagMock).toHaveBeenCalledWith('event', 'shuffle_on', expect.objectContaining({
        value: 15,
      }));
    });
  });

  describe('trackEvents batch', () => {
    it('sends multiple events', () => {
      trackEvents([
        { action: 'play', category: 'Audio', label: 'Song A' },
        { action: 'like', category: 'Engagement', label: 'Song B' },
      ]);

      expect(gtagMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('trackPageView', () => {
    it('sends page_view event', () => {
      trackPageView('/artists/railroadearth', 'Railroad Earth');
      expect(gtagMock).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
        page_location: '/artists/railroadearth',
        page_title: 'Railroad Earth',
      }));
    });
  });
});
