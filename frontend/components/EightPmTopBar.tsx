'use client';

// EightPmTopBar - Top navigation bar with breadcrumbs and theme toggle

import Breadcrumb from './Breadcrumb';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';

export default function EightPmTopBar() {
  const { breadcrumbs } = useBreadcrumbs();
  const isHeroPage = breadcrumbs.length === 0;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors ${
        isHeroPage ? 'bg-transparent' : 'bg-[var(--bg)]'
      }`}
    >
      {/* Breadcrumb navigation - constrained to same width as page content */}
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-8 py-1.5 md:py-1.5 flex items-center h-11 md:h-11">
        <Breadcrumb />
      </div>

      {/* Soft gradient fade at bottom - uses CSS variable (hidden on hero pages) */}
      {!isHeroPage && (
        <div
          className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none -mb-4"
          style={{
            background: 'linear-gradient(to bottom, var(--bg, #1c1a17) 0%, transparent 100%)',
            opacity: 0.8,
          }}
        />
      )}
    </header>
  );
}
