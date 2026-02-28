'use client';

// Queue drawer - sidebar tabs design with album navigation + drag-and-drop reordering

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useQuality } from '@/context/QualityContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { useMobileUI } from '@/context/MobileUIContext';
import { formatDuration } from '@/lib/api';
import { AlbumGroup, QueueItem } from '@/lib/queueTypes';
import type { Song, AudioQuality } from '@/lib/types';

import { VALIDATION_LIMITS } from '@/lib/validation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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

// Quality helpers (shared with QueueChip)
function getQualityLabel(quality: AudioQuality): string {
  switch (quality) {
    case 'high': return 'FLAC';
    case 'medium': return '320k';
    case 'low': return '128k';
  }
}

function getEffectiveQuality(song: Song, preferred: AudioQuality): AudioQuality {
  if (!song.qualityUrls) return preferred;
  if (song.qualityUrls[preferred]) return preferred;
  if (song.qualityUrls.medium) return 'medium';
  if (song.qualityUrls.high) return 'high';
  if (song.qualityUrls.low) return 'low';
  return preferred;
}

export default function Queue() {
  const { isMobile } = useMobileUI();
  const {
    isQueueOpen,
    toggleQueue,
    playFromQueue,
    currentTime,
    duration,
  } = usePlayer();

  const {
    queue,
    currentItem,
    hasItems,
    totalItems,
    albumGroups,
    removeItem,
    clearUpcoming,
    moveItem,
    moveBlock,
    selectVersion,
  } = useQueue();

  const { preferredQuality } = useQuality();
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60"
        onClick={toggleQueue}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed z-[70] flex flex-col ${
          isMobile
            ? 'inset-0 safe-top safe-bottom'
            : 'left-0 top-0 bottom-0 w-[420px]'
        }`}
        style={{
          background: 'linear-gradient(180deg, var(--player-surface-deep) 0%, var(--player-surface-queue) 100%)',
          borderRight: isMobile ? 'none' : '1px solid var(--border-subtle-player)',
          boxShadow: '24px 0 80px color-mix(in srgb, black 50%, transparent), 0 0 0 1px color-mix(in srgb, var(--primary) 10%, transparent)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Queue"
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px z-[1] pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, var(--quinary-muted), var(--tertiary-muted), transparent)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3.5 flex-shrink-0">
          <span className="font-jb-mono text-[13px] font-semibold tracking-[0.14em] uppercase text-primary">
            Queue
          </span>
          <button
            onClick={toggleQueue}
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all"
            style={{
              border: '1.5px solid color-mix(in srgb, var(--primary) 23%, transparent)',
              background: 'transparent',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-secondary)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--primary-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--primary) 23%, transparent)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Close queue"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0" role="region" aria-label="Queue tracks">
          {!hasItems ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-12 h-12 mb-4" style={{ color: 'var(--border-default)' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
              </svg>
              <p className="font-semibold">Queue is empty</p>
              <p className="text-sm mt-1">Add songs or albums to get started</p>
            </div>
          ) : (
            <>
              {/* Now Playing */}
              <NowPlayingSection currentItem={currentItem} currentTime={currentTime} duration={duration} />

              {/* Divider */}
              <div
                className="mx-[18px] mb-2 flex-shrink-0"
                style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-subtle-player), transparent)' }}
              />

              {/* Upcoming Queue */}
              <UpcomingSection
                queue={queue}
                albumGroups={albumGroups}
                removeItem={removeItem}
                clearUpcoming={clearUpcoming}
                playFromQueue={playFromQueue}
                moveItem={moveItem}
                moveBlock={moveBlock}
                selectVersion={selectVersion}
                onSave={() => setShowSaveModal(true)}
                totalItems={totalItems}
                hasItems={hasItems}
                preferredQuality={preferredQuality}
              />
            </>
          )}
        </div>

        {/* Save Playlist Modal */}
        {showSaveModal && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/80"
              onClick={() => !isSaving && setShowSaveModal(false)}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div className="rounded-lg max-w-md w-full p-6" style={{ background: 'var(--surface-elevated)' }}>
                {saveSuccess ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--accent-primary)' }}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Playlist Created!</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {totalItems} {totalItems === 1 ? 'song' : 'songs'} saved to &quot;{playlistName}&quot;
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white mb-4">Save Queue as Playlist</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
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
                      className="w-full px-4 py-3 text-white rounded border focus:outline-none mb-6"
                      style={{
                        background: 'var(--border-default)',
                        borderColor: 'var(--border-default)',
                      }}
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
                        className="flex-1 py-3 px-4 bg-transparent text-white text-sm font-semibold rounded-full transition-colors disabled:opacity-50"
                        style={{ border: '1px solid var(--border-default)' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveQueue}
                        disabled={!playlistName.trim() || isSaving}
                        className="flex-1 py-3 px-4 text-white text-sm font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'var(--accent-primary)' }}
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

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .queue-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .queue-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .queue-sidebar-scroll::-webkit-scrollbar-thumb {
          background: var(--primary-muted);
          border-radius: 2px;
        }
        .queue-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--primary);
        }
        .queue-sidebar-tabs::-webkit-scrollbar { width: 0; }
      `}</style>
    </>
  );
}

// =============================================================================
// Drag Dot Handle — 6-dot grip pattern (3 rows × 2 dots)
// =============================================================================

function DragDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-[2px] ${className}`}>
      {[0, 1, 2].map(row => (
        <span key={row} className="flex gap-[3px]">
          <span className="w-[3.5px] h-[3.5px] rounded-full" style={{ background: 'var(--text-tertiary)' }} />
          <span className="w-[3.5px] h-[3.5px] rounded-full" style={{ background: 'var(--text-tertiary)' }} />
        </span>
      ))}
    </div>
  );
}

// =============================================================================
// Vinyl Placeholder — used when no album art
// =============================================================================

function VinylPlaceholder({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: 'var(--text-tertiary)', opacity: 0.4 }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// =============================================================================
// Now Playing Section
// =============================================================================

function NowPlayingSection({ currentItem, currentTime, duration }: { currentItem: QueueItem | null; currentTime: number; duration: number }) {
  if (!currentItem) return null;

  const song = currentItem.song;
  const albumName = currentItem.albumSource?.albumName;
  const venue = song.showVenue;
  const showInfo = [albumName, venue].filter(Boolean).join(' \u00b7 ');
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="mx-4 mb-4 p-4 rounded-xl relative overflow-hidden flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, var(--player-surface-bar) 0%, var(--player-surface-chip) 100%)',
        border: '1px solid var(--quinary-muted)',
      }}
    >
      {/* Warm inner glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, var(--quinary-muted) 0%, transparent 70%)',
          opacity: 0.3,
        }}
      />

      {/* NOW PLAYING label */}
      <div
        className="font-jb-mono text-[9.5px] font-semibold tracking-[0.14em] uppercase mb-3 relative z-[1]"
        style={{ color: 'var(--quinary)' }}
      >
        Now Playing
      </div>

      {/* Content row */}
      <div className="flex gap-3.5 items-center mb-3.5 relative z-[1]">
        {/* Album art */}
        <div
          className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--surface-elevated), var(--surface-card))',
            boxShadow: '0 2px 10px color-mix(in srgb, black 30%, transparent)',
          }}
        >
          {currentItem.albumSource?.coverArt ? (
            <Image
              src={currentItem.albumSource.coverArt}
              alt={currentItem.albumSource.albumName || 'Album cover'}
              width={64}
              height={64}
              quality={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <VinylPlaceholder size={26} />
          )}
          {/* Gold sheen overlay */}
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--quinary) 10%, transparent), transparent)' }}
          />
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-primary truncate" style={{ lineHeight: '1.25' }}>
            {currentItem.song.title}
          </p>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--tertiary)', lineHeight: '1.3' }}>
            {currentItem.song.artistName}
          </p>
          {showInfo && (
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
              {showInfo}
            </p>
          )}
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="flex items-center gap-2.5 relative z-[1]">
        <span className="font-jb-mono text-[11px] min-w-[34px]" style={{ color: 'var(--text-tertiary)' }}>
          {formatDuration(Math.floor(currentTime))}
        </span>
        <div
          className="flex-1 h-[3px] rounded-sm relative overflow-hidden"
          style={{ background: 'var(--primary-muted)' }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-sm"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--quinary), var(--secondary))',
            }}
          />
          <div
            className="absolute top-1/2 rounded-full"
            style={{
              left: `${progress}%`,
              transform: 'translate(-50%, -50%)',
              width: '8px',
              height: '8px',
              background: 'var(--quinary)',
              boxShadow: '0 0 6px color-mix(in srgb, var(--quinary) 40%, transparent)',
            }}
          />
        </div>
        <span className="font-jb-mono text-[11px] min-w-[34px] text-right" style={{ color: 'var(--text-tertiary)' }}>
          {formatDuration(Math.floor(duration))}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Sortable Track Row — clean row design with drag handle
// =============================================================================

interface SortableTrackRowProps {
  item: QueueItem;
  absoluteIndex: number;
  displayIndex: number;
  removeItem: (queueId: string) => void;
  playFromQueue: (index: number) => void;
  selectVersion: (queueId: string, song: Song) => void;
  preferredQuality: AudioQuality;
  hideVenue?: boolean;
}

function SortableTrackRow({
  item,
  absoluteIndex,
  displayIndex,
  removeItem,
  playFromQueue,
  selectVersion,
  preferredQuality,
  hideVenue,
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

  const song = item.song;
  const year = song.showDate?.split('-')[0] || '';
  const venue = song.showVenue || '';
  const venueDisplay = venue
    ? venue + (year ? ` \u00b7 ${year}` : '')
    : song.artistName;
  const effectiveQuality = getEffectiveQuality(song, preferredQuality);
  const qualityLabel = getQualityLabel(effectiveQuality);

  return (
    <li ref={setNodeRef} style={style}>
      <div
        onClick={() => playFromQueue(absoluteIndex)}
        className="group/row flex items-center gap-0 py-2.5 px-2 mx-1.5 mb-1 rounded-[10px] cursor-pointer transition-all relative"
        style={{
          border: '1px solid transparent',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--player-surface-chip)';
          e.currentTarget.style.borderColor = 'var(--border-subtle-player)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        {/* Left accent bar on hover */}
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-sm transition-colors opacity-0 group-hover/row:opacity-100"
          style={{ background: 'var(--tertiary)' }}
        />

        {/* Drag handle */}
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex-shrink-0 px-2 py-1 opacity-25 group-hover/row:opacity-50 transition-opacity cursor-grab active:cursor-grabbing touch-none"
          aria-label={`Reorder ${item.trackTitle}`}
          onClick={(e) => e.stopPropagation()}
        >
          <DragDots />
        </button>

        {/* Track number */}
        <span
          className="font-jb-mono text-xs font-medium w-[22px] text-center flex-shrink-0 mr-2.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {displayIndex}
        </span>

        {/* Track art */}
        <div
          className="w-[46px] h-[46px] rounded-md flex-shrink-0 mr-3 flex items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--surface-elevated), var(--surface-card))' }}
        >
          {item.albumSource?.coverArt ? (
            <Image
              src={item.albumSource.coverArt}
              alt=""
              width={46}
              height={46}
              quality={60}
              className="w-full h-full object-cover"
            />
          ) : (
            <VinylPlaceholder />
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[14.5px] font-semibold text-primary truncate"
            style={{ lineHeight: '1.3' }}
          >
            {item.trackTitle}
          </p>
          {!hideVenue && (
            <p
              className="text-xs truncate"
              style={{ color: 'var(--text-tertiary)', lineHeight: '1.4' }}
            >
              {venueDisplay}
            </p>
          )}
          {/* Meta row: duration + quality badge */}
          <div className="flex items-center gap-2 mt-0.5">
            {song.duration > 0 && (
              <span
                className="font-jb-mono text-[11px] font-medium"
                style={{ color: 'var(--quinary)' }}
              >
                {formatDuration(song.duration)}
              </span>
            )}
            <span
              className="font-jb-mono text-[8.5px] font-semibold px-[5px] py-px rounded-[3px]"
              style={{
                background: 'var(--tertiary-muted)',
                color: 'var(--tertiary)',
                border: '1px solid color-mix(in srgb, var(--tertiary) 12%, transparent)',
                letterSpacing: '0.04em',
              }}
            >
              {qualityLabel}
            </span>
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeItem(item.queueId);
          }}
          className="w-7 h-7 rounded-md border-0 bg-transparent flex items-center justify-center flex-shrink-0 ml-1.5 opacity-0 group-hover/row:opacity-40 transition-all"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--secondary-muted)';
            e.currentTarget.style.color = 'var(--secondary)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
            e.currentTarget.style.opacity = '';
          }}
          aria-label={`Remove ${item.trackTitle} from queue`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </li>
  );
}

// =============================================================================
// Drag Overlay Content — rendered during drag
// =============================================================================

function DragOverlayTrack({ item }: { item: QueueItem }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-3 rounded-xl"
      style={{
        background: 'var(--surface-elevated)',
        boxShadow: '0 8px 32px color-mix(in srgb, black 50%, transparent)',
        border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
      }}
    >
      <DragDots className="opacity-60" />
      <CardSummary item={item} />
    </div>
  );
}

// =============================================================================
// Card Summary — compact row for DragOverlay
// =============================================================================

function CardSummary({ item }: { item: QueueItem }) {
  const song = item.song;

  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {item.albumSource?.coverArt ? (
        <Image
          src={item.albumSource.coverArt}
          alt=""
          width={48}
          height={48}
          quality={80}
          className="object-cover rounded-md flex-shrink-0"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface-elevated)' }}
        >
          <VinylPlaceholder />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.trackTitle}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{song.artistName}</p>
      </div>
      {song.duration > 0 && (
        <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
          {formatDuration(song.duration)}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Upcoming Section — Sidebar Tabs Layout
// =============================================================================

interface UpcomingSectionProps {
  queue: { items: QueueItem[]; cursorIndex: number };
  albumGroups: AlbumGroup[];
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
  onSave: () => void;
  totalItems: number;
  hasItems: boolean;
  preferredQuality: AudioQuality;
}

interface SidebarGroupEntry {
  id: string;
  albumName: string;
  venue?: string;
  year?: string;
  coverArt?: string;
  items: Array<{ item: QueueItem; absoluteIndex: number }>;
  batchId: string;
}

function UpcomingSection({
  queue,
  albumGroups,
  removeItem,
  clearUpcoming,
  playFromQueue,
  moveItem,
  selectVersion,
  onSave,
  totalItems,
  hasItems,
  preferredQuality,
}: UpcomingSectionProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visibleGroupId, setVisibleGroupId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionHeaderRefs = useRef(new Map<string, HTMLDivElement>());
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const isProgrammaticScroll = useRef(false);
  const upcomingCount = queue.items.length - (queue.cursorIndex + 1);

  // Build sidebar groups: album groups + standalone items
  const sidebarGroups = useMemo((): SidebarGroupEntry[] => {
    const startFrom = queue.cursorIndex + 1;
    if (startFrom >= queue.items.length) return [];

    const groupStartMap = new Map<number, AlbumGroup>();
    albumGroups.forEach(g => groupStartMap.set(g.startIndex, g));

    const result: SidebarGroupEntry[] = [];
    let i = startFrom;

    while (i < queue.items.length) {
      const group = groupStartMap.get(i);
      if (group) {
        result.push({
          id: `${group.batchId}-${group.startIndex}`,
          albumName: group.isContinuation
            ? `${group.albumSource.albumName} (cont.)`
            : group.albumSource.albumName,
          venue: group.albumSource.showVenue,
          year: group.albumSource.showDate?.split('-')[0],
          coverArt: group.albumSource.coverArt,
          items: group.items.map((item, idx) => ({
            item,
            absoluteIndex: group.startIndex + idx,
          })),
          batchId: group.batchId,
        });
        i = group.endIndex + 1;
      } else {
        const item = queue.items[i];
        result.push({
          id: item.queueId,
          albumName: item.albumSource?.albumName || item.trackTitle,
          venue: item.albumSource?.showVenue || item.song.showVenue,
          year: (item.albumSource?.showDate || item.song.showDate)?.split('-')[0],
          coverArt: item.albumSource?.coverArt,
          items: [{ item, absoluteIndex: i }],
          batchId: item.batchId,
        });
        i++;
      }
    }

    return result;
  }, [queue.items, queue.cursorIndex, albumGroups]);

  // Active group index driven by scroll-spy
  const activeGroupIdx = useMemo(() => {
    if (!visibleGroupId || sidebarGroups.length === 0) return 0;
    const idx = sidebarGroups.findIndex(g => g.id === visibleGroupId);
    return idx >= 0 ? idx : 0;
  }, [visibleGroupId, sidebarGroups]);

  // Progress: count tracks from same batch at or before cursor
  const groupProgress = useMemo(() => {
    const progress = new Map<string, number>();
    for (let i = 0; i <= queue.cursorIndex && i < queue.items.length; i++) {
      const bid = queue.items[i].batchId;
      progress.set(bid, (progress.get(bid) || 0) + 1);
    }
    return progress;
  }, [queue.items, queue.cursorIndex]);

  // DnD — all tracks across all groups
  const allSortableIds = useMemo(
    () => sidebarGroups.flatMap(g => g.items.map(i => i.item.queueId)),
    [sidebarGroups],
  );

  const queueIdToAbsoluteIndex = useMemo(() => {
    const map = new Map<string, number>();
    sidebarGroups.forEach(g => {
      g.items.forEach(({ item, absoluteIndex }) => {
        map.set(item.queueId, absoluteIndex);
      });
    });
    return map;
  }, [sidebarGroups]);

  const dragOverlayItem = useMemo(() => {
    if (!activeId) return null;
    for (const group of sidebarGroups) {
      const found = group.items.find(i => i.item.queueId === activeId);
      if (found) return found.item;
    }
    return null;
  }, [activeId, sidebarGroups]);

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || sidebarGroups.length === 0) return;

    const visibleHeaders = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;

        entries.forEach(entry => {
          const groupId = entry.target.getAttribute('data-group-id');
          if (!groupId) return;
          if (entry.isIntersecting) {
            visibleHeaders.add(groupId);
          } else {
            visibleHeaders.delete(groupId);
          }
        });

        // Pick the first visible group in document order
        for (const group of sidebarGroups) {
          if (visibleHeaders.has(group.id)) {
            setVisibleGroupId(group.id);
            break;
          }
        }
      },
      {
        root: container,
        rootMargin: '0px 0px -70% 0px',
        threshold: 0,
      },
    );

    sectionHeaderRefs.current.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sidebarGroups]);

  // Auto-scroll sidebar tab into view
  useEffect(() => {
    if (visibleGroupId) {
      tabRefs.current.get(visibleGroupId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [visibleGroupId]);

  // Click-to-scroll
  const scrollToGroup = useCallback((groupId: string) => {
    const container = scrollContainerRef.current;
    const header = sectionHeaderRefs.current.get(groupId);
    if (!container || !header) return;

    isProgrammaticScroll.current = true;
    setVisibleGroupId(groupId);

    const containerRect = container.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const offset = headerRect.top - containerRect.top + container.scrollTop;

    container.scrollTo({ top: offset, behavior: 'smooth' });

    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 600);
  }, []);

  // Ref setters
  const setSectionHeaderRef = useCallback((groupId: string, el: HTMLDivElement | null) => {
    if (el) {
      sectionHeaderRefs.current.set(groupId, el);
    } else {
      sectionHeaderRefs.current.delete(groupId);
    }
  }, []);

  const setTabRef = useCallback((groupId: string, el: HTMLButtonElement | null) => {
    if (el) {
      tabRefs.current.set(groupId, el);
    } else {
      tabRefs.current.delete(groupId);
    }
  }, []);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const fromIndex = queueIdToAbsoluteIndex.get(String(active.id));
      const toIndex = queueIdToAbsoluteIndex.get(String(over.id));

      if (fromIndex !== undefined && toIndex !== undefined && fromIndex !== toIndex) {
        moveItem(fromIndex, toIndex);
      }
    },
    [queueIdToAbsoluteIndex, moveItem],
  );

  if (upcomingCount <= 0) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Up Next header */}
      <div className="flex items-center justify-between px-5 pt-1 pb-2.5 flex-shrink-0">
        <div className="font-jb-mono text-[11px] font-semibold tracking-[0.1em] uppercase">
          <span style={{ color: 'var(--quinary)' }}>UP</span>{' '}
          <span style={{ color: 'var(--secondary)' }}>NEXT</span>{' '}
          <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>
            &middot; {upcomingCount} TRACKS
          </span>
        </div>
        <div className="flex gap-1">
          {hasItems && totalItems > 0 && (
            <button
              onClick={onSave}
              className="font-jb-mono text-[10.5px] font-medium tracking-wider px-2.5 py-1 rounded transition-all"
              style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--primary-muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-tertiary)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Save
            </button>
          )}
          <button
            onClick={clearUpcoming}
            className="font-jb-mono text-[10.5px] font-medium tracking-wider px-2.5 py-1 rounded transition-all"
            style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--primary-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label={`Clear upcoming queue (${upcomingCount} songs)`}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Sidebar layout */}
      <div className="flex-1 min-h-0 flex">
        {/* Album tabs — scroll-spy navigation */}
        <div
          className="w-[72px] flex-shrink-0 overflow-y-auto px-[7px] py-1.5 flex flex-col gap-1.5 queue-sidebar-tabs"
          style={{ borderRight: '1px solid var(--border-subtle-player)' }}
        >
          {sidebarGroups.map((group, idx) => {
            const isActive = idx === activeGroupIdx;
            const played = groupProgress.get(group.batchId) || 0;
            const total = group.items.length + played;
            const pct = total > 0 ? (played / total) * 100 : 0;

            return (
              <button
                key={group.id}
                ref={(el) => setTabRef(group.id, el)}
                onClick={() => scrollToGroup(group.id)}
                className="w-[58px] flex-shrink-0 rounded-lg p-1 flex flex-col items-center gap-1 transition-all cursor-pointer"
                style={{
                  border: isActive ? '1.5px solid var(--quinary)' : '1.5px solid transparent',
                  background: isActive ? 'var(--player-surface-chip-hover)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'var(--border-subtle-player)';
                    e.currentTarget.style.background = 'var(--player-surface-chip)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                aria-label={`${group.albumName} - ${group.items.length} tracks`}
              >
                <div
                  className="w-[46px] h-[46px] rounded-[5px] flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--surface-elevated), var(--surface-card))' }}
                >
                  {group.coverArt ? (
                    <Image src={group.coverArt} alt="" width={46} height={46} quality={60} className="w-full h-full object-cover" />
                  ) : (
                    <VinylPlaceholder />
                  )}
                </div>
                <span className="font-jb-mono text-[8px]" style={{ color: 'var(--text-tertiary)' }}>
                  {group.items.length} trk
                </span>
                <div className="w-full h-[2px] rounded-sm overflow-hidden" style={{ background: 'var(--primary-muted)' }}>
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, var(--quinary), var(--secondary))',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Track content — continuous list with sticky section headers */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto py-1.5 px-1 queue-sidebar-scroll">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={allSortableIds} strategy={verticalListSortingStrategy}>
              <ul>
                {sidebarGroups.map((group) => {
                  const played = groupProgress.get(group.batchId) || 0;
                  const total = group.items.length + played;
                  const pct = total > 0 ? (played / total) * 100 : 0;

                  return (
                    <li key={group.id}>
                      {/* Sticky album section header */}
                      <div
                        ref={(el) => setSectionHeaderRef(group.id, el)}
                        data-group-id={group.id}
                        className="sticky top-0 z-[2] px-2.5 pt-2 pb-2.5 mx-1 mb-1"
                        style={{
                          background: 'linear-gradient(180deg, var(--player-surface-queue) 80%, transparent)',
                        }}
                      >
                        <p className="text-[14px] font-bold text-primary" style={{ lineHeight: '1.25' }}>
                          {group.albumName}
                        </p>
                        {(group.venue || group.year) && (
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {[group.venue, group.year].filter(Boolean).join(' \u00b7 ')}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-12 h-[3px] rounded-sm overflow-hidden" style={{ background: 'var(--primary-muted)' }}>
                            <div
                              className="h-full rounded-sm"
                              style={{
                                width: `${pct}%`,
                                background: 'linear-gradient(90deg, var(--quinary), var(--secondary))',
                              }}
                            />
                          </div>
                          <span className="font-jb-mono text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                            {played}/{total} played
                          </span>
                        </div>
                      </div>

                      {/* Track rows with per-album numbering */}
                      <ul>
                        {group.items.map(({ item, absoluteIndex }, idx) => (
                          <SortableTrackRow
                            key={item.queueId}
                            item={item}
                            absoluteIndex={absoluteIndex}
                            displayIndex={idx + 1}
                            removeItem={removeItem}
                            playFromQueue={playFromQueue}
                            selectVersion={selectVersion}
                            preferredQuality={preferredQuality}
                            hideVenue
                          />
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {dragOverlayItem && <DragOverlayTrack item={dragOverlayItem} />}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
