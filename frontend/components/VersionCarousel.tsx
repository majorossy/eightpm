'use client';

// VersionCarousel - horizontal scrolling carousel of song version cards

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Song, formatDuration } from '@/lib/api';
import VenueLink from '@/components/VenueLink';

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
  isInQueue: boolean;
  onSelect: () => void;
  onPlay: () => void;
  onAddToQueue: () => void;
}

type SortOrder = 'newest' | 'oldest';

// Star rating display component
function StarRating({ rating, count }: { rating?: number; count?: number }) {
  if (!rating || !count) return null;

  const roundedRating = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1" title={`${rating.toFixed(1)} out of 5 stars (${count} reviews)`}>
      <div className="flex text-[#d4a060]">
        {Array.from({ length: fullStars }).map((_, i) => (
          <svg key={`full-${i}`} className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg className="w-3 h-3" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="halfStar">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#374151" />
              </linearGradient>
            </defs>
            <path fill="url(#halfStar)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <svg key={`empty-${i}`} className="w-3 h-3 text-[#3a3632]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <span className="text-[#8a8478] text-[10px]">({count})</span>
    </div>
  );
}

function VersionCard({
  song,
  isSelected,
  isPlaying,
  isInQueue,
  onSelect,
  onPlay,
  onAddToQueue,
}: VersionCardProps) {
  const venue = song.showVenue || song.albumName || 'Unknown Venue';
  const date = song.showDate;
  const year = date ? date.split('-')[0] : null;

  // Format date for display (YYYY-MM-DD -> MM/DD/YY)
  let formattedDate = date;
  if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, month, day] = date.split('-');
    formattedDate = `${month}/${day}/${y.slice(-2)}`;
  }

  const truncate = (text: string | undefined, maxLen: number) => {
    if (!text) return null;
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  };

  const handleQueueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToQueue();
  };

  return (
    <div
      onClick={onSelect}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
      className={`
        flex-shrink-0 w-[280px] p-5 cursor-pointer transition-all duration-200 snap-start rounded-lg
        ${isSelected
          ? 'bg-[#2d2a26] ring-2 ring-[#d4a060]'
          : 'bg-[#252220] hover:bg-[#2d2a26]'
        }
      `}
    >
      {/* Header: Year + Selected badge */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-4xl font-bold text-white">
          {year || '—'}
        </span>
        {isSelected && (
          <span className="text-[10px] px-2 py-1 bg-[#d4a060] text-black rounded-full font-bold uppercase">
            Selected
          </span>
        )}
      </div>

      {/* Meta info */}
      <div className="text-xs text-[#8a8478] space-y-2">
        {/* Venue */}
        <div className="flex justify-between">
          <span className="text-[#d4a060]">Venue</span>
          <span className="text-white" title={song.showVenue || undefined}>
            {song.showVenue ? <VenueLink venueName={song.showVenue} className="text-white hover:text-[#d4a060] hover:underline transition-colors" truncateLength={20} /> : (truncate(venue, 20) || '—')}
          </span>
        </div>
        {/* Location */}
        <div className="flex justify-between">
          <span className="text-[#d4a060]">Location</span>
          <span title={song.showLocation || undefined}>{truncate(song.showLocation, 20) || '—'}</span>
        </div>
        {/* Date */}
        <div className="flex justify-between">
          <span className="text-[#d4a060]">Date</span>
          <span>{formattedDate || '—'}</span>
        </div>
        {/* Rating */}
        <div className="flex justify-between items-center">
          <span className="text-[#d4a060]">Rating</span>
          {song.avgRating ? <StarRating rating={song.avgRating} count={song.numReviews} /> : <span>—</span>}
        </div>
        {/* Length */}
        <div className="flex justify-between">
          <span className="text-[#d4a060]">Length</span>
          <span>{formatDuration(song.duration)}</span>
        </div>
        {/* Taper */}
        <div className="flex justify-between">
          <span className="text-[#d4a060]">Taper</span>
          <span title={song.taper || undefined}>{truncate(song.taper, 18) || '—'}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 mt-5">
        <button
          onClick={handlePlayClick}
          className={`
            py-2.5 text-xs font-bold rounded-full transition-all
            ${isPlaying
              ? 'bg-[#d4a060] text-black'
              : 'bg-[#d4a060] text-black hover:bg-[#c08a40] hover:scale-105'
            }
          `}
        >
          {isPlaying ? 'Playing' : 'Play'}
        </button>
        <button
          onClick={handleQueueClick}
          disabled={isInQueue}
          className={`
            py-2.5 text-xs font-bold rounded-full transition-all border
            ${isInQueue
              ? 'border-[#d4a060]/50 text-[#d4a060]/50 cursor-default'
              : 'border-[#3a3632] text-white hover:border-white'
            }
          `}
        >
          {isInQueue ? 'Queued' : '+ Queue'}
        </button>
      </div>
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

  const handleAddToQueue = (song: Song) => {
    if (onAddToQueue) {
      onAddToQueue(song);
    }
  };

  return (
    <div className="mt-4">
      {/* Controls bar */}
      {sortedSongs.length > 1 && (
        <div className="flex items-center justify-between py-4 mb-4 border-b border-[#2d2a26]">
          <span className="text-xs text-[#8a8478]">
            Available Recordings
          </span>
          <div className="flex items-center gap-2 text-xs text-[#8a8478]">
            <span>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="bg-[#2d2a26] border border-[#3a3632] rounded px-2 py-1 text-white text-xs"
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
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#252220] to-transparent pointer-events-none z-[5]" />
            <button
              onClick={() => scrollByCard('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all bg-[#2d2a26] border border-[#3a3632] hover:border-white text-white"
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
                isInQueue={isInQueue ? isInQueue(song.id) : false}
                onSelect={() => handleSelect(idx)}
                onPlay={() => onPlay(song)}
                onAddToQueue={() => handleAddToQueue(song)}
              />
            );
          })}
        </div>

        {/* Right fade + arrow */}
        {canScrollRight && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#252220] to-transparent pointer-events-none z-[5]" />
            <button
              onClick={() => scrollByCard('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all bg-[#2d2a26] border border-[#3a3632] hover:border-white text-white"
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
