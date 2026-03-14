'use client';

import { useState, useEffect } from 'react';
import type { SyncStatus } from '@/lib/types';

export default function SyncStatusIndicator({ syncStatus }: { syncStatus: SyncStatus }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (syncStatus === 'synced') {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
    if (syncStatus === 'syncing' || syncStatus === 'error') {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [syncStatus]);

  if (!visible) return null;

  if (syncStatus === 'syncing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--tertiary)' }} />
        Syncing
      </span>
    );
  }

  if (syncStatus === 'synced') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] animate-fade-in" style={{ color: 'var(--tertiary)' }}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Synced
      </span>
    );
  }

  if (syncStatus === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--secondary)' }}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Sync error
      </span>
    );
  }

  return null;
}
