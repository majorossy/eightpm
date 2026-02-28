'use client';

import { useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { useHaptic } from '@/hooks/useHaptic';

interface ShareButtonProps {
  title: string;
  artistName?: string;
  url?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function ShareButton({
  title,
  artistName,
  url,
  className = '',
  size = 'sm',
}: ShareButtonProps) {
  const { showSuccess, showError } = useToast();
  const { vibrate, BUTTON_PRESS } = useHaptic();

  const handleShare = useCallback(async () => {
    vibrate(BUTTON_PRESS);

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareTitle = artistName ? `${title} - ${artistName}` : title;
    const shareText = `Listen to ${shareTitle} on 8pm.me`;

    // Try native Web Share API first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return; // Success - native share handled it
      } catch (err) {
        // User cancelled or share failed - fall through to clipboard
        if ((err as Error).name === 'AbortError') {
          return; // User cancelled, don't show toast
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSuccess('Link copied to clipboard');
    } catch {
      showError('Failed to copy link');
    }
  }, [title, artistName, url, vibrate, BUTTON_PRESS, showSuccess, showError]);

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={handleShare}
      className={`text-secondary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded ${className}`}
      aria-label="Share"
      title="Share"
    >
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
    </button>
  );
}
