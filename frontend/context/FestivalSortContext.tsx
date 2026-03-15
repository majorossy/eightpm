'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ArtistWithStats,
  SortAlgorithm,
  isValidAlgorithm,
  sortAlphabetically,
  sortArtistsByAlgorithm,
} from '@/utils/festivalSorting';

const STORAGE_KEY = 'festivalSortAlgorithm';
const ALPHA_STORAGE_KEY = 'festivalSortAlphaMode';
const DEFAULT_ALGORITHM: SortAlgorithm = 'shows';

interface FestivalSortContextValue {
  sortedArtists: ArtistWithStats[];
  algorithm: SortAlgorithm;
  setAlgorithm: (algo: SortAlgorithm) => void;
  isAlphaMode: boolean;
  toggleAlphaMode: () => void;
  isLoading: boolean;
}

const FestivalSortContext = createContext<FestivalSortContextValue | undefined>(
  undefined
);

interface FestivalSortProviderProps {
  artists: ArtistWithStats[];
  children: React.ReactNode;
}

export function FestivalSortProvider({
  artists,
  children,
}: FestivalSortProviderProps) {
  const [algorithm, setAlgorithmState] = useState<SortAlgorithm>(DEFAULT_ALGORITHM);
  const [isAlphaMode, setIsAlphaMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // SSR-safe hydration: Load from localStorage after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedAlgo = localStorage.getItem(STORAGE_KEY);
      if (storedAlgo && isValidAlgorithm(storedAlgo)) {
        setAlgorithmState(storedAlgo);
      }

      const storedAlpha = localStorage.getItem(ALPHA_STORAGE_KEY);
      if (storedAlpha === 'true') {
        setIsAlphaMode(true);
      }
    } catch (error) {
      // localStorage quota exceeded or disabled - gracefully degrade
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Memoized sorted artists - only recompute when artists, algorithm, or alpha mode changes
  const sortedArtists = useMemo(() => {
    // During SSR or before hydration, use default sort to match server-side pre-sorting
    if (!isHydrated) {
      return sortArtistsByAlgorithm(artists, DEFAULT_ALGORITHM);
    }

    // In alpha mode, sort alphabetically (font sizes still based on algorithm's metric)
    if (isAlphaMode) {
      return sortAlphabetically(artists);
    }

    return sortArtistsByAlgorithm(artists, algorithm);
  }, [artists, algorithm, isAlphaMode, isHydrated]);

  // Memoized setter - persists to localStorage and resets alpha mode
  const setAlgorithm = useCallback((algo: SortAlgorithm) => {
    if (!isValidAlgorithm(algo)) {
      return;
    }

    setAlgorithmState(algo);
    setIsAlphaMode(false); // Reset alpha mode when changing algorithm

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, algo);
        localStorage.setItem(ALPHA_STORAGE_KEY, 'false');
      } catch (error) {
        // Quota exceeded - app keeps working, just loses persistence
      }
    }
  }, []);

  // Toggle alpha mode - persists to localStorage
  const toggleAlphaMode = useCallback(() => {
    setIsAlphaMode((prev) => {
      const newValue = !prev;

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(ALPHA_STORAGE_KEY, String(newValue));
        } catch { /* localStorage unavailable */ }
      }

      return newValue;
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<FestivalSortContextValue>(
    () => ({
      sortedArtists,
      algorithm,
      setAlgorithm,
      isAlphaMode,
      toggleAlphaMode,
      isLoading: !isHydrated,
    }),
    [sortedArtists, algorithm, setAlgorithm, isAlphaMode, toggleAlphaMode, isHydrated]
  );

  return (
    <FestivalSortContext.Provider value={value}>
      {children}
    </FestivalSortContext.Provider>
  );
}

export function useFestivalSort(): FestivalSortContextValue {
  const context = React.useContext(FestivalSortContext);
  if (context === undefined) {
    throw new Error('useFestivalSort must be used within a FestivalSortProvider');
  }
  return context;
}
