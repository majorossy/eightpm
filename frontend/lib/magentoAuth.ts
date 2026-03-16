import { MagentoCustomer, MagentoCustomerCreateInput } from './types';

// Use the Next.js API proxy to avoid self-signed cert issues in the browser
const MAGENTO_URL = '/api/graphql';
const TOKEN_KEY = 'magento_customer_token';
const TOKEN_EXPIRY_KEY = 'magento_customer_token_expiry';
const USERNAME_DOMAIN = '8pm.me';

/** Convert a username to the internal email format */
export function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}@${USERNAME_DOMAIN}`;
}

/** Extract a username from the internal email format */
export function emailToUsername(email: string): string {
  if (email.endsWith(`@${USERNAME_DOMAIN}`)) {
    return email.slice(0, -(USERNAME_DOMAIN.length + 1));
  }
  // Fallback for legacy accounts with real emails
  return email.split('@')[0];
}

// 30-day sliding window — refreshed on each successful auth check
const TOKEN_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) return null;

  if (Date.now() > parseInt(expiry, 10)) {
    clearStoredToken();
    return null;
  }

  return token;
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_DURATION_MS));
  } catch {
    // QuotaExceededError — token lives in memory for this session only
    console.error('[magentoAuth] Failed to persist auth token to localStorage');
  }
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

async function magentoFetch<T>(query: string, variables?: Record<string, unknown>, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(MAGENTO_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    const msg = result.errors[0]?.message || 'GraphQL error';
    const category = result.errors[0]?.extensions?.category;
    if (category === 'graphql-authorization' || msg.toLowerCase().includes('not authorized')) {
      throw new AuthError(msg);
    }
    throw new Error(msg);
  }

  return result.data;
}

export async function generateCustomerToken(email: string, password: string): Promise<string> {
  const query = `
    mutation GenerateCustomerToken($email: String!, $password: String!) {
      generateCustomerToken(email: $email, password: $password) {
        token
      }
    }
  `;

  const data = await magentoFetch<{ generateCustomerToken: { token: string } }>(
    query,
    { email, password }
  );

  const token = data.generateCustomerToken.token;
  setStoredToken(token);
  return token;
}

export async function createCustomer(input: MagentoCustomerCreateInput): Promise<MagentoCustomer> {
  const query = `
    mutation CreateCustomer($input: CustomerCreateInput!) {
      createCustomerV2(input: $input) {
        customer {
          email
          firstname
          lastname
        }
      }
    }
  `;

  const data = await magentoFetch<{ createCustomerV2: { customer: MagentoCustomer } }>(
    query,
    { input }
  );

  return data.createCustomerV2.customer;
}

export async function getCustomer(token?: string): Promise<MagentoCustomer | null> {
  const authToken = token || getStoredToken();
  if (!authToken) return null;

  const query = `
    query GetCustomer {
      customer {
        email
        firstname
        lastname
        addresses {
          id
          firstname
          lastname
          street
          city
          region {
            region
            region_code
            region_id
          }
          postcode
          country_code
          telephone
          default_billing
          default_shipping
        }
      }
    }
  `;

  try {
    const data = await magentoFetch<{ customer: MagentoCustomer }>(query, undefined, authToken);
    // Sliding window: extend expiry on every successful check
    setStoredToken(authToken);
    return data.customer;
  } catch (err) {
    if (err instanceof AuthError) {
      // Token is genuinely invalid/expired — clear it
      clearStoredToken();
      return null;
    }
    // Network error, 502, timeout — don't destroy valid token
    throw err;
  }
}

export async function revokeCustomerToken(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return true;

  const query = `
    mutation RevokeCustomerToken {
      revokeCustomerToken {
        result
      }
    }
  `;

  try {
    await magentoFetch<{ revokeCustomerToken: { result: boolean } }>(query, undefined, token);
  } catch {
    // Ignore errors on revoke
  }

  clearStoredToken();
  return true;
}

export async function requestPasswordReset(email: string): Promise<boolean> {
  const query = `
    mutation RequestPasswordReset($email: String!) {
      requestPasswordResetEmail(email: $email)
    }
  `;

  const data = await magentoFetch<{ requestPasswordResetEmail: boolean }>(query, { email });
  return data.requestPasswordResetEmail;
}
