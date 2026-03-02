'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackPWAInstallPrompt, trackPWAInstall, trackPWAInstallDismissed } from '@/lib/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface UsePWAInstallReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  install: () => Promise<boolean>;
  dismiss: () => void;
  wasDismissed: boolean;
}

const DISMISS_STORAGE_KEY = 'pwa_install_dismissed';
const DISMISS_DURATION_DAYS = 7;

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [wasDismissed, setWasDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

      if (isStandalone) {
        setIsInstalled(true);
        return;
      }

      // Check if iOS
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
      setIsIOS(isIOSDevice);

      // Check if previously dismissed
      const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedAt) {
        const dismissDate = new Date(dismissedAt);
        const daysSinceDismiss = (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < DISMISS_DURATION_DAYS) {
          setWasDismissed(true);
        } else {
          localStorage.removeItem(DISMISS_STORAGE_KEY);
        }
      }

      // For iOS, show custom install instructions (no native prompt)
      if (isIOSDevice) {
        setIsInstallable(true);
        return;
      }
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      trackPWAInstallPrompt();
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed event
    const installedHandler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      // For iOS, we can't programmatically trigger install
      // Return false and let the UI show instructions
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        trackPWAInstall();
        return true;
      }
    } catch (error) {
      console.error('Error triggering install prompt:', error);
    }

    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setWasDismissed(true);
    localStorage.setItem(DISMISS_STORAGE_KEY, new Date().toISOString());
    trackPWAInstallDismissed();
  }, []);

  return {
    isInstallable: isInstallable && !wasDismissed && !isInstalled,
    isInstalled,
    isIOS,
    install,
    dismiss,
    wasDismissed,
  };
}
