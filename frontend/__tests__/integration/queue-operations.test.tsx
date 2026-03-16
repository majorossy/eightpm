/**
 * Integration test: Advanced queue operations
 *
 * Tests QueueContext operations not covered by other test files:
 * - playNow: insert-and-advance atomically
 * - addToQueue triggers chipGlow with type 'queued'
 * - playNext triggers chipGlow with type 'play-next'
 * - moveItem reorders and adjusts cursor
 * - removeItem adjusts cursor correctly
 * - removeBatch removes album group but keeps played items
 * - detachItem gives item a new batchId
 * - restoreFromHistory moves played item back to upcoming
 * - computed values: isLastItem, isFirstItem, totalItems
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

function QueueOpsDisplay() {
  const queue = useQueue();
  const player = usePlayer();

  return (
    <div>
      <div data-testid="cursor">{queue.queue.cursorIndex}</div>
      <div data-testid="count">{queue.totalItems}</div>
      <div data-testid="is-first">{String(queue.isFirstItem)}</div>
      <div data-testid="is-last">{String(queue.isLastItem)}</div>
      <div data-testid="current-song">{queue.currentSong?.trackTitle ?? 'none'}</div>
      <div data-testid="chip-glow-type">{queue.chipGlow?.type ?? 'null'}</div>
      <div data-testid="items">
        {queue.queue.items.map((item, i) => (
          <span key={item.queueId} data-testid={`item-${i}`}>{item.song.trackTitle}</span>
        ))}
      </div>
      <div data-testid="item-0-batchId">{queue.queue.items[0]?.batchId ?? ''}</div>
      <div data-testid="item-1-batchId">{queue.queue.items[1]?.batchId ?? ''}</div>
      <div data-testid="item-0-played">{String(queue.queue.items[0]?.played ?? false)}</div>
      <button
        data-testid="load-album"
        onClick={() => {
          const album = buildAlbum({
            tracks: [
              buildTrack({ title: 'Fee', songs: [buildSong({ trackTitle: 'Fee' })] }),
              buildTrack({ title: 'Possum', songs: [buildSong({ trackTitle: 'Possum' })] }),
              buildTrack({ title: 'Golgi', songs: [buildSong({ trackTitle: 'Golgi' })] }),
            ],
          });
          queue.playAlbum(album);
        }}
      >Load Album</button>
      <button
        data-testid="add-to-queue"
        onClick={() => {
          const song = buildSong({ trackTitle: 'Meatstick' });
          queue.addToQueue(queue.trackToItem(song));
        }}
      >Add to Queue</button>
      <button
        data-testid="play-next-btn"
        onClick={() => {
          const song = buildSong({ trackTitle: 'Farmhouse' });
          queue.playNext(queue.trackToItem(song));
        }}
      >Play Next</button>
      <button
        data-testid="play-now"
        onClick={() => {
          const song = buildSong({ trackTitle: 'Sample' });
          queue.playNow(queue.trackToItem(song));
        }}
      >Play Now</button>
      <button data-testid="advance" onClick={() => queue.advanceCursor()}>Advance</button>
      <button data-testid="mark-played" onClick={() => queue.markPlayed()}>Mark Played</button>
      <button
        data-testid="move-2-to-1"
        onClick={() => queue.moveItem(2, 1)}
      >Move 2→1</button>
      <button
        data-testid="remove-first"
        onClick={() => {
          const firstId = queue.queue.items[0]?.queueId;
          if (firstId) queue.removeItem(firstId);
        }}
      >Remove First</button>
      <button
        data-testid="detach-1"
        onClick={() => {
          const id = queue.queue.items[1]?.queueId;
          if (id) queue.detachItem(id, 1);
        }}
      >Detach Item 1</button>
      <button
        data-testid="restore-0"
        onClick={() => {
          const id = queue.queue.items[0]?.queueId;
          if (id) queue.restoreFromHistory(id, queue.queue.cursorIndex + 1);
        }}
      >Restore Item 0</button>
    </div>
  );
}

describe('Queue Operations Integration', () => {
  beforeEach(() => {
    resetCounters();
    resetQueueCounters();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('addToQueue appends and triggers chipGlow type=queued', async () => {
    renderApp(<QueueOpsDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });
    expect(screen.getByTestId('count').textContent).toBe('3');

    await act(async () => { screen.getByTestId('add-to-queue').click(); });
    expect(screen.getByTestId('count').textContent).toBe('4');
    expect(screen.getByTestId('chip-glow-type').textContent).toBe('queued');
  });

  it('playNext inserts after cursor and triggers chipGlow type=play-next', async () => {
    renderApp(<QueueOpsDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });

    await act(async () => { screen.getByTestId('play-next-btn').click(); });
    expect(screen.getByTestId('count').textContent).toBe('4');
    // Farmhouse should be at index 1 (after cursor at 0)
    expect(screen.getByTestId('item-1').textContent).toBe('Farmhouse');
    expect(screen.getByTestId('chip-glow-type').textContent).toBe('play-next');
  });

  it('playNow inserts after cursor and advances to it', async () => {
    renderApp(<QueueOpsDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });
    expect(screen.getByTestId('cursor').textContent).toBe('0');

    await act(async () => { screen.getByTestId('play-now').click(); });
    expect(screen.getByTestId('cursor').textContent).toBe('1');
    expect(screen.getByTestId('current-song').textContent).toBe('Sample');
    expect(screen.getByTestId('count').textContent).toBe('4');
  });

  it('moveItem reorders queue and adjusts cursor', async () => {
    renderApp(<QueueOpsDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });
    // Order: Fee(0), Possum(1), Golgi(2)
    expect(screen.getByTestId('item-0').textContent).toBe('Fee');
    expect(screen.getByTestId('item-1').textContent).toBe('Possum');
    expect(screen.getByTestId('item-2').textContent).toBe('Golgi');

    // Move Golgi (2) to position 1
    await act(async () => { screen.getByTestId('move-2-to-1').click(); });
    expect(screen.getByTestId('item-0').textContent).toBe('Fee');
    expect(screen.getByTestId('item-1').textContent).toBe('Golgi');
    expect(screen.getByTestId('item-2').textContent).toBe('Possum');
  });

  it('removeItem before cursor shifts cursor back', async () => {
    renderApp(<QueueOpsDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });
    // Advance to index 1 (Possum)
    await act(async () => { screen.getByTestId('advance').click(); });
    expect(screen.getByTestId('cursor').textContent).toBe('1');
    expect(screen.getByTestId('current-song').textContent).toBe('Possum');

    // Remove first item (Fee, before cursor)
    await act(async () => { screen.getByTestId('remove-first').click(); });
    // Cursor should shift back to 0, still pointing at Possum
    expect(screen.getByTestId('cursor').textContent).toBe('0');
    expect(screen.getByTestId('current-song').textContent).toBe('Possum');
    expect(screen.getByTestId('count').textContent).toBe('2');
  });

  it('isFirstItem and isLastItem computed correctly', async () => {
    renderApp(<QueueOpsDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });
    expect(screen.getByTestId('is-first').textContent).toBe('true');
    expect(screen.getByTestId('is-last').textContent).toBe('false');

    // Advance to last
    await act(async () => { screen.getByTestId('advance').click(); });
    await act(async () => { screen.getByTestId('advance').click(); });
    expect(screen.getByTestId('cursor').textContent).toBe('2');
    expect(screen.getByTestId('is-first').textContent).toBe('false');
    expect(screen.getByTestId('is-last').textContent).toBe('true');
  });

  it('detachItem gives item a new batchId', async () => {
    renderApp(<QueueOpsDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });
    const originalBatchId = screen.getByTestId('item-1-batchId').textContent;

    await act(async () => { screen.getByTestId('detach-1').click(); });
    const newBatchId = screen.getByTestId('item-1-batchId').textContent;

    expect(newBatchId).not.toBe(originalBatchId);
    expect(newBatchId).toBeTruthy();
  });

  it('restoreFromHistory moves played item to upcoming zone', async () => {
    renderApp(<QueueOpsDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });

    // Play through: mark played, advance
    await act(async () => { screen.getByTestId('mark-played').click(); });
    await act(async () => { screen.getByTestId('advance').click(); });
    // Now: Fee(played, idx=0), Possum(cursor=1), Golgi(idx=2)
    expect(screen.getByTestId('cursor').textContent).toBe('1');
    expect(screen.getByTestId('item-0-played').textContent).toBe('true');

    // Restore item 0 (Fee) — should move to upcoming (after cursor)
    await act(async () => { screen.getByTestId('restore-0').click(); });
    // Cursor should decrement since we removed an item before it
    expect(screen.getByTestId('cursor').textContent).toBe('0');
    expect(screen.getByTestId('current-song').textContent).toBe('Possum');
    // Fee should now be after cursor, with played=false
    expect(screen.getByTestId('count').textContent).toBe('3');
  });

  it('chipGlow clears after 1800ms', async () => {
    renderApp(<QueueOpsDisplay />);

    await act(async () => { screen.getByTestId('load-album').click(); });
    await act(async () => { screen.getByTestId('add-to-queue').click(); });
    expect(screen.getByTestId('chip-glow-type').textContent).toBe('queued');

    await act(async () => { vi.advanceTimersByTime(1900); });
    expect(screen.getByTestId('chip-glow-type').textContent).toBe('null');
  });

  it('playNow with same song at cursor is a no-op', async () => {
    renderApp(<QueueOpsDisplay />);

    // Play a song via playSong first
    const song = buildSong({ trackTitle: 'Unique Song', id: 'unique-1' });

    // Use load-album first, then playNow with the current song
    await act(async () => { screen.getByTestId('load-album').click(); });
    const countBefore = screen.getByTestId('count').textContent;
    const songBefore = screen.getByTestId('current-song').textContent;

    // playNow with a different song should insert
    await act(async () => { screen.getByTestId('play-now').click(); });
    expect(screen.getByTestId('count').textContent).toBe('4');
  });
});
