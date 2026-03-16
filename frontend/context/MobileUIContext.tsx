'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface MobileUIState {
  isSidebarOpen: boolean;
  isMobile: boolean;
  isPlayerExpanded: boolean;
  isPlayerMinimized: boolean;
  isTransitioning: boolean;
  dragOffset: number;
}

interface MobileUIContextType extends MobileUIState {
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  expandPlayer: () => void;
  collapsePlayer: () => void;
  togglePlayer: () => void;
  minimizePlayer: () => void;
  restorePlayer: () => void;
  setDragOffset: (offset: number) => void;
}

const MobileUIContext = createContext<MobileUIContextType | undefined>(undefined);

const MOBILE_BREAKPOINT = 767;

export function MobileUIProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('8pm_player_minimized') === 'true'
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const isProgrammaticBackRef = useRef(false);
  const playerOverlayIdRef = useRef<string | null>(null);

  // Handle hydration and media query
  useEffect(() => {
    setIsHydrated(true);

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      // Auto-close sidebar when switching to desktop
      if (!e.matches) {
        setIsSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Auto-close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // Also collapse player on route change
    if (isMobile && isPlayerExpanded) {
      setIsPlayerExpanded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const expandPlayer = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsPlayerExpanded(true);
    // Push history state so Android back button collapses instead of navigating away
    if (isMobile) {
      const id = `player-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      playerOverlayIdRef.current = id;
      window.history.pushState({ overlay: id, playerExpanded: true }, '');
    }
    // Reset transition state after animation completes (300ms)
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, isMobile]);

  const collapsePlayer = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsPlayerExpanded(false);
    // Pop the history entry we pushed when expanding
    if (isMobile && playerOverlayIdRef.current) {
      const id = playerOverlayIdRef.current;
      playerOverlayIdRef.current = null;
      if (window.history.state?.overlay === id) {
        isProgrammaticBackRef.current = true;
        window.history.back();
      }
    }
    // Reset transition state after animation completes (300ms)
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, isMobile]);

  const togglePlayer = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsPlayerExpanded((prev) => !prev);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning]);

  const minimizePlayer = useCallback(() => {
    setIsPlayerMinimized(true);
    localStorage.setItem('8pm_player_minimized', 'true');
  }, []);

  const restorePlayer = useCallback(() => {
    setIsPlayerMinimized(false);
    localStorage.setItem('8pm_player_minimized', 'false');
  }, []);

  // Handle Android back button: collapse player instead of navigating away
  useEffect(() => {
    if (!isMobile) return;

    const handlePopState = () => {
      if (isProgrammaticBackRef.current) {
        isProgrammaticBackRef.current = false;
        return;
      }

      if (isPlayerExpanded) {
        // If state still has our overlay ID, a higher overlay was popped — don't collapse
        if (window.history.state?.overlay === playerOverlayIdRef.current) {
          return;
        }
        // Our entry was popped — collapse
        playerOverlayIdRef.current = null;
        setIsTransitioning(true);
        setIsPlayerExpanded(false);
        setTimeout(() => setIsTransitioning(false), 300);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobile, isPlayerExpanded]);

  // SSR: default to desktop (isMobile = false) until hydrated
  const resolvedIsMobile = isHydrated ? isMobile : false;

  const value = useMemo<MobileUIContextType>(() => ({
    isSidebarOpen,
    isMobile: resolvedIsMobile,
    isPlayerExpanded,
    isPlayerMinimized,
    isTransitioning,
    dragOffset,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    expandPlayer,
    collapsePlayer,
    togglePlayer,
    minimizePlayer,
    restorePlayer,
    setDragOffset,
  }), [
    isSidebarOpen,
    resolvedIsMobile,
    isPlayerExpanded,
    isPlayerMinimized,
    isTransitioning,
    dragOffset,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    expandPlayer,
    collapsePlayer,
    togglePlayer,
    minimizePlayer,
    restorePlayer,
    setDragOffset,
  ]);

  return (
    <MobileUIContext.Provider value={value}>
      {children}
    </MobileUIContext.Provider>
  );
}

export function useMobileUI() {
  const context = useContext(MobileUIContext);
  if (context === undefined) {
    throw new Error('useMobileUI must be used within a MobileUIProvider');
  }
  return context;
}
