/**
 * Integration test: Player controls + Queue interaction
 *
 * Tests PlayerContext behavior through the real provider tree:
 * - playSong inserts into queue via playNow and sets isPlaying
 * - togglePlay toggles state
 * - pause sets isPlaying false
 * - playFromQueue jumps to specific index
 * - queue drawer toggle persists to localStorage
 * - volume persists across interactions
 * - playAlbum then navigate via PlayerContext
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

function PlayerDisplay() {
  const queue = useQueue();
  const player = usePlayer();

  return (
    <div>
      <div data-testid="is-playing">{String(player.isPlaying)}</div>
      <div data-testid="current-song">{player.currentSong?.trackTitle ?? 'none'}</div>
      <div data-testid="volume">{player.volume}</div>
      <div data-testid="cursor">{queue.queue.cursorIndex}</div>
      <div data-testid="queue-count">{queue.queue.items.length}</div>
      <div data-testid="queue-open">{String(player.isQueueOpen)}</div>
      <div data-testid="has-items">{String(queue.hasItems)}</div>
      <button
        data-testid="play-song"
        onClick={() => {
          const song = buildSong({ trackTitle: 'Divided Sky' });
          player.playSong(song);
        }}
      >Play Song</button>
      <button
        data-testid="play-another"
        onClick={() => {
          const song = buildSong({ trackTitle: 'Fluffhead' });
          player.playSong(song);
        }}
      >Play Another</button>
      <button data-testid="toggle-play" onClick={() => player.togglePlay()}>Toggle</button>
      <button data-testid="pause" onClick={() => player.pause()}>Pause</button>
      <button data-testid="play-next" onClick={() => player.playNext()}>Next</button>
      <button data-testid="play-prev" onClick={() => player.playPrev()}>Prev</button>
      <button data-testid="set-volume" onClick={() => player.setVolume(0.3)}>Vol 30%</button>
      <button data-testid="toggle-queue" onClick={() => player.toggleQueue()}>Toggle Queue</button>
      <button data-testid="close-queue" onClick={() => player.closeQueue()}>Close Queue</button>
      <button
        data-testid="load-album"
        onClick={() => {
          const album = buildAlbum({
            tracks: [
              buildTrack({ title: 'You Enjoy Myself', songs: [buildSong({ trackTitle: 'You Enjoy Myself' })] }),
              buildTrack({ title: 'Run Like an Antelope', songs: [buildSong({ trackTitle: 'Run Like an Antelope' })] }),
              buildTrack({ title: 'Harry Hood', songs: [buildSong({ trackTitle: 'Harry Hood' })] }),
            ],
          });
          queue.playAlbum(album);
        }}
      >Load Album</button>
      <button
        data-testid="play-from-2"
        onClick={() => player.playFromQueue(2)}
      >Play Index 2</button>
    </div>
  );
}

describe('Player Controls Integration', () => {
  beforeEach(() => {
    resetCounters();
    resetQueueCounters();
    localStorage.clear();
  });

  it('playSong inserts into queue and sets isPlaying', async () => {
    renderApp(<PlayerDisplay />);

    expect(screen.getByTestId('is-playing').textContent).toBe('false');
    expect(screen.getByTestId('has-items').textContent).toBe('false');

    await act(async () => { screen.getByTestId('play-song').click(); });

    expect(screen.getByTestId('is-playing').textContent).toBe('true');
    expect(screen.getByTestId('current-song').textContent).toBe('Divided Sky');
    expect(screen.getByTestId('has-items').textContent).toBe('true');
  });

  it('playSong a second song inserts after cursor and advances', async () => {
    renderApp(<PlayerDisplay />);

    await act(async () => { screen.getByTestId('play-song').click(); });
    expect(screen.getByTestId('current-song').textContent).toBe('Divided Sky');

    await act(async () => { screen.getByTestId('play-another').click(); });
    expect(screen.getByTestId('current-song').textContent).toBe('Fluffhead');
    // Queue should have 2 items
    expect(screen.getByTestId('queue-count').textContent).toBe('2');
  });

  it('togglePlay toggles isPlaying state', async () => {
    renderApp(<PlayerDisplay />);

    // First need to play something
    await act(async () => { screen.getByTestId('play-song').click(); });
    expect(screen.getByTestId('is-playing').textContent).toBe('true');

    // Toggle off
    await act(async () => { screen.getByTestId('toggle-play').click(); });
    expect(screen.getByTestId('is-playing').textContent).toBe('false');

    // Toggle on
    await act(async () => { screen.getByTestId('toggle-play').click(); });
    expect(screen.getByTestId('is-playing').textContent).toBe('true');
  });

  it('pause sets isPlaying to false', async () => {
    renderApp(<PlayerDisplay />);

    await act(async () => { screen.getByTestId('play-song').click(); });
    expect(screen.getByTestId('is-playing').textContent).toBe('true');

    await act(async () => { screen.getByTestId('pause').click(); });
    expect(screen.getByTestId('is-playing').textContent).toBe('false');
  });

  it('volume change is reflected in state', async () => {
    renderApp(<PlayerDisplay />);

    await act(async () => { screen.getByTestId('play-song').click(); });

    // Default volume
    expect(screen.getByTestId('volume').textContent).toBe('0.7');

    await act(async () => { screen.getByTestId('set-volume').click(); });
    expect(screen.getByTestId('volume').textContent).toBe('0.3');
  });

  it('queue drawer toggle persists to localStorage', async () => {
    renderApp(<PlayerDisplay />);

    // Toggle queue open
    await act(async () => { screen.getByTestId('toggle-queue').click(); });
    expect(screen.getByTestId('queue-open').textContent).toBe('true');
    expect(localStorage.getItem('8pm_queue_open')).toBe('true');

    // Toggle queue closed
    await act(async () => { screen.getByTestId('toggle-queue').click(); });
    expect(screen.getByTestId('queue-open').textContent).toBe('false');
    expect(localStorage.getItem('8pm_queue_open')).toBe('false');
  });

  it('closeQueue sets queue drawer to false', async () => {
    renderApp(<PlayerDisplay />);

    await act(async () => { screen.getByTestId('toggle-queue').click(); });
    expect(screen.getByTestId('queue-open').textContent).toBe('true');

    await act(async () => { screen.getByTestId('close-queue').click(); });
    expect(screen.getByTestId('queue-open').textContent).toBe('false');
  });

  it('playFromQueue jumps to specific index', async () => {
    renderApp(<PlayerDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });
    expect(screen.getByTestId('cursor').textContent).toBe('0');
    expect(screen.getByTestId('current-song').textContent).toBe('You Enjoy Myself');

    // Jump to index 2
    await act(async () => { screen.getByTestId('play-from-2').click(); });
    expect(screen.getByTestId('cursor').textContent).toBe('2');
    expect(screen.getByTestId('current-song').textContent).toBe('Harry Hood');
  });

  it('playNext advances through album', async () => {
    renderApp(<PlayerDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });
    expect(screen.getByTestId('current-song').textContent).toBe('You Enjoy Myself');

    await act(async () => { screen.getByTestId('play-next').click(); });
    expect(screen.getByTestId('current-song').textContent).toBe('Run Like an Antelope');

    await act(async () => { screen.getByTestId('play-next').click(); });
    expect(screen.getByTestId('current-song').textContent).toBe('Harry Hood');
  });

  it('restores queue open state from localStorage', async () => {
    localStorage.setItem('8pm_queue_open', 'true');

    renderApp(<PlayerDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-open').textContent).toBe('true');
    });
  });
});
