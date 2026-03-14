'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { getStoredToken } from '@/lib/magentoAuth';
import { SharedCassette, fetchSharedCassettes } from '@/lib/magentoSync';

export function useSharedCassettes(albumIdentifier: string | undefined) {
  const { isAuthenticated } = useMagentoAuth();
  const [sharedCassettes, setSharedCassettes] = useState<SharedCassette[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!albumIdentifier) return;
    setIsLoading(true);
    try {
      const token = getStoredToken() || undefined;
      const result = await fetchSharedCassettes(albumIdentifier, token);
      setSharedCassettes(result.items);
    } catch (error) {
      console.error('[useSharedCassettes] Failed to fetch:', error);
      setSharedCassettes([]);
    } finally {
      setIsLoading(false);
    }
  }, [albumIdentifier]);

  useEffect(() => {
    refresh();
  }, [refresh, isAuthenticated]);

  return { sharedCassettes, isLoading, refresh };
}
