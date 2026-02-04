'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Campfire Tapes theme - earthy, organic, warm analog vibes
export type ThemeType = 'campfire';
export type ModeType = 'light' | 'dark';

interface ThemeConfig {
  name: string;
  label: string;
  description: string;
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
  campfire: {
    name: 'campfire',
    label: 'Campfire Tapes',
    description: 'Earthy, organic, warm analog vibes',
  },
};

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themes: typeof THEMES;
  mode: ModeType;
  setMode: (mode: ModeType) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get initial mode from localStorage or system preference
function getInitialMode(): ModeType {
  if (typeof window === 'undefined') return 'dark';

  // Check localStorage first
  const stored = localStorage.getItem('8pm-mode');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // Default to dark mode
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState<ThemeType>('campfire');
  const [mode, setModeState] = useState<ModeType>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize mode on mount
  useEffect(() => {
    const initialMode = getInitialMode();
    setModeState(initialMode);
    localStorage.setItem('8pm-theme', 'campfire');
    setMounted(true);
  }, []);

  // Apply theme and mode classes to document
  useEffect(() => {
    if (!mounted) return;

    // Remove any old theme classes
    document.documentElement.classList.remove(
      'theme-tron', 'theme-metro', 'theme-minimal',
      'theme-classic', 'theme-forest', 'theme-jamify'
    );
    // Add campfire theme class
    document.documentElement.classList.add('theme-campfire');

    // Apply mode class
    document.documentElement.classList.remove('mode-light', 'mode-dark');
    document.documentElement.classList.add(`mode-${mode}`);
  }, [mounted, mode]);

  const setTheme = useCallback(() => {
    // No-op: theme is always campfire
  }, []);

  const setMode = useCallback((newMode: ModeType) => {
    setModeState(newMode);
    localStorage.setItem('8pm-mode', newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values if context not yet available (during SSR/hydration)
    return {
      theme: 'campfire' as ThemeType,
      setTheme: () => {},
      themes: THEMES,
      mode: 'dark' as ModeType,
      setMode: () => {},
      toggleMode: () => {},
    };
  }
  return context;
}
