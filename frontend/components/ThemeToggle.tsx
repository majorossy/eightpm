'use client';

import { useTheme, THEMES } from '@/context/ThemeContext';
import type { ThemeType } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-full transition-all duration-300"
      style={{ background: 'var(--overlay-subtle)' }}
      role="radiogroup"
      aria-label="Theme selector"
    >
      {(Object.keys(THEMES) as ThemeType[]).map((themeKey) => {
        const themeConfig = THEMES[themeKey];
        const isActive = theme === themeKey;

        return (
          <button
            key={themeKey}
            onClick={() => setTheme(themeKey)}
            className="p-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-pink)]"
            style={{
              background: isActive ? 'var(--overlay-medium)' : 'transparent',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
            }}
            aria-label={`Switch to ${themeConfig.label} theme`}
            title={themeConfig.description}
            role="radio"
            aria-checked={isActive}
          >
            <span
              className="block text-lg leading-none transition-all duration-300"
              style={{
                opacity: isActive ? 1 : 0.5,
                filter: `grayscale(${isActive ? 0 : 100}%)`,
              }}
            >
              {themeConfig.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}
