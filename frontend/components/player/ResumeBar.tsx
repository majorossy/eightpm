'use client';

import { formatDuration } from '@/lib/api';

interface SavedProgress {
  title: string;
  artistName: string;
  position: number;
}

interface ResumeBarProps {
  savedProgress: SavedProgress;
  isMobile: boolean;
  onResume: () => void;
  onDismiss: () => void;
}

export default function ResumeBar({ savedProgress, isMobile, onResume, onDismiss }: ResumeBarProps) {
  return (
    <div
      className={`fixed left-0 right-0 z-[40] ${isMobile ? '' : 'bottom-0'}`}
      style={isMobile ? { bottom: 'calc(50px + env(safe-area-inset-bottom, 0px))' } : undefined}
    >
      <div className={`${isMobile ? 'border-t border-accent/20 bg-surface-card px-3 pt-3' : 'bg-surface-card border-t border-default px-4'}`}>
        <div className={`flex items-center gap-4 ${isMobile ? '' : 'max-w-xl mx-auto h-[90px]'}`}>
          {/* Resume info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-secondary mb-1">Continue where you left off</p>
            <p className="text-sm text-white font-medium truncate">{savedProgress.title}</p>
            <p className="text-xs text-secondary truncate">{savedProgress.artistName} • {formatDuration(Math.floor(savedProgress.position))}</p>
          </div>

          {/* Resume button */}
          <button
            onClick={onResume}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-full transition-colors flex-shrink-0"
          >
            Resume
          </button>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="p-2 text-secondary hover:text-white transition-colors flex-shrink-0"
            aria-label="Dismiss"
            title="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
