'use client';

// NavDrawer - Left-side navigation drawer triggered by hamburger menu

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { useMobileUI } from '@/context/MobileUIContext';
import { useBackToClose } from '@/hooks/useBackToClose';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    label: 'Search',
    href: '/search',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: 'Your Library',
    href: '/library',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z" />
      </svg>
    ),
  },
  {
    label: 'Cassettes',
    href: '/cassettes',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="8" cy="12" r="2" />
        <circle cx="16" cy="12" r="2" />
        <path d="M8 14h8" />
      </svg>
    ),
  },
  {
    label: 'MiniDiscs',
    href: '/minidiscs',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
      </svg>
    ),
  },
  {
    label: 'Podcasts',
    href: '/podcasts',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 5.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
      </svg>
    ),
  },
  {
    label: 'Venues',
    href: '/venues',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    ),
  },
  {
    label: 'Recently Played',
    href: '/recently-played',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
      </svg>
    ),
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: 'Account',
    href: '/account',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    ),
  },
];

export default function NavDrawer() {
  const { isSidebarOpen, closeSidebar, isMobile } = useMobileUI();
  useBackToClose(isSidebarOpen, closeSidebar);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <Dialog.Root open={isSidebarOpen} onOpenChange={(open) => { if (!open) closeSidebar(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/60"
          aria-hidden="true"
        />

        <Dialog.Content asChild>
          <aside
            className={`fixed z-50 left-0 top-0 bottom-0 flex flex-col ${
              isMobile
                ? 'w-[280px] bg-gradient-to-b from-border to-surface-base safe-top safe-bottom'
                : 'w-72 bg-surface-base border-r border-default'
            }`}
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 ${isMobile ? 'py-4' : 'p-4 border-b border-default'}`}>
              <Link
                href="/"
                onClick={closeSidebar}
                className="text-xl font-bold text-accent hover:text-accent-hover transition-colors"
              >
                8pm.me
              </Link>
              <Dialog.Close asChild>
                <button
                  className="p-2 text-secondary hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>

            {/* Navigation items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-2">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeSidebar}
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                          active
                            ? 'bg-surface-elevated text-white'
                            : 'text-secondary hover:text-white hover:bg-surface-elevated/50'
                        }`}
                      >
                        <span className={active ? 'text-accent' : ''}>{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Divider */}
              <div className="my-4 mx-4 border-t border-default" />

              {/* Bottom nav items */}
              <ul className="space-y-1 px-2">
                {bottomNavItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeSidebar}
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                          active
                            ? 'bg-surface-elevated text-white'
                            : 'text-secondary hover:text-white hover:bg-surface-elevated/50'
                        }`}
                      >
                        <span className={active ? 'text-accent' : ''}>{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-default">
              <p className="text-xs text-tertiary text-center">
                Please copy freely - never sell
              </p>
            </div>
          </aside>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
