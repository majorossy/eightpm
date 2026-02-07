'use client';

// Queue drawer - card-stack layout with expand/collapse detail panels (Campfire theme)

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { useMobileUI } from '@/context/MobileUIContext';
import { formatDuration } from '@/lib/api';
import { getRecordingBadge } from '@/lib/lineageUtils';
import { formatLineage } from '@/lib/lineageUtils';
import { AlbumGroup, QueueItem } from '@/lib/queueTypes';
import type { Song } from '@/lib/types';
import SwipeableQueueItem from '@/components/SwipeableQueueItem';
import { VALIDATION_LIMITS } from '@/lib/validation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type RenderEntry =
  | { type: 'group-header'; group: AlbumGroup }
  | { type: 'track'; item: QueueItem; absoluteIndex: number };

export default function Queue() {
  const { isMobile } = useMobileUI();
  const {
    isQueueOpen,
    toggleQueue,
    playFromQueue,
  } = usePlayer();

  const {
    queue,
    currentItem,
    hasItems,
    totalItems,
    albumGroups,
    removeItem,
    clearQueue,
    clearUpcoming,
    moveItem,
    moveBlock,
    selectVersion,
  } = useQueue();

  const { createPlaylist, addToPlaylist } = usePlaylists();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isQueueOpen) return null;

  const handleSaveQueue = async () => {
    if (!playlistName.trim()) return;

    setIsSaving(true);

    try {
      const newPlaylist = createPlaylist(playlistName.trim(), 'Saved from queue');

      const allSongs = queue.items.map(item => item.song);
      allSongs.forEach(song => {
        addToPlaylist(newPlaylist.id, song);
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setShowSaveModal(false);
        setPlaylistName('');
        setSaveSuccess(false);
        setIsSaving(false);
        toggleQueue();
      }, 1500);
    } catch (error) {
      console.error('Failed to save playlist:', error);
      setIsSaving(false);
    }
  };

  // Jamify/Spotify style - slides from right, positioned above bottom player
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed z-[60] bg-black/60 ${
          isMobile ? 'inset-0' : 'inset-0 bottom-[90px]'
        }`}
        onClick={toggleQueue}
        aria-hidden="true"
      />

      {/* Drawer - Full screen on mobile */}
      <aside
        className={`fixed z-[70] flex flex-col ${
          isMobile
            ? 'inset-0 bg-gradient-to-b from-[#3a3632] to-[#1c1a17] safe-top safe-bottom'
            : 'left-0 top-0 bottom-[90px] w-96 bg-[#1c1a17] border-r border-[#2d2a26]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Queue"
      >
          {/* Mobile drag indicator */}
          {isMobile && (
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/30 rounded-full" />
            </div>
          )}

          {/* Header */}
          <div className={`flex items-center justify-between px-4 ${isMobile ? 'py-3' : 'p-4 border-b border-[#2d2a26]'}`}>
            {isMobile ? (
              <>
                <button
                  onClick={toggleQueue}
                  className="p-2 -ml-2 text-white"
                  aria-label="Close queue"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <h2 className="text-base font-bold text-white">Queue</h2>
                <div className="w-10" /> {/* Spacer for centering */}
              </>
            ) : (
              <>
                <h2 className="text-base font-bold text-white">Queue</h2>
                <div className="flex items-center gap-2">
                  {hasItems && (
                    <button
                      onClick={clearQueue}
                      className="text-xs text-[#8a8478] hover:text-white transition-colors"
                      aria-label="Clear entire queue"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={toggleQueue}
                    className="p-2 text-[#8a8478] hover:text-white transition-colors"
                    aria-label="Close queue"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Save as Playlist Button */}
          {hasItems && totalItems > 0 && (
            <div className="px-4 py-3 border-b border-[#2d2a26]">
              <button
                onClick={() => setShowSaveModal(true)}
                className="w-full py-2 px-4 bg-[#d4a060] hover:bg-[#c08a40] text-white text-sm font-semibold rounded-full transition-colors"
                aria-label={`Save queue with ${totalItems} songs as a new playlist`}
              >
                Save as Playlist
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto prevent-overscroll" role="region" aria-label="Queue tracks">
            {!hasItems ? (
              <div className="flex flex-col items-center justify-center h-full text-[#8a8478]">
                <svg className="w-12 h-12 mb-4 text-[#3a3632]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                </svg>
                <p className="font-semibold">Queue is empty</p>
                <p className="text-sm mt-1">Add songs or albums to get started</p>
              </div>
            ) : (
              <>
                {/* Now Playing */}
                <NowPlayingSection currentItem={currentItem} />

                {/* Upcoming Queue */}
                <UpcomingSection
                  queue={queue}
                  albumGroups={albumGroups}
                  isMobile={isMobile}
                  removeItem={removeItem}
                  clearUpcoming={clearUpcoming}
                  playFromQueue={playFromQueue}
                  moveItem={moveItem}
                  moveBlock={moveBlock}
                  selectVersion={selectVersion}
                />
              </>
            )}
          </div>

      {/* Save Playlist Modal */}
      {showSaveModal && (
        <>
          {/* Modal Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/80"
            onClick={() => !isSaving && setShowSaveModal(false)}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-[#2d2a26] rounded-lg max-w-md w-full p-6">
              {saveSuccess ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#d4a060] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Playlist Created!</h3>
                  <p className="text-[#8a8478] text-sm">
                    {totalItems} {totalItems === 1 ? 'song' : 'songs'} saved to &quot;{playlistName}&quot;
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white mb-4">Save Queue as Playlist</h3>
                  <p className="text-[#8a8478] text-sm mb-4">
                    {totalItems} {totalItems === 1 ? 'song' : 'songs'} will be saved
                  </p>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value.slice(0, VALIDATION_LIMITS.PLAYLIST_NAME_MAX))}
                    maxLength={VALIDATION_LIMITS.PLAYLIST_NAME_MAX}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && playlistName.trim()) {
                        handleSaveQueue();
                      }
                    }}
                    placeholder="Playlist name"
                    className="w-full px-4 py-3 bg-[#3a3632] text-white rounded border border-[#3a3632] focus:border-[#d4a060] focus:outline-none mb-6"
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowSaveModal(false);
                        setPlaylistName('');
                      }}
                      disabled={isSaving}
                      className="flex-1 py-3 px-4 bg-transparent border border-[#3a3632] text-white text-sm font-semibold rounded-full hover:border-white transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveQueue}
                      disabled={!playlistName.trim() || isSaving}
                      className="flex-1 py-3 px-4 bg-[#d4a060] hover:bg-[#c08a40] text-white text-sm font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  </>
  );
}

// =============================================================================
// Queue Card Detail — expanded card with version browsing (adapted from BottomPlayer)
// =============================================================================

function QueueCardDetail({
  item,
  absoluteIndex,
  onPlay,
  onSelectVersion,
}: {
  item: QueueItem;
  absoluteIndex: number;
  onPlay: (index: number) => void;
  onSelectVersion: (queueId: string, song: Song) => void;
}) {
  const versions = item.availableVersions;
  const hasVersions = !item.played && versions.length > 1;
  const vIdx = versions.findIndex((v) => v.id === item.song.id);

  const song = item.song;
  const badge = getRecordingBadge(song.lineage, song.recordingType);

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasVersions || vIdx <= 0) return;
    onSelectVersion(item.queueId, versions[vIdx - 1]);
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasVersions || vIdx >= versions.length - 1) return;
    onSelectVersion(item.queueId, versions[vIdx + 1]);
  };

  const year = song.showDate?.split('-')[0] || '\u2014';
  let formattedDate = song.showDate || null;
  if (formattedDate && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = formattedDate.split('-');
    formattedDate = `${m}/${d}/${y.slice(-2)}`;
  }

  const Row = ({ label, value, truncLen }: { label: string; value?: string | null; truncLen?: number }) => {
    if (!value) return null;
    const display = truncLen && value.length > truncLen ? value.slice(0, truncLen) + '\u2026' : value;
    return (
      <div className="flex justify-between gap-2">
        <span className="text-[#d4a060] flex-shrink-0">{label}</span>
        <span className="text-[#a89a8c] truncate text-right" title={value}>{display}</span>
      </div>
    );
  };

  return (
    <div className="border-t border-[#3a3632]/50 mt-1">
      <div className="px-1.5 py-1.5 flex items-stretch gap-1">
        {/* Left arrow */}
        {hasVersions && (
          <button
            onClick={goPrev}
            disabled={vIdx <= 0}
            className="flex-shrink-0 w-7 flex items-center justify-center rounded-l-lg bg-[#252220] hover:bg-[#2d2a26] text-[#8a8478] hover:text-[#d4a060] transition-colors disabled:opacity-15 disabled:text-[#3a3632]"
            aria-label="Previous version"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}

        {/* Card */}
        <div className="flex-1 min-w-0 bg-[#1c1a17] rounded-lg border border-[#3a3632]/60 overflow-hidden">
          {/* Card header */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252220] border-b border-[#3a3632]/40">
            <span className="text-lg font-bold text-white leading-none tracking-tight">{year}</span>
            {badge && badge.show && (
              <span
                className="px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider"
                style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
              >
                {badge.text}
              </span>
            )}
            {song.duration > 0 && (
              <span className="text-[10px] text-[#6a6458] font-mono">{formatDuration(song.duration)}</span>
            )}
            {hasVersions && (
              <span className="text-[10px] text-[#6a6458] tabular-nums ml-auto">{vIdx + 1} / {versions.length}</span>
            )}
          </div>

          {/* Card body */}
          <div className="px-3 py-2 text-[10px] space-y-1">
            <Row label="Venue" value={song.showVenue} truncLen={28} />
            <Row label="Location" value={song.showLocation} truncLen={28} />
            <Row label="Date" value={formattedDate} />
            <Row label="Taper" value={song.taper} truncLen={24} />
            <Row label="Source" value={song.source} truncLen={34} />
            <Row label="Lineage" value={song.lineage ? formatLineage(song.lineage, 38) : undefined} />
            {song.avgRating && (
              <div className="flex justify-between gap-2">
                <span className="text-[#d4a060] flex-shrink-0">Rating</span>
                <span className="text-[#a89a8c]">
                  {'\u2605'.repeat(Math.round(song.avgRating))}{'\u2606'.repeat(5 - Math.round(song.avgRating))}
                  <span className="text-[#6a6458] ml-1">{song.avgRating.toFixed(1)}{song.numReviews ? ` (${song.numReviews})` : ''}</span>
                </span>
              </div>
            )}
            {song.downloads && (
              <Row label="Downloads" value={song.downloads.toLocaleString()} />
            )}
          </div>

          {/* Card footer */}
          <div className="px-3 pb-2">
            <button
              onClick={(e) => { e.stopPropagation(); onPlay(absoluteIndex); }}
              className="w-full py-1.5 bg-[#d4a060] hover:bg-[#c08a40] text-[#1c1a17] rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Play This Version
            </button>
          </div>
        </div>

        {/* Right arrow */}
        {hasVersions && (
          <button
            onClick={goNext}
            disabled={vIdx >= versions.length - 1}
            className="flex-shrink-0 w-7 flex items-center justify-center rounded-r-lg bg-[#252220] hover:bg-[#2d2a26] text-[#8a8478] hover:text-[#d4a060] transition-colors disabled:opacity-15 disabled:text-[#3a3632]"
            aria-label="Next version"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Compact Card Summary — shared by both desktop rows and mobile items
// =============================================================================

function CardSummary({ item }: { item: QueueItem }) {
  const song = item.song;
  const badge = getRecordingBadge(song.lineage, song.recordingType);

  let formattedDate: string | null = song.showDate || null;
  if (formattedDate && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = formattedDate.split('-');
    formattedDate = `${m}/${d}/${y.slice(-2)}`;
  }

  const venueDate = [song.showVenue, formattedDate].filter(Boolean).join(' \u00b7 ');

  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {/* Album art */}
      {item.albumSource?.coverArt ? (
        <Image
          src={item.albumSource.coverArt}
          alt=""
          width={48}
          height={48}
          quality={80}
          className="object-cover rounded flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 bg-[#2d2a26] rounded flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-[#3a3632]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
      )}

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-white truncate">
            {item.albumSource ? <><span className="text-[#6a6458]">{(item.albumSource.originalTrackIndex ?? 0) + 1}.</span> {item.trackTitle}</> : item.trackTitle}
          </p>
          {badge && badge.show && (
            <span
              className="px-1 py-0.5 text-[7px] font-bold rounded uppercase tracking-wider flex-shrink-0"
              style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
            >
              {badge.text}
            </span>
          )}
        </div>
        <p className="text-xs text-[#8a8478] truncate">{song.artistName}</p>
        {venueDate && (
          <p className="text-[10px] text-[#6a6458] truncate">{venueDate}</p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Now Playing Section
// =============================================================================

function NowPlayingSection({ currentItem }: { currentItem: QueueItem | null }) {
  if (!currentItem) return null;

  const song = currentItem.song;
  const badge = getRecordingBadge(song.lineage, song.recordingType);

  let formattedDate: string | null = song.showDate || null;
  if (formattedDate && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = formattedDate.split('-');
    formattedDate = `${m}/${d}/${y.slice(-2)}`;
  }

  const venueDate = [song.showVenue, formattedDate].filter(Boolean).join(' \u00b7 ');

  return (
    <div className="p-4 border-b border-[#2d2a26]">
      <p className="text-xs text-[#8a8478] uppercase tracking-wider mb-3">Now Playing</p>
      <div className="flex items-center gap-3">
        {currentItem.albumSource?.coverArt ? (
          <Image
            src={currentItem.albumSource.coverArt}
            alt={currentItem.albumSource.albumName || 'Album cover'}
            width={48}
            height={48}
            quality={80}
            className="object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-[#2d2a26] rounded flex items-center justify-center">
            <svg className="w-6 h-6 text-[#3a3632]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-[#d4a060] truncate">
              {currentItem.albumSource ? <><span className="text-[#6a6458]">{(currentItem.albumSource.originalTrackIndex ?? 0) + 1}.</span> {currentItem.song.title}</> : currentItem.song.title}
            </p>
            {badge && badge.show && (
              <span
                className="px-1 py-0.5 text-[7px] font-bold rounded uppercase tracking-wider flex-shrink-0"
                style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
              >
                {badge.text}
              </span>
            )}
          </div>
          <p className="text-xs text-[#8a8478] truncate">
            {currentItem.song.artistName}
          </p>
          {venueDate && (
            <p className="text-[10px] text-[#6a6458] truncate">{venueDate}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Drag Handle Icon (6-dot grip)
// =============================================================================

function DragHandleIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 ${className}`}
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <circle cx="5" cy="3" r="1.5" />
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="13" r="1.5" />
      <circle cx="11" cy="13" r="1.5" />
    </svg>
  );
}

// =============================================================================
// Sortable Track Row (desktop only) — card layout with expand/collapse
// =============================================================================

interface SortableTrackRowProps {
  item: QueueItem;
  absoluteIndex: number;
  removeItem: (queueId: string) => void;
  playFromQueue: (index: number) => void;
  isExpanded: boolean;
  onToggleExpand: (queueId: string) => void;
  selectVersion: (queueId: string, song: Song) => void;
}

function SortableTrackRow({
  item,
  absoluteIndex,
  removeItem,
  playFromQueue,
  isExpanded,
  onToggleExpand,
  selectVersion,
}: SortableTrackRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.queueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`px-3 py-2 hover:bg-[#2d2a26]/50 transition-colors ${
        isDragging ? 'bg-[#2d2a26] rounded shadow-lg shadow-black/30' : ''
      } ${isExpanded ? 'bg-[#252220]' : ''}`}
    >
      {/* Collapsed card row */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => onToggleExpand(item.queueId)}
      >
        {/* Drag handle */}
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="p-1 text-[#3a3632] hover:text-[#8a8478] cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          aria-label={`Reorder ${item.trackTitle}`}
          onClick={(e) => e.stopPropagation()}
        >
          <DragHandleIcon />
        </button>

        {/* Card summary */}
        <CardSummary item={item} />

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeItem(item.queueId);
          }}
          className="p-1 text-[#8a8478] hover:text-white transition-colors flex-shrink-0"
          aria-label={`Remove ${item.trackTitle} from queue`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <QueueCardDetail
          item={item}
          absoluteIndex={absoluteIndex}
          onPlay={(idx) => {
            playFromQueue(idx);
            onToggleExpand(item.queueId);
          }}
          onSelectVersion={selectVersion}
        />
      )}
    </li>
  );
}

// =============================================================================
// Drag Overlay Track Content (rendered in DragOverlay portal) — card style
// =============================================================================

function DragOverlayTrack({ item }: { item: QueueItem }) {
  return (
    <div className="px-3 py-2 bg-[#2d2a26] rounded shadow-lg shadow-black/50 border border-[#d4a060]/30 flex items-center gap-2">
      <div className="p-1 text-[#d4a060]">
        <DragHandleIcon />
      </div>
      <CardSummary item={item} />
    </div>
  );
}

function DragOverlayGroup({ group }: { group: AlbumGroup }) {
  return (
    <div className="px-4 py-3 bg-[#2d2a26] rounded shadow-lg shadow-black/50 border border-[#d4a060]/30">
      <div className="flex items-center gap-2">
        <div className="p-1 text-[#d4a060]">
          <DragHandleIcon />
        </div>
        {group.albumSource.coverArt && (
          <Image
            src={group.albumSource.coverArt}
            alt=""
            width={24}
            height={24}
            className="rounded"
          />
        )}
        <p className="text-xs text-white uppercase tracking-wider truncate">
          {group.albumSource.albumName}
        </p>
        <span className="text-xs text-[#8a8478] ml-auto">
          {group.items.length} tracks
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Upcoming Section
// =============================================================================

interface UpcomingSectionProps {
  queue: { items: QueueItem[]; cursorIndex: number };
  albumGroups: AlbumGroup[];
  isMobile: boolean;
  removeItem: (queueId: string) => void;
  clearUpcoming: () => void;
  playFromQueue: (index: number) => void;
  moveItem: (fromIndex: number, toIndex: number) => void;
  moveBlock: (
    batchId: string,
    startIndex: number,
    endIndex: number,
    targetIndex: number,
  ) => void;
  selectVersion: (queueId: string, song: Song) => void;
}

function UpcomingSection({
  queue,
  albumGroups,
  isMobile,
  removeItem,
  clearUpcoming,
  playFromQueue,
  moveItem,
  moveBlock,
  selectVersion,
}: UpcomingSectionProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedQueueId, setExpandedQueueId] = useState<string | null>(null);
  const upcomingCount = queue.items.length - (queue.cursorIndex + 1);

  // Collapse expanded card when cursor (current track) changes
  useEffect(() => {
    setExpandedQueueId(null);
  }, [queue.cursorIndex]);

  const toggleExpand = useCallback((queueId: string) => {
    setExpandedQueueId(prev => prev === queueId ? null : queueId);
  }, []);

  // Build group-header drag IDs: "group-{batchId}-{startIndex}"
  const groupDragIdPrefix = 'group-drag-';

  const renderItems = useMemo((): RenderEntry[] => {
    const startFrom = queue.cursorIndex + 1;
    if (startFrom >= queue.items.length) return [];

    const groupByStartIndex = new Map<number, AlbumGroup>();
    albumGroups.forEach(group => {
      groupByStartIndex.set(group.startIndex, group);
    });

    const result: RenderEntry[] = [];

    for (let i = startFrom; i < queue.items.length; i++) {
      const group = groupByStartIndex.get(i);
      if (group) {
        result.push({ type: 'group-header', group });
      }
      result.push({ type: 'track', item: queue.items[i], absoluteIndex: i });
    }

    return result;
  }, [queue.items, queue.cursorIndex, albumGroups]);

  // Sortable IDs: track queueIds + group drag IDs
  const sortableIds = useMemo(() => {
    return renderItems
      .map(entry => {
        if (entry.type === 'track') return entry.item.queueId;
        if (entry.type === 'group-header') return `${groupDragIdPrefix}${entry.group.batchId}-${entry.group.startIndex}`;
        return null;
      })
      .filter((id): id is string => id !== null);
  }, [renderItems, groupDragIdPrefix]);

  // Find the active item or group for DragOverlay
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    if (activeId.startsWith(groupDragIdPrefix)) {
      const group = albumGroups.find(g => `${groupDragIdPrefix}${g.batchId}-${g.startIndex}` === activeId);
      return group ? { type: 'group' as const, group } : null;
    }
    const item = queue.items.find(i => i.queueId === activeId);
    return item ? { type: 'track' as const, item } : null;
  }, [activeId, queue.items, albumGroups, groupDragIdPrefix]);

  // Sensors: pointer for desktop (DnD is desktop-only, mobile keeps swipe-to-delete)
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(pointerSensor, keyboardSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setExpandedQueueId(null); // Collapse any expanded card when dragging
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);

      // Group header drag
      if (activeIdStr.startsWith(groupDragIdPrefix)) {
        const group = albumGroups.find(
          g => `${groupDragIdPrefix}${g.batchId}-${g.startIndex}` === activeIdStr,
        );
        if (!group) return;

        // Find where the over item is in absolute terms
        let targetIndex: number;
        if (overIdStr.startsWith(groupDragIdPrefix)) {
          // Dropped on another group header - find that group's start index
          const targetGroup = albumGroups.find(
            g => `${groupDragIdPrefix}${g.batchId}-${g.startIndex}` === overIdStr,
          );
          targetIndex = targetGroup ? targetGroup.startIndex : group.startIndex;
        } else {
          // Dropped on a track - find that track's absolute index
          const trackEntry = renderItems.find(
            e => e.type === 'track' && e.item.queueId === overIdStr,
          );
          targetIndex = trackEntry && trackEntry.type === 'track' ? trackEntry.absoluteIndex : group.startIndex;
        }

        moveBlock(group.batchId, group.startIndex, group.endIndex, targetIndex);
        return;
      }

      // Single track drag
      const fromEntry = renderItems.find(
        e => e.type === 'track' && e.item.queueId === activeIdStr,
      );
      if (!fromEntry || fromEntry.type !== 'track') return;

      let toIndex: number;
      if (overIdStr.startsWith(groupDragIdPrefix)) {
        // Dropped on a group header - place at group's start index
        const targetGroup = albumGroups.find(
          g => `${groupDragIdPrefix}${g.batchId}-${g.startIndex}` === overIdStr,
        );
        toIndex = targetGroup ? targetGroup.startIndex : fromEntry.absoluteIndex;
      } else {
        const toEntry = renderItems.find(
          e => e.type === 'track' && e.item.queueId === overIdStr,
        );
        toIndex = toEntry && toEntry.type === 'track' ? toEntry.absoluteIndex : fromEntry.absoluteIndex;
      }

      if (fromEntry.absoluteIndex !== toIndex) {
        moveItem(fromEntry.absoluteIndex, toIndex);
      }
    },
    [renderItems, albumGroups, moveItem, moveBlock, groupDragIdPrefix],
  );

  if (upcomingCount <= 0) return null;

  // Mobile: no DnD, keep swipe-to-delete
  if (isMobile) {
    return (
      <div>
        <div className="flex items-center justify-between p-4">
          <p className="text-xs text-[#8a8478] uppercase tracking-wider">
            Up Next ({upcomingCount})
          </p>
          <button
            onClick={clearUpcoming}
            className="text-xs text-[#8a8478] hover:text-white transition-colors"
            aria-label={`Clear upcoming queue (${upcomingCount} songs)`}
          >
            Clear
          </button>
        </div>
        <ul>
          {renderItems.map((entry) => {
            if (entry.type === 'group-header') {
              return (
                <li
                  key={`group-${entry.group.batchId}-${entry.group.startIndex}`}
                  className="p-4 pb-0"
                  aria-hidden="true"
                >
                  <div className="flex items-center gap-2">
                    {entry.group.albumSource.coverArt && (
                      <Image
                        src={entry.group.albumSource.coverArt}
                        alt=""
                        width={24}
                        height={24}
                        className="rounded"
                      />
                    )}
                    <p className="text-xs text-[#8a8478] uppercase tracking-wider truncate">
                      {entry.group.isContinuation
                        ? `${entry.group.albumSource.albumName} (continued)`
                        : entry.group.albumSource.albumName}
                    </p>
                  </div>
                </li>
              );
            }

            const { item, absoluteIndex } = entry;
            const isExpanded = expandedQueueId === item.queueId;
            return (
              <SwipeableQueueItem
                key={item.queueId}
                onDelete={() => removeItem(item.queueId)}
                className="px-3 py-2"
              >
                <div>
                  {/* Collapsed card row */}
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleExpand(item.queueId)}
                  >
                    <CardSummary item={item} />
                    <span className="text-xs text-[#8a8478] font-mono flex-shrink-0">
                      {formatDuration(item.song.duration)}
                    </span>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <QueueCardDetail
                      item={item}
                      absoluteIndex={absoluteIndex}
                      onPlay={(idx) => {
                        playFromQueue(idx);
                        toggleExpand(item.queueId);
                      }}
                      onSelectVersion={selectVersion}
                    />
                  )}
                </div>
              </SwipeableQueueItem>
            );
          })}
        </ul>
      </div>
    );
  }

  // Desktop: DnD enabled
  return (
    <div>
      <div className="flex items-center justify-between p-4">
        <p className="text-xs text-[#8a8478] uppercase tracking-wider">
          Up Next ({upcomingCount})
        </p>
        <button
          onClick={clearUpcoming}
          className="text-xs text-[#8a8478] hover:text-white transition-colors"
          aria-label={`Clear upcoming queue (${upcomingCount} songs)`}
        >
          Clear
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <ul>
            {renderItems.map((entry) => {
              if (entry.type === 'group-header') {
                return (
                  <SortableGroupHeader
                    key={`group-${entry.group.batchId}-${entry.group.startIndex}`}
                    group={entry.group}
                    dragId={`${groupDragIdPrefix}${entry.group.batchId}-${entry.group.startIndex}`}
                  />
                );
              }

              return (
                <SortableTrackRow
                  key={entry.item.queueId}
                  item={entry.item}
                  absoluteIndex={entry.absoluteIndex}
                  removeItem={removeItem}
                  playFromQueue={playFromQueue}
                  isExpanded={expandedQueueId === entry.item.queueId}
                  onToggleExpand={toggleExpand}
                  selectVersion={selectVersion}
                />
              );
            })}
          </ul>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeItem?.type === 'track' && (
            <DragOverlayTrack item={activeItem.item} />
          )}
          {activeItem?.type === 'group' && (
            <DragOverlayGroup group={activeItem.group} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// =============================================================================
// Sortable Group Header (desktop only)
// =============================================================================

interface SortableGroupHeaderProps {
  group: AlbumGroup;
  dragId: string;
}

function SortableGroupHeader({ group, dragId }: SortableGroupHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dragId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`p-4 pb-0 ${isDragging ? 'bg-[#2d2a26] rounded' : ''}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="p-1 text-[#3a3632] hover:text-[#8a8478] cursor-grab active:cursor-grabbing touch-none"
          aria-label={`Reorder ${group.albumSource.albumName} group`}
        >
          <DragHandleIcon />
        </button>
        {group.albumSource.coverArt && (
          <Image
            src={group.albumSource.coverArt}
            alt=""
            width={24}
            height={24}
            className="rounded"
          />
        )}
        <p className="text-xs text-[#8a8478] uppercase tracking-wider truncate">
          {group.isContinuation
            ? `${group.albumSource.albumName} (continued)`
            : group.albumSource.albumName}
        </p>
      </div>
    </li>
  );
}
