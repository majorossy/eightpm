'use client';

import { useMemo } from 'react';
import { useQueue } from '@/context/QueueContext';
import { formatDuration } from '@/lib/api';

interface QueuePreviewProps {
  className?: string;
}

export default function QueuePreview({ className = '' }: QueuePreviewProps) {
  const { queue, hasItems } = useQueue();

  const upcomingItems = useMemo(() => {
    if (queue.cursorIndex < 0) return [];
    return queue.items.slice(queue.cursorIndex + 1);
  }, [queue.items, queue.cursorIndex]);

  if (upcomingItems.length === 0) {
    return (
      <div className={`p-3 ${className}`}>
        <p className="text-xs text-[#8a8478] text-center">No upcoming tracks</p>
      </div>
    );
  }

  return (
    <div className={`p-2 ${className}`}>
      <p className="text-[10px] text-[#8a8478] uppercase tracking-wider mb-2 px-2">
        Up Next ({upcomingItems.length} tracks)
      </p>
      <ul className="space-y-1 max-h-80 overflow-y-auto">
        {upcomingItems.map((item, index) => (
          <li
            key={item.queueId}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2d2a26] transition-colors"
          >
            <span className="text-xs text-[#6a6458] w-5 text-center font-mono">
              {item.albumSource ? (item.albumSource.originalTrackIndex ?? 0) + 1 : index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{item.trackTitle}</p>
              <p className="text-xs text-[#8a8478] truncate">{item.song.artistName}</p>
            </div>
            <span className="text-xs text-[#6a6458] font-mono flex-shrink-0">
              {formatDuration(item.song.duration)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
