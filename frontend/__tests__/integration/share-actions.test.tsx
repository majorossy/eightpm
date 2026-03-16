/**
 * Integration test: Share clipboard and native share actions
 *
 * Tests useShare hook methods not covered by share-url.test.tsx:
 * - copyToClipboard: writes to clipboard, sets copied state, tracks analytics
 * - copyToClipboard: returns false on clipboard failure
 * - nativeShare: calls Web Share API with correct params
 * - nativeShare: returns false when API unavailable
 * - nativeShare: returns false when user cancels
 * - shareableSong / shareableTrack / shareableAlbum helper constructors
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShare } from '@/hooks/useShare';
import { Song, Track, Album } from '@/lib/types';

// Mock analytics
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

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
    albumIdentifier: 'rre-2024-06-15',
    albumName: 'Red Rocks 2024',
    trackTitle: 'Bird on a Wire',
    ...overrides,
  };
}

describe('Share Actions Integration', () => {
  let originalClipboard: Clipboard;
  let originalShare: Navigator['share'];

  beforeEach(() => {
    originalClipboard = navigator.clipboard;
    originalShare = navigator.share;
    vi.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: originalShare,
      writable: true,
      configurable: true,
    });
    vi.useRealTimers();
  });

  describe('copyToClipboard', () => {
    it('writes URL to clipboard and returns true', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useShare());
      let success: boolean = false;

      await act(async () => {
        success = await result.current.copyToClipboard('https://8pm.me/test');
      });

      expect(success).toBe(true);
      expect(writeText).toHaveBeenCalledWith('https://8pm.me/test');
    });

    it('sets copiedToClipboard state temporarily', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useShare());

      await act(async () => {
        await result.current.copyToClipboard('https://8pm.me/test');
      });

      expect(result.current.copiedToClipboard).toBe(true);

      // Resets after 2 seconds
      act(() => { vi.advanceTimersByTime(2000); });
      expect(result.current.copiedToClipboard).toBe(false);
    });

    it('returns false when clipboard fails', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useShare());
      let success: boolean = true;

      await act(async () => {
        success = await result.current.copyToClipboard('https://8pm.me/test');
      });

      expect(success).toBe(false);
    });
  });

  describe('nativeShare', () => {
    it('calls Web Share API with title and URL', async () => {
      const shareFn = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: shareFn,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useShare());
      let success: boolean = false;

      await act(async () => {
        success = await result.current.nativeShare('https://8pm.me/test', 'Test Share');
      });

      expect(success).toBe(true);
      expect(shareFn).toHaveBeenCalledWith({
        title: 'Test Share',
        url: 'https://8pm.me/test',
      });
    });

    it('returns false when share API unavailable', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useShare());
      let success: boolean = true;

      await act(async () => {
        success = await result.current.nativeShare('https://8pm.me/test', 'Test');
      });

      expect(success).toBe(false);
    });

    it('returns false when user cancels share', async () => {
      const shareFn = vi.fn().mockRejectedValue(new Error('Share canceled'));
      Object.defineProperty(navigator, 'share', {
        value: shareFn,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useShare());
      let success: boolean = true;

      await act(async () => {
        success = await result.current.nativeShare('https://8pm.me/test', 'Test');
      });

      expect(success).toBe(false);
    });
  });

  describe('shareable helpers', () => {
    it('shareableSong extracts correct fields from Song', () => {
      const song = buildSong({ id: 's1', title: 'Dark Star', artistSlug: 'grateful-dead', albumIdentifier: 'gd1977-05-08' });
      const { result } = renderHook(() => useShare());
      const shareable = result.current.shareableSong(song);

      expect(shareable.type).toBe('song');
      expect(shareable.id).toBe('s1');
      expect(shareable.title).toBe('Dark Star');
      expect(shareable.artistSlug).toBe('grateful-dead');
      expect(shareable.albumIdentifier).toBe('gd1977-05-08');
    });

    it('shareableTrack extracts correct fields from Track', () => {
      const track = {
        id: 't1',
        title: 'Bird on a Wire',
        slug: 'bird-on-a-wire',
        artistSlug: 'railroadearth',
        albumIdentifier: 'rre-2024',
        albumName: 'Red Rocks',
        artistId: 'a1',
        artistName: 'Railroad Earth',
        songs: [],
        totalDuration: 300,
        songCount: 1,
      } as Track;

      const { result } = renderHook(() => useShare());
      const shareable = result.current.shareableTrack(track);

      expect(shareable.type).toBe('track');
      expect(shareable.id).toBe('t1');
      expect(shareable.title).toBe('Bird on a Wire');
    });

    it('shareableAlbum extracts correct fields from Album', () => {
      const album = {
        id: 'a1',
        identifier: 'rre-2024-06-15',
        name: 'Red Rocks 2024',
        slug: 'rre-2024-06-15',
        artistId: 'a1',
        artistName: 'Railroad Earth',
        artistSlug: 'railroadearth',
        tracks: [],
        totalTracks: 0,
        totalSongs: 0,
        totalDuration: 0,
      } as Album;

      const { result } = renderHook(() => useShare());
      const shareable = result.current.shareableAlbum(album);

      expect(shareable.type).toBe('album');
      expect(shareable.id).toBe('a1');
      expect(shareable.title).toBe('Red Rocks 2024');
      expect(shareable.artistSlug).toBe('railroadearth');
      expect(shareable.albumIdentifier).toBe('rre-2024-06-15');
    });
  });
});
