/**
 * No-op mock for @/lib/analytics.
 *
 * Every exported function becomes a vi.fn() that does nothing.
 * Tests can assert on calls without triggering real GA4 events.
 */
import { vi } from 'vitest';

export const isAnalyticsAvailable = vi.fn(() => false);
export const getGAMeasurementId = vi.fn(() => undefined);
export const trackEvent = vi.fn();
export const trackSongPlay = vi.fn();
export const trackSongComplete = vi.fn();
export const trackSeek = vi.fn();
export const trackAddToPlaylist = vi.fn();
export const trackAddToQueue = vi.fn();
export const trackPlayNext = vi.fn();
export const trackVersionChange = vi.fn();
export const trackQueueReorder = vi.fn();
export const trackLike = vi.fn();
export const trackUnlike = vi.fn();
export const trackSearch = vi.fn();
export const trackSearchResultClick = vi.fn();
export const trackShare = vi.fn();
export const trackArtistView = vi.fn();
export const trackAlbumView = vi.fn();
export const trackPlaybackError = vi.fn();
export const trackError = vi.fn();
export const trackWebVitals = vi.fn();
export const trackPageView = vi.fn();
export const trackTimeOnPage = vi.fn();
export const trackScrollDepth = vi.fn();
export const trackSignUp = vi.fn();
export const trackLogin = vi.fn();
export const trackMiniDiscCreate = vi.fn();
export const trackMiniDiscDelete = vi.fn();
export const trackAddToMiniDisc = vi.fn();
export const trackRemoveFromMiniDisc = vi.fn();
export const trackCassetteSave = vi.fn();
export const trackCassetteDelete = vi.fn();
export const trackPlaylistCreate = vi.fn();
export const trackPlaylistDelete = vi.fn();
export const trackRemoveFromPlaylist = vi.fn();
export const trackFollowArtist = vi.fn();
export const trackUnfollowArtist = vi.fn();
export const trackFollowAlbum = vi.fn();
export const trackUnfollowAlbum = vi.fn();
export const trackQualityChange = vi.fn();
export const trackRepeatChange = vi.fn();
export const trackDownload = vi.fn();
export const trackPWAInstallPrompt = vi.fn();
export const trackPWAInstall = vi.fn();
export const trackPWAInstallDismissed = vi.fn();
export const trackSkip = vi.fn();
export const trackPrevious = vi.fn();
export const trackShuffleToggle = vi.fn();
export const trackBuffer = vi.fn();
export const trackListeningSession = vi.fn();
export const trackSleepTimerStart = vi.fn();
export const trackSleepTimerCancel = vi.fn();
export const trackSleepTimerComplete = vi.fn();
export const trackThemeChange = vi.fn();
export const trackKeyboardShortcut = vi.fn();
export const trackVenueClick = vi.fn();
export const trackResumeBar = vi.fn();
export const trackCrossfadeChange = vi.fn();
export const trackSharedCassetteImport = vi.fn();
export const setUserProperties = vi.fn();
export const trackEvents = vi.fn();
