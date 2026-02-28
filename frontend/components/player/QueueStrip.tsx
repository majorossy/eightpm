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
  isPlayed,
}: {
  item: QueueItem;
  chipIndex: number;
  absoluteIndex: number;
  onPlay: (index: number) => void;
  onRemove?: (queueId: string) => void;
  onSelectVersion?: (queueId: string, song: Song) => void;
  preferredQuality?: AudioQuality;
  isActive?: boolean;
  isPlayed?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.queueId, disabled: !!isPlayed });

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
        onRemove={isPlayed ? undefined : onRemove}
        onSelectVersion={onSelectVersion}
        preferredQuality={preferredQuality}
        isDragging={isDragging}
        isActive={isActive}
        isPlayed={isPlayed}
      />
    </div>
  );
}

// Re-export Song type for callers that need it
export type { Song } from '@/lib/types';
