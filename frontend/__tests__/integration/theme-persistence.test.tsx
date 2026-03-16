/**
 * Integration test: Theme persistence across login/logout
 *
 * Tests ThemeContext + MagentoAuthContext interaction:
 * - Theme persists in localStorage
 * - Theme survives logout (user preference, not auth-tied)
 * - Legacy theme names migrate correctly
 * - Correct CSS classes applied to document
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useTheme } from '@/context/ThemeContext';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { buildCustomer } from '@/test/factories/customer';
import { setCustomerToReturn, resetAuthMocks } from '@/test/mocks/magentoAuth';
import { resetCollections } from '@/test/mocks/magentoSync';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

function ThemeDisplay() {
  const { theme, setTheme } = useTheme();
  const auth = useMagentoAuth();

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <button data-testid="set-camp" onClick={() => setTheme('camp')}>Camp</button>
      <button data-testid="set-lot" onClick={() => setTheme('lot')}>Lot</button>
      <button data-testid="set-shore" onClick={() => setTheme('shore')}>Shore</button>
      <button data-testid="sign-in" onClick={() => auth.signIn('user', 'pass')}>Sign In</button>
      <button data-testid="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
}

describe('Theme Persistence Integration', () => {
  beforeEach(() => {
    resetAuthMocks();
    resetCollections();
    localStorage.clear();
    // Clean up document classes
    document.documentElement.classList.remove(
      'theme-camp', 'theme-lot', 'mode-shore',
      'theme-campfire', 'theme-fishman', 'mode-light', 'mode-dark'
    );
  });

  it('defaults to lot theme', async () => {
    renderApp(<ThemeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('lot');
    });
  });

  it('switches theme and persists to localStorage', async () => {
    renderApp(<ThemeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('lot');
    });

    await act(async () => { screen.getByTestId('set-camp').click(); });

    expect(screen.getByTestId('theme').textContent).toBe('camp');
    expect(localStorage.getItem('8pm-theme')).toBe('camp');
  });

  it('applies correct CSS classes for camp theme', async () => {
    renderApp(<ThemeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('lot');
    });

    await act(async () => { screen.getByTestId('set-camp').click(); });

    expect(document.documentElement.classList.contains('theme-camp')).toBe(true);
    expect(document.documentElement.classList.contains('theme-lot')).toBe(false);
  });

  it('applies correct CSS classes for shore theme (camp + mode-shore)', async () => {
    renderApp(<ThemeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('lot');
    });

    await act(async () => { screen.getByTestId('set-shore').click(); });

    expect(document.documentElement.classList.contains('theme-camp')).toBe(true);
    expect(document.documentElement.classList.contains('mode-shore')).toBe(true);
  });

  it('theme survives logout (not auth-tied)', async () => {
    const customer = buildCustomer({ firstname: 'Trey' });
    setCustomerToReturn(customer);

    renderApp(<ThemeDisplay />);

    // Sign in
    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('lot');
    });

    await act(async () => { screen.getByTestId('sign-in').click(); });
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // Change theme while logged in
    await act(async () => { screen.getByTestId('set-camp').click(); });
    expect(screen.getByTestId('theme').textContent).toBe('camp');

    // Sign out
    await act(async () => { screen.getByTestId('sign-out').click(); });
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });

    // Theme should persist through logout
    expect(screen.getByTestId('theme').textContent).toBe('camp');
    expect(localStorage.getItem('8pm-theme')).toBe('camp');
  });

  it('restores theme from localStorage on mount', async () => {
    localStorage.setItem('8pm-theme', 'shore');

    renderApp(<ThemeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('shore');
    });
  });

  it('migrates legacy fishman → lot', async () => {
    localStorage.setItem('8pm-theme', 'fishman');

    renderApp(<ThemeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('lot');
    });
  });

  it('migrates legacy campfire → camp', async () => {
    localStorage.setItem('8pm-theme', 'campfire');

    renderApp(<ThemeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('camp');
    });
  });

  it('migrates legacy light → shore', async () => {
    localStorage.setItem('8pm-theme', 'light');

    renderApp(<ThemeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('shore');
    });
  });
});
