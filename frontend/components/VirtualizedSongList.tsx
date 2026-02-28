'use client';

import { useEffect, CSSProperties, ReactElement } from 'react';
import Image from 'next/image';
import { List, ListImperativeAPI, useListCallbackRef } from 'react-window';
import { Song } from '@/lib/types';
import { formatDuration } from '@/lib/api';
import { useHaptic } from '@/hooks/useHaptic';

// Custom row props for VirtualizedSongList (excluding index/style which are injected)
interface SongRowProps {
  songs: Array<{ song: Song; id: string }>;
  onPlay: (song: Song) => void;
  onRemove?: (id: string) => void;
  onAddToQueue?: (song: Song) => void;
  vibrate: (pattern: number | number[]) => void;
  BUTTON_PRESS: number;
  DELETE_ACTION: number;
}

interface VirtualizedSongListProps {
  songs: Array<{ song: Song; id: string }>;
  onPlay: (song: Song) => void;
  onRemove?: (id: string) => void;
  onAddToQueue?: (song: Song) => void;
  containerHeight?: number;
  rowHeight?: number;
  scrollKey?: string;
}

// Store scroll positions by key
const scrollPositions = new Map<string, number>();

// Row component for VirtualizedSongList
function SongRow({
  index,
  style,
  songs,
  onPlay,
  onRemove,
  onAddToQueue,
  vibrate,
  BUTTON_PRESS,
  DELETE_ACTION,
}: {
  index: number;
  style: CSSProperties;
  ariaAttributes: object;
} & SongRowProps): ReactElement | null {
  const item = songs[index];
  if (!item) return <div style={style} />;

  const { song, id } = item;

  return (
    <div
      style={style}
      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 group transition-colors"
    >
      {/* Track number */}
      <span className="w-6 text-sm text-secondary text-right flex-shrink-0">
        {index + 1}
      </span>

      {/* Play button / Song info */}
      <button
        onClick={() => {
          vibrate(BUTTON_PRESS);
          onPlay(song);
        }}
        className="flex-1 min-w-0 text-left flex items-center gap-3"
      >
        {/* Album art thumbnail */}
        {song.albumArt && (
          <Image
            src={song.albumArt}
            alt={song.albumName || 'Album cover'}
            width={40}
            height={40}
            quality={75}
            className="rounded flex-shrink-0 bg-surface-elevated"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate group-hover:text-accent transition-colors">
            {song.title}
          </p>
          <p className="text-secondary text-xs truncate">
            {song.artistName}
          </p>
        </div>
      </button>

      {/* Duration */}
      <span className="text-sm text-secondary flex-shrink-0 w-12 text-right">
        {formatDuration(song.duration)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onAddToQueue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              vibrate(BUTTON_PRESS);
              onAddToQueue(song);
            }}
            className="p-2 text-secondary hover:text-white transition-colors"
            title="Add to queue"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
            </svg>
          </button>
        )}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              vibrate(DELETE_ACTION);
              onRemove(id);
            }}
            className="p-2 text-secondary hover:text-red-500 transition-colors"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function VirtualizedSongList({
  songs,
  onPlay,
  onRemove,
  onAddToQueue,
  containerHeight = 500,
  rowHeight = 72,
  scrollKey,
}: VirtualizedSongListProps) {
  const [listRef, setListRef] = useListCallbackRef();
  const { vibrate, BUTTON_PRESS, DELETE_ACTION } = useHaptic();

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollKey && listRef) {
      const savedPosition = scrollPositions.get(scrollKey);
      if (savedPosition !== undefined) {
        listRef.scrollToRow({ index: Math.floor(savedPosition / rowHeight) });
      }
    }
  }, [scrollKey, rowHeight, listRef]);

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-secondary">
        No songs found
      </div>
    );
  }

  return (
    <List<SongRowProps>
      listRef={setListRef}
      rowCount={songs.length}
      rowHeight={rowHeight}
      className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      style={{ height: containerHeight, width: '100%' }}
      rowComponent={SongRow}
      rowProps={{
        songs,
        onPlay,
        onRemove,
        onAddToQueue,
        vibrate,
        BUTTON_PRESS,
        DELETE_ACTION,
      }}
    />
  );
}

// Recently played variant with timestamp
interface RecentlyPlayedItem {
  song: Song;
  playedAt: number;
}

// Row props for VirtualizedRecentList (excluding index/style which are injected)
interface RecentRowProps {
  items: RecentlyPlayedItem[];
  onPlay: (song: Song) => void;
  vibrate: (pattern: number | number[]) => void;
  BUTTON_PRESS: number;
}

interface VirtualizedRecentListProps {
  items: RecentlyPlayedItem[];
  onPlay: (song: Song) => void;
  containerHeight?: number;
  rowHeight?: number;
  scrollKey?: string;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Row component for VirtualizedRecentList
function RecentRow({
  index,
  style,
  items,
  onPlay,
  vibrate,
  BUTTON_PRESS,
}: {
  index: number;
  style: CSSProperties;
  ariaAttributes: object;
} & RecentRowProps): ReactElement | null {
  const item = items[index];
  if (!item) return <div style={style} />;

  const { song, playedAt } = item;

  return (
    <div
      style={style}
      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 group transition-colors"
    >
      <button
        onClick={() => {
          vibrate(BUTTON_PRESS);
          onPlay(song);
        }}
        className="flex-1 min-w-0 text-left flex items-center gap-3"
      >
        {song.albumArt && (
          <Image
            src={song.albumArt}
            alt={song.albumName || 'Album cover'}
            width={40}
            height={40}
            quality={75}
            className="rounded flex-shrink-0 bg-surface-elevated"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate group-hover:text-accent transition-colors">
            {song.title}
          </p>
          <p className="text-secondary text-xs truncate">
            {song.artistName}
          </p>
        </div>
      </button>

      <span className="text-xs text-secondary flex-shrink-0">
        {formatTimeAgo(playedAt)}
      </span>

      <span className="text-sm text-secondary flex-shrink-0 w-12 text-right">
        {formatDuration(song.duration)}
      </span>
    </div>
  );
}

export function VirtualizedRecentList({
  items,
  onPlay,
  containerHeight = 500,
  rowHeight = 72,
  scrollKey,
}: VirtualizedRecentListProps) {
  const [listRef, setListRef] = useListCallbackRef();
  const { vibrate, BUTTON_PRESS } = useHaptic();

  useEffect(() => {
    if (scrollKey && listRef) {
      const savedPosition = scrollPositions.get(scrollKey);
      if (savedPosition !== undefined) {
        listRef.scrollToRow({ index: Math.floor(savedPosition / rowHeight) });
      }
    }
  }, [scrollKey, rowHeight, listRef]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-secondary">
        No recently played tracks
      </div>
    );
  }

  return (
    <List<RecentRowProps>
      listRef={setListRef}
      rowCount={items.length}
      rowHeight={rowHeight}
      className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      style={{ height: containerHeight, width: '100%' }}
      rowComponent={RecentRow}
      rowProps={{
        items,
        onPlay,
        vibrate,
        BUTTON_PRESS,
      }}
    />
  );
}
