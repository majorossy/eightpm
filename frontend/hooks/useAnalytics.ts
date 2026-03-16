'use client';

/**
 * useAnalytics - Hook that runs page-level analytics side effects.
 *
 * Tracks SPA page views on route change and scroll depth thresholds.
 * Call once in a top-level layout component (e.g., ClientLayout).
 *
 * Individual event tracking functions should be imported directly
 * from `@/lib/analytics` — no hook wrapper needed.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  trackPageView,
  trackTimeOnPage,
  trackScrollDepth,
} from '@/lib/analytics';

export function useAnalytics(): void {
  const pathname = usePathname();
  const pageLoadTimeRef = useRef<number>(Date.now());
  const scrollDepthTrackedRef = useRef<Set<number>>(new Set());

  // Track page views on route change (for SPA navigation)
  useEffect(() => {
    pageLoadTimeRef.current = Date.now();
    scrollDepthTrackedRef.current = new Set();

    if (pathname) {
      trackPageView(pathname);
    }

    // Track time on page when leaving
    return () => {
      const timeSpent = Math.round((Date.now() - pageLoadTimeRef.current) / 1000);
      if (timeSpent > 5 && pathname) {
        trackTimeOnPage(timeSpent, pathname);
      }
    };
  }, [pathname]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      const thresholds = [25, 50, 75, 90];
      for (const threshold of thresholds) {
        if (scrollPercent >= threshold && !scrollDepthTrackedRef.current.has(threshold)) {
          scrollDepthTrackedRef.current.add(threshold);
          if (pathname) {
            trackScrollDepth(threshold, pathname);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);
}

export default useAnalytics;
