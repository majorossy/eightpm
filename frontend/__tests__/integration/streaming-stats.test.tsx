/**
 * Integration test: useStreamingStats hook
 *
 * Tests useStreamingStats from hooks/useStreamingStats.ts:
 * - Default state: all zeros, online=true
 * - Tracks online/offline status via window events
 * - Reads network info from navigator.connection
 * - Default networkType is null when no Connection API
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamingStats } from '@/hooks/useStreamingStats';
import { useRef } from 'react';

describe('Streaming Stats Integration', () => {
  let originalOnLine: boolean;
  let rafCallbacks: Array<(time: number) => void>;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    rafCallbacks = [];

    // Mock RAF to NOT call synchronously (avoids infinite recursion)
    let rafId = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafId++;
      rafCallbacks.push(cb);
      return rafId;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
    // Clean up connection mock
    try {
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    } catch {}
  });

  it('returns empty stats when audio ref is null', () => {
    const { result } = renderHook(() => {
      const audioRef = useRef<HTMLAudioElement>(null);
      return useStreamingStats(audioRef);
    });

    expect(result.current.bufferedPercent).toBe(0);
    expect(result.current.bufferedAhead).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isOnline).toBe(true);
  });

  it('detects offline status via window event', () => {
    const { result } = renderHook(() => {
      const audioRef = useRef<HTMLAudioElement>(null);
      return useStreamingStats(audioRef);
    });

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('detects online recovery via window event', () => {
    const { result } = renderHook(() => {
      const audioRef = useRef<HTMLAudioElement>(null);
      return useStreamingStats(audioRef);
    });

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
  });

  it('reads network type from navigator.connection', () => {
    const mockConnection = {
      effectiveType: '4g',
      downlink: 10.5,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(navigator, 'connection', {
      value: mockConnection,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => {
      const audioRef = useRef<HTMLAudioElement>(null);
      return useStreamingStats(audioRef);
    });

    expect(result.current.networkType).toBe('4g');
    expect(result.current.downlinkMbps).toBe(10.5);
  });

  it('defaults networkType to null when no Connection API', () => {
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => {
      const audioRef = useRef<HTMLAudioElement>(null);
      return useStreamingStats(audioRef);
    });

    expect(result.current.networkType).toBeNull();
    expect(result.current.downlinkMbps).toBeNull();
  });

  it('registers RAF for polling buffer state', () => {
    renderHook(() => {
      const audioRef = useRef<HTMLAudioElement>(null);
      return useStreamingStats(audioRef);
    });

    // RAF should have been called (hook sets up a polling loop)
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });
});
