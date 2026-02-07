'use client';

// EightPmMobileNav - Spotify-style bottom tab navigation for mobile

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { EightPmSearchOverlay } from './EightPmSearchOverlay';
import { useHaptic } from '@/hooks/useHaptic';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';

export default function EightPmMobileNav() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { vibrate, BUTTON_PRESS } = useHaptic();
  const { isAuthenticated, profile, user } = useAuth();

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const tabs = [
    {
      href: '/',
      label: 'Home',
      action: null,
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          {active ? (
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          )}
        </svg>
      ),
    },
    {
      href: '/search',
      label: 'Search',
      action: () => {
        vibrate(BUTTON_PRESS);
        setIsSearchOpen(true);
      },
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2.5 : 2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      href: '/library',
      label: 'Your Library',
      action: null,
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          {active ? (
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
          ) : (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </>
          )}
        </svg>
      ),
    },
    {
      href: isAuthenticated ? '/account' : '#',
      label: isAuthenticated ? 'Profile' : 'Sign In',
      action: isAuthenticated ? null : () => {
        vibrate(BUTTON_PRESS);
        setIsAuthModalOpen(true);
      },
      icon: (active: boolean) => (
        isAuthenticated ? (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            active ? 'bg-[var(--neon-pink)] text-[var(--bg)]' : 'bg-[var(--bg-elevated)] text-[var(--text)]'
          }`}>
            {initials}
          </div>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={active ? 2.5 : 2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )
      ),
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-[50px] bg-transparent z-[51] safe-bottom" aria-label="Main navigation">
        <div className="flex items-center justify-around h-full px-4 max-w-[1000px] mx-auto">
          {tabs.map((tab) => {
            const active = isActive(tab.href);

            // If tab has an action, render as button
            if (tab.action) {
              return (
                <button
                  key={tab.href}
                  onClick={tab.action}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 transition-colors ${
                    active ? 'text-[#d4a060]' : 'text-[#8a8478]'
                  }`}
                  aria-label={tab.label}
                  aria-current={active ? 'page' : undefined}
                >
                  {tab.icon(active)}
                  <span className="text-[10px] font-medium font-sans" aria-hidden="true">{tab.label}</span>
                </button>
              );
            }

            // Otherwise render as link
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => vibrate(BUTTON_PRESS)}
                className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 transition-colors ${
                  active ? 'text-[#d4a060]' : 'text-[#8a8478]'
                }`}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                {tab.icon(active)}
                <span className="text-[10px] font-medium font-sans" aria-hidden="true">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Search Overlay */}
      <EightPmSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
