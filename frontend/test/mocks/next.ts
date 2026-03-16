/**
 * Mock implementations for Next.js modules in jsdom tests.
 * Import in vi.mock() calls at the top of test files.
 */
import { vi } from 'vitest';
import React from 'react';

// Shared router mock — tests can override push/back via mockRouter
export const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

let currentPathname = '/';

export function setPathname(path: string) {
  currentPathname = path;
}

export const nextNavigationMock = {
  useRouter: () => mockRouter,
  usePathname: () => currentPathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
};

export const nextImageMock = {
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    React.createElement('img', { src, alt, ...props }),
};

export const nextLinkMock = {
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
};

export const nextDynamicMock = {
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // For tests, return a simple passthrough component
    const Component = React.lazy(loader);
    return function DynamicComponent(props: Record<string, unknown>) {
      return React.createElement(React.Suspense, { fallback: null },
        React.createElement(Component, props)
      );
    };
  },
};
