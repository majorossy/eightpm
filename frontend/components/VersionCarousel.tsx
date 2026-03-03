'use client';

// VersionCarousel - horizontal scrolling carousel of song version cards

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Song } from '@/lib/api';
import { RecordingRow } from '@/components/version-row';

interface VersionCarouselProps {
  songs: Song[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onPlay: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  currentSongId?: string;
  isPlaying: boolean;
  isInQueue?: (songId: string) => boolean;
}

interface VersionCardProps {
  song: Song;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

type SortOrder = 'newest' | 'oldest';

function VersionCard({
  song,
  isSelected,
  isPlaying,
  onSelect,
  onPlay,
}: VersionCardProps) {
  const year = song.showDate?.split('-')[0] ?? null;

  return (
    <div
      onClick={onSelect}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
      className={`
        flex-shrink-0 w-[280px] p-5 cursor-pointer transition-all duration-200 snap-start rounded-lg
        ${isSelected
          ? 'bg-surface-elevated ring-2 ring-accent'
          : 'bg-surface-card hover:bg-surface-elevated'
        }
      `}
    >
      {/* Header: Year + Selected badge */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-4xl font-bold text-white">
          {year || '—'}
        </span>
        {isSelected && (
          <span className="text-[10px] px-2 py-1 bg-accent text-black rounded-full font-bold uppercase">
            Selected
          </span>
        )}
      </div>

      {/* Meta info + inline action buttons */}
      <RecordingRow
        song={song}
        size="sm"
        actions={['play', 'play-next', 'queue', 'favorite']}
        onPlay={() => onPlay()}
        isCurrentlyPlaying={isPlaying}
      />
    </div>
  );
}

export default function VersionCarousel({
  songs,
  selectedIndex,
  onSelect,
  onPlay,
  onAddToQueue,
  currentSongId,
  isPlaying,
  isInQueue,
}: VersionCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Sort songs by date
  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      const dateA = a.showDate || '0000-00-00';
      const dateB = b.showDate || '0000-00-00';
      return sortOrder === 'newest'
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB);
    });
  }, [songs, sortOrder]);

  // Find the sorted index of the currently selected song
  const selectedSongId = songs[selectedIndex]?.id;
  const sortedSelectedIndex = sortedSongs.findIndex(s => s.id === selectedSongId);

  // Check scroll position to update arrow visibility
  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  // Initialize scroll state and add listeners
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateScrollState();
    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, sortedSongs]);

  // Auto-scroll to selected card when selection changes
  useEffect(() => {
    if (sortedSelectedIndex < 0 || !scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.children[sortedSelectedIndex] as HTMLElement;
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [sortedSelectedIndex]);

  // Scroll by one card width
  const scrollByCard = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = 300;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Handle card selection - need to map back to original index
  const handleSelect = (sortedIdx: number) => {
    const song = sortedSongs[sortedIdx];
    const originalIndex = songs.findIndex(s => s.id === song.id);
    onSelect(originalIndex);
  };

  return (
    <div className="mt-4">
      {/* Controls bar */}
      {sortedSongs.length > 1 && (
        <div className="flex items-center justify-between py-4 mb-4 border-b border-default">
          <span className="text-xs text-secondary">
            Available Recordings
          </span>
          <div className="flex items-center gap-2 text-xs text-secondary">
            <span>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="bg-surface-elevated border border-default rounded px-2 py-1 text-white text-xs"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      )}

      {/* Carousel container */}
      <div className="relative group">
        {/* Left fade + arrow */}
        {canScrollLeft && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-surface-card to-transparent pointer-events-none z-[5]" />
            <button
              onClick={() => scrollByCard('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all bg-surface-elevated border border-default hover:border-white text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-thin"
        >
          {sortedSongs.map((song, idx) => {
            const originalIndex = songs.findIndex(s => s.id === song.id);
            return (
              <VersionCard
                key={song.id}
                song={song}
                isSelected={originalIndex === selectedIndex}
                isPlaying={currentSongId === song.id && isPlaying}
                onSelect={() => handleSelect(idx)}
                onPlay={() => onPlay(song)}
              />
            );
          })}
        </div>

        {/* Right fade + arrow */}
        {canScrollRight && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-surface-card to-transparent pointer-events-none z-[5]" />
            <button
              onClick={() => scrollByCard('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all bg-surface-elevated border border-default hover:border-white text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
