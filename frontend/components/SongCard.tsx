'use client';

// SongCard - displays a song with play and add-to-queue buttons

import { useState } from 'react';
import { Song, formatDuration } from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useWishlist } from '@/context/WishlistContext';
import { AddToPlaylistModal } from '@/components/Playlists/AddToPlaylistModal';
import { useShare } from '@/hooks/useShare';
import ShareModal from '@/components/ShareModal';

interface SongCardProps {
  song: Song;
  index?: number;
}

export default function SongCard({ song, index }: SongCardProps) {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const { addToQueue, trackToItem } = useQueue();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const {
    showShareModal,
    shareUrl,
    shareTitle,
    copiedToClipboard,
    openShareModal,
    closeShareModal,
    copyToClipboard,
    nativeShare,
    shareableSong,
  } = useShare();

  const isCurrentSong = currentSong?.id === song.id;
  const inFavorites = isInWishlist(song.id);

  const handlePlayClick = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(trackToItem(song));
  };

  const handleAddToFavorites = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToWishlist(song);
  };

  return (
    <div
      className={`
        group grid grid-cols-[16px_1fr_auto_auto_auto_auto_auto] gap-4 items-center px-4 py-2 rounded-md transition-all
        ${isCurrentSong ? 'bg-[var(--bg-elevated)]' : 'hover:bg-[var(--bg-elevated)]'}
      `}
    >
        {/* Index or play icon */}
        <div className="w-4 flex items-center justify-center">
          <span className={`text-sm group-hover:hidden ${isCurrentSong ? 'text-[var(--neon-pink)]' : 'text-[var(--text-dim)]'}`}>
            {isCurrentSong && isPlaying ? (
              <svg className="w-4 h-4 text-[var(--neon-pink)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            ) : (
              index !== undefined ? String(index).padStart(2, '0') : ''
            )}
          </span>
          <button
            onClick={handlePlayClick}
            className="hidden group-hover:block text-[var(--text)]"
            aria-label={isCurrentSong && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
          >
            {isCurrentSong && isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Song info */}
        <div className="flex flex-col min-w-0">
          <p className={`text-base truncate ${isCurrentSong ? 'text-[var(--neon-pink)]' : 'text-[var(--text)]'}`}>
            {song.title}
          </p>
          <p className="text-sm text-[var(--text-dim)] truncate">
            {song.artistName}
          </p>
        </div>

        {/* Duration */}
        <span className="text-sm text-[var(--text-dim)]">
          {formatDuration(song.duration)}
        </span>

        {/* Favorite button */}
        <button
          onClick={handleAddToFavorites}
          disabled={inFavorites}
          className={`transition-colors opacity-0 group-hover:opacity-100 ${
            inFavorites ? 'text-[var(--neon-pink)] opacity-100' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
          aria-label={inFavorites ? `${song.title} is in favorites` : `Add ${song.title} to favorites`}
          aria-pressed={inFavorites}
        >
          <svg
            className="w-5 h-5"
            fill={inFavorites ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Add to playlist */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPlaylistModal(true);
          }}
          className="transition-colors opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-[var(--text)]"
          aria-label={`Add ${song.title} to playlist`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        {/* Add to queue */}
        <button
          onClick={handleAddToQueue}
          className="transition-colors opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-[var(--text)]"
          aria-label={`Add ${song.title} to queue`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Share */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openShareModal(shareableSong(song));
          }}
          className="transition-colors opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-[var(--text)]"
          aria-label={`Share ${song.title}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>

        {/* Add to Playlist Modal */}
        <AddToPlaylistModal
          isOpen={showPlaylistModal}
          onClose={() => setShowPlaylistModal(false)}
          song={song}
        />

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={closeShareModal}
          url={shareUrl}
          title={shareTitle}
          onCopy={copyToClipboard}
          onNativeShare={nativeShare}
          copiedToClipboard={copiedToClipboard}
        />
      </div>
    );
}
