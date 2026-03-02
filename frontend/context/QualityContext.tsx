'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AudioQuality, Song } from '@/lib/types';
import { sanitizeStreamUrl } from '@/lib/urlUtils';
import { trackQualityChange } from '@/lib/analytics';

interface NetworkInformation {
  effectiveType?: string;
  saveData?: boolean;
}

interface QualityContextType {
  preferredQuality: AudioQuality;
  setPreferredQuality: (quality: AudioQuality) => void;
  getStreamUrl: (song: Song) => string;
  getQualityLabel: (quality: AudioQuality) => string;
  getLowerQualityUrl: (song: Song, currentUrl: string) => string | null;
}

const QualityContext = createContext<QualityContextType | null>(null);

const QUALITY_LABELS: Record<AudioQuality, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};


function getDefaultQuality(): AudioQuality {
  if (typeof navigator === 'undefined') return 'high';
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!conn) return 'high';
  if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
    return 'low';
  }
  if (conn.effectiveType === '3g') {
    return 'medium';
  }
  return 'high';
}

export function QualityProvider({ children }: { children: React.ReactNode }) {
  const [preferredQuality, setPreferredQualityState] = useState<AudioQuality>(getDefaultQuality);
  const [isClient, setIsClient] = useState(false);

  // Initialize from localStorage on client mount
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('audioQuality');
      if (saved && ['high', 'medium', 'low'].includes(saved)) {
        setPreferredQualityState(saved as AudioQuality);
      }
    }
  }, []);

  const preferredQualityRef = useRef(preferredQuality);
  useEffect(() => { preferredQualityRef.current = preferredQuality; }, [preferredQuality]);

  const setPreferredQuality = useCallback((quality: AudioQuality) => {
    const previousQuality = preferredQualityRef.current;
    setPreferredQualityState(quality);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioQuality', quality);
    }
    trackQualityChange(quality, previousQuality);
  }, []);

  const getStreamUrl = useCallback((song: Song): string => {
    if (!song.qualityUrls) {
      return sanitizeStreamUrl(song.streamUrl);
    }

    // Try preferred quality first, then respect defaultQuality if set
    const preferred = song.qualityUrls[preferredQuality];
    const defaultQ = song.defaultQuality ? song.qualityUrls[song.defaultQuality] : undefined;

    const url = preferred
      || defaultQ
      || song.qualityUrls.high
      || song.qualityUrls.medium
      || song.qualityUrls.low
      || song.streamUrl;

    return sanitizeStreamUrl(url);
  }, [preferredQuality]);

  const getQualityLabel = useCallback((quality: AudioQuality): string => {
    return QUALITY_LABELS[quality];
  }, []);

  const getLowerQualityUrl = useCallback((song: Song, currentUrl: string): string | null => {
    if (!song.qualityUrls) return null;

    const { high, medium, low } = song.qualityUrls;
    const fallback = song.streamUrl;

    // Sanitize all URLs for comparison and return
    const sHigh = high ? sanitizeStreamUrl(high) : undefined;
    const sMedium = medium ? sanitizeStreamUrl(medium) : undefined;
    const sLow = low ? sanitizeStreamUrl(low) : undefined;
    const sFallback = sanitizeStreamUrl(fallback);

    // Determine which quality the current URL matches and return next lower
    if (currentUrl === sHigh) {
      return sMedium || sLow || (sFallback !== sHigh ? sFallback : null);
    }
    if (currentUrl === sMedium) {
      return sLow || (sFallback !== sMedium ? sFallback : null);
    }
    if (currentUrl === sLow) {
      return sFallback !== sLow ? sFallback : null;
    }

    // currentUrl doesn't match any known quality - no fallback available
    return null;
  }, []);

  return (
    <QualityContext.Provider value={{
      preferredQuality,
      setPreferredQuality,
      getStreamUrl,
      getQualityLabel,
      getLowerQualityUrl,
    }}>
      {children}
    </QualityContext.Provider>
  );
}

export function useQuality() {
  const context = useContext(QualityContext);
  if (!context) {
    throw new Error('useQuality must be used within a QualityProvider');
  }
  return context;
}
