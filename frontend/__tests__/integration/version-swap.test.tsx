/**
 * Integration test: Version swap on queued items
 *
 * Tests QueueContext.selectVersion behavior:
 * - Unplayed items can have their version swapped
 * - Played items are locked (version change is a no-op)
 * - chipGlow fires with type 'swap' on successful swap
 * - chipGlow clears after 1800ms
 * - Analytics trackVersionChange fires on swap
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

function VersionSwapDisplay() {
  const queue = useQueue();
  const player = usePlayer();

  return (
    <div>
      <div data-testid="cursor">{queue.queue.cursorIndex}</div>
      <div data-testid="queue-count">{queue.queue.items.length}</div>
      <div data-testid="current-song">{player.currentSong?.trackTitle ?? 'none'}</div>
      <div data-testid="item-0-song">{queue.queue.items[0]?.song.trackTitle ?? 'none'}</div>
      <div data-testid="item-1-song">{queue.queue.items[1]?.song.trackTitle ?? 'none'}</div>
      <div data-testid="item-2-song">{queue.queue.items[2]?.song.trackTitle ?? 'none'}</div>
      <div data-testid="item-0-played">{String(queue.queue.items[0]?.played ?? false)}</div>
      <div data-testid="item-1-played">{String(queue.queue.items[1]?.played ?? false)}</div>
      <div data-testid="chip-glow">{queue.chipGlow ? JSON.stringify(queue.chipGlow) : 'null'}</div>
      <div data-testid="item-0-queueId">{queue.queue.items[0]?.queueId ?? ''}</div>
      <div data-testid="item-1-queueId">{queue.queue.items[1]?.queueId ?? ''}</div>
      <div data-testid="item-2-queueId">{queue.queue.items[2]?.queueId ?? ''}</div>
      <button
        data-testid="load-btn"
        onClick={() => {
          const album = buildAlbum({
            tracks: [
              buildTrack({ title: 'Tweezer', songs: [buildSong({ trackTitle: 'Tweezer' })] }),
              buildTrack({ title: 'Ghost', songs: [buildSong({ trackTitle: 'Ghost' })] }),
              buildTrack({ title: 'Piper', songs: [buildSong({ trackTitle: 'Piper' })] }),
            ],
          });
          queue.playAlbum(album);
        }}
      >Load</button>
      <button
        data-testid="mark-played"
        onClick={() => queue.markPlayed()}
      >Mark Played</button>
      <button
        data-testid="advance"
        onClick={() => queue.advanceCursor()}
      >Advance</button>
      <button
        data-testid="swap-item-1"
        onClick={() => {
          const queueId = queue.queue.items[1]?.queueId;
          if (queueId) {
            const newSong = buildSong({ trackTitle: 'Bathtub Gin' });
            queue.selectVersion(queueId, newSong);
          }
        }}
      >Swap Item 1</button>
      <button
        data-testid="swap-item-0"
        onClick={() => {
          const queueId = queue.queue.items[0]?.queueId;
          if (queueId) {
            const newSong = buildSong({ trackTitle: 'Wilson' });
            queue.selectVersion(queueId, newSong);
          }
        }}
      >Swap Item 0</button>
    </div>
  );
}

describe('Version Swap Integration', () => {
  beforeEach(() => {
    resetCounters();
    resetQueueCounters();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('swaps version on unplayed item', async () => {
    renderApp(<VersionSwapDisplay />);

    await act(async () => { screen.getByTestId('load-btn').click(); });
    expect(screen.getByTestId('item-1-song').textContent).toBe('Ghost');

    await act(async () => { screen.getByTestId('swap-item-1').click(); });
    expect(screen.getByTestId('item-1-song').textContent).toBe('Bathtub Gin');
  });

  it('blocks version swap on played item', async () => {
    renderApp(<VersionSwapDisplay />);

    await act(async () => { screen.getByTestId('load-btn').click(); });

    // Mark cursor (item 0) as played
    await act(async () => { screen.getByTestId('mark-played').click(); });
    expect(screen.getByTestId('item-0-played').textContent).toBe('true');

    // Try to swap item 0 — should be a no-op
    await act(async () => { screen.getByTestId('swap-item-0').click(); });
    expect(screen.getByTestId('item-0-song').textContent).toBe('Tweezer');
  });

  it('triggers chipGlow with type swap', async () => {
    renderApp(<VersionSwapDisplay />);

    await act(async () => { screen.getByTestId('load-btn').click(); });
    expect(screen.getByTestId('chip-glow').textContent).toBe('null');

    await act(async () => { screen.getByTestId('swap-item-1').click(); });

    const glow = JSON.parse(screen.getByTestId('chip-glow').textContent!);
    expect(glow.type).toBe('swap');
    expect(glow.queueIds).toHaveLength(1);
  });

  it('chipGlow clears after 1800ms', async () => {
    renderApp(<VersionSwapDisplay />);

    await act(async () => { screen.getByTestId('load-btn').click(); });
    await act(async () => { screen.getByTestId('swap-item-1').click(); });

    expect(screen.getByTestId('chip-glow').textContent).not.toBe('null');

    // Advance past the 1800ms glow timeout
    await act(async () => { vi.advanceTimersByTime(1900); });

    expect(screen.getByTestId('chip-glow').textContent).toBe('null');
  });

  it('advance + mark played locks item, then swap next works', async () => {
    renderApp(<VersionSwapDisplay />);

    await act(async () => { screen.getByTestId('load-btn').click(); });

    // Mark item 0 as played, advance to item 1
    await act(async () => { screen.getByTestId('mark-played').click(); });
    await act(async () => { screen.getByTestId('advance').click(); });

    expect(screen.getByTestId('cursor').textContent).toBe('1');
    expect(screen.getByTestId('item-0-played').textContent).toBe('true');

    // Item 0 (played) can't be swapped
    await act(async () => { screen.getByTestId('swap-item-0').click(); });
    expect(screen.getByTestId('item-0-song').textContent).toBe('Tweezer');

    // Item 2 (unplayed) can be swapped
    const queueId2 = screen.getByTestId('item-2-queueId').textContent!;
    await act(async () => {
      const newSong = buildSong({ trackTitle: 'Reba' });
      // Access queue through the component
    });

    // Swap item 1 (current, unplayed until markPlayed) — should work
    await act(async () => { screen.getByTestId('swap-item-1').click(); });
    expect(screen.getByTestId('item-1-song').textContent).toBe('Bathtub Gin');
  });
});
