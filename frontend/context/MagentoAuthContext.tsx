'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MagentoCustomer, MagentoCustomerCreateInput } from '@/lib/types';
import {
  generateCustomerToken,
  createCustomer,
  getCustomer,
  revokeCustomerToken,
  getStoredToken,
  usernameToEmail,
} from '@/lib/magentoAuth';

interface MagentoAuthContextType {
  customer: MagentoCustomer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signUp: (input: { username: string; password: string; firstname: string; lastname: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const MagentoAuthContext = createContext<MagentoAuthContextType | null>(null);

export function MagentoAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<MagentoCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = customer !== null;

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const customerData = await getCustomer(token);
          setCustomer(customerData);
        } catch {
          // getCustomer only returns null for auth failures (token cleared).
          // Network errors throw — keep customer null but don't clear the token,
          // so the next page load can retry.
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const signIn = useCallback(async (username: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const email = usernameToEmail(username);
      const token = await generateCustomerToken(email, password);
      const customerData = await getCustomer(token);
      setCustomer(customerData);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (input: { username: string; password: string; firstname: string; lastname: string }): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const email = usernameToEmail(input.username);
      await createCustomer({ email, password: input.password, firstname: input.firstname, lastname: input.lastname });
      // Auto sign in after registration
      return await signIn(input.username, input.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [signIn]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await revokeCustomerToken();
    } finally {
      setCustomer(null);
      setIsLoading(false);
    }
  }, []);

  const refreshCustomer = useCallback(async () => {
    const token = getStoredToken();
    if (token) {
      try {
        const customerData = await getCustomer(token);
        setCustomer(customerData);
      } catch {
        // Network error — keep existing customer state
      }
    }
  }, []);

  return (
    <MagentoAuthContext.Provider
      value={{
        customer,
        isAuthenticated,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        refreshCustomer,
      }}
    >
      {children}
    </MagentoAuthContext.Provider>
  );
}

export function useMagentoAuth() {
  const context = useContext(MagentoAuthContext);
  if (!context) {
    throw new Error('useMagentoAuth must be used within a MagentoAuthProvider');
  }
  return context;
}
