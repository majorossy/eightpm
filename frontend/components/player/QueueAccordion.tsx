'use client';

// QueueAccordion - Horizontal accordion for the queue strip.
// Groups consecutive same-album tracks into collapsible headers.
// Single-track items render as standalone chips.
// Drag past group boundary → detach track from album (assigns new batchId).

import { useState, useMemo, useCallback, useRef, useEffect, Fragment } from 'react';
import Image from 'next/image';
import type { QueueItem, QueueItemAlbumSource } from '@/lib/queueTypes';
import type { Song, AudioQuality } from '@/lib/types';
import { SortableQueueChip } from '@/components/player/QueueStrip';
import QueueChip from '@/components/player/QueueChip';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

// ─── Types ───────────────────────────────────────────────────────────

interface ChipEntry {
  item: QueueItem;
  absoluteIndex: number;
  isPlayed: boolean;
  isCurrent: boolean;
}

interface StripGroup {
  type: 'album' | 'standalone';
  key: string;
  batchId: string;
  albumSource: QueueItemAlbumSource | null;
  chips: ChipEntry[];
  colorVar: string;
  isFullyPlayed: boolean;
  playedInGroup: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const ACCENT_COLORS = ['var(--quinary)', 'var(--tertiary)', 'var(--quaternary)'];
const COLLAPSED_W = 52;
const CHIP_STRIDE = 202; // 194px chip + 8px gap

// ─── Props ───────────────────────────────────────────────────────────

interface QueueAccordionProps {
  queueChips: ChipEntry[];
  totalUpcoming: number;
  playedCount: number;
  onChipPlay: (index: number) => void;
  onRemoveItem: (queueId: string) => void;
  onSelectVersion: (queueId: string, song: Song) => void;
  onMoveItem: (from: number, to: number) => void;
  onDetachItem: (queueId: string, targetIndex: number) => void;
  preferredQuality: AudioQuality;
}

// ─── Component ───────────────────────────────────────────────────────

export default function QueueAccordion({
  queueChips,
  totalUpcoming,
  playedCount,
  onChipPlay,
  onRemoveItem,
  onSelectVersion,
  onMoveItem,
  onDetachItem,
  preferredQuality,
}: QueueAccordionProps) {

  // ─── Grouping ──────────────────────────────────────────────────────

  const groups = useMemo(() => {
    const result: StripGroup[] = [];
    let colorIdx = 0;
    let i = 0;

    while (i < queueChips.length) {
      const chip = queueChips[i];

      // Try to form a multi-track album group
      if (chip.item.albumSource) {
        const groupChips: ChipEntry[] = [chip];
        let j = i + 1;
        while (
          j < queueChips.length &&
          queueChips[j].item.albumSource &&
          queueChips[j].item.batchId === chip.item.batchId
        ) {
          groupChips.push(queueChips[j]);
          j++;
        }

        if (groupChips.length > 1) {
          const playedInGroup = groupChips.filter(c => c.isPlayed).length;
          result.push({
            type: 'album',
            key: `album-${chip.item.batchId}-${i}`,
            batchId: chip.item.batchId,
            albumSource: chip.item.albumSource,
            chips: groupChips,
            colorVar: ACCENT_COLORS[colorIdx % ACCENT_COLORS.length],
            isFullyPlayed: playedInGroup === groupChips.length,
            playedInGroup,
          });
          colorIdx++;
          i = j;
          continue;
        }
      }

      // Standalone chip (no albumSource, or single-track album group)
      result.push({
        type: 'standalone',
        key: `standalone-${chip.item.queueId}`,
        batchId: chip.item.batchId,
        albumSource: chip.item.albumSource,
        chips: [chip],
        colorVar: '',
        isFullyPlayed: chip.isPlayed,
        playedInGroup: chip.isPlayed ? 1 : 0,
      });
      i++;
    }

    return result;
  }, [queueChips]);

  // ─── Global index lookup ───────────────────────────────────────────

  const chipGlobalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    queueChips.forEach((c, idx) => map.set(c.item.queueId, idx));
    return map;
  }, [queueChips]);

  // ─── Drop zone targets ────────────────────────────────────────────

  const dropZones = useMemo(() => {
    const zones: { id: string; insertAtIndex: number }[] = [];
    for (let gi = 0; gi <= groups.length; gi++) {
      if (gi < groups.length) {
        // Before this group → insert at first chip's absoluteIndex
        zones.push({
          id: `dz-${gi}`,
          insertAtIndex: groups[gi].chips[0].absoluteIndex,
        });
      } else {
        // After last group → insert after last chip
        const lastGroup = groups[groups.length - 1];
        const lastChip = lastGroup.chips[lastGroup.chips.length - 1];
        zones.push({
          id: `dz-${gi}`,
          insertAtIndex: lastChip.absoluteIndex + 1,
        });
      }
    }
    return zones;
  }, [groups]);

  // ─── Expand State ──────────────────────────────────────────────────

  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // First non-fully-played album group
  const firstUpcomingAlbumKey = useMemo(() => {
    return groups.find(g => g.type === 'album' && !g.isFullyPlayed)?.key ?? null;
  }, [groups]);

  // Auto-expand: on mount or when track advances into a new group
  useEffect(() => {
    if (!firstUpcomingAlbumKey) return;
    setExpandedKey(prev => {
      if (prev) {
        const stillValid = groups.some(g => g.key === prev && !g.isFullyPlayed);
        if (stillValid) return prev;
      }
      return firstUpcomingAlbumKey;
    });
  }, [firstUpcomingAlbumKey, groups]);

  const toggleExpand = useCallback((key: string) => {
    setExpandedKey(prev => prev === key ? null : key);
  }, []);

  // ─── DnD ───────────────────────────────────────────────────────────

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const dndSensors = useSensors(pointerSensor);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isDetaching, setIsDetaching] = useState(false);
  const isDetachingRef = useRef(false);

  // Only expanded group's non-played chips are sortable
  const sortableIds = useMemo(() => {
    if (!expandedKey) return [];
    const expandedGroup = groups.find(g => g.key === expandedKey);
    if (!expandedGroup || expandedGroup.type !== 'album') return [];
    return expandedGroup.chips
      .filter(c => !c.isPlayed)
      .map(c => c.item.queueId);
  }, [expandedKey, groups]);

  const activeDragItem = useMemo(() => {
    if (!activeDragId) return null;
    return queueChips.find(c => c.item.queueId === activeDragId) ?? null;
  }, [activeDragId, queueChips]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!expandedKey || !activeDragId) {
      if (isDetachingRef.current) {
        isDetachingRef.current = false;
        setIsDetaching(false);
      }
      return;
    }

    const groupEl = groupRefs.current.get(expandedKey);
    if (!groupEl) return;

    const rect = groupEl.getBoundingClientRect();
    const activatorEvent = event.activatorEvent as PointerEvent;
    const pointerX = activatorEvent.clientX + (event.delta?.x ?? 0);
    const nowDetaching = pointerX < rect.left - 10 || pointerX > rect.right + 10;

    if (nowDetaching !== isDetachingRef.current) {
      isDetachingRef.current = nowDetaching;
      setIsDetaching(nowDetaching);
    }
  }, [expandedKey, activeDragId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const wasDetaching = isDetachingRef.current;
    setActiveDragId(null);
    setIsDetaching(false);
    isDetachingRef.current = false;

    const { active, over } = event;

    // Detach path — pointer was outside group boundary when released
    if (wasDetaching) {
      const fromEntry = queueChips.find(c => c.item.queueId === String(active.id));
      if (!fromEntry) return;

      // If dropped on a drop zone, use its insertAtIndex
      const dropData = over?.data?.current as { insertAtIndex?: number; isDropZone?: boolean } | undefined;
      if (dropData?.isDropZone && typeof dropData.insertAtIndex === 'number') {
        onDetachItem(fromEntry.item.queueId, dropData.insertAtIndex);
        return;
      }

      // Otherwise, calculate insertion from pointer position vs group positions
      const activatorEvent = event.activatorEvent as PointerEvent;
      const pointerX = activatorEvent.clientX + (event.delta?.x ?? 0);
      let targetIndex = fromEntry.absoluteIndex; // fallback: stays in place

      // Find nearest group boundary
      for (let gi = 0; gi < groups.length; gi++) {
        const groupEl = groupRefs.current.get(groups[gi].key);
        if (!groupEl) continue;
        const rect = groupEl.getBoundingClientRect();
        if (pointerX < rect.left + rect.width / 2) {
          targetIndex = groups[gi].chips[0].absoluteIndex;
          break;
        }
        // Past this group — insert after it
        const lastChip = groups[gi].chips[groups[gi].chips.length - 1];
        targetIndex = lastChip.absoluteIndex + 1;
      }

      onDetachItem(fromEntry.item.queueId, targetIndex);
      return;
    }

    // Standard within-group reorder
    if (!over || active.id === over.id) return;
    const fromEntry = queueChips.find(c => c.item.queueId === String(active.id));
    const toEntry = queueChips.find(c => c.item.queueId === String(over.id));
    if (fromEntry && toEntry) {
      onMoveItem(fromEntry.absoluteIndex, toEntry.absoluteIndex);
    }
  }, [queueChips, groups, onMoveItem, onDetachItem]);

  // ─── Reduced Motion ────────────────────────────────────────────────

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // ─── Auto-scroll on expand ─────────────────────────────────────────

  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expandedKey) return;
    const el = groupRefs.current.get(expandedKey);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    }
  }, [expandedKey]);

  // ─── Left fade mask ────────────────────────────────────────────────

  const [showLeftFade, setShowLeftFade] = useState(false);
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => setShowLeftFade(el.scrollLeft > 0);
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [groups.length]);

  // ─── Render ────────────────────────────────────────────────────────

  const isDragActive = !!activeDragId;

  return (
    <div className="relative">
      <DndContext
        sensors={dndSensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
          <div ref={scrollContainerRef} className="flex gap-2 overflow-x-auto queue-scrollbar pb-1">
            {groups.map((group, groupIndex) => (
              <Fragment key={group.key}>
                {/* Drop zone before this group */}
                <DropZone
                  id={dropZones[groupIndex]?.id ?? `dz-${groupIndex}`}
                  insertAtIndex={dropZones[groupIndex]?.insertAtIndex ?? 0}
                  isDragActive={isDragActive}
                  isDetaching={isDetaching}
                />

                {group.type === 'standalone' ? (
                  <StandaloneChip
                    chipEntry={group.chips[0]}
                    playedCount={playedCount}
                    chipGlobalIndexMap={chipGlobalIndexMap}
                    onChipPlay={onChipPlay}
                    onRemoveItem={onRemoveItem}
                    onSelectVersion={onSelectVersion}
                    preferredQuality={preferredQuality}
                  />
                ) : (
                  <AlbumGroupSection
                    group={group}
                    isExpanded={expandedKey === group.key}
                    expandedWidth={COLLAPSED_W + 8 + group.chips.length * CHIP_STRIDE}
                    reducedMotion={reducedMotion}
                    playedCount={playedCount}
                    chipGlobalIndexMap={chipGlobalIndexMap}
                    groupRefs={groupRefs}
                    onToggle={() => !group.isFullyPlayed && toggleExpand(group.key)}
                    onChipPlay={onChipPlay}
                    onRemoveItem={onRemoveItem}
                    onSelectVersion={onSelectVersion}
                    preferredQuality={preferredQuality}
                  />
                )}
              </Fragment>
            ))}

            {/* Drop zone after last group */}
            {groups.length > 0 && (
              <DropZone
                id={dropZones[groups.length]?.id ?? 'dz-end'}
                insertAtIndex={dropZones[groups.length]?.insertAtIndex ?? 0}
                isDragActive={isDragActive}
                isDetaching={isDetaching}
              />
            )}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeDragItem ? (
            <div
              className="relative"
              style={{
                transform: isDetaching ? 'scale(0.93)' : 'scale(1)',
                transition: 'transform 150ms ease-out',
              }}
            >
              <QueueChip
                item={activeDragItem.item}
                chipIndex={(chipGlobalIndexMap.get(activeDragItem.item.queueId) ?? 0) + 1}
                absoluteIndex={activeDragItem.absoluteIndex}
                onPlay={() => {}}
                preferredQuality={preferredQuality}
                isDragging
              />
              {/* Detach indicator badge */}
              {isDetaching && (
                <div
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    background: 'var(--accent-secondary)',
                    boxShadow: '0 0 8px var(--accent-secondary)',
                  }}
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Fade masks */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-surface-player-queue to-transparent pointer-events-none z-[1]" />
      )}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface-player-queue to-transparent pointer-events-none" />
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────

function DropZone({
  id,
  insertAtIndex,
  isDragActive,
  isDetaching,
}: {
  id: string;
  insertAtIndex: number;
  isDragActive: boolean;
  isDetaching: boolean;
}) {
  // Only register as droppable when detaching — prevents collision
  // interference with sortable items during within-group reorder
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { insertAtIndex, isDropZone: true },
    disabled: !isDragActive || !isDetaching,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 flex items-center justify-center self-stretch"
      style={{
        width: isDragActive ? '20px' : '1px',
        transition: 'width 150ms ease-out',
        minHeight: '48px',
      }}
    >
      <div
        className="rounded-full transition-all duration-150"
        style={{
          width: '2px',
          height: isOver ? '100%' : isDetaching ? '50%' : '0%',
          background: isOver
            ? 'var(--accent-secondary)'
            : isDetaching
              ? 'color-mix(in srgb, var(--border-default) 40%, transparent)'
              : 'transparent',
          boxShadow: isOver
            ? '0 0 8px var(--accent-secondary), 0 0 16px color-mix(in srgb, var(--accent-secondary) 30%, transparent)'
            : 'none',
        }}
      />
    </div>
  );
}

function StandaloneChip({
  chipEntry,
  playedCount,
  chipGlobalIndexMap,
  onChipPlay,
  onRemoveItem,
  onSelectVersion,
  preferredQuality,
}: {
  chipEntry: ChipEntry;
  playedCount: number;
  chipGlobalIndexMap: Map<string, number>;
  onChipPlay: (index: number) => void;
  onRemoveItem: (queueId: string) => void;
  onSelectVersion: (queueId: string, song: Song) => void;
  preferredQuality: AudioQuality;
}) {
  const { item, absoluteIndex, isPlayed } = chipEntry;
  const globalIdx = chipGlobalIndexMap.get(item.queueId) ?? -1;
  const isActive = !isPlayed && globalIdx === playedCount;

  return (
    <QueueChip
      item={item}
      chipIndex={absoluteIndex + 1}
      absoluteIndex={absoluteIndex}
      onPlay={onChipPlay}
      onRemove={isPlayed ? undefined : onRemoveItem}
      onSelectVersion={onSelectVersion}
      preferredQuality={preferredQuality}
      isActive={isActive}
      isPlayed={isPlayed}
    />
  );
}

function AlbumGroupSection({
  group,
  isExpanded,
  expandedWidth,
  reducedMotion,
  playedCount,
  chipGlobalIndexMap,
  groupRefs,
  onToggle,
  onChipPlay,
  onRemoveItem,
  onSelectVersion,
  preferredQuality,
}: {
  group: StripGroup;
  isExpanded: boolean;
  expandedWidth: number;
  reducedMotion: boolean;
  playedCount: number;
  chipGlobalIndexMap: Map<string, number>;
  groupRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onToggle: () => void;
  onChipPlay: (index: number) => void;
  onRemoveItem: (queueId: string) => void;
  onSelectVersion: (queueId: string, song: Song) => void;
  preferredQuality: AudioQuality;
}) {
  const canExpand = !group.isFullyPlayed;

  return (
    <div
      ref={(el) => {
        if (el) groupRefs.current.set(group.key, el);
        else groupRefs.current.delete(group.key);
      }}
      className="flex-shrink-0 overflow-hidden flex"
      style={{
        maxWidth: isExpanded ? `${expandedWidth}px` : `${COLLAPSED_W}px`,
        transition: reducedMotion ? 'none' : 'max-width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: group.isFullyPlayed ? 0.4 : 1,
      }}
    >
      {/* Collapsed header strip — always visible */}
      <AlbumHeader
        group={group}
        isExpanded={isExpanded}
        canExpand={canExpand}
        onToggle={onToggle}
      />

      {/* Expanded chips section */}
      {isExpanded && (
        <div className="flex gap-2 pl-2">
          {group.chips.map((chipEntry) => {
            const globalIdx = chipGlobalIndexMap.get(chipEntry.item.queueId) ?? -1;
            const isActive = !chipEntry.isPlayed && globalIdx === playedCount;
            return (
              <SortableQueueChip
                key={chipEntry.item.queueId}
                item={chipEntry.item}
                chipIndex={chipEntry.absoluteIndex + 1}
                absoluteIndex={chipEntry.absoluteIndex}
                onPlay={onChipPlay}
                onRemove={onRemoveItem}
                onSelectVersion={onSelectVersion}
                preferredQuality={preferredQuality}
                isActive={isActive}
                isPlayed={chipEntry.isPlayed}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function AlbumHeader({
  group,
  isExpanded,
  canExpand,
  onToggle,
}: {
  group: StripGroup;
  isExpanded: boolean;
  canExpand: boolean;
  onToggle: () => void;
}) {
  const progressPct = (group.playedInGroup / group.chips.length) * 100;

  return (
    <button
      onClick={onToggle}
      disabled={!canExpand}
      className={`
        flex-shrink-0 flex flex-col items-center gap-1 py-1.5 px-0.5 rounded-lg
        transition-colors relative
        ${canExpand ? 'cursor-pointer hover:bg-surface-player-chip-hover' : 'cursor-default'}
      `}
      style={{
        width: `${COLLAPSED_W}px`,
        background: isExpanded
          ? 'color-mix(in srgb, var(--player-surface-chip) 80%, transparent)'
          : 'var(--player-surface-chip)',
        border: `1px solid ${isExpanded ? group.colorVar : 'var(--border-subtle-player)'}`,
        borderLeft: `3px solid ${group.colorVar}`,
      }}
      aria-label={`${group.albumSource?.albumName ?? 'Album'} - ${group.chips.length} tracks${isExpanded ? ', click to collapse' : ', click to expand'}`}
      title={group.albumSource?.albumName ?? 'Album'}
    >
      {/* Album art */}
      <div className="w-[38px] h-[38px] rounded overflow-hidden flex-shrink-0">
        {group.albumSource?.coverArt ? (
          <Image
            src={group.albumSource.coverArt}
            alt=""
            width={38}
            height={38}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--player-surface-chip-hover), var(--player-surface-deep))' }}
          >
            <svg className="w-4 h-4 text-tertiary opacity-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Track count badge */}
      <span className="font-jb-mono text-[8px] font-semibold text-secondary leading-none whitespace-nowrap">
        {group.chips.length} trk
      </span>

      {/* Mini progress bar */}
      <div
        className="w-full h-[2px] rounded-full overflow-hidden"
        style={{ background: 'color-mix(in srgb, var(--border-default) 25%, transparent)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%`, background: group.colorVar }}
        />
      </div>

      {/* Chevron */}
      <svg
        className="w-3 h-3 text-tertiary transition-transform duration-200"
        style={{ transform: isExpanded ? 'rotate(-90deg)' : 'rotate(90deg)' }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
