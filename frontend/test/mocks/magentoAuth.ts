/**
 * Mock for @/lib/magentoAuth — token management and customer API calls.
 *
 * Provides controllable mock implementations for:
 * - generateCustomerToken (login)
 * - createCustomer (signup)
 * - getCustomer (token validation + profile fetch)
 * - revokeCustomerToken (logout)
 * - Token storage (get/set/clear)
 */
import { vi } from 'vitest';
import type { MagentoCustomer, MagentoCustomerCreateInput } from '@/lib/types';

let storedToken: string | null = null;
let customerToReturn: MagentoCustomer | null = null;
let shouldFailAuth = false;
let failMessage = 'Invalid credentials';

// Control what the mocks return
export function setStoredTokenValue(token: string | null) {
  storedToken = token;
}

export function setCustomerToReturn(customer: MagentoCustomer | null) {
  customerToReturn = customer;
}

export function setAuthFailure(fail: boolean, message = 'Invalid credentials') {
  shouldFailAuth = fail;
  failMessage = message;
}

export function resetAuthMocks() {
  storedToken = null;
  customerToReturn = null;
  shouldFailAuth = false;
  failMessage = 'Invalid credentials';
}

// Mock implementations
export const getStoredToken = vi.fn(() => storedToken);
export const setStoredToken = vi.fn((token: string) => { storedToken = token; });
export const clearStoredToken = vi.fn(() => { storedToken = null; });

export const usernameToEmail = vi.fn((username: string) => `${username.toLowerCase().trim()}@8pm.me`);
export const emailToUsername = vi.fn((email: string) => email.split('@')[0]);

export const generateCustomerToken = vi.fn(async (_email: string, _password: string) => {
  if (shouldFailAuth) throw new Error(failMessage);
  const token = 'mock-token-' + Date.now();
  storedToken = token;
  return token;
});

export const createCustomer = vi.fn(async (input: MagentoCustomerCreateInput): Promise<MagentoCustomer> => {
  if (shouldFailAuth) throw new Error(failMessage);
  return {
    email: input.email,
    firstname: input.firstname,
    lastname: input.lastname,
  };
});

export const getCustomer = vi.fn(async (_token?: string): Promise<MagentoCustomer | null> => {
  if (shouldFailAuth) throw new Error(failMessage);
  return customerToReturn;
});

export const revokeCustomerToken = vi.fn(async () => {
  storedToken = null;
  return true;
});

export const requestPasswordReset = vi.fn(async (_email: string) => true);
