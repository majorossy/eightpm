'use client';

interface MobileMinimizedTagProps {
  currentSong: { title: string; artistName: string };
  isPlaying: boolean;
  reducedMotion: boolean;
  onRestore: () => void;
  onTogglePlay: () => void;
}

export default function MobileMinimizedTag({
  currentSong,
  isPlaying,
  reducedMotion,
  onRestore,
  onTogglePlay,
}: MobileMinimizedTagProps) {
  return (
    <div
      className="fixed left-0 right-0 z-[40] flex justify-center pointer-events-none"
      style={{
        bottom: 'calc(50px + env(safe-area-inset-bottom, 0px))',
        animation: reducedMotion ? 'none' : 'minimizedTagSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      }}
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-t-lg bg-surface-elevated border border-b-0 border-accent/30 shadow-lg shadow-black/40 transition-colors">
        {/* Restore area */}
        <button
          onClick={onRestore}
          className="flex items-center gap-2 pl-3 pr-1.5 py-1.5"
          aria-label="Restore player"
        >
          <svg className="w-3 h-3 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-[11px] text-white truncate max-w-[140px]">
            {currentSong.title}
          </span>
          <span className="text-[11px] text-tertiary">&middot;</span>
          <span className="text-[11px] text-secondary truncate max-w-[80px]">
            {currentSong.artistName}
          </span>
        </button>

        {/* Play/Pause */}
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
          className="flex items-center justify-center w-7 h-7 mr-1.5 rounded-full text-white/80 hover:text-white transition-colors flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
