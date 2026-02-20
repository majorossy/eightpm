'use client';

import Image from 'next/image';
import TicketStubCard from '@/components/TicketStubCard';
import type { QueueItem } from '@/lib/queueTypes';
import type { Song } from '@/lib/types';
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

export function SortableTicketChip({
  item,
  chipIndex,
  absoluteIndex,
  onPlay,
  onSelectVersion,
}: {
  item: QueueItem;
  chipIndex: number;
  absoluteIndex: number;
  onPlay: (index: number) => void;
  onSelectVersion: (queueId: string, song: Song) => void;
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
    transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TicketStubCard
        item={item}
        index={chipIndex}
        absoluteIndex={absoluteIndex}
        onPlay={onPlay}
        onSelectVersion={onSelectVersion}
        variant="horizontal"
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
