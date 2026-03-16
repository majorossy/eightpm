'use client';

import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    let reconnectTimer: ReturnType<typeof setTimeout>;

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      // Hide reconnected message after 3 seconds
      reconnectTimer = setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(reconnectTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] flex items-center justify-center py-2 px-4 text-sm font-medium transition-colors ${
        isOffline
          ? 'bg-red-900/90 text-red-100'
          : 'bg-green-900/90 text-green-100'
      }`}
    >
      {isOffline ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          You&apos;re offline. Some features may be limited.
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Back online!
        </span>
      )}
    </div>
  );
}
