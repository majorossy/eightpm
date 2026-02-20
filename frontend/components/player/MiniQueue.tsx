'use client';

import React from 'react';
import Image from 'next/image';
import TicketStubCard from '@/components/TicketStubCard';
import type { QueueItem } from '@/lib/queueTypes';
import type { Song } from '@/lib/types';
import {
  DndContext,
  closestCenter,
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

function SortableMiniQueueTrack({
  item,
  index,
  absoluteIndex,
  onPlay,
  onSelectVersion,
}: {
  item: QueueItem;
  index: number;
  absoluteIndex: number;
  onPlay: (index: number) => void;
  onSelectVersion?: (queueId: string, song: Song) => void;
}) {
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
    <div ref={setNodeRef} style={style}>
      <TicketStubCard
        item={item}
        index={index + 1}
        absoluteIndex={absoluteIndex}
        onPlay={onPlay}
        onSelectVersion={onSelectVersion}
        variant="vertical-compact"
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

interface MiniQueueProps {
  upcomingItems: { item: QueueItem; absoluteIndex: number }[];
  totalUpcoming: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  sortableIds: string[];
  sensors: ReturnType<typeof import('@dnd-kit/core').useSensors>;
  activeDragItem: { item: QueueItem; absoluteIndex: number } | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onPlay: (index: number) => void;
  onSelectVersion: (queueId: string, song: Song) => void;
  vibrate: (pattern: number | number[]) => void;
  BUTTON_PRESS: number;
}

export const MiniQueue = React.memo(function MiniQueue({
  upcomingItems,
  totalUpcoming,
  isExpanded,
  onToggleExpand,
  sortableIds,
  sensors,
  activeDragItem,
  onDragStart,
  onDragEnd,
  onPlay,
  onSelectVersion,
  vibrate,
  BUTTON_PRESS,
}: MiniQueueProps) {
  if (totalUpcoming === 0) return null;

  const hasMoreItems = totalUpcoming > upcomingItems.length;

  return (
    <div className="px-4 pb-4">
      <button
        onClick={() => {
          vibrate(BUTTON_PRESS);
          onToggleExpand();
        }}
        className="w-full flex items-center justify-between py-2 text-left"
      >
        <span className="text-xs text-[#8a8478] uppercase tracking-[0.15em]">
          Up Next <span className="text-[#d4a060]">&middot; {totalUpcoming} tracks</span>
        </span>
        <svg
          className={`w-4 h-4 text-[#8a8478] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[400px] overflow-y-auto' : 'max-h-40'}`}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {upcomingItems.map(({ item, absoluteIndex }, index) => (
                <SortableMiniQueueTrack
                  key={item.queueId}
                  item={item}
                  index={index}
                  absoluteIndex={absoluteIndex}
                  onPlay={onPlay}
                  onSelectVersion={onSelectVersion}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeDragItem && (
              <div className="flex items-center gap-3 py-3 px-3 rounded-xl bg-[#2d2a26] shadow-lg shadow-black/50 border border-[#d4a060]/30">
                {activeDragItem.item.albumSource?.coverArt ? (
                  <Image src={activeDragItem.item.albumSource.coverArt} alt="" width={40} height={40} quality={60} className="object-cover rounded-md flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-[#2d2a26] rounded-md flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#3a3632]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{activeDragItem.item.trackTitle}</p>
                  <p className="text-xs text-[#8a8478] truncate">{activeDragItem.item.song.artistName}</p>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {hasMoreItems && !isExpanded && (
          <p className="text-[10px] text-[#6a6458] text-center py-1 italic mt-2">
            +{totalUpcoming - upcomingItems.length} more &middot; tap to expand
          </p>
        )}
      </div>
    </div>
  );
});
