'use client';

// Queue drawer - card-stack layout with expand/collapse detail panels (Campfire theme)

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { useMobileUI } from '@/context/MobileUIContext';
import { formatDuration } from '@/lib/api';
import { AlbumGroup, QueueItem } from '@/lib/queueTypes';
import type { Song } from '@/lib/types';
import TicketStubCard from '@/components/TicketStubCard';

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

type RenderEntry =
  | { type: 'group-header'; group: AlbumGroup }
  | { type: 'track'; item: QueueItem; absoluteIndex: number };

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
        className="fixed inset-0 z-[60] bg-black/60"
        onClick={toggleQueue}
        aria-hidden="true"
      />

      {/* Drawer - Full screen on mobile */}
      <aside
        className={`fixed z-[70] flex flex-col ${
          isMobile
            ? 'inset-0 bg-[#1c1a17] safe-top safe-bottom'
            : 'left-0 top-0 bottom-0 w-96 bg-[#1c1a17] border-r border-[#2d2a26]/50'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Queue"
      >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-xs font-medium text-[#8a8478] uppercase tracking-[0.2em]">Queue</h2>
            <button
              onClick={toggleQueue}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[#3a3632] text-[#8a8478] hover:text-white hover:border-[#6a6458] transition-colors"
              aria-label="Close queue"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto prevent-overscroll px-4" role="region" aria-label="Queue tracks">
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
                <NowPlayingSection currentItem={currentItem} currentTime={currentTime} duration={duration} />

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
// Compact Card Summary — used by DragOverlay only
// =============================================================================

function CardSummary({ item }: { item: QueueItem }) {
  const song = item.song;

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
          className="object-cover rounded-md flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 bg-[#2d2a26] rounded-md flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-[#3a3632]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
      )}

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.trackTitle}</p>
        <p className="text-xs text-[#8a8478] truncate">{song.artistName}</p>
      </div>

      {/* Duration */}
      {song.duration > 0 && (
        <span className="text-xs text-[#6a6458] font-mono flex-shrink-0">{formatDuration(song.duration)}</span>
      )}
    </div>
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
    <div className="mb-5">
      <div className="rounded-xl border border-[#3a3632]/60 bg-[#252220] p-4">
        {/* Now Playing label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-[#d4a060] rounded-full" />
          <span className="text-[10px] font-bold text-[#d4a060] uppercase tracking-[0.15em]">Now Playing</span>
        </div>

        {/* Track info */}
        <div className="flex items-center gap-3 mb-3">
          {currentItem.albumSource?.coverArt ? (
            <Image
              src={currentItem.albumSource.coverArt}
              alt={currentItem.albumSource.albumName || 'Album cover'}
              width={56}
              height={56}
              quality={80}
              className="object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-[#2d2a26] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-[#3a3632]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{currentItem.song.title}</p>
            <p className="text-sm text-[#8a8478] truncate">{currentItem.song.artistName}</p>
            {showInfo && (
              <p className="text-xs text-[#6a6458] truncate mt-0.5">{showInfo}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="w-full h-[3px] bg-[#3a3632] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#d4a060] rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-[#8a8478] font-mono">{formatDuration(Math.floor(currentTime))}</span>
            <span className="text-[11px] text-[#8a8478] font-mono">{formatDuration(Math.floor(duration))}</span>
          </div>
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
// Sortable Track Row — ticket stub flip card with drag handle
// =============================================================================

interface SortableTrackRowProps {
  item: QueueItem;
  absoluteIndex: number;
  displayIndex: number;
  removeItem: (queueId: string) => void;
  playFromQueue: (index: number) => void;
  selectVersion: (queueId: string, song: Song) => void;
}

function SortableTrackRow({
  item,
  absoluteIndex,
  displayIndex,
  removeItem,
  playFromQueue,
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
    <li ref={setNodeRef} style={style}>
      <TicketStubCard
        item={item}
        index={displayIndex}
        absoluteIndex={absoluteIndex}
        onPlay={playFromQueue}
        onSelectVersion={selectVersion}
        onRemove={removeItem}
        variant="vertical"
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </li>
  );
}

// =============================================================================
// Drag Overlay Track Content (rendered in DragOverlay portal) — card style
// =============================================================================

function DragOverlayTrack({ item }: { item: QueueItem }) {
  return (
    <div className="px-3 py-3 bg-[#2d2a26] rounded-xl shadow-lg shadow-black/50 border border-[#d4a060]/30 flex items-center gap-2">
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
}

function UpcomingSection({
  queue,
  albumGroups,
  removeItem,
  clearUpcoming,
  playFromQueue,
  moveItem,
  moveBlock,
  selectVersion,
  onSave,
  totalItems,
  hasItems,
}: UpcomingSectionProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const upcomingCount = queue.items.length - (queue.cursorIndex + 1);

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
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
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

  // Both mobile and desktop: DnD enabled (drag handle activator works with touch)
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#8a8478] uppercase tracking-[0.15em]">
          Up Next <span className="text-[#d4a060]">&middot; {upcomingCount} tracks</span>
        </p>
        <div className="flex items-center gap-3">
          {hasItems && totalItems > 0 && (
            <button
              onClick={onSave}
              className="text-xs text-[#8a8478] hover:text-white transition-colors"
            >
              Save
            </button>
          )}
          <button
            onClick={clearUpcoming}
            className="text-xs text-[#8a8478] hover:text-white transition-colors"
            aria-label={`Clear upcoming queue (${upcomingCount} songs)`}
          >
            Clear
          </button>
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
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
                  displayIndex={entry.absoluteIndex - queue.cursorIndex}
                  removeItem={removeItem}
                  playFromQueue={playFromQueue}
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
