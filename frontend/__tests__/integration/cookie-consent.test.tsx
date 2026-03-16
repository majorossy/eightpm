/**
 * Integration test: Cookie consent management
 *
 * Tests useCookieConsent hook:
 * - Defaults: necessary=true, functional=false, analytics=false
 * - acceptAll sets all categories to true
 * - declineNonEssential keeps only necessary
 * - updateConsent allows custom selection (necessary always forced true)
 * - hasConsentFor checks individual categories
 * - localStorage persistence and restore on mount
 * - Version mismatch forces re-consent
 * - resetConsent clears everything
 * - cookieConsentUpdate custom event fires on save
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

function ConsentDisplay() {
  const consent = useCookieConsent();

  return (
    <div>
      <div data-testid="has-consented">{String(consent.hasConsented)}</div>
      <div data-testid="is-loading">{String(consent.isLoading)}</div>
      <div data-testid="necessary">{String(consent.consent.necessary)}</div>
      <div data-testid="functional">{String(consent.consent.functional)}</div>
      <div data-testid="analytics">{String(consent.consent.analytics)}</div>
      <div data-testid="has-analytics">{String(consent.hasConsentFor('analytics'))}</div>
      <div data-testid="has-functional">{String(consent.hasConsentFor('functional'))}</div>
      <button data-testid="accept-all" onClick={() => consent.acceptAll()}>
        Accept All
      </button>
      <button data-testid="decline" onClick={() => consent.declineNonEssential()}>
        Decline
      </button>
      <button
        data-testid="custom"
        onClick={() => consent.updateConsent({ functional: true, analytics: false })}
      >
        Custom
      </button>
      <button data-testid="reset" onClick={() => consent.resetConsent()}>
        Reset
      </button>
    </div>
  );
}

describe('Cookie Consent Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to not consented with necessary only', async () => {
    render(<ConsentDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('has-consented').textContent).toBe('false');
    expect(screen.getByTestId('necessary').textContent).toBe('true');
    expect(screen.getByTestId('functional').textContent).toBe('false');
    expect(screen.getByTestId('analytics').textContent).toBe('false');
  });

  it('acceptAll sets all categories to true', async () => {
    render(<ConsentDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('accept-all').click(); });

    expect(screen.getByTestId('has-consented').textContent).toBe('true');
    expect(screen.getByTestId('necessary').textContent).toBe('true');
    expect(screen.getByTestId('functional').textContent).toBe('true');
    expect(screen.getByTestId('analytics').textContent).toBe('true');
  });

  it('declineNonEssential keeps only necessary', async () => {
    render(<ConsentDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('decline').click(); });

    expect(screen.getByTestId('has-consented').textContent).toBe('true');
    expect(screen.getByTestId('necessary').textContent).toBe('true');
    expect(screen.getByTestId('functional').textContent).toBe('false');
    expect(screen.getByTestId('analytics').textContent).toBe('false');
  });

  it('updateConsent allows custom selection, necessary always true', async () => {
    render(<ConsentDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('custom').click(); });

    expect(screen.getByTestId('functional').textContent).toBe('true');
    expect(screen.getByTestId('analytics').textContent).toBe('false');
    expect(screen.getByTestId('necessary').textContent).toBe('true');
  });

  it('hasConsentFor checks individual categories', async () => {
    render(<ConsentDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('has-analytics').textContent).toBe('false');
    expect(screen.getByTestId('has-functional').textContent).toBe('false');

    act(() => { screen.getByTestId('accept-all').click(); });

    expect(screen.getByTestId('has-analytics').textContent).toBe('true');
    expect(screen.getByTestId('has-functional').textContent).toBe('true');
  });

  it('persists to localStorage', async () => {
    render(<ConsentDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('accept-all').click(); });

    const stored = localStorage.getItem('8pm_cookie_consent');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.necessary).toBe(true);
    expect(parsed.functional).toBe(true);
    expect(parsed.analytics).toBe(true);
    expect(parsed.version).toBe('1.0');
    expect(parsed.timestamp).toBeGreaterThan(0);
  });

  it('restores consent from localStorage on mount', async () => {
    localStorage.setItem('8pm_cookie_consent', JSON.stringify({
      necessary: true,
      functional: true,
      analytics: false,
      timestamp: Date.now(),
      version: '1.0',
    }));

    render(<ConsentDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('has-consented').textContent).toBe('true');
    expect(screen.getByTestId('functional').textContent).toBe('true');
    expect(screen.getByTestId('analytics').textContent).toBe('false');
  });

  it('version mismatch forces re-consent', async () => {
    localStorage.setItem('8pm_cookie_consent', JSON.stringify({
      necessary: true,
      functional: true,
      analytics: true,
      timestamp: Date.now(),
      version: '0.9', // Outdated version
    }));

    render(<ConsentDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    // Should treat as not consented due to version mismatch
    expect(screen.getByTestId('has-consented').textContent).toBe('false');
  });

  it('resetConsent clears everything', async () => {
    render(<ConsentDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('accept-all').click(); });
    expect(screen.getByTestId('has-consented').textContent).toBe('true');

    act(() => { screen.getByTestId('reset').click(); });
    expect(screen.getByTestId('has-consented').textContent).toBe('false');
    expect(screen.getByTestId('functional').textContent).toBe('false');
    expect(screen.getByTestId('analytics').textContent).toBe('false');
    expect(localStorage.getItem('8pm_cookie_consent')).toBeNull();
  });

  it('fires cookieConsentUpdate custom event on save', async () => {
    const handler = vi.fn();
    window.addEventListener('cookieConsentUpdate', handler);

    render(<ConsentDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('accept-all').click(); });

    expect(handler).toHaveBeenCalledTimes(1);
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.analytics).toBe(true);

    window.removeEventListener('cookieConsentUpdate', handler);
  });
});
