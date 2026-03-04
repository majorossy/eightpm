import { MagentoCustomer, MagentoCustomerCreateInput } from './types';

const MAGENTO_URL = process.env.NEXT_PUBLIC_MAGENTO_GRAPHQL_URL || 'https://magento.test/graphql';
const TOKEN_KEY = 'magento_customer_token';
const TOKEN_EXPIRY_KEY = 'magento_customer_token_expiry';

// Token expires in 1 hour by default
const TOKEN_DURATION_MS = 60 * 60 * 1000;

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
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_DURATION_MS));
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
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
    throw new Error(result.errors[0]?.message || 'GraphQL error');
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
    return data.customer;
  } catch {
    clearStoredToken();
    return null;
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
