'use client';

// TrackCard - displays a track with play button and version carousel

import { useState } from 'react';
import { Track, Song, Album, formatDuration } from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { AddToPlaylistModal } from '@/components/Playlists/AddToPlaylistModal';
import VersionCarousel from './VersionCarousel';
import { useShare } from '@/hooks/useShare';
import ShareModal from '@/components/ShareModal';
import { getRecordingBadge } from '@/lib/lineageUtils';

interface TrackCardProps {
  track: Track;
  index?: number;
  album?: Album;
}

export default function TrackCard({ track, index, album }: TrackCardProps) {
  const { currentSong, isPlaying, playSong, togglePlay, playAlbum } = usePlayer();
  const { addToQueue, trackToItem } = useQueue();
  const [isExpanded, setIsExpanded] = useState(false);
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
    shareableTrack,
  } = useShare();

  // Track which version is selected (default to first)
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Selected song based on carousel selection
  const selectedSong = track.songs[selectedIndex] || track.songs[0];
  const isCurrentTrack = track.songs.some(s => s.id === currentSong?.id);
  const isSelectedPlaying = currentSong?.id === selectedSong?.id;
  const hasMultipleVersions = track.songCount > 1;

  // Check if the selected song is streamable
  const isUnavailable = selectedSong?.isStreamable === false;

  // Get recording type badge for the selected song
  const recordingBadge = selectedSong
    ? getRecordingBadge(selectedSong.lineage, selectedSong.recordingType)
    : null;

  const handlePlayClick = () => {
    if (!selectedSong || isUnavailable) return;

    // If this track is from an album and we have album context, load the album
    if (album && index !== undefined) {
      // Load the album starting at this track
      playAlbum(album, index - 1); // index is 1-based, playAlbum expects 0-based
    } else if (isSelectedPlaying) {
      togglePlay();
    } else {
      playSong(selectedSong);
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSong && !isUnavailable) {
      addToQueue(trackToItem(selectedSong));
    }
  };

  const handleArchiveLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSong?.archiveDetailUrl) {
      window.open(selectedSong.archiveDetailUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLicenseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSong?.archiveLicenseUrl) {
      window.open(selectedSong.archiveLicenseUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVersionSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleVersionPlay = (song: Song) => {
    if (song.isStreamable === false) return;
    if (currentSong?.id === song.id && isPlaying) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
        className={`
          rounded-lg overflow-hidden transition-all
          ${isCurrentTrack
            ? 'bg-[#2d2a26] border-l-2 border-[#d4a060]'
            : 'hover:bg-[#2d2a26] border-l-2 border-transparent'
          }
          ${isExpanded ? 'bg-[#2d2a26]' : ''}
          ${isUnavailable ? 'opacity-60' : ''}
        `}
      >
        {/* Main track row */}
        <div
          className="grid grid-cols-[24px_1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-2 cursor-pointer group"
          onClick={toggleExpanded}
        >
          {/* Track number, play icon, or lock icon for unavailable */}
          <div className="w-6 flex items-center justify-center">
            {isUnavailable ? (
              /* Lock icon for unavailable tracks */
              <svg className="w-4 h-4 text-[#8a8478]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth={2} />
                <path d="M8 11V7a4 4 0 018 0v4" strokeWidth={2} strokeLinecap="round" />
              </svg>
            ) : isSelectedPlaying && isPlaying ? (
              /* Animated EQ bars for playing track */
              <span className="jamify-eq-bars">
                <span /><span /><span />
              </span>
            ) : (
              <>
                <span className={`text-sm group-hover:hidden ${isCurrentTrack ? 'text-[#d4a060]' : 'text-[#8a8478]'}`}>
                  {index !== undefined ? index : ''}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayClick();
                  }}
                  className="hidden group-hover:block text-white focus:outline-none"
                  aria-label={isSelectedPlaying && isPlaying ? 'Pause' : 'Play'}
                >
                  {isSelectedPlaying && isPlaying ? (
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
              </>
            )}
          </div>

          {/* Track info */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-base truncate ${isUnavailable ? 'text-[#8a8478]' : isCurrentTrack ? 'text-[#d4a060]' : 'text-white'}`}>
                {track.title}
              </span>
              {/* Recording type badge */}
              {recordingBadge && (
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full"
                  style={{ backgroundColor: recordingBadge.bgColor, color: recordingBadge.textColor }}
                  title={`${recordingBadge.text} Recording`}
                >
                  {recordingBadge.text}
                </span>
              )}
              {/* CC license badge */}
              {selectedSong?.archiveLicenseUrl && (
                <button
                  onClick={handleLicenseClick}
                  className="flex-shrink-0 px-1 py-0.5 text-[9px] font-bold rounded border border-[#8a8478]/40 text-[#8a8478] hover:text-white hover:border-white transition-colors"
                  title="Creative Commons Licensed"
                >
                  CC
                </button>
              )}
              {/* Unavailable pill */}
              {isUnavailable && (
                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] rounded bg-[#3a3632] text-[#8a8478]">
                  Unavailable
                </span>
              )}
            </div>
            {hasMultipleVersions && (
              <span className="text-xs text-[#8a8478] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#d4a060] rounded-full" />
                {track.songCount} versions available
              </span>
            )}
          </div>

          {/* Unavailable: show Archive.org link instead of action buttons */}
          {isUnavailable ? (
            <>
              {/* Archive.org link button */}
              {selectedSong?.archiveDetailUrl && (
                <button
                  onClick={handleArchiveLink}
                  className="col-span-3 flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border border-[#d4a060] text-[#d4a060] hover:bg-[#d4a060]/10 transition-colors"
                  aria-label="Stream on Archive.org"
                >
                  {/* External link icon */}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Archive.org
                </button>
              )}
              {!selectedSong?.archiveDetailUrl && (
                <span className="col-span-3" />
              )}
            </>
          ) : (
            <>
              {/* Add to playlist */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPlaylistModal(true);
                }}
                className="text-[#8a8478] hover:text-white opacity-0 group-hover:opacity-100 transition-all focus:outline-none focus:opacity-100"
                aria-label={`Add ${track.title} to playlist`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Add to queue */}
              <button
                onClick={handleAddToQueue}
                className="text-[#8a8478] hover:text-white opacity-0 group-hover:opacity-100 transition-all focus:outline-none focus:opacity-100"
                aria-label={`Add ${track.title} to queue`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Share */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openShareModal(shareableTrack(track));
                }}
                className="text-[#8a8478] hover:text-white opacity-0 group-hover:opacity-100 transition-all focus:outline-none focus:opacity-100"
                aria-label={`Share ${track.title}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </>
          )}

          {/* Duration and expand chevron */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#8a8478]">
              {formatDuration(selectedSong?.duration || track.totalDuration)}
            </span>
            {/* Always show expand chevron to indicate expandability */}
            <div
              className={`text-[#8a8478] transition-transform ${isExpanded ? 'rotate-180 text-white' : ''} ${hasMultipleVersions ? '' : 'opacity-0'}`}
              aria-hidden="true"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Versions panel */}
        {isExpanded && (
          <div className="px-4 pb-4 bg-[#252220]">
            {track.songs.length > 0 ? (
              <VersionCarousel
                songs={track.songs}
                selectedIndex={selectedIndex}
                onSelect={handleVersionSelect}
                onPlay={handleVersionPlay}
                onAddToQueue={(song: Song) => addToQueue(trackToItem(song))}
                currentSongId={currentSong?.id}
                isPlaying={isPlaying}
                isInQueue={() => false}
              />
            ) : (
              /* Empty State - No Live Recordings for this track */
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <svg className="w-16 h-16 text-[#3a3632] mb-4" viewBox="0 0 64 64" fill="none">
                  {/* Microphone with X */}
                  <path
                    d="M32 8C26.477 8 22 12.477 22 18V28C22 33.523 26.477 38 32 38C37.523 38 42 33.523 42 28V18C42 12.477 37.523 8 32 8Z"
                    fill="currentColor"
                    opacity="0.6"
                  />
                  <rect x="30" y="38" width="4" height="12" fill="currentColor" opacity="0.4" />
                  <rect x="24" y="50" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
                  {/* X overlay */}
                  <path d="M20 16L44 40M44 16L20 40" stroke="#3a3632" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <p className="text-sm text-[#8a8478] text-center">
                  No live recordings found for this track
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add to Playlist Modal */}
        <AddToPlaylistModal
          isOpen={showPlaylistModal}
          onClose={() => setShowPlaylistModal(false)}
          song={selectedSong}
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
