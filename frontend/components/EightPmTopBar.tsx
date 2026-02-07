'use client';

// EightPmTopBar - Top navigation bar with breadcrumbs and theme toggle

import Breadcrumb from './Breadcrumb';
import ThemeToggle from './ThemeToggle';

interface EightPmTopBarProps {
  transparent?: boolean;
}

export default function EightPmTopBar({ transparent = false }: EightPmTopBarProps) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors ${
        transparent ? 'bg-transparent' : 'bg-[var(--bg)]/95 backdrop-blur-sm'
      }`}
    >
      {/* Breadcrumb navigation - constrained to same width as page content */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-1.5 md:py-3 flex items-center justify-between gap-4 h-14 md:h-16">
        <Breadcrumb />
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>

      {/* Soft gradient fade at bottom - uses CSS variable */}
      {!transparent && (
        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none -mb-8"
          style={{
            background: 'linear-gradient(to bottom, var(--bg, #1c1a17) 0%, transparent 100%)',
            opacity: 0.8,
          }}
        />
      )}
    </header>
  );
}
