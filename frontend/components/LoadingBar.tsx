'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function LoadingBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const prevPathname = useRef(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start the loading animation
  const startLoading = useCallback(() => {
    clearTimers();
    setProgress(0);
    setIsVisible(true);
    setIsNavigating(true);

    // Animate to 30% quickly
    requestAnimationFrame(() => {
      setProgress(30);
    });

    // Slow crawl from 30% to 90%
    let currentProgress = 30;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 8;
      if (currentProgress >= 90) {
        currentProgress = 90;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      setProgress(currentProgress);
    }, 300);
  }, [clearTimers]);

  // Complete the loading animation
  const completeLoading = useCallback(() => {
    clearTimers();
    setProgress(100);
    setIsNavigating(false);

    // Hide after completion animation
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 200);
  }, [clearTimers]);

  // Listen for clicks on internal links to start loading immediately
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip external links, hash links, and special protocols
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank' ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // Skip if already navigating or if it's the same path
      const linkPath = href.split('?')[0].split('#')[0];
      const currentPath = pathname.split('?')[0].split('#')[0];
      if (isNavigating || linkPath === currentPath) {
        return;
      }

      // Start loading immediately on link click
      startLoading();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname, isNavigating, startLoading]);

  // Complete loading when pathname actually changes
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      // Navigation completed - finish the animation
      completeLoading();
    }
  }, [pathname, completeLoading]);

  // Safety timeout - complete after 10 seconds if navigation seems stuck
  useEffect(() => {
    if (isNavigating) {
      const safetyTimeout = setTimeout(() => {
        if (isNavigating) {
          completeLoading();
        }
      }, 10000);
      return () => clearTimeout(safetyTimeout);
    }
  }, [isNavigating, completeLoading]);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[4px] pointer-events-none"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
    >
      <div
        className="h-full"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--loading-bar-from, #d4a060) 0%, var(--loading-bar-to, #c08a40) 100%)',
          boxShadow: '0 0 10px var(--accent-glow), 0 0 5px var(--accent-glow-subtle)',
          transition: progress === 0
            ? 'none'
            : progress <= 30
              ? 'width 100ms ease-out'
              : progress === 100
                ? 'width 150ms ease-out'
                : 'width 500ms ease-out',
        }}
      />
    </div>
  );
}
