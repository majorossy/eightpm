/**
 * Integration test: RecentlyPlayed tracking
 *
 * Tests RecentlyPlayedContext behavior:
 * - trackPlay records a song in history
 * - Deduplication: replaying same song updates playCount and moves to front
 * - MAX_ITEMS (50) truncation
 * - localStorage persistence
 * - clearRecentlyPlayed wipes history
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useRecentlyPlayed } from '@/context/RecentlyPlayedContext';
import { buildSong, resetCounters } from '@/test/factories/song';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

const songA = () => buildSong({ id: 'song-a', trackTitle: 'Elko' });
const songB = () => buildSong({ id: 'song-b', trackTitle: 'Black Elk' });
const songC = () => buildSong({ id: 'song-c', trackTitle: 'Bird Song' });

function RecentlyPlayedDisplay() {
  const rp = useRecentlyPlayed();

  return (
    <div>
      <div data-testid="count">{rp.recentlyPlayed.length}</div>
      <div data-testid="first-song">{rp.recentlyPlayed[0]?.song.trackTitle ?? 'none'}</div>
      <div data-testid="first-play-count">{rp.recentlyPlayed[0]?.playCount ?? 0}</div>
      <div data-testid="second-song">{rp.recentlyPlayed[1]?.song.trackTitle ?? 'none'}</div>
      <div data-testid="ids">
        {rp.recentlyPlayed.map(item => item.songId).join(',')}
      </div>
      <button data-testid="play-a" onClick={() => rp.trackPlay(songA())}>Play A</button>
      <button data-testid="play-b" onClick={() => rp.trackPlay(songB())}>Play B</button>
      <button data-testid="play-c" onClick={() => rp.trackPlay(songC())}>Play C</button>
      <button data-testid="clear" onClick={() => rp.clearRecentlyPlayed()}>Clear</button>
      <button
        data-testid="play-many"
        onClick={() => {
          for (let i = 0; i < 55; i++) {
            rp.trackPlay(buildSong({ id: `song-bulk-${i}`, trackTitle: `Bulk ${i}` }));
          }
        }}
      >
        Play 55
      </button>
    </div>
  );
}

describe('Recently Played Integration', () => {
  beforeEach(() => {
    resetCounters();
    localStorage.clear();
  });

  it('records a song play', async () => {
    renderApp(<RecentlyPlayedDisplay />);

    expect(screen.getByTestId('count').textContent).toBe('0');

    await act(async () => { screen.getByTestId('play-a').click(); });

    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('first-song').textContent).toBe('Elko');
    expect(screen.getByTestId('first-play-count').textContent).toBe('1');
  });

  it('maintains order: most recent first', async () => {
    renderApp(<RecentlyPlayedDisplay />);

    await act(async () => { screen.getByTestId('play-a').click(); });
    await act(async () => { screen.getByTestId('play-b').click(); });

    // B played last, should be first
    expect(screen.getByTestId('first-song').textContent).toBe('Black Elk');
    expect(screen.getByTestId('second-song').textContent).toBe('Elko');
  });

  it('deduplicates: replaying moves to front and increments playCount', async () => {
    renderApp(<RecentlyPlayedDisplay />);

    await act(async () => { screen.getByTestId('play-a').click(); });
    await act(async () => { screen.getByTestId('play-b').click(); });

    expect(screen.getByTestId('first-song').textContent).toBe('Black Elk');

    // Replay A
    await act(async () => { screen.getByTestId('play-a').click(); });

    // A should be back on top with playCount=2
    expect(screen.getByTestId('first-song').textContent).toBe('Elko');
    expect(screen.getByTestId('first-play-count').textContent).toBe('2');
    expect(screen.getByTestId('count').textContent).toBe('2'); // No duplicate
  });

  it('truncates at MAX_ITEMS (50)', async () => {
    renderApp(<RecentlyPlayedDisplay />);

    await act(async () => { screen.getByTestId('play-many').click(); });

    expect(parseInt(screen.getByTestId('count').textContent!)).toBeLessThanOrEqual(50);
  });

  it('clears recently played history', async () => {
    renderApp(<RecentlyPlayedDisplay />);

    await act(async () => { screen.getByTestId('play-a').click(); });
    await act(async () => { screen.getByTestId('play-b').click(); });
    expect(screen.getByTestId('count').textContent).toBe('2');

    await act(async () => { screen.getByTestId('clear').click(); });

    expect(screen.getByTestId('count').textContent).toBe('0');
    // useEffect persists empty array back after clear, so check for empty array or null
    const stored = localStorage.getItem('8pm_recently_played');
    expect(stored === null || stored === '[]').toBe(true);
  });

  it('persists to localStorage', async () => {
    renderApp(<RecentlyPlayedDisplay />);

    await act(async () => { screen.getByTestId('play-a').click(); });

    const stored = localStorage.getItem('8pm_recently_played');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].songId).toBe('song-a');
  });

  it('restores from localStorage on mount', async () => {
    // Pre-populate localStorage
    const history = [{
      songId: 'song-pre',
      song: buildSong({ id: 'song-pre', trackTitle: 'Pre-loaded' }),
      playedAt: new Date().toISOString(),
      playCount: 3,
    }];
    localStorage.setItem('8pm_recently_played', JSON.stringify(history));

    renderApp(<RecentlyPlayedDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('1');
    });
    expect(screen.getByTestId('first-song').textContent).toBe('Pre-loaded');
    expect(screen.getByTestId('first-play-count').textContent).toBe('3');
  });
});
