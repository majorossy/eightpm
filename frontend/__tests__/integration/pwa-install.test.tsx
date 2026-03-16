/**
 * Integration test: PWA install prompt
 *
 * Tests usePWAInstall hook:
 * - Not installable by default (no beforeinstallprompt event)
 * - Not installed by default
 * - dismiss sets wasDismissed, persists to localStorage
 * - dismiss suppresses isInstallable (even if beforeinstallprompt fired)
 * - Dismiss expires after 7 days
 * - Already-dismissed on mount (from localStorage) suppresses prompt
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

// Mock analytics
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

function PWADisplay() {
  const pwa = usePWAInstall();

  return (
    <div>
      <div data-testid="installable">{String(pwa.isInstallable)}</div>
      <div data-testid="installed">{String(pwa.isInstalled)}</div>
      <div data-testid="ios">{String(pwa.isIOS)}</div>
      <div data-testid="dismissed">{String(pwa.wasDismissed)}</div>
      <button data-testid="dismiss" onClick={() => pwa.dismiss()}>
        Dismiss
      </button>
    </div>
  );
}

describe('PWA Install Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock matchMedia for (display-mode: standalone)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false, // Not in standalone mode
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('not installable and not installed by default', () => {
    render(<PWADisplay />);

    expect(screen.getByTestId('installable').textContent).toBe('false');
    expect(screen.getByTestId('installed').textContent).toBe('false');
    expect(screen.getByTestId('dismissed').textContent).toBe('false');
  });

  it('dismiss sets wasDismissed and persists to localStorage', () => {
    render(<PWADisplay />);

    act(() => { screen.getByTestId('dismiss').click(); });

    expect(screen.getByTestId('dismissed').textContent).toBe('true');
    expect(localStorage.getItem('pwa_install_dismissed')).not.toBeNull();
  });

  it('already-dismissed on mount (from localStorage) sets wasDismissed', () => {
    // Set dismissal to 1 day ago (within 7-day window)
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    localStorage.setItem('pwa_install_dismissed', oneDayAgo.toISOString());

    render(<PWADisplay />);

    expect(screen.getByTestId('dismissed').textContent).toBe('true');
  });

  it('expired dismissal (8 days ago) resets wasDismissed', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    localStorage.setItem('pwa_install_dismissed', eightDaysAgo.toISOString());

    render(<PWADisplay />);

    expect(screen.getByTestId('dismissed').textContent).toBe('false');
    // Should have cleaned up expired key
    expect(localStorage.getItem('pwa_install_dismissed')).toBeNull();
  });

  it('standalone mode sets isInstalled', () => {
    // Mock standalone mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<PWADisplay />);

    expect(screen.getByTestId('installed').textContent).toBe('true');
    // When installed, should not be installable
    expect(screen.getByTestId('installable').textContent).toBe('false');
  });

  it('beforeinstallprompt event makes it installable', async () => {
    render(<PWADisplay />);

    // Simulate browser firing beforeinstallprompt
    act(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = vi.fn();
      (event as any).userChoice = Promise.resolve({ outcome: 'dismissed', platform: '' });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByTestId('installable').textContent).toBe('true');
    });
  });

  it('dismiss after beforeinstallprompt hides installable', async () => {
    render(<PWADisplay />);

    // Fire beforeinstallprompt
    act(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = vi.fn();
      (event as any).userChoice = Promise.resolve({ outcome: 'dismissed', platform: '' });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByTestId('installable').textContent).toBe('true');
    });

    // Dismiss
    act(() => { screen.getByTestId('dismiss').click(); });

    // isInstallable should be false because wasDismissed is true
    expect(screen.getByTestId('installable').textContent).toBe('false');
    expect(screen.getByTestId('dismissed').textContent).toBe('true');
  });
});
