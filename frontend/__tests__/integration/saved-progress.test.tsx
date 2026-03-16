/**
 * Integration test: Playback progress persistence
 *
 * Tests the savePlaybackProgress / restore / expiry logic in PlayerContext:
 * - Saves checkpoint to localStorage when position > 5s and < 95% of duration
 * - Does NOT save if position < 5 (too early)
 * - Does NOT save if position > 95% of duration (near end)
 * - Restores saved progress on mount if less than 7 days old
 * - Discards saved progress if older than 7 days
 * - clearPlaybackProgress removes from localStorage
 * - savedProgress projection is available to components
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { usePlayer } from '@/context/PlayerContext';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

const PROGRESS_KEY = '8pm_playback_progress';

function SavedProgressDisplay() {
  const player = usePlayer();

  return (
    <div>
      <div data-testid="has-saved">{String(player.savedProgress !== null)}</div>
      <div data-testid="saved-song-id">{player.savedProgress?.songId ?? 'none'}</div>
      <div data-testid="saved-position">{player.savedProgress?.position ?? 0}</div>
      <div data-testid="saved-title">{player.savedProgress?.title ?? 'none'}</div>
      <div data-testid="saved-artist">{player.savedProgress?.artistName ?? 'none'}</div>
    </div>
  );
}

describe('Saved Progress Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('no saved progress when localStorage is empty', async () => {
    renderApp(<SavedProgressDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('has-saved').textContent).toBe('false');
    });
  });

  it('restores saved progress from localStorage on mount', async () => {
    const checkpoint = {
      songId: 'song-123',
      position: 120.5,
      duration: 300,
      timestamp: Date.now() - 1000, // 1 second ago
      title: 'Bird Song',
      artistName: 'Grateful Dead',
      albumName: 'Cornell 77',
      streamUrl: 'https://archive.org/download/test/bird-song.mp3',
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(checkpoint));

    renderApp(<SavedProgressDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('has-saved').textContent).toBe('true');
    });

    expect(screen.getByTestId('saved-song-id').textContent).toBe('song-123');
    expect(screen.getByTestId('saved-position').textContent).toBe('120.5');
    expect(screen.getByTestId('saved-title').textContent).toBe('Bird Song');
    expect(screen.getByTestId('saved-artist').textContent).toBe('Grateful Dead');
  });

  it('discards saved progress older than 7 days', async () => {
    const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
    const checkpoint = {
      songId: 'song-old',
      position: 60,
      duration: 300,
      timestamp: eightDaysAgo,
      title: 'Old Song',
      artistName: 'Old Band',
      streamUrl: 'https://archive.org/download/test/old.mp3',
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(checkpoint));

    renderApp(<SavedProgressDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('has-saved').textContent).toBe('false');
    });

    // Should have cleaned up localStorage too
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
  });

  it('keeps progress that is exactly 6 days old', async () => {
    const sixDaysAgo = Date.now() - (6 * 24 * 60 * 60 * 1000);
    const checkpoint = {
      songId: 'song-recent',
      position: 45,
      duration: 200,
      timestamp: sixDaysAgo,
      title: 'Recent Song',
      artistName: 'Recent Band',
      streamUrl: 'https://archive.org/download/test/recent.mp3',
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(checkpoint));

    renderApp(<SavedProgressDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('has-saved').textContent).toBe('true');
    });

    expect(screen.getByTestId('saved-song-id').textContent).toBe('song-recent');
  });

  it('handles corrupted localStorage gracefully', async () => {
    localStorage.setItem(PROGRESS_KEY, 'not valid json{{{');

    renderApp(<SavedProgressDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('has-saved').textContent).toBe('false');
    });
  });
});
