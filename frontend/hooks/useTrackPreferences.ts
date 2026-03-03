'use client';

import { useState, useCallback } from 'react';

type Prefs = Record<string, string>; // trackId → songId

const STORAGE_PREFIX = '8pm-track-pref:';

function readStorage(albumId: string): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + albumId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStorage(albumId: string, prefs: Prefs) {
  const key = STORAGE_PREFIX + albumId;
  if (Object.keys(prefs).length === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(prefs));
  }
}

export function useTrackPreferences(albumIdentifier: string) {
  const [prefs, setPrefs] = useState<Prefs>(() => readStorage(albumIdentifier));

  const getPreferred = useCallback(
    (trackId: string): string | null => prefs[trackId] ?? null,
    [prefs],
  );

  const setPreferred = useCallback(
    (trackId: string, songId: string) => {
      setPrefs(prev => {
        const next = { ...prev, [trackId]: songId };
        writeStorage(albumIdentifier, next);
        return next;
      });
    },
    [albumIdentifier],
  );

  const clearPreferred = useCallback(
    (trackId: string) => {
      setPrefs(prev => {
        const next = { ...prev };
        delete next[trackId];
        writeStorage(albumIdentifier, next);
        return next;
      });
    },
    [albumIdentifier],
  );

  const setAll = useCallback(
    (overrides: Record<string, string>) => {
      writeStorage(albumIdentifier, overrides);
      setPrefs(overrides);
    },
    [albumIdentifier],
  );

  const getOverridesMap = useCallback((): Map<string, string> => {
    return new Map(Object.entries(prefs));
  }, [prefs]);

  return { getPreferred, setPreferred, clearPreferred, setAll, getOverridesMap };
}
