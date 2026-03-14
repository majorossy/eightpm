'use client';

// Queue drawer - single-column with sticky album cards + drag-and-drop reordering

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useQuality } from '@/context/QualityContext';
import { useMiniDiscs } from '@/context/CollectionContext';
import { useMobileUI } from '@/context/MobileUIContext';
import { formatDuration } from '@/lib/api';
import { AlbumGroup, QueueItem } from '@/lib/queueTypes';
import type { Song, AudioQuality } from '@/lib/types';
import { glowClassName, ChipGlowType, ChipGlow } from '@/lib/chipGlow';
import { useBackToClose } from '@/hooks/useBackToClose';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import Link from 'next/link';

import { VALIDATION_LIMITS } from '@/lib/validation';
import VersionPickerModal from '@/components/VersionPickerModal';
import { VersionsIcon, RecordingRow } from '@/components/version-row';
import TicketStub from '@/components/TicketStub';
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


export default function Queue() {
  const { isMobile } = useMobileUI();
  const {
    isQueueOpen,
    toggleQueue,
    closeQueue,
    playFromQueue,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrev,
    isPlaying,
  } = usePlayer();

  useBackToClose(isQueueOpen, closeQueue);

  const {
    queue,
    currentItem,
    hasItems,
    totalItems,
    albumGroups,
    removeItem,
    removeBatch,
    clearUpcoming,
    moveItem,
    moveBlock,
    selectVersion,
  } = useQueue();

  const { preferredQuality } = useQuality();
  const { createMiniDisc, addToMiniDisc } = useMiniDiscs();

  const { isAuthenticated } = useMagentoAuth();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [discName, setDiscName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isQueueOpen) return null;

  const handleSaveQueue = async () => {
    if (!discName.trim()) return;

    setIsSaving(true);

    try {
      const newDisc = createMiniDisc(discName.trim(), 'Saved from queue');

      const allSongs = queue.items.map(item => item.song);
      allSongs.forEach(song => {
        addToMiniDisc(newDisc.id, song);
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setShowSaveModal(false);
        setDiscName('');
        setSaveSuccess(false);
        setIsSaving(false);
        toggleQueue();
      }, 1500);
    } catch (error) {
      console.error('Failed to save MiniDisc:', error);
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

        {/* Header: nav links + close button */}
        <nav className="flex items-center gap-1 px-5 pt-3 pb-3 flex-shrink-0">
          <Link
            href="/my-library"
            onClick={closeQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid color-mix(in srgb, var(--primary) 23%, transparent)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--primary-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
            </svg>
            <span className="hidden min-[380px]:inline">My Library</span>
          </Link>
          <Link
            href="/find"
            onClick={closeQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid color-mix(in srgb, var(--primary) 23%, transparent)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--primary-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden min-[380px]:inline">Find</span>
          </Link>
          <Link
            href={isAuthenticated ? '/account' : '/sign-in'}
            onClick={closeQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid color-mix(in srgb, var(--primary) 23%, transparent)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--primary-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden min-[380px]:inline">{isAuthenticated ? 'Account' : 'Sign In'}</span>
          </Link>
          <button
            onClick={toggleQueue}
            className="ml-auto w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all flex-shrink-0"
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
        </nav>

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
              <NowPlayingSection currentItem={currentItem} currentTime={currentTime} duration={duration} removeItem={removeItem} isPlaying={isPlaying} togglePlay={togglePlay} playNext={playNext} playPrev={playPrev} />

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
                removeBatch={removeBatch}
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

        {/* Save as MiniDisc Modal */}
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
                    <h3 className="text-xl font-bold text-white mb-2">MiniDisc Created!</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {totalItems} {totalItems === 1 ? 'song' : 'songs'} saved to &quot;{discName}&quot;
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white mb-4">Save Queue as MiniDisc</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {totalItems} {totalItems === 1 ? 'song' : 'songs'} will be saved
                    </p>
                    <input
                      type="text"
                      value={discName}
                      onChange={(e) => setDiscName(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_NAME_MAX))}
                      maxLength={VALIDATION_LIMITS.MINIDISC_NAME_MAX}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && discName.trim()) {
                          handleSaveQueue();
                        }
                      }}
                      placeholder="MiniDisc name"
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
                          setDiscName('');
                        }}
                        disabled={isSaving}
                        className="flex-1 py-3 px-4 bg-transparent text-white text-sm font-semibold rounded-full transition-colors disabled:opacity-50"
                        style={{ border: '1px solid var(--border-default)' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveQueue}
                        disabled={!discName.trim() || isSaving}
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
          <span className="w-[3.5px] h-[3.5px] rounded-full" style={{ background: 'var(--quinary)' }} />
          <span className="w-[3.5px] h-[3.5px] rounded-full" style={{ background: 'var(--quinary)' }} />
        </span>
      ))}
    </div>
  );
}

// =============================================================================
// Now Playing Section
// =============================================================================

function NowPlayingSection({ currentItem, currentTime, duration, removeItem, isPlaying, togglePlay, playNext, playPrev }: { currentItem: QueueItem | null; currentTime: number; duration: number; removeItem: (queueId: string) => void; isPlaying: boolean; togglePlay: () => void; playNext: () => void; playPrev: () => void }) {
  if (!currentItem) return null;

  const song = currentItem.song;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trackNumber = currentItem.albumSource ? (currentItem.albumSource.originalTrackIndex ?? 0) + 1 : null;
  const versionCount = currentItem.availableVersions.length;
  const hasMultipleVersions = versionCount > 1;

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

      {/* NOW PLAYING label + dismiss button */}
      <div className="flex items-center justify-between mb-3 relative z-[1]">
        <div
          className="font-jb-mono text-[9.5px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: 'var(--quinary)' }}
        >
          Now Playing
        </div>
        <button
          onClick={() => removeItem(currentItem.queueId)}
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 opacity-40 hover:!opacity-100 transition-all"
          style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--secondary-muted)';
            e.currentTarget.style.color = 'var(--secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
          aria-label="Dismiss current song"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Multi-row content — matches SortableTrackRow layout */}
      <div className="flex-1 min-w-0 relative z-[1] mb-3.5">
        <RecordingRow
          song={song}
          trackNumber={trackNumber}
        />
      </div>

      {/* Transport controls — back / play-pause / next */}
      <div className="flex items-center justify-center gap-5 relative z-[1] mb-3.5">
        {/* Previous */}
        <button
          onClick={(e) => { e.stopPropagation(); playPrev(); }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'var(--primary-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="Previous track"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{
            color: 'var(--text-primary)',
            background: 'color-mix(in srgb, var(--quinary) 20%, transparent)',
            border: '1.5px solid color-mix(in srgb, var(--quinary) 40%, transparent)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'color-mix(in srgb, var(--quinary) 35%, transparent)';
            e.currentTarget.style.borderColor = 'var(--quinary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'color-mix(in srgb, var(--quinary) 20%, transparent)';
            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--quinary) 40%, transparent)';
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={(e) => { e.stopPropagation(); playNext(); }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'var(--primary-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="Next track"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
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
  glowType?: ChipGlowType | null;
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
  glowType,
}: SortableTrackRowProps) {
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const modalClosedAtRef = useRef(0);

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
  };

  const song = item.song;
  const year = song.showDate?.split('-')[0] || '';
  const venue = song.showVenue || '';
  const venueDisplay = venue
    ? venue + (year ? ` \u00b7 ${year}` : '')
    : song.artistName;

  const versionCount = item.availableVersions.length;
  const hasMultipleVersions = versionCount > 1;

  return (
    <li ref={setNodeRef} style={style} data-queue-id={item.queueId}>
      <div
        onClick={() => {
          if (isDragging) return;
          if (Date.now() - modalClosedAtRef.current < 300) return;
          playFromQueue(absoluteIndex);
        }}
        className={`group/row flex gap-0 py-2 px-2 mx-1.5 mb-0.5 rounded-[10px] cursor-pointer transition-all relative ${glowType ? glowClassName(glowType) : ''}`}
        style={{
          border: isDragging
            ? '2px dashed color-mix(in srgb, var(--quinary) 70%, transparent)'
            : '1px solid color-mix(in srgb, var(--border-subtle-player) 50%, transparent)',
          background: isDragging
            ? 'color-mix(in srgb, var(--quinary) 15%, var(--player-surface-queue))'
            : 'var(--player-surface-queue)',
        }}
        onMouseEnter={(e) => {
          if (isDragging) return;
          e.currentTarget.style.background = 'var(--player-surface-chip)';
        }}
        onMouseLeave={(e) => {
          if (isDragging) return;
          e.currentTarget.style.background = 'var(--player-surface-queue)';
        }}
      >
        {/* Inner content — hidden when dragging to show dashed placeholder */}
        <div
          className="flex gap-0 w-full"
          style={{ visibility: isDragging ? 'hidden' : 'visible' }}
        >
        {/* Drag handle — self-centering */}
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex-shrink-0 px-1.5 pt-0.5 opacity-25 group-hover/row:opacity-50 transition-opacity cursor-grab active:cursor-grabbing touch-none self-start"
          aria-label={`Reorder ${item.trackTitle}`}
          onClick={(e) => e.stopPropagation()}
        >
          <DragDots />
        </button>

        {/* Multi-row content block */}
        <div className="flex-1 min-w-0 flex items-start gap-1">
          <div className="flex-1 min-w-0">
            <RecordingRow
              song={song}
              trackNumber={displayIndex}
              actions={hasMultipleVersions ? ['swap'] : undefined}
              onSwap={hasMultipleVersions ? () => setShowVersionPicker(true) : undefined}
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeItem(item.queueId);
            }}
            className="w-5 h-5 rounded-md border-0 bg-transparent flex items-center justify-center flex-shrink-0 mt-0.5 opacity-40 hover:!opacity-100 transition-all"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--secondary-muted)';
              e.currentTarget.style.color = 'var(--secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            aria-label={`Remove ${item.trackTitle} from queue`}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        </div>{/* end inner content wrapper */}
      </div>

      {/* Version picker modal */}
      {showVersionPicker && hasMultipleVersions && (
        <VersionPickerModal
          isOpen={showVersionPicker}
          onClose={() => { modalClosedAtRef.current = Date.now(); setShowVersionPicker(false); }}
          trackTitle={item.trackTitle}
          trackNumber={displayIndex}
          artistName={song.artistName}
          currentSongId={song.id}
          versions={item.availableVersions}
          coverArt={item.albumSource?.coverArt}
          onSwapVersion={(newSong) => selectVersion(item.queueId, newSong)}
        />
      )}
    </li>
  );
}

// =============================================================================
// Drag Overlay Content — faithful clone of SortableTrackRow during drag
// =============================================================================

function DragOverlayTrack({
  item,
  displayIndex,
  preferredQuality,
}: {
  item: QueueItem;
  displayIndex: number;
  preferredQuality: AudioQuality;
}) {
  const song = item.song;
  const versionCount = item.availableVersions.length;
  const hasMultipleVersions = versionCount > 1;

  return (
    <div
      className="flex gap-0 py-2 px-2 rounded-[10px] scale-[1.03]"
      style={{
        background: 'color-mix(in srgb, var(--quinary) 12%, var(--player-surface-chip))',
        border: '1px solid var(--quinary-muted)',
        boxShadow: '0 12px 40px color-mix(in srgb, black 55%, transparent), 0 0 0 1px color-mix(in srgb, var(--quinary) 20%, transparent)',
      }}
    >
      {/* Drag handle */}
      <div className="flex-shrink-0 px-1.5 pt-0.5 opacity-60">
        <DragDots />
      </div>

      {/* Multi-row content block */}
      <div className="flex-1 min-w-0">
        <RecordingRow
          song={song}
          trackNumber={displayIndex}
        />
      </div>
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
  removeBatch: (batchId: string) => void;
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
  /** True when this is a single song added individually (not an album group) */
  isSingle?: boolean;
}

// All groups use unified dark player-surface styling

function UpcomingSection({
  queue,
  albumGroups,
  removeItem,
  removeBatch,
  clearUpcoming,
  playFromQueue,
  moveItem,
  selectVersion,
  onSave,
  totalItems,
  hasItems,
  preferredQuality,
}: UpcomingSectionProps) {
  const [dragState, setDragState] = useState<{ queueId: string; item: QueueItem; displayIndex: number } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const upcomingCount = queue.items.length - (queue.cursorIndex + 1);

  // ─── Jump to glowing row, then glow ──────────────────────────────
  const { chipGlow } = useQueue();
  const [delayedGlow, setDelayedGlow] = useState<ChipGlow>(null);

  useEffect(() => {
    if (!chipGlow || !scrollContainerRef.current) {
      setDelayedGlow(chipGlow ?? null);
      return;
    }

    setDelayedGlow(null);

    const container = scrollContainerRef.current;
    const targetId = chipGlow.queueIds[0];
    const captured = chipGlow;

    const raf = requestAnimationFrame(() => {
      const el = container.querySelector(`[data-queue-id="${targetId}"]`) as HTMLElement | null;
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      setTimeout(() => setDelayedGlow(captured), 80);
    });

    return () => cancelAnimationFrame(raf);
  }, [chipGlow]);

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

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
          isSingle: true,
        });
        i++;
      }
    }

    return result;
  }, [queue.items, queue.cursorIndex, albumGroups]);

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

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    for (const group of sidebarGroups) {
      const idx = group.items.findIndex(i => i.item.queueId === id);
      if (idx !== -1) {
        const dragItem = group.items[idx].item;
        setDragState({ queueId: id, item: dragItem, displayIndex: (dragItem.albumSource?.originalTrackIndex ?? idx) + 1 });
        return;
      }
    }
  }, [sidebarGroups]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragState(null);
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
      {/* Queue label */}
      <span className="font-jb-mono text-[13px] font-semibold tracking-[0.14em] uppercase text-primary px-5 pt-1 pb-1 flex-shrink-0">
        Queue
      </span>
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

      {/* Single-column track list with inline sticky album cards */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto py-1.5 px-1 queue-sidebar-scroll min-h-0">
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
                const isCollapsed = collapsedGroups.has(group.id);
                const totalDuration = group.items.reduce((sum, { item }) => sum + (item.song.duration || 0), 0);

                // Single song — render as a bare track row, no album card
                if (group.isSingle) {
                  const { item, absoluteIndex } = group.items[0];
                  return (
                    <SortableTrackRow
                      key={group.id}
                      item={item}
                      absoluteIndex={absoluteIndex}
                      displayIndex={1}
                      removeItem={removeItem}
                      playFromQueue={playFromQueue}
                      selectVersion={selectVersion}
                      preferredQuality={preferredQuality}
                      glowType={delayedGlow?.queueIds.includes(item.queueId) ? delayedGlow.type : null}
                    />
                  );
                }

                return (
                  <li
                    key={group.id}
                    className="mx-1.5 mb-2 rounded-xl overflow-hidden relative"
                    style={{
                      background: 'var(--player-surface-queue)',
                      border: '1px solid color-mix(in srgb, var(--border-subtle-player) 50%, transparent)',
                    }}
                  >
                    {/* Album card — sticky when expanded, static when collapsed */}
                    <div
                      className={`${isCollapsed ? '' : 'sticky top-0'} z-[3] p-1.5 ${isCollapsed ? 'pb-1.5' : 'pb-1'}`}
                      style={{
                        background: 'var(--player-surface-chip)',
                        boxShadow: isCollapsed ? 'none' : '0 4px 12px -2px color-mix(in srgb, black 40%, transparent)',
                      }}
                    >
                      <div
                        className="group/album relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                        style={{}}
                        onClick={() => toggleGroup(group.id)}
                      >
                        {/* Chevron */}
                        <svg
                          className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
                          style={{
                            color: 'var(--secondary)',
                            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                          }}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <TicketStub coverArt={group.coverArt} albumName={group.albumName} size={46} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-primary truncate" style={{ lineHeight: '1.25' }}>
                            {group.albumName}
                          </p>
                          {(group.venue || group.year) && (
                            <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                              {[group.venue, group.year].filter(Boolean).join(' \u00b7 ')}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-12 h-[3px] rounded-sm overflow-hidden" style={{ background: 'var(--primary-muted)' }}>
                              <div
                                className="h-full rounded-sm"
                                style={{
                                  width: `${pct}%`,
                                  background: 'var(--secondary)',
                                }}
                              />
                            </div>
                            <span className="font-jb-mono text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                              {isCollapsed
                                ? `${group.items.length} tracks${totalDuration > 0 ? ` \u00b7 ${formatDuration(totalDuration)}` : ''}`
                                : `${played}/${total} played`
                              }
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeBatch(group.batchId); }}
                          className="absolute top-1 right-0 w-5 h-5 flex items-center justify-center rounded-full opacity-40 hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--text-tertiary)' }}
                          aria-label={`Remove ${group.albumName} from queue`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Divider between album header and tracks */}
                    {!isCollapsed && (
                      <div className="mx-3" style={{ borderTop: '1px solid var(--border-subtle-player)' }} />
                    )}

                    {/* Track rows — hidden when collapsed */}
                    {!isCollapsed && (
                      <ul className="pb-1 relative z-[1]" style={{ background: 'var(--player-surface-queue)' }}>
                        {group.items.map(({ item, absoluteIndex }, idx) => (
                          <SortableTrackRow
                            key={item.queueId}
                            item={item}
                            absoluteIndex={absoluteIndex}
                            displayIndex={(item.albumSource?.originalTrackIndex ?? idx) + 1}
                            removeItem={removeItem}
                            playFromQueue={playFromQueue}
                            selectVersion={selectVersion}
                            preferredQuality={preferredQuality}
                            hideVenue
                            glowType={delayedGlow?.queueIds.includes(item.queueId) ? delayedGlow.type : null}
                          />
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {dragState && (
              <DragOverlayTrack
                item={dragState.item}
                displayIndex={dragState.displayIndex}
                preferredQuality={preferredQuality}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
