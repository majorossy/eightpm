'use client';

import { useEffect, useRef } from 'react';
import { useMobileUI } from '@/context/MobileUIContext';

/**
 * On mobile, intercepts the Android back gesture (history.back) to close an
 * overlay instead of navigating away.  Supports stacking — if multiple
 * overlays each call this hook, pressing back closes only the top-most one.
 *
 * No-op on desktop.
 */
export function useBackToClose(isOpen: boolean, onClose: () => void) {
  const { isMobile } = useMobileUI();
  const overlayIdRef = useRef<string | null>(null);
  const isProgrammaticBackRef = useRef(false);

  useEffect(() => {
    if (!isMobile) return;

    // Overlay just opened → push a history entry
    if (isOpen && !overlayIdRef.current) {
      const id = `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      overlayIdRef.current = id;
      window.history.pushState({ overlay: id }, '');
    }

    // Overlay just closed programmatically (X / backdrop / Escape) → pop our entry
    if (!isOpen && overlayIdRef.current) {
      const id = overlayIdRef.current;
      overlayIdRef.current = null;

      // Only pop if our entry is still the current one
      if (window.history.state?.overlay === id) {
        isProgrammaticBackRef.current = true;
        window.history.back();
      }
    }
  }, [isMobile, isOpen]);

  // Listen for popstate (user pressed back)
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const handlePopState = () => {
      // If we triggered the back() ourselves, ignore
      if (isProgrammaticBackRef.current) {
        isProgrammaticBackRef.current = false;
        return;
      }

      // If the current state still has our overlay ID, a *higher* overlay
      // was popped — our entry is still on the stack, so don't close.
      if (window.history.state?.overlay === overlayIdRef.current) {
        return;
      }

      // Our entry was popped → close
      overlayIdRef.current = null;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobile, isOpen, onClose]);

  // Cleanup: if component unmounts while open, pop the stale entry
  useEffect(() => {
    return () => {
      if (overlayIdRef.current && isMobile) {
        const id = overlayIdRef.current;
        overlayIdRef.current = null;
        if (window.history.state?.overlay === id) {
          isProgrammaticBackRef.current = true;
          window.history.back();
        }
      }
    };
  }, [isMobile]);
}
