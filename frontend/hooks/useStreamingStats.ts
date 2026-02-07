import { useState, useEffect, useCallback, useRef } from 'react';

export interface StreamingStats {
  bufferedPercent: number;      // 0-100, end of last buffered range / duration
  bufferedAhead: number;        // seconds buffered ahead of currentTime
  networkType: string | null;   // "4g", "3g", "2g", "slow-2g"
  downlinkMbps: number | null;  // estimated Mbps
  isLoading: boolean;           // audio.networkState === NETWORK_LOADING
}

const EMPTY_STATS: StreamingStats = {
  bufferedPercent: 0,
  bufferedAhead: 0,
  networkType: null,
  downlinkMbps: null,
  isLoading: false,
};

interface NetworkInformation extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

function getConnection(): NetworkInformation | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as { connection?: NetworkInformation }).connection ?? null;
}

export function useStreamingStats(
  audioRef: React.MutableRefObject<HTMLAudioElement | null>
): StreamingStats {
  const [stats, setStats] = useState<StreamingStats>(EMPTY_STATS);
  const rafRef = useRef<number | null>(null);

  const computeBufferStats = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || audio.duration === Infinity) {
      return { bufferedPercent: 0, bufferedAhead: 0, isLoading: false };
    }

    const { buffered, currentTime, duration, networkState } = audio;
    let bufferedEnd = 0;

    // Find the buffered range that contains or is ahead of currentTime
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && buffered.end(i) > bufferedEnd) {
        bufferedEnd = buffered.end(i);
      }
    }
    // Also check ranges entirely ahead of currentTime
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.end(i) > bufferedEnd) {
        bufferedEnd = buffered.end(i);
      }
    }

    return {
      bufferedPercent: duration > 0 ? Math.min(100, (bufferedEnd / duration) * 100) : 0,
      bufferedAhead: Math.max(0, bufferedEnd - currentTime),
      isLoading: networkState === HTMLMediaElement.NETWORK_LOADING,
    };
  }, [audioRef]);

  // Poll buffer state at ~4Hz via requestAnimationFrame throttle
  useEffect(() => {
    let lastUpdate = 0;
    const INTERVAL = 250; // ms between updates

    const tick = () => {
      const now = performance.now();
      if (now - lastUpdate >= INTERVAL) {
        lastUpdate = now;
        const { bufferedPercent, bufferedAhead, isLoading } = computeBufferStats();
        setStats(prev => {
          // Skip update if nothing meaningful changed
          if (
            Math.abs(prev.bufferedPercent - bufferedPercent) < 0.5 &&
            Math.abs(prev.bufferedAhead - bufferedAhead) < 0.1 &&
            prev.isLoading === isLoading
          ) {
            return prev;
          }
          return { ...prev, bufferedPercent, bufferedAhead, isLoading };
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [computeBufferStats]);

  // Listen for navigator.connection changes
  useEffect(() => {
    const connection = getConnection();

    const updateNetworkInfo = () => {
      const conn = getConnection();
      setStats(prev => ({
        ...prev,
        networkType: conn?.effectiveType ?? null,
        downlinkMbps: conn?.downlink ?? null,
      }));
    };

    // Initial read
    updateNetworkInfo();

    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  return stats;
}
