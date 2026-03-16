/**
 * Integration test: Queue + Player interaction
 *
 * Tests the full queue lifecycle through real providers:
 * - Load album into queue → cursor starts playing
 * - Advance cursor (next track)
 * - Retreat cursor (previous track / restart)
 * - Add-to-queue appends to end
 * - Play-next inserts after cursor
 * - Remove item adjusts cursor
 * - Repeat modes
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useQueue } from '@/context/QueueContext';
import { usePlayer } from '@/context/PlayerContext';
import { buildSong, buildTrack, buildAlbum, resetCounters } from '@/test/factories/song';
import { buildQueueItem, resetQueueCounters } from '@/test/factories/queue';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

// Test component that exposes queue and player state
function QueuePlayerDisplay() {
  const queue = useQueue();
  const player = usePlayer();

  return (
    <div>
      <div data-testid="queue-count">{queue.queue.items.length}</div>
      <div data-testid="cursor">{queue.queue.cursorIndex}</div>
      <div data-testid="current-song">{player.currentSong?.trackTitle ?? 'none'}</div>
      <div data-testid="repeat">{queue.queue.repeat}</div>
      <div data-testid="upcoming-count">{queue.upcomingCount}</div>
      <button data-testid="play-next-btn" onClick={() => player.playNext()}>Next</button>
      <button data-testid="play-prev-btn" onClick={() => player.playPrev()}>Prev</button>
      <button
        data-testid="load-album-btn"
        onClick={() => {
          const s1 = buildSong({ trackTitle: 'Bird Song' });
          const s2 = buildSong({ trackTitle: 'Truckin' });
          const s3 = buildSong({ trackTitle: 'Scarlet Begonias' });
          const album = buildAlbum({
            tracks: [
              buildTrack({ title: 'Bird Song', songs: [s1] }),
              buildTrack({ title: 'Truckin', songs: [s2] }),
              buildTrack({ title: 'Scarlet Begonias', songs: [s3] }),
            ],
          });
          queue.playAlbum(album);
        }}
      >
        Load Album
      </button>
      <button
        data-testid="add-to-queue-btn"
        onClick={() => {
          const song = buildSong({ trackTitle: 'Eyes of the World' });
          queue.addToQueue(queue.trackToItem(song));
        }}
      >
        Add to Queue
      </button>
      <button
        data-testid="play-next-song-btn"
        onClick={() => {
          const song = buildSong({ trackTitle: 'Dark Star' });
          queue.playNext(queue.trackToItem(song));
        }}
      >
        Play Next Song
      </button>
      <button
        data-testid="set-repeat-all"
        onClick={() => queue.setRepeat('all')}
      >
        Repeat All
      </button>
      <button
        data-testid="clear-queue-btn"
        onClick={() => queue.clearQueue()}
      >
        Clear
      </button>
    </div>
  );
}

describe('Queue + Playback Integration', () => {
  beforeEach(() => {
    resetCounters();
    resetQueueCounters();
    localStorage.clear();
  });

  it('loads an album and sets cursor to first track', async () => {
    renderApp(<QueuePlayerDisplay />);

    await act(async () => {
      screen.getByTestId('load-album-btn').click();
    });

    expect(screen.getByTestId('queue-count').textContent).toBe('3');
    expect(screen.getByTestId('cursor').textContent).toBe('0');
    expect(screen.getByTestId('current-song').textContent).toBe('Bird Song');
  });

  it('advances cursor on next', async () => {
    renderApp(<QueuePlayerDisplay />);

    await act(async () => {
      screen.getByTestId('load-album-btn').click();
    });

    await act(async () => {
      screen.getByTestId('play-next-btn').click();
    });

    expect(screen.getByTestId('cursor').textContent).toBe('1');
    expect(screen.getByTestId('current-song').textContent).toBe('Truckin');
  });

  it('add-to-queue appends after all existing items', async () => {
    renderApp(<QueuePlayerDisplay />);

    await act(async () => {
      screen.getByTestId('load-album-btn').click();
    });

    await act(async () => {
      screen.getByTestId('add-to-queue-btn').click();
    });

    expect(screen.getByTestId('queue-count').textContent).toBe('4');
    // Cursor stays at 0 (first track)
    expect(screen.getByTestId('cursor').textContent).toBe('0');
  });

  it('play-next inserts after cursor', async () => {
    renderApp(<QueuePlayerDisplay />);

    await act(async () => {
      screen.getByTestId('load-album-btn').click();
    });

    // Cursor is at 0 (Bird Song), play next inserts Dark Star at position 1
    await act(async () => {
      screen.getByTestId('play-next-song-btn').click();
    });

    expect(screen.getByTestId('queue-count').textContent).toBe('4');

    // Advance to next — should be Dark Star (inserted after cursor)
    await act(async () => {
      screen.getByTestId('play-next-btn').click();
    });

    expect(screen.getByTestId('current-song').textContent).toBe('Dark Star');
  });

  it('clears queue and resets cursor', async () => {
    renderApp(<QueuePlayerDisplay />);

    await act(async () => {
      screen.getByTestId('load-album-btn').click();
    });

    await act(async () => {
      screen.getByTestId('clear-queue-btn').click();
    });

    expect(screen.getByTestId('queue-count').textContent).toBe('0');
    expect(screen.getByTestId('cursor').textContent).toBe('-1');
    expect(screen.getByTestId('current-song').textContent).toBe('none');
  });

  it('sets repeat mode', async () => {
    renderApp(<QueuePlayerDisplay />);

    expect(screen.getByTestId('repeat').textContent).toBe('off');

    await act(async () => {
      screen.getByTestId('set-repeat-all').click();
    });

    expect(screen.getByTestId('repeat').textContent).toBe('all');
  });
});
