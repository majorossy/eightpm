/**
 * Integration test: Crossfade dual-audio management
 *
 * Tests useCrossfade hook state management:
 * - Initial state: activeElement='A', isCrossfading=false
 * - swapActiveElement toggles A/B
 * - stopCrossfade resets crossfade state
 * - clearPreload clears preloaded source
 * - getCurrentAudio returns the active element
 * - preloadNextTrack skips duplicate src
 *
 * Note: Audio elements are mocked since jsdom has no native Audio.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrossfade } from '@/hooks/useCrossfade';

// Mock Audio constructor
class MockAudio {
  src = '';
  volume = 1;
  currentTime = 0;
  crossOrigin = '';
  preload = '';
  buffered = { length: 0, start: () => 0, end: () => 0 };
  pause = vi.fn();
  play = vi.fn().mockResolvedValue(undefined);
  load = vi.fn();
}

beforeEach(() => {
  (globalThis as any).Audio = MockAudio;
});

afterEach(() => {
  delete (globalThis as any).Audio;
});

function renderCrossfade(duration = 5) {
  return renderHook(() =>
    useCrossfade({
      crossfadeDuration: duration,
      onTrackEnd: vi.fn(),
      getCurrentTime: () => 0,
      getDuration: () => 300,
    }),
  );
}

describe('Crossfade Hook Integration', () => {
  it('starts with activeElement A and not crossfading', () => {
    const { result } = renderCrossfade();

    expect(result.current.state.activeElement).toBe('A');
    expect(result.current.state.isCrossfading).toBe(false);
    expect(result.current.state.crossfadeProgress).toBe(0);
  });

  it('creates audio elements on mount', () => {
    const { result } = renderCrossfade();

    expect(result.current.audioRefA.current).toBeInstanceOf(MockAudio);
    expect(result.current.audioRefB.current).toBeInstanceOf(MockAudio);
  });

  it('sets crossOrigin on audio elements', () => {
    const { result } = renderCrossfade();

    expect(result.current.audioRefA.current!.crossOrigin).toBe('anonymous');
    expect(result.current.audioRefB.current!.crossOrigin).toBe('anonymous');
  });

  it('swapActiveElement toggles between A and B', () => {
    const { result } = renderCrossfade();

    expect(result.current.state.activeElement).toBe('A');

    act(() => { result.current.swapActiveElement(); });
    expect(result.current.state.activeElement).toBe('B');

    act(() => { result.current.swapActiveElement(); });
    expect(result.current.state.activeElement).toBe('A');
  });

  it('activeAudioRef matches current active element', () => {
    const { result } = renderCrossfade();

    // Initially active = A
    expect(result.current.activeAudioRef.current).toBe(result.current.audioRefA.current);
    expect(result.current.inactiveAudioRef.current).toBe(result.current.audioRefB.current);
  });

  it('getCurrentAudio returns the active element', () => {
    const { result } = renderCrossfade();

    const audio = result.current.getCurrentAudio();
    expect(audio).toBe(result.current.audioRefA.current);
  });

  it('stopCrossfade resets crossfade state', () => {
    const { result } = renderCrossfade();

    act(() => { result.current.stopCrossfade(); });

    expect(result.current.state.isCrossfading).toBe(false);
    expect(result.current.state.crossfadeProgress).toBe(0);
  });

  it('preloadNextTrack sets src on inactive element', () => {
    const { result } = renderCrossfade();
    const inactiveAudio = result.current.inactiveAudioRef.current!;

    act(() => {
      result.current.preloadNextTrack('https://example.com/next.mp3');
    });

    expect(inactiveAudio.src).toBe('https://example.com/next.mp3');
    expect(inactiveAudio.load).toHaveBeenCalled();
  });

  it('preloadNextTrack skips if same src already loaded', () => {
    const { result } = renderCrossfade();
    const inactiveAudio = result.current.inactiveAudioRef.current!;

    act(() => {
      result.current.preloadNextTrack('https://example.com/next.mp3');
    });

    const loadCount = inactiveAudio.load.mock.calls.length;

    act(() => {
      result.current.preloadNextTrack('https://example.com/next.mp3');
    });

    // Should not have loaded again
    expect(inactiveAudio.load.mock.calls.length).toBe(loadCount);
  });

  it('clearPreload clears the preloaded source', () => {
    const { result } = renderCrossfade();

    act(() => {
      result.current.preloadNextTrack('https://example.com/next.mp3');
    });

    act(() => {
      result.current.clearPreload();
    });

    expect(result.current.inactiveAudioRef.current!.src).toBe('');
  });

  it('crossfade disabled when duration is 0', () => {
    const { result } = renderCrossfade(0);

    expect(result.current.state.isCrossfading).toBe(false);
    // With duration 0, crossfade should never trigger
  });
});
