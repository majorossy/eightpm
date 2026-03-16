/**
 * Integration test: MobileUI context state management
 *
 * Tests MobileUIContext within the real provider tree:
 * - Player minimize/restore persists to localStorage
 * - Player expand/collapse state
 * - Transition guard prevents double-expand
 * - Sidebar toggle
 * - Drag offset tracking
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useMobileUI } from '@/context/MobileUIContext';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

function MobileUIDisplay() {
  const ui = useMobileUI();

  return (
    <div>
      <div data-testid="sidebar-open">{String(ui.isSidebarOpen)}</div>
      <div data-testid="player-expanded">{String(ui.isPlayerExpanded)}</div>
      <div data-testid="player-minimized">{String(ui.isPlayerMinimized)}</div>
      <div data-testid="is-transitioning">{String(ui.isTransitioning)}</div>
      <div data-testid="drag-offset">{ui.dragOffset}</div>
      <div data-testid="is-mobile">{String(ui.isMobile)}</div>
      <button data-testid="toggle-sidebar" onClick={() => ui.toggleSidebar()}>Toggle Sidebar</button>
      <button data-testid="open-sidebar" onClick={() => ui.openSidebar()}>Open Sidebar</button>
      <button data-testid="close-sidebar" onClick={() => ui.closeSidebar()}>Close Sidebar</button>
      <button data-testid="expand-player" onClick={() => ui.expandPlayer()}>Expand</button>
      <button data-testid="collapse-player" onClick={() => ui.collapsePlayer()}>Collapse</button>
      <button data-testid="toggle-player" onClick={() => ui.togglePlayer()}>Toggle Player</button>
      <button data-testid="minimize-player" onClick={() => ui.minimizePlayer()}>Minimize</button>
      <button data-testid="restore-player" onClick={() => ui.restorePlayer()}>Restore</button>
      <button data-testid="set-drag" onClick={() => ui.setDragOffset(150)}>Set Drag</button>
      <button data-testid="reset-drag" onClick={() => ui.setDragOffset(0)}>Reset Drag</button>
    </div>
  );
}

describe('Mobile UI Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sidebar toggle works', async () => {
    renderApp(<MobileUIDisplay />);

    expect(screen.getByTestId('sidebar-open').textContent).toBe('false');

    await act(async () => { screen.getByTestId('toggle-sidebar').click(); });
    expect(screen.getByTestId('sidebar-open').textContent).toBe('true');

    await act(async () => { screen.getByTestId('toggle-sidebar').click(); });
    expect(screen.getByTestId('sidebar-open').textContent).toBe('false');
  });

  it('open/close sidebar', async () => {
    renderApp(<MobileUIDisplay />);

    await act(async () => { screen.getByTestId('open-sidebar').click(); });
    expect(screen.getByTestId('sidebar-open').textContent).toBe('true');

    await act(async () => { screen.getByTestId('close-sidebar').click(); });
    expect(screen.getByTestId('sidebar-open').textContent).toBe('false');
  });

  it('minimize player persists to localStorage', async () => {
    renderApp(<MobileUIDisplay />);

    expect(screen.getByTestId('player-minimized').textContent).toBe('false');

    await act(async () => { screen.getByTestId('minimize-player').click(); });
    expect(screen.getByTestId('player-minimized').textContent).toBe('true');
    expect(localStorage.getItem('8pm_player_minimized')).toBe('true');
  });

  it('restore player persists to localStorage', async () => {
    renderApp(<MobileUIDisplay />);

    await act(async () => { screen.getByTestId('minimize-player').click(); });
    expect(screen.getByTestId('player-minimized').textContent).toBe('true');

    await act(async () => { screen.getByTestId('restore-player').click(); });
    expect(screen.getByTestId('player-minimized').textContent).toBe('false');
    expect(localStorage.getItem('8pm_player_minimized')).toBe('false');
  });

  it('restores minimized state from localStorage on mount', () => {
    // useState initializer reads localStorage synchronously — no waitFor needed
    vi.useRealTimers();
    localStorage.setItem('8pm_player_minimized', 'true');

    renderApp(<MobileUIDisplay />);

    expect(screen.getByTestId('player-minimized').textContent).toBe('true');
    vi.useFakeTimers();
  });

  it('expand/collapse player', async () => {
    renderApp(<MobileUIDisplay />);

    expect(screen.getByTestId('player-expanded').textContent).toBe('false');

    await act(async () => { screen.getByTestId('expand-player').click(); });
    expect(screen.getByTestId('player-expanded').textContent).toBe('true');

    // Wait for transition to complete
    await act(async () => { vi.advanceTimersByTime(350); });

    await act(async () => { screen.getByTestId('collapse-player').click(); });
    expect(screen.getByTestId('player-expanded').textContent).toBe('false');
  });

  it('transition guard prevents double-expand', async () => {
    renderApp(<MobileUIDisplay />);

    // First expand starts transition
    await act(async () => { screen.getByTestId('expand-player').click(); });
    expect(screen.getByTestId('player-expanded').textContent).toBe('true');
    expect(screen.getByTestId('is-transitioning').textContent).toBe('true');

    // Second collapse during transition should be blocked
    await act(async () => { screen.getByTestId('collapse-player').click(); });
    // Player should still be expanded because collapse was blocked by transition guard
    expect(screen.getByTestId('player-expanded').textContent).toBe('true');

    // Wait for transition to complete
    await act(async () => { vi.advanceTimersByTime(350); });
    expect(screen.getByTestId('is-transitioning').textContent).toBe('false');

    // Now collapse should work
    await act(async () => { screen.getByTestId('collapse-player').click(); });
    expect(screen.getByTestId('player-expanded').textContent).toBe('false');
  });

  it('toggle player cycles expanded state', async () => {
    renderApp(<MobileUIDisplay />);

    await act(async () => { screen.getByTestId('toggle-player').click(); });
    expect(screen.getByTestId('player-expanded').textContent).toBe('true');

    // Wait for transition
    await act(async () => { vi.advanceTimersByTime(350); });

    await act(async () => { screen.getByTestId('toggle-player').click(); });
    expect(screen.getByTestId('player-expanded').textContent).toBe('false');
  });

  it('drag offset tracking', async () => {
    renderApp(<MobileUIDisplay />);

    expect(screen.getByTestId('drag-offset').textContent).toBe('0');

    await act(async () => { screen.getByTestId('set-drag').click(); });
    expect(screen.getByTestId('drag-offset').textContent).toBe('150');

    await act(async () => { screen.getByTestId('reset-drag').click(); });
    expect(screen.getByTestId('drag-offset').textContent).toBe('0');
  });
});
