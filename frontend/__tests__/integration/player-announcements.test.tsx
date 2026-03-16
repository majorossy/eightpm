/**
 * Integration test: Player accessibility announcements
 *
 * Tests usePlayerAnnouncements hook:
 * - Announces "Now playing: {title} by {artist}" on track change
 * - Announces "Playing" / "Paused" on play/pause toggle
 * - Clears announcement after timeout (3s for track, 2s for state)
 * - Does not announce on initial mount (play/pause)
 * - Empty when no song
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerAnnouncements } from '@/components/player/usePlayerAnnouncements';

describe('Player Announcements Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty string when no song', () => {
    const { result } = renderHook(() => usePlayerAnnouncements(null, false));
    expect(result.current).toBe('');
  });

  it('announces track change', () => {
    const song = { title: 'Bird on a Wire', artistName: 'Railroad Earth', id: 's1' };
    const { result } = renderHook(() => usePlayerAnnouncements(song, false));

    expect(result.current).toBe('Now playing: Bird on a Wire by Railroad Earth');
  });

  it('clears track announcement after 3 seconds', () => {
    const song = { title: 'Bird on a Wire', artistName: 'Railroad Earth', id: 's1' };
    const { result } = renderHook(() => usePlayerAnnouncements(song, false));

    expect(result.current).toBe('Now playing: Bird on a Wire by Railroad Earth');

    act(() => { vi.advanceTimersByTime(3000); });

    expect(result.current).toBe('');
  });

  it('announces new track when song changes', () => {
    const song1 = { title: 'Bird on a Wire', artistName: 'Railroad Earth', id: 's1' };
    const song2 = { title: 'Dark Star', artistName: 'Grateful Dead', id: 's2' };

    const { result, rerender } = renderHook(
      ({ song, playing }) => usePlayerAnnouncements(song, playing),
      { initialProps: { song: song1, playing: false } },
    );

    expect(result.current).toContain('Bird on a Wire');

    rerender({ song: song2, playing: false });

    expect(result.current).toBe('Now playing: Dark Star by Grateful Dead');
  });

  it('does not announce play/pause on initial mount', () => {
    const song = { title: 'Bird on a Wire', artistName: 'Railroad Earth', id: 's1' };
    const { result } = renderHook(() => usePlayerAnnouncements(song, true));

    // Should have track announcement, but NOT "Playing"
    expect(result.current).toBe('Now playing: Bird on a Wire by Railroad Earth');
  });

  it('announces "Playing" when playback starts after initial mount', () => {
    const song = { title: 'Bird on a Wire', artistName: 'Railroad Earth', id: 's1' };

    const { result, rerender } = renderHook(
      ({ song: s, playing }) => usePlayerAnnouncements(s, playing),
      { initialProps: { song, playing: false } },
    );

    // Clear the track announcement
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current).toBe('');

    // Toggle to playing
    rerender({ song, playing: true });
    expect(result.current).toBe('Playing');
  });

  it('announces "Paused" when playback pauses', () => {
    const song = { title: 'Bird on a Wire', artistName: 'Railroad Earth', id: 's1' };

    const { result, rerender } = renderHook(
      ({ song: s, playing }) => usePlayerAnnouncements(s, playing),
      { initialProps: { song, playing: true } },
    );

    // Clear track announcement
    act(() => { vi.advanceTimersByTime(3000); });

    // Pause
    rerender({ song, playing: false });
    expect(result.current).toBe('Paused');
  });

  it('clears play/pause announcement after 2 seconds', () => {
    const song = { title: 'Bird on a Wire', artistName: 'Railroad Earth', id: 's1' };

    const { result, rerender } = renderHook(
      ({ song: s, playing }) => usePlayerAnnouncements(s, playing),
      { initialProps: { song, playing: false } },
    );

    act(() => { vi.advanceTimersByTime(3000); }); // clear track announcement

    rerender({ song, playing: true }); // trigger Playing
    expect(result.current).toBe('Playing');

    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current).toBe('');
  });
});
