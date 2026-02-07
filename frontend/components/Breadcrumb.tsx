'use client';

// Breadcrumb - Navigation breadcrumbs for the top bar
// Format: ☰ 8pm.me > Artist: {name} > Album: {name} > Track: {name} > Version: {year / venue}

import Link from 'next/link';
import { useBreadcrumbs, BreadcrumbType } from '@/context/BreadcrumbContext';
import { usePlayer } from '@/context/PlayerContext';

// Get the prefix for each breadcrumb type
function getTypePrefix(type?: BreadcrumbType): string {
  switch (type) {
    case 'artist':
      return 'Artist: ';
    case 'album':
      return 'Album: ';
    case 'track':
      return 'Track: ';
    case 'version':
      return 'Version: ';
    default:
      return '';
  }
}

// Hamburger menu button component
function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-0 text-[var(--text-dim)] hover:brightness-110 transition-all flex items-center justify-center shrink-0"
      aria-label="Open queue"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32" height="32">
        <defs>
          <linearGradient id="psychTopBun" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#FF9A56'}}/>
            <stop offset="50%" style={{stopColor:'#E8A54B'}}/>
            <stop offset="100%" style={{stopColor:'#D4893D'}}/>
          </linearGradient>
          <linearGradient id="rainbowCheese" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor:'#FFD93D'}}/>
            <stop offset="25%" style={{stopColor:'#FF9A56'}}/>
            <stop offset="50%" style={{stopColor:'#FFD93D'}}/>
            <stop offset="75%" style={{stopColor:'#F5A623'}}/>
            <stop offset="100%" style={{stopColor:'#FFD93D'}}/>
          </linearGradient>
          <linearGradient id="cosmicPatty" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor:'#6D4C41'}}/>
            <stop offset="50%" style={{stopColor:'#8D6E63'}}/>
            <stop offset="100%" style={{stopColor:'#5D4037'}}/>
          </linearGradient>
          <linearGradient id="neonLettuce" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor:'#69F0AE'}}/>
            <stop offset="50%" style={{stopColor:'#00E676'}}/>
            <stop offset="100%" style={{stopColor:'#76FF03'}}/>
          </linearGradient>
          <linearGradient id="hotTomato" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:'#FF5252'}}/>
            <stop offset="100%" style={{stopColor:'#D32F2F'}}/>
          </linearGradient>
        </defs>
        <path d="M7 36 Q7 39 11 39 L37 39 Q41 39 41 36 L41 34 L7 34 Z" fill="url(#psychTopBun)"/>
        <rect x="6" y="28" width="36" height="5" rx="2" fill="url(#cosmicPatty)"/>
        <path d="M6 24 L6 26 Q7 30 9 27 L9 24 L14 24 L14 27 Q16 32 18 27 L18 24 L24 24 L24 26 Q25 29 27 26 L27 24 L33 24 L33 27 Q35 30 37 26 L37 24 L42 24 L42 26 Q43 28 42 26 L42 24 Z" fill="url(#rainbowCheese)"/>
        <ellipse cx="24" cy="22" rx="15" ry="2.5" fill="url(#hotTomato)"/>
        <path d="M6 18 Q9 21 12 17 Q15 21 18 17 Q21 21 24 17 Q27 21 30 17 Q33 21 36 17 Q39 21 42 18 L42 20 Q39 23 36 19 Q33 23 30 19 Q27 23 24 19 Q21 23 18 19 Q15 23 12 19 Q9 23 6 20 Z" fill="url(#neonLettuce)"/>
        <path d="M7 17 Q7 6 24 6 Q41 6 41 17 L41 18 L7 18 Z" fill="url(#psychTopBun)"/>
        <ellipse cx="13" cy="10" rx="2.2" ry="1.3" fill="#FFFDE7" transform="rotate(-20 13 10)"/>
        <ellipse cx="24" cy="8" rx="2.2" ry="1.3" fill="#FFFDE7" transform="rotate(5 24 8)"/>
        <ellipse cx="35" cy="10" rx="2.2" ry="1.3" fill="#FFFDE7" transform="rotate(15 35 10)"/>
      </svg>
    </button>
  );
}

export default function Breadcrumb() {
  const { breadcrumbs } = useBreadcrumbs();
  const player = usePlayer();

  // Show "8pm.me" when no breadcrumbs are set
  if (breadcrumbs.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center text-sm gap-1 min-w-0 flex-1">
        <HamburgerButton onClick={player.toggleQueue} />
        <svg
          className="w-4 h-4 text-[var(--text-subdued)] shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <Link href="/" className="text-[var(--text)] font-medium hover:text-[var(--neon-pink)] transition-colors shrink-0">
          8pm.me
        </Link>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm gap-1 min-w-0 flex-1">
      <HamburgerButton onClick={player.toggleQueue} />
      <svg
        className="w-4 h-4 text-[var(--text-subdued)] shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
      <ol className="flex items-center gap-1 min-w-0 flex-1">
        {/* Always show 8pm.me link first */}
        <li className="flex items-center shrink-0">
          <Link
            href="/"
            className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            8pm.me
          </Link>
        </li>

        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const prefix = getTypePrefix(crumb.type);
          const displayLabel = prefix + crumb.label;

          return (
            <li key={index} className="flex items-center min-w-0">
              {/* Chevron separator */}
              <svg
                className="w-4 h-4 text-[var(--text-subdued)] shrink-0 mx-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>

              {isLast || !crumb.href ? (
                // Current page (non-clickable)
                <span
                  className="text-[var(--text)] font-medium truncate min-w-0 max-w-xs"
                  title={displayLabel}
                >
                  {prefix && <span className="text-[var(--text-subdued)]">{prefix}</span>}
                  {crumb.label}
                </span>
              ) : (
                // Clickable link
                <Link
                  href={crumb.href}
                  className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors truncate min-w-0 max-w-xs"
                  title={displayLabel}
                >
                  {prefix && <span className="text-[var(--text-subdued)]">{prefix}</span>}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
