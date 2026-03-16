'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { trackThemeChange, setUserProperties } from '@/lib/analytics';

// Three themes: Camp (dark), Lot (blue-gray), Shore (white)
export type ThemeType = 'camp' | 'lot' | 'shore';

interface ThemeConfig {
  name: string;
  label: string;
  description: string;
  icon: string;
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
  camp: {
    name: 'camp',
    label: 'Camp',
    description: 'Warm analog dark theme',
    icon: '🔥',
  },
  lot: {
    name: 'lot',
    label: 'Lot',
    description: 'Aurora donut theme',
    icon: '🍩',
  },
  shore: {
    name: 'shore',
    label: 'Shore',
    description: 'Clean white theme',
    icon: '☀️',
  },
};

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get initial theme from localStorage
function getInitialTheme(): ThemeType {
  if (typeof window === 'undefined') return 'lot';

  const stored = localStorage.getItem('8pm-theme');

  // Support legacy theme names during migration
  if (stored === 'fishman') return 'lot';
  if (stored === 'campfire') return 'camp';
  if (stored === 'light') return 'shore';

  if (stored === 'camp' || stored === 'lot' || stored === 'shore') {
    return stored;
  }

  return 'lot';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('lot');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setThemeState(initialTheme);
    setMounted(true);
  }, []);

  // Apply theme classes to document
  useEffect(() => {
    if (!mounted) return;

    // Remove all theme classes
    document.documentElement.classList.remove(
      'theme-camp', 'theme-lot', 'mode-shore',
      // Legacy classes — remove if present
      'theme-campfire', 'theme-fishman', 'mode-light', 'mode-dark'
    );

    // Add appropriate theme class
    if (theme === 'camp') {
      document.documentElement.classList.add('theme-camp');
    } else if (theme === 'shore') {
      document.documentElement.classList.add('theme-camp', 'mode-shore');
    } else {
      document.documentElement.classList.add('theme-lot');
    }
  }, [mounted, theme]);

  const themeRef = useRef(theme);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  const setTheme = useCallback((newTheme: ThemeType) => {
    trackThemeChange(themeRef.current, newTheme);
    setUserProperties({ preferred_theme: newTheme });
    setThemeState(newTheme);
    localStorage.setItem('8pm-theme', newTheme);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values if context not yet available (during SSR/hydration)
    return {
      theme: 'lot' as ThemeType,
      setTheme: () => {},
      themes: THEMES,
    };
  }
  return context;
}
