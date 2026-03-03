'use client';

// RecordingRowActions — inline strip of color-coded text action buttons
// (play, play-next, queue, swap) plus icon-only favorite & playlist.
// All hooks live here so RecordingRow stays hook-free.

import { useState, useCallback } from 'react';
import type { Song } from '@/lib/types';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/hooks/useToast';
import { useHaptic } from '@/hooks/useHaptic';
import { AddToPlaylistModal } from '@/components/Playlists/AddToPlaylistModal';
import type { RecordingRowSize } from '../molecules/RecordingRow';

// ─── Types ────────────────────────────────────────────────────────────

export type RecordingAction = 'play' | 'play-next' | 'queue' | 'swap' | 'favorite' | 'playlist';

interface RecordingRowActionsProps {
  song: Song;
  actions: RecordingAction[];
  size?: RecordingRowSize;
  isCurrentlyPlaying?: boolean;
  onSwap?: (e: React.MouseEvent) => void;
  onPlay?: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
}

// ─── Size Config (for icon-only buttons: favorite, playlist) ─────────

const ACTION_SIZE_CONFIG: Record<RecordingRowSize, {
  icon: string; gap: string; padding: string;
}> = {
  sm: { icon: 'w-3.5 h-3.5', gap: 'gap-1',   padding: 'p-0.5' },
  md: { icon: 'w-4 h-4',     gap: 'gap-1.5', padding: 'p-1'   },
  lg: { icon: 'w-[18px] h-[18px]', gap: 'gap-2', padding: 'p-1' },
  xl: { icon: 'w-5 h-5',     gap: 'gap-2',   padding: 'p-1.5' },
};

// ─── Shared action button style ──────────────────────────────────────

const btnBase: React.CSSProperties = {
  fontFamily: 'var(--font-jb-mono), monospace',
  fontSize: '9px',
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: '5px',
  letterSpacing: '0.04em',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  cursor: 'pointer',
  lineHeight: 1,
};

// ─── Per-button color specs ──────────────────────────────────────────

const BTN_STYLES = {
  play: {
    color: '#e8908e',
    background: 'rgba(196,112,110,0.15)',
    border: '1px solid rgba(196,112,110,0.25)',
    hoverBg: 'rgba(196,112,110,0.25)',
  },
  'play-next': {
    color: '#d8a878',
    background: 'linear-gradient(135deg, rgba(196,112,110,0.12), rgba(200,168,72,0.12))',
    border: '1px solid rgba(196,112,110,0.2)',
    hoverBg: 'linear-gradient(135deg, rgba(196,112,110,0.22), rgba(200,168,72,0.22))',
  },
  queue: {
    color: '#e0c868',
    background: 'rgba(200,168,72,0.14)',
    border: '1px solid rgba(200,168,72,0.25)',
    hoverBg: 'rgba(200,168,72,0.24)',
  },
  swap: {
    color: '#c0a8e0',
    background: 'rgba(160,130,200,0.14)',
    border: '1px solid rgba(160,130,200,0.25)',
    hoverBg: 'rgba(160,130,200,0.24)',
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────

export default function RecordingRowActions({
  song,
  actions,
  size = 'md',
  isCurrentlyPlaying = false,
  onSwap,
  onPlay,
  onAddToQueue,
}: RecordingRowActionsProps) {
  const { playSong, togglePlay } = usePlayer();
  const { addToQueue, playNext, trackToItem } = useQueue();
  const { isInWishlist, addToWishlist, removeFromWishlist, wishlist } = useWishlist();
  const toast = useToast();
  const haptic = useHaptic();

  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);

  const cfg = ACTION_SIZE_CONFIG[size];
  const iconBtnClass = `${cfg.padding} transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-accent rounded`;
  const defaultColor = 'var(--text-secondary)';

  // ─── Handlers ─────────────────────────────────────────────────────

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.vibrate(haptic.BUTTON_PRESS);
    if (isCurrentlyPlaying) {
      togglePlay();
    } else if (onPlay) {
      onPlay(song);
    } else {
      playSong(song);
    }
  }, [song, isCurrentlyPlaying, onPlay, playSong, togglePlay, haptic]);

  const handlePlayNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.vibrate(haptic.BUTTON_PRESS);
    if (onAddToQueue) {
      onAddToQueue(song);
    } else {
      playNext(trackToItem(song));
    }
    toast.showSuccess('Playing next');
  }, [song, onAddToQueue, playNext, trackToItem, haptic, toast]);

  const handleQueue = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.vibrate(haptic.BUTTON_PRESS);
    addToQueue(trackToItem(song));
    toast.showSuccess('Added to queue');
  }, [song, addToQueue, trackToItem, haptic, toast]);

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.vibrate(haptic.BUTTON_PRESS);
    if (isInWishlist(song.id)) {
      const item = wishlist.items.find(i => i.song.id === song.id);
      if (item) removeFromWishlist(item.id);
      toast.showInfo('Removed from favorites');
    } else {
      addToWishlist(song);
      toast.showSuccess('Added to favorites');
    }
  }, [song, isInWishlist, wishlist.items, addToWishlist, removeFromWishlist, haptic, toast]);

  const handlePlaylist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.vibrate(haptic.BUTTON_PRESS);
    setPlaylistModalOpen(true);
  }, [haptic]);

  // ─── Action button helper ───────────────────────────────────────

  const renderActionBtn = (
    key: keyof typeof BTN_STYLES,
    label: string,
    onClick: (e: React.MouseEvent) => void,
    ariaLabel: string,
  ) => {
    const s = BTN_STYLES[key];
    return (
      <button
        key={key}
        onClick={onClick}
        style={{ ...btnBase, color: s.color, background: s.background, border: s.border }}
        onMouseEnter={(e) => { e.currentTarget.style.background = s.hoverBg; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = s.background; }}
        aria-label={ariaLabel}
      >
        {label}
      </button>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────

  const isFavorited = isInWishlist(song.id);

  return (
    <>
      <div className={`flex items-center ${cfg.gap} flex-shrink-0`}>
        {actions.map((action) => {
          switch (action) {
            case 'play':
              return renderActionBtn(
                'play',
                isCurrentlyPlaying ? 'pause' : 'play',
                handlePlay,
                isCurrentlyPlaying ? 'Pause' : `Play ${song.title}`,
              );

            case 'play-next':
              return renderActionBtn(
                'play-next',
                'play next',
                handlePlayNext,
                `Play ${song.title} next`,
              );

            case 'queue':
              return renderActionBtn(
                'queue',
                'queue',
                handleQueue,
                `Add ${song.title} to queue`,
              );

            case 'swap':
              if (!onSwap) return null;
              return renderActionBtn(
                'swap',
                'swap',
                (e) => { e.stopPropagation(); onSwap(e); },
                'Swap version',
              );

            case 'favorite':
              return (
                <button
                  key="favorite"
                  onClick={handleFavorite}
                  className={`${iconBtnClass} rounded-full`}
                  style={{
                    color: isFavorited ? 'var(--action-play)' : defaultColor,
                    border: isFavorited
                      ? '1px solid color-mix(in srgb, var(--action-play) 45%, transparent)'
                      : '1px solid color-mix(in srgb, var(--text-secondary) 40%, transparent)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--action-play)';
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--action-play) 65%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isFavorited ? 'var(--action-play)' : defaultColor;
                    e.currentTarget.style.borderColor = isFavorited
                      ? 'color-mix(in srgb, var(--action-play) 45%, transparent)'
                      : 'color-mix(in srgb, var(--text-secondary) 40%, transparent)';
                  }}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorited ? (
                    <svg className={cfg.icon} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <svg className={cfg.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
              );

            case 'playlist':
              return (
                <button
                  key="playlist"
                  onClick={handlePlaylist}
                  style={{
                    ...btnBase,
                    color: defaultColor,
                    border: '1px solid color-mix(in srgb, var(--text-secondary) 25%, transparent)',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'color-mix(in srgb, var(--text-secondary) 10%, transparent)';
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--text-secondary) 40%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = defaultColor;
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--text-secondary) 25%, transparent)';
                  }}
                  aria-label="Add to playlist"
                >
                  playlist
                </button>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Playlist modal — rendered outside button strip */}
      {actions.includes('playlist') && (
        <AddToPlaylistModal
          isOpen={playlistModalOpen}
          onClose={() => setPlaylistModalOpen(false)}
          song={song}
        />
      )}
    </>
  );
}
