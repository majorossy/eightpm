'use client';

interface DesktopMinimizedTagProps {
  currentSong: { title: string; artistName: string };
  isPlaying: boolean;
  reducedMotion: boolean;
  onRestore: () => void;
  onTogglePlay: () => void;
}

export default function DesktopMinimizedTag({
  currentSong,
  isPlaying,
  reducedMotion,
  onRestore,
  onTogglePlay,
}: DesktopMinimizedTagProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[40] flex justify-end pr-4 pointer-events-none"
      style={{
        animation: reducedMotion ? 'none' : 'minimizedTagSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      }}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-t-xl bg-surface-elevated border border-b-0 border-accent/30 hover:border-accent shadow-lg shadow-black/40 transition-colors">
        {/* Restore area — click to expand */}
        <button
          onClick={onRestore}
          className="flex items-center gap-3 pl-4 pr-2 py-2"
          aria-label="Restore player"
        >
          <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-xs text-white truncate max-w-[200px]">
            {currentSong.title}
          </span>
          <span className="text-xs text-tertiary">&middot;</span>
          <span className="text-xs text-secondary truncate max-w-[120px]">
            {currentSong.artistName}
          </span>
        </button>

        {/* Play/Pause — separate click target */}
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
          className="flex items-center justify-center w-8 h-8 mr-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
