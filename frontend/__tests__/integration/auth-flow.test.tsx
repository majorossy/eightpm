/**
 * Integration test: Authentication flow
 *
 * Tests the full auth lifecycle through real providers:
 * - Sign in (token generation → customer fetch → context update)
 * - Sign up (create account → auto-sign-in)
 * - Sign out (token revocation → state cleanup)
 * - Token restore on mount (localStorage → customer fetch)
 * - Auth failure handling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { buildCustomer } from '@/test/factories/customer';
import {
  setCustomerToReturn,
  setStoredTokenValue,
  setAuthFailure,
  resetAuthMocks,
  generateCustomerToken,
  getCustomer,
  revokeCustomerToken,
  createCustomer,
  getStoredToken,
} from '@/test/mocks/magentoAuth';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

// Test component that exposes auth state
function AuthDisplay() {
  const auth = useMagentoAuth();
  return (
    <div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="loading">{String(auth.isLoading)}</div>
      <div data-testid="error">{auth.error ?? ''}</div>
      <div data-testid="customer-name">{auth.customer?.firstname ?? ''}</div>
      <div data-testid="customer-email">{auth.customer?.email ?? ''}</div>
      <button onClick={() => auth.signIn('trey', 'password123')}>Sign In</button>
      <button onClick={() => auth.signUp({ username: 'newuser', password: 'pass', firstname: 'New', lastname: 'User' })}>Sign Up</button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
}

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    resetAuthMocks();
    localStorage.clear();
  });

  it('starts unauthenticated with no stored token', async () => {
    renderApp(<AuthDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('customer-name').textContent).toBe('');
  });

  it('signs in successfully', async () => {
    const customer = buildCustomer({ firstname: 'Trey', lastname: 'Anastasio' });
    setCustomerToReturn(customer);

    renderApp(<AuthDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Sign In').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    expect(screen.getByTestId('customer-name').textContent).toBe('Trey');
    expect(screen.getByTestId('customer-email').textContent).toBe(customer.email);
    expect(generateCustomerToken).toHaveBeenCalledWith('trey@8pm.me', 'password123');
    expect(getCustomer).toHaveBeenCalled();
  });

  it('shows error on sign in failure', async () => {
    setAuthFailure(true, 'The account sign-in was incorrect');

    renderApp(<AuthDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Sign In').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('The account sign-in was incorrect');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('signs out and clears state', async () => {
    const customer = buildCustomer({ firstname: 'Page' });
    setCustomerToReturn(customer);

    renderApp(<AuthDisplay />);

    // Sign in first
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Sign In').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // Now sign out
    await act(async () => {
      screen.getByText('Sign Out').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });

    expect(screen.getByTestId('customer-name').textContent).toBe('');
    expect(revokeCustomerToken).toHaveBeenCalled();
  });

  it('restores session from stored token on mount', async () => {
    const customer = buildCustomer({ firstname: 'Mike', email: 'mike@8pm.me' });
    setStoredTokenValue('existing-token-abc');
    setCustomerToReturn(customer);

    renderApp(<AuthDisplay />);

    // Should auto-restore the session
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    expect(screen.getByTestId('customer-name').textContent).toBe('Mike');
    expect(getCustomer).toHaveBeenCalledWith('existing-token-abc');
  });

  it('clears expired/invalid token on mount', async () => {
    setStoredTokenValue('expired-token');
    setAuthFailure(true, 'Token expired');

    renderApp(<AuthDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Should remain unauthenticated
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('signs up, then auto-signs in', async () => {
    const customer = buildCustomer({ firstname: 'New', lastname: 'User', email: 'newuser@8pm.me' });
    setCustomerToReturn(customer);

    renderApp(<AuthDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Sign Up').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    expect(screen.getByTestId('customer-name').textContent).toBe('New');
    expect(createCustomer).toHaveBeenCalled();
    // Auto-sign-in triggers generateCustomerToken
    expect(generateCustomerToken).toHaveBeenCalled();
  });

  it('handles getCustomer returning null after token generation', async () => {
    // Token generates fine, but getCustomer returns null
    setCustomerToReturn(null);

    renderApp(<AuthDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Sign In').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Failed to retrieve account details');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });
});
