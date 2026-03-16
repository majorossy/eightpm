/**
 * Integration test: Crossfade duration persistence
 *
 * Tests PlayerContext crossfade duration behavior:
 * - Default crossfade duration is 3 seconds
 * - setCrossfadeDuration updates state and persists to localStorage
 * - Restores from localStorage on mount
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
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

function CrossfadeDisplay() {
  const player = usePlayer();

  return (
    <div>
      <div data-testid="crossfade">{player.crossfadeDuration}</div>
      <button data-testid="set-0" onClick={() => player.setCrossfadeDuration(0)}>Off</button>
      <button data-testid="set-5" onClick={() => player.setCrossfadeDuration(5)}>5s</button>
      <button data-testid="set-10" onClick={() => player.setCrossfadeDuration(10)}>10s</button>
    </div>
  );
}

describe('Crossfade Persistence Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to 3 seconds', async () => {
    renderApp(<CrossfadeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('crossfade').textContent).toBe('3');
    });
  });

  it('setCrossfadeDuration updates state', async () => {
    renderApp(<CrossfadeDisplay />);

    await act(async () => { screen.getByTestId('set-5').click(); });
    expect(screen.getByTestId('crossfade').textContent).toBe('5');
  });

  it('setCrossfadeDuration persists to localStorage', async () => {
    renderApp(<CrossfadeDisplay />);

    await act(async () => { screen.getByTestId('set-10').click(); });
    expect(localStorage.getItem('crossfadeDuration')).toBe('10');
  });

  it('setting to 0 disables crossfade', async () => {
    renderApp(<CrossfadeDisplay />);

    await act(async () => { screen.getByTestId('set-0').click(); });
    expect(screen.getByTestId('crossfade').textContent).toBe('0');
    expect(localStorage.getItem('crossfadeDuration')).toBe('0');
  });

  it('restores from localStorage on mount', async () => {
    localStorage.setItem('crossfadeDuration', '7');

    renderApp(<CrossfadeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('crossfade').textContent).toBe('7');
    });
  });
});
