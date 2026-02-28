'use client';

import QueueChip from '@/components/player/QueueChip';
import type { QueueItem } from '@/lib/queueTypes';
import type { Song, AudioQuality } from '@/lib/types';
import {
  useSortable,
} from '@dnd-kit/sortable';

export function SortableQueueChip({
  item,
  chipIndex,
  absoluteIndex,
  onPlay,
  onRemove,
  onSelectVersion,
  preferredQuality,
  isActive,
}: {
  item: QueueItem;
  chipIndex: number;
  absoluteIndex: number;
  onPlay: (index: number) => void;
  onRemove?: (queueId: string) => void;
  onSelectVersion?: (queueId: string, song: Song) => void;
  preferredQuality?: AudioQuality;
  isActive?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <QueueChip
        item={item}
        chipIndex={chipIndex}
        absoluteIndex={absoluteIndex}
        onPlay={onPlay}
        onRemove={onRemove}
        onSelectVersion={onSelectVersion}
        preferredQuality={preferredQuality}
        isDragging={isDragging}
        isActive={isActive}
      />
    </div>
  );
}

// Re-export Song type for callers that need it
export type { Song } from '@/lib/types';
