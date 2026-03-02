'use client';

import type React from 'react';
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
  forceEnableDrag,
  compact,
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
  forceEnableDrag?: boolean;
  compact?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.queueId, disabled: !!isPlayed && !forceEnableDrag });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
    transition,
    // Dashed placeholder border when dragging (preserves dimensions for dnd-kit)
    ...(isDragging ? {
      border: '2px dashed color-mix(in srgb, var(--quinary) 25%, transparent)',
      background: 'color-mix(in srgb, var(--quinary) 4%, transparent)',
      borderRadius: '8px',
    } : {}),
  };

  return (
    <div ref={setNodeRef} style={style} className={isPlayed && !forceEnableDrag ? '' : 'cursor-grab active:cursor-grabbing'} {...attributes} {...listeners}>
      <div style={{ visibility: isDragging ? 'hidden' : 'visible' }}>
        <QueueChip
          item={item}
          chipIndex={chipIndex}
          absoluteIndex={absoluteIndex}
          onPlay={onPlay}
          onRemove={isPlayed ? undefined : onRemove}
          onSelectVersion={onSelectVersion}
          preferredQuality={preferredQuality}
          isActive={isActive}
          isPlayed={isPlayed}
          inSortable
          compact={compact}
        />
      </div>
    </div>
  );
}

// Re-export Song type for callers that need it
export type { Song } from '@/lib/types';
