'use client';

// QueueAccordion - Horizontal accordion for the queue strip.
// Groups consecutive same-album tracks into collapsible headers.
// Single-track items render as standalone chips.
// Drag past group boundary → detach track from album (assigns new batchId).

import { useState, useMemo, useCallback, useRef, useEffect, Fragment } from 'react';
import type { QueueItem, QueueItemAlbumSource } from '@/lib/queueTypes';
import type { ChipGlow } from '@/lib/chipGlow';
import { glowClassName } from '@/lib/chipGlow';
import TicketStub from '@/components/TicketStub';
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
  groupIndex: number;
}

// ─── Constants ───────────────────────────────────────────────────────

// All album groups use teal (--tertiary) for neutral framing.
// Even/odd index provides visual distinction via background tint.
const COLLAPSED_W = 94;
const COLLAPSED_W_COMPACT = 71;
const CHIP_STRIDE = 345; // 337px chip + 8px gap
const CHIP_STRIDE_COMPACT = 238; // 230px chip + 8px gap

// ─── Props ───────────────────────────────────────────────────────────

interface QueueAccordionProps {
  queueChips: ChipEntry[];
  totalUpcoming: number;
  playedCount: number;
  onChipPlay: (index: number) => void;
  onRemoveItem: (queueId: string) => void;
  onRemoveBatch: (batchId: string) => void;
  onSelectVersion: (queueId: string, song: Song) => void;
  onMoveItem: (from: number, to: number) => void;
  onDetachItem: (queueId: string, targetIndex: number) => void;
  onRestoreFromHistory: (queueId: string, targetIndex: number) => void;
  preferredQuality: AudioQuality;
  /** Compact mode for mobile — smaller chips and headers */
  compact?: boolean;
  /** Active chip glow state (swap / play-next / queued) */
  chipGlow?: ChipGlow;
}

// ─── Component ───────────────────────────────────────────────────────

export default function QueueAccordion({
  queueChips,
  totalUpcoming,
  playedCount,
  onChipPlay,
  onRemoveItem,
  onRemoveBatch,
  onSelectVersion,
  onMoveItem,
  onDetachItem,
  onRestoreFromHistory,
  preferredQuality,
  compact,
  chipGlow,
}: QueueAccordionProps) {

  // ─── History / Upcoming Split ──────────────────────────────────────

  const { historyChips, upcomingChips } = useMemo(() => {
    const history: ChipEntry[] = [];
    const upcoming: ChipEntry[] = [];
    for (const chip of queueChips) {
      if (chip.isPlayed) history.push(chip);
      else upcoming.push(chip);
    }
    return { historyChips: history, upcomingChips: upcoming };
  }, [queueChips]);

  const [historyOpen, setHistoryOpen] = useState(false);

  // Auto-close history if all history chips disappear (e.g., queue cleared)
  useEffect(() => {
    if (historyChips.length === 0 && historyOpen) setHistoryOpen(false);
  }, [historyChips.length, historyOpen]);

  // ─── Grouping (upcoming only) ────────────────────────────────────

  const groups = useMemo(() => {
    const result: StripGroup[] = [];
    const usedKeys = new Set<string>();
    let colorIdx = 0;
    let i = 0;

    while (i < upcomingChips.length) {
      const chip = upcomingChips[i];

      // Try to form a multi-track album group
      if (chip.item.albumSource) {
        const groupChips: ChipEntry[] = [chip];
        let j = i + 1;
        while (
          j < upcomingChips.length &&
          upcomingChips[j].item.albumSource &&
          upcomingChips[j].item.batchId === chip.item.batchId
        ) {
          groupChips.push(upcomingChips[j]);
          j++;
        }

        if (groupChips.length > 1) {
          // Key uses batchId for stability (index-based keys shift when queue changes).
          // Fallback suffix for rare split-album case (same batchId, non-consecutive).
          let key = `album-${chip.item.batchId}`;
          if (usedKeys.has(key)) key = `${key}-${groupChips[0].item.queueId}`;
          usedKeys.add(key);
          result.push({
            type: 'album',
            key,
            batchId: chip.item.batchId,
            albumSource: chip.item.albumSource,
            chips: groupChips,
            groupIndex: colorIdx,
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
        groupIndex: -1,
      });
      i++;
    }

    return result;
  }, [upcomingChips]);

  // ─── Global index lookup ───────────────────────────────────────────

  const chipGlobalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    queueChips.forEach((c, idx) => map.set(c.item.queueId, idx));
    return map;
  }, [queueChips]);

  // ─── Drop zone targets ────────────────────────────────────────────

  const dropZones = useMemo(() => {
    if (groups.length === 0) return [];
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
  // All album groups are expanded by default. User can manually collapse individual ones.

  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((key: string) => {
    setCollapsedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ─── DnD ───────────────────────────────────────────────────────────

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const dndSensors = useSensors(pointerSensor);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isDetaching, setIsDetaching] = useState(false);
  const isDetachingRef = useRef(false);

  // Sortable IDs: history chips (when open) + all expanded album groups' chips
  const sortableIds = useMemo(() => {
    const ids: string[] = [];
    if (historyOpen) {
      historyChips.forEach(c => ids.push(c.item.queueId));
    }
    for (const g of groups) {
      if (g.type === 'standalone') {
        g.chips.filter(c => !c.isPlayed).forEach(c => ids.push(c.item.queueId));
      } else if (g.type === 'album' && !collapsedKeys.has(g.key)) {
        g.chips.filter(c => !c.isPlayed).forEach(c => ids.push(c.item.queueId));
      }
    }
    return ids;
  }, [historyOpen, historyChips, collapsedKeys, groups]);

  const activeDragItem = useMemo(() => {
    if (!activeDragId) return null;
    return queueChips.find(c => c.item.queueId === activeDragId) ?? null;
  }, [activeDragId, queueChips]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!activeDragId) {
      if (isDetachingRef.current) {
        isDetachingRef.current = false;
        setIsDetaching(false);
      }
      return;
    }

    // Find which expanded album group the dragged item belongs to
    const dragGroup = groups.find(g =>
      g.type === 'album' && !collapsedKeys.has(g.key) &&
      g.chips.some(c => c.item.queueId === activeDragId)
    );
    if (!dragGroup) {
      if (isDetachingRef.current) {
        isDetachingRef.current = false;
        setIsDetaching(false);
      }
      return;
    }

    const groupEl = groupRefs.current.get(dragGroup.key);
    if (!groupEl) return;

    const rect = groupEl.getBoundingClientRect();
    const activatorEvent = event.activatorEvent as PointerEvent;
    const pointerX = activatorEvent.clientX + (event.delta?.x ?? 0);
    const nowDetaching = pointerX < rect.left - 10 || pointerX > rect.right + 10;

    if (nowDetaching !== isDetachingRef.current) {
      isDetachingRef.current = nowDetaching;
      setIsDetaching(nowDetaching);
    }
  }, [groups, collapsedKeys, activeDragId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const wasDetaching = isDetachingRef.current;
    setActiveDragId(null);
    setIsDetaching(false);
    isDetachingRef.current = false;

    const { active, over } = event;

    // History restore path — dragging a played chip into upcoming zone
    const isFromHistory = historyChips.some(c => c.item.queueId === String(active.id));
    if (isFromHistory) {
      const dropData = over?.data?.current as { insertAtIndex?: number; isDropZone?: boolean } | undefined;
      if (dropData?.isDropZone && typeof dropData.insertAtIndex === 'number') {
        onRestoreFromHistory(String(active.id), dropData.insertAtIndex);
      }
      // If not dropped on valid zone → snaps back (no-op)
      return;
    }

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
  }, [queueChips, groups, historyChips, onMoveItem, onDetachItem, onRestoreFromHistory]);

  // ─── Reduced Motion ────────────────────────────────────────────────

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // ─── Scroll Management ─────────────────────────────────────────────
  // Single unified effect handles ALL scroll positioning.
  // Previously split across two effects that raced each other on history close.

  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);
  const prevHistoryOpenRef = useRef(historyOpen);
  const skipNextActiveScrollRef = useRef(false);

  useEffect(() => {
    const wasHistoryOpen = prevHistoryOpenRef.current;
    prevHistoryOpenRef.current = historyOpen;

    const container = scrollContainerRef.current;
    if (!container) return;

    // ── History opening: scroll to history/upcoming boundary ──
    if (historyOpen) {
      const historyEl = historyContainerRef.current;
      if (!historyEl) return;
      const timer = setTimeout(() => {
        const historyRight = historyEl.offsetLeft + historyEl.scrollWidth;
        const viewW = container.clientWidth;
        container.scrollLeft = Math.max(0, historyRight - viewW * 0.33);
      }, 370);
      return () => clearTimeout(timer);
    }

    // ── Scroll to active group or chip ──
    const scrollToTarget = () => {
      // 1. Group containing the active chip
      for (const group of groups) {
        const hasActive = group.chips.some((c) => {
          const gIdx = chipGlobalIndexMap.get(c.item.queueId) ?? -1;
          return !c.isPlayed && gIdx === playedCount;
        });
        if (hasActive) {
          const groupEl = groupRefs.current.get(group.key);
          if (groupEl) groupEl.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' });
          return;
        }
      }
      // 3. Standalone active chip
      const activeChip = container.querySelector('[data-queue-active]');
      if (activeChip) {
        (activeChip as HTMLElement).scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' });
      }
    };

    if (wasHistoryOpen) {
      // History just closed — wait for the 350ms collapse transition before scrolling.
      // Do NOT fire rAF/early-timeout: the layout is wrong during the transition.
      const timer = setTimeout(scrollToTarget, 370);
      return () => clearTimeout(timer);
    }

    // Normal case (track advance, expand toggle) — scroll immediately + after transition
    // When glow effect fires in the same render (play-now), it claims scroll ownership.
    if (skipNextActiveScrollRef.current) {
      skipNextActiveScrollRef.current = false;
      return;
    }
    const raf = requestAnimationFrame(scrollToTarget);
    const timer = setTimeout(scrollToTarget, 320);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [playedCount, groups, chipGlobalIndexMap, historyOpen]);

  // ─── Jump to glowing chip, then glow ──────────────────────────────
  // Instant scroll to target chip, then apply glow after a brief delay.
  // If the chip is inside a collapsed album group, auto-expands it first.

  const [delayedGlow, setDelayedGlow] = useState<ChipGlow>(null);

  useEffect(() => {
    if (!chipGlow || !scrollContainerRef.current) {
      setDelayedGlow(chipGlow ?? null);
      return;
    }

    // Suppress glow so chips render without glow class while we jump
    setDelayedGlow(null);

    const container = scrollContainerRef.current;
    const targetId = chipGlow.queueIds[0];
    const captured = chipGlow;

    // Auto-expand collapsed group containing the target
    const collapsedGroup = groups.find(
      (g) => g.type === 'album' && collapsedKeys.has(g.key) &&
        g.chips.some((c) => c.item.queueId === targetId),
    );
    if (collapsedGroup) toggleExpand(collapsedGroup.key);

    // Claim scroll ownership so the scroll-to-active effect (same render) doesn't override us
    skipNextActiveScrollRef.current = true;

    // Jump + glow on next frame (after possible expand DOM update)
    const raf = requestAnimationFrame(() => {
      const el = container.querySelector(`[data-queue-id="${targetId}"]`) as HTMLElement | null;
      if (el) el.scrollIntoView({ behavior: 'instant', inline: 'center', block: 'nearest' });
      // Brief pause so the eye registers position before glow fires
      setTimeout(() => setDelayedGlow(captured), 80);
    });

    return () => cancelAnimationFrame(raf);
  }, [chipGlow, groups, collapsedKeys, toggleExpand]);

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
  const isHistoryDrag = useMemo(() => {
    if (!activeDragId) return false;
    return historyChips.some(c => c.item.queueId === activeDragId);
  }, [activeDragId, historyChips]);

  return (
    <div className="relative isolate">
      <DndContext
        sensors={dndSensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
          <div ref={scrollContainerRef} className="relative z-[2] flex gap-2 overflow-x-auto queue-scrollbar pb-1 pt-4 items-center">
            {/* History toggle button — temporarily hidden */}
            {/* {historyChips.length > 0 && (
              <HistoryToggleButton
                count={historyChips.length}
                isOpen={historyOpen}
                onToggle={() => setHistoryOpen(prev => !prev)}
                sticky
              />
            )} */}

            {/* History chips — slide in/out */}
            {historyChips.length > 0 && (
              <div
                ref={historyContainerRef}
                className="flex gap-2 items-center flex-shrink-0 overflow-hidden"
                style={{
                  maxWidth: historyOpen ? `${historyChips.length * CHIP_STRIDE + 40}px` : '0px',
                  opacity: historyOpen ? 1 : 0,
                  transition: reducedMotion ? 'none' : 'max-width 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms ease',
                }}
              >
                {historyChips.map((chipEntry) => {
                  return (
                    <SortableQueueChip
                      key={chipEntry.item.queueId}
                      item={chipEntry.item}
                      chipIndex={chipEntry.absoluteIndex + 1}
                      absoluteIndex={chipEntry.absoluteIndex}
                      onPlay={onChipPlay}
                      onSelectVersion={onSelectVersion}
                      preferredQuality={preferredQuality}
                      isPlayed
                      forceEnableDrag
                      compact={compact}
                    />
                  );
                })}
                {/* NOW separator */}
                <HistorySeparator />
              </div>
            )}

            {groups.map((group, groupIndex) => (
              <Fragment key={group.key}>
                {/* Drop zone before this group */}
                <DropZone
                  id={dropZones[groupIndex]?.id ?? `dz-${groupIndex}`}
                  insertAtIndex={dropZones[groupIndex]?.insertAtIndex ?? 0}
                  isDragActive={isDragActive}
                  isDetaching={isDetaching}
                  isHistoryDrag={isHistoryDrag}
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
                    compact={compact}
                    chipGlow={delayedGlow}
                  />
                ) : (
                  <AlbumGroupSection
                    group={group}
                    isExpanded={!collapsedKeys.has(group.key)}
                    expandedWidth={(compact ? COLLAPSED_W_COMPACT : COLLAPSED_W) + 8 + group.chips.length * (compact ? CHIP_STRIDE_COMPACT : CHIP_STRIDE)}
                    reducedMotion={reducedMotion}
                    playedCount={playedCount}
                    chipGlobalIndexMap={chipGlobalIndexMap}
                    groupRefs={groupRefs}
                    historyChips={historyChips}
                    onToggle={() => toggleExpand(group.key)}
                    onChipPlay={onChipPlay}
                    onRemoveItem={onRemoveItem}
                    onRemoveBatch={onRemoveBatch}
                    onSelectVersion={onSelectVersion}
                    preferredQuality={preferredQuality}
                    compact={compact}
                    chipGlow={delayedGlow}
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
                isHistoryDrag={isHistoryDrag}
              />
            )}

            {/* Trailing spacer — last chip stops flush against album header's right edge */}
            <div className="flex-shrink-0 pointer-events-none" style={{ minWidth: `calc(100% - ${compact ? COLLAPSED_W_COMPACT + 8 + CHIP_STRIDE_COMPACT : COLLAPSED_W + 8 + CHIP_STRIDE}px)`, height: 1 }} />
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null} zIndex={9999}>
          {activeDragItem ? (
            <div
              className="relative rounded-lg cursor-grabbing"
              style={{
                transform: isDetaching ? 'scale(0.93)' : 'scale(1)',
                transition: 'transform 150ms ease-out',
                border: '1px solid var(--quinary-muted)',
                boxShadow: '0 12px 40px color-mix(in srgb, black 55%, transparent), 0 0 0 1px color-mix(in srgb, var(--quinary) 10%, transparent)',
              }}
            >
              <QueueChip
                item={activeDragItem.item}
                chipIndex={(chipGlobalIndexMap.get(activeDragItem.item.queueId) ?? 0) + 1}
                absoluteIndex={activeDragItem.absoluteIndex}
                onPlay={() => {}}
                preferredQuality={preferredQuality}
                isDragging
                compact={compact}
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
  isHistoryDrag,
}: {
  id: string;
  insertAtIndex: number;
  isDragActive: boolean;
  isDetaching: boolean;
  isHistoryDrag?: boolean;
}) {
  // Register as droppable when detaching OR when dragging from history
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { insertAtIndex, isDropZone: true },
    disabled: !isDragActive || (!isDetaching && !isHistoryDrag),
  });

  const showIndicator = isDetaching || !!isHistoryDrag;

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
          height: isOver ? '100%' : showIndicator ? '50%' : '0%',
          background: isOver
            ? 'var(--accent-secondary)'
            : showIndicator
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
  compact,
  chipGlow,
}: {
  chipEntry: ChipEntry;
  playedCount: number;
  chipGlobalIndexMap: Map<string, number>;
  onChipPlay: (index: number) => void;
  onRemoveItem: (queueId: string) => void;
  onSelectVersion: (queueId: string, song: Song) => void;
  preferredQuality: AudioQuality;
  compact?: boolean;
  chipGlow?: ChipGlow;
}) {
  const { item, absoluteIndex, isPlayed } = chipEntry;
  const globalIdx = chipGlobalIndexMap.get(item.queueId) ?? -1;
  const isActive = !isPlayed && globalIdx === playedCount;
  const glowType = chipGlow?.queueIds.includes(item.queueId) ? chipGlow.type : null;

  return (
    <SortableQueueChip
      item={item}
      chipIndex={absoluteIndex + 1}
      absoluteIndex={absoluteIndex}
      onPlay={onChipPlay}
      onRemove={isPlayed ? undefined : onRemoveItem}
      onSelectVersion={onSelectVersion}
      preferredQuality={preferredQuality}
      isActive={isActive}
      isPlayed={isPlayed}
      compact={compact}
      glowType={glowType}
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
  historyChips,
  onToggle,
  onChipPlay,
  onRemoveItem,
  onRemoveBatch,
  onSelectVersion,
  preferredQuality,
  compact,
  chipGlow,
}: {
  group: StripGroup;
  isExpanded: boolean;
  expandedWidth: number;
  reducedMotion: boolean;
  playedCount: number;
  chipGlobalIndexMap: Map<string, number>;
  groupRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  historyChips: ChipEntry[];
  onToggle: () => void;
  onChipPlay: (index: number) => void;
  onRemoveItem: (queueId: string) => void;
  onRemoveBatch: (batchId: string) => void;
  onSelectVersion: (queueId: string, song: Song) => void;
  preferredQuality: AudioQuality;
  compact?: boolean;
  chipGlow?: ChipGlow;
}) {
  return (
    <div
      ref={(el) => {
        if (el) groupRefs.current.set(group.key, el);
        else groupRefs.current.delete(group.key);
      }}
      className="flex-shrink-0 flex rounded-lg"
      style={{
        maxWidth: isExpanded ? `${expandedWidth}px` : `${compact ? COLLAPSED_W_COMPACT : COLLAPSED_W}px`,
        transition: reducedMotion ? 'none' : 'max-width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        border: isExpanded
          ? group.groupIndex % 2 === 0
            ? '1px solid color-mix(in srgb, var(--tertiary) 30%, transparent)'
            : '1px solid color-mix(in srgb, var(--tertiary) 15%, transparent)'
          : 'none',
        background: isExpanded
          ? group.groupIndex % 2 === 0
            ? 'color-mix(in srgb, var(--tertiary) 8%, transparent)'
            : 'color-mix(in srgb, var(--tertiary) 3%, transparent)'
          : 'transparent',
        overflow: 'clip',
      }}
    >
      {/* Collapsed header strip — always visible */}
      <AlbumHeader
        group={group}
        isExpanded={isExpanded}
        historyChips={historyChips}
        onToggle={onToggle}
        onRemoveBatch={onRemoveBatch}
        compact={compact}
      />

      {/* Expanded chips section */}
      {isExpanded && (
        <div className={`flex gap-2 ${compact ? 'pl-1.5 items-center' : 'pl-2 py-1.5 items-center'}`}>
          {group.chips.map((chipEntry) => {
            const globalIdx = chipGlobalIndexMap.get(chipEntry.item.queueId) ?? -1;
            const isActive = !chipEntry.isPlayed && globalIdx === playedCount;
            const glowType = chipGlow?.queueIds.includes(chipEntry.item.queueId) ? chipGlow.type : null;
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
                compact={compact}
                glowType={glowType}
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
  historyChips,
  onToggle,
  onRemoveBatch,
  compact,
}: {
  group: StripGroup;
  isExpanded: boolean;
  historyChips: ChipEntry[];
  onToggle: () => void;
  onRemoveBatch: (batchId: string) => void;
  compact?: boolean;
}) {
  // Count how many tracks from this album batch have already been played
  const playedFromAlbum = historyChips.filter(c => c.item.batchId === group.batchId).length;
  const isActiveAlbum = playedFromAlbum > 0;
  // +1 for the currently-playing track (in neither history nor upcoming chips)
  const currentTrack = playedFromAlbum + 1;
  const totalTracks = playedFromAlbum + 1 + group.chips.length;

  return (
    <button
      onClick={onToggle}
      className={`group flex-shrink-0 flex flex-col items-center ${compact ? 'gap-0.5 py-1 px-0.5' : 'gap-1 py-1.5 px-0.5'} rounded-lg transition-colors relative cursor-pointer hover:bg-surface-player-chip-hover`}
      style={{
        width: `${compact ? COLLAPSED_W_COMPACT : COLLAPSED_W}px`,
        background: 'var(--player-surface-chip)',
        ...(isExpanded
          ? { border: 'none', position: 'sticky' as const, left: 0, zIndex: 5 }
          : { border: '1px solid var(--border-subtle-player)', borderLeft: '3px solid var(--tertiary-muted)' }
        ),
      }}
      aria-label={`${group.albumSource?.albumName ?? 'Album'} - ${isActiveAlbum ? `track ${currentTrack} of ${totalTracks}` : `${group.chips.length} tracks`}${isExpanded ? ', click to collapse' : ', click to expand'}`}
      title={group.albumSource?.albumName ?? 'Album'}
    >
      {/* Remove album button */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onRemoveBatch(group.batchId); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRemoveBatch(group.batchId); } }}
        className={`inline absolute top-0.5 right-0.5 ${compact ? 'w-3 h-3' : 'w-4 h-4'} flex items-center justify-center rounded-full z-10 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto bg-surface-player-deep text-tertiary hover:!text-white hover:!bg-border transition-all cursor-pointer`}
        aria-label={`Remove ${group.albumSource?.albumName ?? 'album'} from queue`}
      >
        <svg className={compact ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>

      {/* Album art — jewel case with chevron on spine */}
      <TicketStub
        coverArt={group.albumSource?.coverArt}
        albumName={group.albumSource?.albumName}
        size={compact ? 51 : 74}
        chevronDirection={isExpanded ? 'left' : 'right'}
      />
    </button>
  );
}

function HistoryToggleButton({
  count,
  isOpen,
  onToggle,
  sticky,
}: {
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  sticky?: boolean;
}) {
  // Both states: a thin vertical bar snapped to the left edge.
  // Closed: subtle, just a thin line with a small right-pointing chevron.
  // Open: accent-colored with left-pointing chevron.
  return (
    <button
      onClick={onToggle}
      className="flex-shrink-0 flex items-center justify-center self-stretch hover:opacity-100 transition-opacity cursor-pointer"
      style={{
        ...(sticky ? { position: 'sticky' as const, left: 0, zIndex: 2 } : {}),
        width: '12px',
        padding: 0,
        background: 'none',
        border: 'none',
        borderRight: isOpen
          ? '2px solid var(--secondary)'
          : '2px solid color-mix(in srgb, var(--text-tertiary) 40%, transparent)',
        opacity: isOpen ? 1 : 0.5,
      }}
      aria-label={`${isOpen ? 'Hide' : 'Show'} ${count} played tracks`}
      title={`${isOpen ? 'Hide' : 'Show'} history (${count} played)`}
    >
      <svg
        width="6"
        height="10"
        viewBox="0 0 6 10"
        fill="none"
        stroke={isOpen ? 'var(--secondary)' : 'var(--text-tertiary)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isOpen
          ? <path d="M5 1L1 5L5 9" />
          : <path d="M1 1L5 5L1 9" />
        }
      </svg>
    </button>
  );
}

function HistorySeparator() {
  return (
    <div
      data-history-separator
      className="flex-shrink-0 flex flex-col items-center gap-1 self-stretch justify-center px-1"
    >
      <div
        className="flex-1 w-px rounded-full"
        style={{ background: 'linear-gradient(180deg, transparent, var(--secondary), transparent)' }}
      />
      <span
        className="font-jb-mono text-[8px] font-bold tracking-widest uppercase leading-none"
        style={{ color: 'var(--secondary)' }}
      >
        NOW
      </span>
      <div
        className="flex-1 w-px rounded-full"
        style={{ background: 'linear-gradient(180deg, transparent, var(--secondary), transparent)' }}
      />
    </div>
  );
}
