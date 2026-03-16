/**
 * Integration test: Queue persistence across mounts
 *
 * Tests QueueContext localStorage save/restore:
 * - Queue persists to localStorage on state change
 * - Queue restores from localStorage on remount
 * - Corrupted localStorage handled gracefully
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useQueue } from '@/context/QueueContext';
import { buildSong, buildTrack, buildAlbum, resetCounters } from '@/test/factories/song';
import { resetQueueCounters } from '@/test/factories/queue';
import { resetAuthMocks } from '@/test/mocks/magentoAuth';
import { resetCollections } from '@/test/mocks/magentoSync';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

const QUEUE_STORAGE_KEY = '8pm_queue_snapshot';

function QueueDisplay() {
  const queue = useQueue();

  return (
    <div>
      <div data-testid="queue-count">{queue.queue.items.length}</div>
      <div data-testid="cursor">{queue.queue.cursorIndex}</div>
      <div data-testid="current-title">
        {queue.queue.cursorIndex >= 0
          ? queue.queue.items[queue.queue.cursorIndex]?.trackTitle ?? 'none'
          : 'none'}
      </div>
      <button
        data-testid="load-album-btn"
        onClick={() => {
          const s1 = buildSong({ trackTitle: 'Elko' });
          const s2 = buildSong({ trackTitle: 'Black Elk' });
          const album = buildAlbum({
            tracks: [
              buildTrack({ title: 'Elko', songs: [s1] }),
              buildTrack({ title: 'Black Elk', songs: [s2] }),
            ],
          });
          queue.playAlbum(album);
        }}
      >
        Load Album
      </button>
    </div>
  );
}

describe('Queue Persistence Integration', () => {
  beforeEach(() => {
    resetCounters();
    resetQueueCounters();
    resetAuthMocks();
    resetCollections();
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists queue to localStorage after loading an album', async () => {
    renderApp(<QueueDisplay />);

    await act(async () => {
      screen.getByTestId('load-album-btn').click();
    });

    expect(screen.getByTestId('queue-count').textContent).toBe('2');

    // Flush the debounced save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.cursorIndex).toBe(0);
  });

  it('restores queue from localStorage on remount', async () => {
    // First mount: load album
    const { unmount } = renderApp(<QueueDisplay />);

    await act(async () => {
      screen.getByTestId('load-album-btn').click();
    });

    expect(screen.getByTestId('queue-count').textContent).toBe('2');

    // Flush the debounced save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Verify save happened
    expect(localStorage.getItem(QUEUE_STORAGE_KEY)).not.toBeNull();

    // Unmount
    unmount();
    cleanup();

    // Remount — should restore from localStorage
    renderApp(<QueueDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-count').textContent).toBe('2');
    });
  });

  it('starts with empty queue when localStorage is empty', () => {
    renderApp(<QueueDisplay />);

    expect(screen.getByTestId('queue-count').textContent).toBe('0');
    expect(screen.getByTestId('cursor').textContent).toBe('-1');
    expect(screen.getByTestId('current-title').textContent).toBe('none');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(QUEUE_STORAGE_KEY, '{{{not-json');

    renderApp(<QueueDisplay />);

    // Should fall back to empty queue
    expect(screen.getByTestId('queue-count').textContent).toBe('0');
    expect(screen.getByTestId('cursor').textContent).toBe('-1');
  });
});
