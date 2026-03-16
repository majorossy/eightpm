/**
 * Integration test: Track version preferences
 *
 * Tests useTrackPreferences hook:
 * - setPreferred stores trackId → songId mapping
 * - getPreferred returns correct songId or null
 * - clearPreferred removes a single preference
 * - setAll bulk-overrides entire map
 * - localStorage persistence per album
 * - Empty prefs removes localStorage key
 * - Different albums have isolated preferences
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useTrackPreferences } from '@/hooks/useTrackPreferences';

function PrefsDisplay({ albumId }: { albumId: string }) {
  const prefs = useTrackPreferences(albumId);

  const pref1 = prefs.getPreferred('track-1');
  const pref2 = prefs.getPreferred('track-2');
  const overrides = prefs.getOverridesMap();

  return (
    <div>
      <div data-testid="pref-1">{pref1 ?? 'null'}</div>
      <div data-testid="pref-2">{pref2 ?? 'null'}</div>
      <div data-testid="overrides-size">{overrides.size}</div>
      <button
        data-testid="set-1"
        onClick={() => prefs.setPreferred('track-1', 'song-sbd-1')}
      >Set Track 1</button>
      <button
        data-testid="set-2"
        onClick={() => prefs.setPreferred('track-2', 'song-aud-2')}
      >Set Track 2</button>
      <button
        data-testid="clear-1"
        onClick={() => prefs.clearPreferred('track-1')}
      >Clear Track 1</button>
      <button
        data-testid="set-all"
        onClick={() => prefs.setAll({ 'track-1': 'song-mtx-1', 'track-3': 'song-sbd-3' })}
      >Set All</button>
    </div>
  );
}

describe('Track Preferences Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to null for unset preferences', () => {
    render(<PrefsDisplay albumId="album-123" />);

    expect(screen.getByTestId('pref-1').textContent).toBe('null');
    expect(screen.getByTestId('pref-2').textContent).toBe('null');
    expect(screen.getByTestId('overrides-size').textContent).toBe('0');
  });

  it('setPreferred stores trackId → songId', () => {
    render(<PrefsDisplay albumId="album-123" />);

    act(() => { screen.getByTestId('set-1').click(); });

    expect(screen.getByTestId('pref-1').textContent).toBe('song-sbd-1');
    expect(screen.getByTestId('overrides-size').textContent).toBe('1');
  });

  it('multiple preferences coexist', () => {
    render(<PrefsDisplay albumId="album-123" />);

    act(() => { screen.getByTestId('set-1').click(); });
    act(() => { screen.getByTestId('set-2').click(); });

    expect(screen.getByTestId('pref-1').textContent).toBe('song-sbd-1');
    expect(screen.getByTestId('pref-2').textContent).toBe('song-aud-2');
    expect(screen.getByTestId('overrides-size').textContent).toBe('2');
  });

  it('clearPreferred removes a single preference', () => {
    render(<PrefsDisplay albumId="album-123" />);

    act(() => { screen.getByTestId('set-1').click(); });
    act(() => { screen.getByTestId('set-2').click(); });
    act(() => { screen.getByTestId('clear-1').click(); });

    expect(screen.getByTestId('pref-1').textContent).toBe('null');
    expect(screen.getByTestId('pref-2').textContent).toBe('song-aud-2');
    expect(screen.getByTestId('overrides-size').textContent).toBe('1');
  });

  it('setAll bulk-overrides entire map', () => {
    render(<PrefsDisplay albumId="album-123" />);

    act(() => { screen.getByTestId('set-1').click(); });
    act(() => { screen.getByTestId('set-2').click(); });

    // setAll replaces everything
    act(() => { screen.getByTestId('set-all').click(); });

    expect(screen.getByTestId('pref-1').textContent).toBe('song-mtx-1');
    expect(screen.getByTestId('pref-2').textContent).toBe('null'); // track-2 not in setAll
    expect(screen.getByTestId('overrides-size').textContent).toBe('2'); // track-1 and track-3
  });

  it('persists to localStorage with album-scoped key', () => {
    render(<PrefsDisplay albumId="album-123" />);

    act(() => { screen.getByTestId('set-1').click(); });

    const stored = localStorage.getItem('8pm-track-pref:album-123');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed['track-1']).toBe('song-sbd-1');
  });

  it('clearing all prefs removes localStorage key', () => {
    render(<PrefsDisplay albumId="album-123" />);

    act(() => { screen.getByTestId('set-1').click(); });
    expect(localStorage.getItem('8pm-track-pref:album-123')).not.toBeNull();

    act(() => { screen.getByTestId('clear-1').click(); });
    expect(localStorage.getItem('8pm-track-pref:album-123')).toBeNull();
  });

  it('restores preferences from localStorage on mount', () => {
    localStorage.setItem('8pm-track-pref:album-456', JSON.stringify({
      'track-1': 'song-restored',
      'track-2': 'song-restored-2',
    }));

    render(<PrefsDisplay albumId="album-456" />);

    expect(screen.getByTestId('pref-1').textContent).toBe('song-restored');
    expect(screen.getByTestId('pref-2').textContent).toBe('song-restored-2');
    expect(screen.getByTestId('overrides-size').textContent).toBe('2');
  });

  it('different albums have isolated preferences', () => {
    localStorage.setItem('8pm-track-pref:album-A', JSON.stringify({ 'track-1': 'song-A' }));
    localStorage.setItem('8pm-track-pref:album-B', JSON.stringify({ 'track-1': 'song-B' }));

    const { unmount } = render(<PrefsDisplay albumId="album-A" />);
    expect(screen.getByTestId('pref-1').textContent).toBe('song-A');
    unmount();

    render(<PrefsDisplay albumId="album-B" />);
    expect(screen.getByTestId('pref-1').textContent).toBe('song-B');
  });
});
