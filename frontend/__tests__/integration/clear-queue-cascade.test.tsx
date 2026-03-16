/**
 * Integration test: Clear queue cascade
 *
 * Tests that clearQueue properly cascades across contexts:
 * - Queue empties (items=[], cursorIndex=-1)
 * - Player pauses (isPlaying=false, ghost-play fix)
 * - localStorage queue snapshot removed synchronously (no 500ms debounce)
 * - Playback progress cleared from localStorage
 * - savedProgress state cleared when queue transitions non-empty → empty
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useQueue } from '@/context/QueueContext';
import { usePlayer } from '@/context/PlayerContext';
import { buildSong, buildTrack, buildAlbum, resetCounters } from '@/test/factories/song';
import { resetQueueCounters } from '@/test/factories/queue';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

function ClearQueueDisplay() {
  const queue = useQueue();
  const player = usePlayer();

  return (
    <div>
      <div data-testid="cursor">{queue.queue.cursorIndex}</div>
      <div data-testid="queue-count">{queue.queue.items.length}</div>
      <div data-testid="is-playing">{String(player.isPlaying)}</div>
      <div data-testid="has-items">{String(queue.hasItems)}</div>
      <div data-testid="current-song">{player.currentSong?.trackTitle ?? 'none'}</div>
      <div data-testid="repeat">{queue.queue.repeat}</div>
      <div data-testid="saved-progress">{player.savedProgress ? 'has-progress' : 'null'}</div>
      <button
        data-testid="load-btn"
        onClick={() => {
          const album = buildAlbum({
            tracks: [
              buildTrack({ title: 'Stash', songs: [buildSong({ trackTitle: 'Stash' })] }),
              buildTrack({ title: 'Maze', songs: [buildSong({ trackTitle: 'Maze' })] }),
              buildTrack({ title: 'Bouncing', songs: [buildSong({ trackTitle: 'Bouncing' })] }),
            ],
          });
          queue.playAlbum(album);
        }}
      >Load</button>
      <button data-testid="clear-btn" onClick={() => queue.clearQueue()}>Clear</button>
      <button data-testid="clear-upcoming" onClick={() => queue.clearUpcoming()}>Clear Upcoming</button>
      <button data-testid="play-song" onClick={() => player.playSong(buildSong({ trackTitle: 'Stash' }))}>Play</button>
      <button data-testid="set-repeat-all" onClick={() => queue.setRepeat('all')}>Rep All</button>
    </div>
  );
}

describe('Clear Queue Cascade Integration', () => {
  beforeEach(() => {
    resetCounters();
    resetQueueCounters();
    localStorage.clear();
  });

  it('clearQueue empties queue and stops playback', async () => {
    renderApp(<ClearQueueDisplay />);

    // Load and verify
    await act(async () => { screen.getByTestId('load-btn').click(); });
    expect(screen.getByTestId('queue-count').textContent).toBe('3');
    expect(screen.getByTestId('has-items').textContent).toBe('true');

    // Clear queue
    await act(async () => { screen.getByTestId('clear-btn').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('queue-count').textContent).toBe('0');
      expect(screen.getByTestId('cursor').textContent).toBe('-1');
      expect(screen.getByTestId('has-items').textContent).toBe('false');
      expect(screen.getByTestId('current-song').textContent).toBe('none');
    });
  });

  it('clearQueue removes localStorage queue snapshot synchronously', async () => {
    renderApp(<ClearQueueDisplay />);

    await act(async () => { screen.getByTestId('load-btn').click(); });

    // Queue should have been saved to localStorage by debounce
    // Wait for the debounce (500ms)
    await act(async () => { await new Promise(r => setTimeout(r, 600)); });
    expect(localStorage.getItem('8pm_queue_snapshot')).not.toBeNull();

    // Clear queue — localStorage should be cleared immediately (no debounce wait)
    await act(async () => { screen.getByTestId('clear-btn').click(); });

    // Should be removed synchronously by flushQueueToStorage
    expect(localStorage.getItem('8pm_queue_snapshot')).toBeNull();
  });

  it('clearQueue removes playback progress from localStorage', async () => {
    // Seed playback progress
    const progress = {
      songId: 'song-1',
      position: 120,
      duration: 300,
      timestamp: Date.now(),
      title: 'Stash',
      artistName: 'Phish',
      streamUrl: 'https://example.com/stash.mp3',
    };
    localStorage.setItem('8pm_playback_progress', JSON.stringify(progress));

    renderApp(<ClearQueueDisplay />);

    await act(async () => { screen.getByTestId('load-btn').click(); });
    expect(localStorage.getItem('8pm_playback_progress')).not.toBeNull();

    await act(async () => { screen.getByTestId('clear-btn').click(); });
    expect(localStorage.getItem('8pm_playback_progress')).toBeNull();
  });

  it('clearQueue preserves repeat mode', async () => {
    renderApp(<ClearQueueDisplay />);

    await act(async () => { screen.getByTestId('load-btn').click(); });
    await act(async () => { screen.getByTestId('set-repeat-all').click(); });
    expect(screen.getByTestId('repeat').textContent).toBe('all');

    await act(async () => { screen.getByTestId('clear-btn').click(); });

    // Repeat mode should be preserved through clear
    expect(screen.getByTestId('repeat').textContent).toBe('all');
  });

  it('clearUpcoming keeps current song but removes rest', async () => {
    renderApp(<ClearQueueDisplay />);

    await act(async () => { screen.getByTestId('load-btn').click(); });
    expect(screen.getByTestId('queue-count').textContent).toBe('3');
    expect(screen.getByTestId('cursor').textContent).toBe('0');

    await act(async () => { screen.getByTestId('clear-upcoming').click(); });

    expect(screen.getByTestId('queue-count').textContent).toBe('1');
    expect(screen.getByTestId('cursor').textContent).toBe('0');
    expect(screen.getByTestId('current-song').textContent).toBe('Stash');
  });

  it('player ghost-play fix: isPlaying goes false when queue empties', async () => {
    renderApp(<ClearQueueDisplay />);

    // Start playback
    await act(async () => { screen.getByTestId('play-song').click(); });
    expect(screen.getByTestId('is-playing').textContent).toBe('true');

    // Clear queue while playing
    await act(async () => { screen.getByTestId('clear-btn').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('is-playing').textContent).toBe('false');
      expect(screen.getByTestId('has-items').textContent).toBe('false');
    });
  });
});
