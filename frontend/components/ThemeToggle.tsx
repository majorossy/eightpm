'use client';

import { useTheme, THEMES } from '@/context/ThemeContext';
import type { ThemeType } from '@/context/ThemeContext';

interface ThemeToggleProps {
  iconSize?: number;
}

export default function ThemeToggle({ iconSize }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center gap-0.5 p-0.5 rounded-full transition-all duration-300"
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
            className="rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] flex items-center justify-center"
            style={{
              width: iconSize ?? undefined,
              height: iconSize ?? undefined,
              padding: iconSize ? undefined : '0.25rem',
              background: isActive ? 'var(--overlay-medium)' : 'transparent',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
            }}
            aria-label={`Switch to ${themeConfig.label} theme`}
            title={themeConfig.description}
            role="radio"
            aria-checked={isActive}
          >
            <span
              className="block leading-none transition-all duration-300"
              style={{
                opacity: isActive ? 1 : 0.5,
                filter: `grayscale(${isActive ? 0 : 100}%)`,
                fontSize: iconSize ? `${iconSize * 0.45}px` : '0.6rem',
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
