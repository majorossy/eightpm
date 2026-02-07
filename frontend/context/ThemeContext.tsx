'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Three themes: Campfire (dark), Fishman (blue-gray), Light (white)
export type ThemeType = 'campfire' | 'fishman' | 'light';

interface ThemeConfig {
  name: string;
  label: string;
  description: string;
  icon: string;
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
  campfire: {
    name: 'campfire',
    label: 'Campfire',
    description: 'Warm analog dark theme',
    icon: '🔥',
  },
  fishman: {
    name: 'fishman',
    label: 'Fishman',
    description: 'Blue-gray donut theme',
    icon: '🍩',
  },
  light: {
    name: 'light',
    label: 'Light',
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
  if (typeof window === 'undefined') return 'campfire';

  const stored = localStorage.getItem('8pm-theme');
  if (stored === 'campfire' || stored === 'fishman' || stored === 'light') {
    return stored;
  }

  return 'campfire';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('campfire');
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
      'theme-campfire', 'theme-fishman', 'mode-light', 'mode-dark'
    );

    // Add appropriate theme class
    if (theme === 'fishman') {
      document.documentElement.classList.add('theme-fishman');
    } else if (theme === 'light') {
      document.documentElement.classList.add('theme-campfire', 'mode-light');
    } else {
      document.documentElement.classList.add('theme-campfire');
    }
  }, [mounted, theme]);

  const setTheme = useCallback((newTheme: ThemeType) => {
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
      theme: 'campfire' as ThemeType,
      setTheme: () => {},
      themes: THEMES,
    };
  }
  return context;
}
