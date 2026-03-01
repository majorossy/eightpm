'use client';

import { useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { useHaptic } from '@/hooks/useHaptic';

interface DownloadButtonProps {
  archiveUrl?: string;
  title: string;
  artistName?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function DownloadButton({
  archiveUrl,
  title,
  artistName,
  className = '',
  size = 'sm',
}: DownloadButtonProps) {
  const { showSuccess, showError } = useToast();
  const { vibrate, BUTTON_PRESS } = useHaptic();

  const handleDownload = useCallback(() => {
    vibrate(BUTTON_PRESS);

    if (!archiveUrl) {
      showError('Download not available');
      return;
    }

    // Open Archive.org link in new tab
    window.open(archiveUrl, '_blank', 'noopener,noreferrer');
    showSuccess('Opening download on Archive.org');
  }, [archiveUrl, vibrate, BUTTON_PRESS, showSuccess, showError]);

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={handleDownload}
      disabled={!archiveUrl}
      className={`text-secondary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      aria-label="Download from Archive.org"
      title="Download from Archive.org"
    >
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    </button>
  );
}
