'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageEditPopoverProps {
  categoryId: number;
  currentUrl: string;
  type: 'album_artwork' | 'band_image';
  artistName: string;
  albumName?: string;
  isLocked: boolean;
  currentNotes?: string;
  anchorRect: DOMRect;
  onSave: (categoryId: number, url: string, type: 'album_artwork' | 'band_image', notes: string) => Promise<void>;
  onUnlock: (categoryId: number, type: 'album_artwork' | 'band_image') => Promise<void>;
  onClose: () => void;
}

export default function ImageEditPopover({
  categoryId,
  currentUrl,
  type,
  artistName,
  albumName,
  currentNotes,
  isLocked,
  anchorRect,
  onSave,
  onUnlock,
  onClose,
}: ImageEditPopoverProps) {
  const [url, setUrl] = useState(currentUrl || '');
  const [notes, setNotes] = useState(currentNotes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  const handleSave = async () => {
    if (!url.trim()) {
      setError('URL is required');
      return;
    }
    try {
      new URL(url);
    } catch {
      setError('Invalid URL');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave(categoryId, url.trim(), type, notes.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);
    try {
      await onUnlock(categoryId, type);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unlock failed');
    } finally {
      setLoading(false);
    }
  };

  // Position below anchor, or above if it would overflow viewport
  const popoverWidth = 480;
  const popoverHeight = 340; // approximate
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const showAbove = spaceBelow < popoverHeight && anchorRect.top > popoverHeight;
  const topPos = showAbove ? anchorRect.top - popoverHeight - 4 : anchorRect.bottom + 4;
  const leftPos = Math.max(8, Math.min(anchorRect.left, window.innerWidth - popoverWidth - 8));

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[9999] w-[480px] bg-neutral-900 border border-neutral-600 rounded-lg shadow-xl p-4"
      style={{ top: topPos, left: leftPos }}
    >
      <div className="text-xs text-neutral-400 mb-2 truncate" title={albumName || artistName}>
        {type === 'album_artwork' ? 'Album' : 'Band Image'}: <span className="text-neutral-200">{albumName || artistName}</span>
      </div>

      {/* Preview */}
      <div className="w-full h-44 rounded border border-neutral-700 overflow-hidden bg-neutral-950 mb-3 flex items-center justify-center">
        {url && !previewError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={url}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onError={() => setPreviewError(true)}
          />
        ) : url && previewError ? (
          <span className="text-red-400 text-xs">Failed to load image</span>
        ) : (
          <span className="text-neutral-600 text-xs">No URL</span>
        )}
      </div>

      {/* URL input */}
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setPreviewError(false);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
        }}
        placeholder="https://..."
        className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-600 rounded text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
        disabled={loading}
      />

      {/* Attribution / notes */}
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
        }}
        placeholder="Attribution / notes (optional)"
        className="w-full px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-600 rounded text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 mt-1.5"
        disabled={loading}
      />

      {error && (
        <p className="text-red-400 text-[10px] mt-1">{error}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={loading || !url.trim()}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Save & Lock'}
        </button>
        {isLocked && (
          <button
            onClick={handleUnlock}
            disabled={loading}
            className="px-2 py-1.5 text-xs font-medium rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200 disabled:opacity-40 transition-colors"
          >
            Unlock
          </button>
        )}
        <button
          onClick={onClose}
          disabled={loading}
          className="px-2 py-1.5 text-xs font-medium rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>

      <p className="text-[10px] text-neutral-500 mt-1.5">
        Cat ID: {categoryId} &middot; {isLocked ? 'Locked (auto-update blocked)' : 'Unlocked (auto-update active)'}
      </p>
    </div>,
    document.body
  );
}
