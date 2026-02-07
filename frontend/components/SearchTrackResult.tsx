'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Song } from '@/lib/types';
import { getRecordingBadge } from '@/lib/lineageUtils';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { type VersionFilters, applyFilters, hasActiveFilters } from '@/lib/filters';
import VenueLink from '@/components/VenueLink';

interface CategoryBreadcrumb {
  category_uid: string;
  category_name: string;
  category_url_key: string;
}

interface SearchTrackResultProps {
  track: {
    uid: string;
    name: string;
    url_key: string;
    product_count: number;
    breadcrumbs?: CategoryBreadcrumb[];
  };
  /** Pre-filtered versions (if provided, skips fetch on expand) */
  filteredVersions?: Song[];
  /** Number of versions matching current filters */
  versionCount?: number;
  /** Total versions before filtering */
  totalVersions?: number;
  /** Filters to apply when lazy-loading versions */
  filters?: VersionFilters;
  onPlay?: (song: Song) => void;
}

// Simple star rating for compact display
function CompactStars({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-[#6a5a48]">--</span>;
  const stars = Math.round(rating);
  return (
    <span className="text-[#e8a050]" title={`${rating.toFixed(1)} rating`}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

// Truncate text with ellipsis
function truncate(text: string | undefined, max: number): string {
  if (!text) return '--';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

// Version card component (simpler than RecordingCard)
function VersionCard({
  song,
  isPlaying,
  onPlay,
  onQueue,
}: {
  song: Song;
  isPlaying: boolean;
  onPlay: () => void;
  onQueue: () => void;
}) {
  const year = song.showDate?.split('-')[0] || '--';
  const recordingBadge = getRecordingBadge(song.lineage, song.recordingType);

  return (
    <div
      className={`
        min-w-[180px] max-w-[200px] flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200
        ${isPlaying
          ? 'bg-gradient-to-b from-[#faf4e8] to-[#f0e4d0] border-2 border-[#e8a050]'
          : 'bg-gradient-to-b from-[#2a2520] to-[#1e1a15] border border-[#3a3028] hover:border-[#4a4038]'
        }
      `}
    >
      {/* Card header with year and badge */}
      <div className={`px-3 pt-3 pb-2 border-b ${isPlaying ? 'border-[#8b5a2b]/15' : 'border-[#a88060]/8'}`}>
        <div className="flex justify-between items-center">
          <span className={`text-2xl font-bold font-serif ${isPlaying ? 'text-[#1a0f08]' : 'text-[#a89080]'}`}>
            {year}
          </span>
          {recordingBadge && (
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                isPlaying
                  ? 'bg-[#c88030] text-[#1a1410]'
                  : 'bg-[#d4a060] text-[#1c1a17]'
              }`}
              title={`${recordingBadge.text} Recording`}
            >
              {recordingBadge.text}
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="px-3 py-2">
        {/* Venue */}
        <div className={`text-sm font-medium mb-1 ${isPlaying ? 'text-[#2a1810]' : 'text-[#c8b8a8]'}`}>
          <VenueLink venueName={song.showVenue} className={`${isPlaying ? 'text-[#2a1810] hover:text-[#1a0808]' : 'text-[#c8b8a8] hover:text-[#d4a060]'} hover:underline transition-colors`} truncateLength={22} />
        </div>
        {/* Location */}
        <div className={`text-xs mb-2 ${isPlaying ? 'text-[#5a4030]' : 'text-[#8a7a68]'}`}>
          {truncate(song.showLocation, 24)}
        </div>
        {/* Rating */}
        <div className="text-xs">
          <CompactStars rating={song.avgRating} />
          {song.numReviews && (
            <span className={`ml-1 ${isPlaying ? 'text-[#6a5040]' : 'text-[#6a5a48]'}`}>
              ({song.numReviews})
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className={`flex gap-2 px-3 py-2 border-t ${isPlaying ? 'border-[#8b5a2b]/10' : 'border-[#a88060]/5'}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className={`
            flex-1 py-2 rounded text-[11px] font-semibold transition-all flex items-center justify-center gap-1
            ${isPlaying
              ? 'bg-gradient-to-r from-[#e8a050] to-[#c88030] text-[#1a1410]'
              : 'bg-gradient-to-r from-[#3a3028] to-[#2a2520] text-[#a89080] hover:from-[#4a4038] hover:to-[#3a3028]'
            }
          `}
        >
          <span>▶</span> Play
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onQueue(); }}
          className={`
            px-2 py-2 rounded text-[11px] transition-all border
            ${isPlaying
              ? 'border-[#c8a070] text-[#6a5040] hover:bg-[#e8d8c8]'
              : 'border-[#4a3a28] text-[#8a7a68] hover:border-[#6a5a48]'
            }
          `}
          title="Add to queue"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SearchTrackResult({
  track,
  filteredVersions,
  versionCount,
  totalVersions,
  filters,
  onPlay,
}: SearchTrackResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [versions, setVersions] = useState<Song[]>([]);
  const [allVersions, setAllVersions] = useState<Song[]>([]); // Store unfiltered for re-filtering
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { currentSong, isPlaying, playSong } = usePlayer();
  const { addToQueue, trackToItem } = useQueue();

  // Use pre-filtered versions if provided, otherwise use lazy-loaded versions
  const displayVersions = filteredVersions || versions;
  const hasPreloadedVersions = !!filteredVersions;

  // Fetch versions when first expanded (only if not pre-loaded)
  useEffect(() => {
    if (isExpanded && !hasLoaded && !hasPreloadedVersions) {
      setIsLoading(true);
      fetch(`/api/track-versions?uid=${encodeURIComponent(track.uid)}`)
        .then(res => res.json())
        .then(data => {
          const loadedVersions = data || [];
          setAllVersions(loadedVersions);
          // Apply filters if any are active
          if (filters && hasActiveFilters(filters)) {
            setVersions(applyFilters(loadedVersions, filters));
          } else {
            setVersions(loadedVersions);
          }
          setHasLoaded(true);
        })
        .catch(err => {
          console.error('Failed to fetch track versions:', err);
          setVersions([]);
          setAllVersions([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isExpanded, hasLoaded, hasPreloadedVersions, track.uid, filters]);

  // Re-apply filters when they change (for lazy-loaded versions)
  useEffect(() => {
    if (hasLoaded && !hasPreloadedVersions && allVersions.length > 0) {
      if (filters && hasActiveFilters(filters)) {
        setVersions(applyFilters(allVersions, filters));
      } else {
        setVersions(allVersions);
      }
    }
  }, [filters, hasLoaded, hasPreloadedVersions, allVersions]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handlePlay = (song: Song) => {
    if (onPlay) {
      onPlay(song);
    } else {
      playSong(song);
    }
  };

  const handleQueue = (song: Song) => {
    addToQueue(trackToItem(song));
  };

  // Check if any version of this track is currently playing
  const isTrackPlaying = displayVersions.some(v => v.id === currentSong?.id) && isPlaying;

  // Check if track has no versions (disabled state)
  const hasNoVersions = (track.product_count || 0) === 0;

  return (
    <div className={`
      rounded-lg overflow-hidden transition-all duration-200
      ${hasNoVersions
        ? 'opacity-50 cursor-not-allowed'
        : isExpanded
          ? 'bg-[rgba(232,160,80,0.04)] border border-[#e8a050]/20'
          : 'hover:bg-[#2a2520]'
      }
    `}>
      {/* Collapsed row (always visible) */}
      <button
        onClick={hasNoVersions ? undefined : handleToggle}
        disabled={hasNoVersions}
        className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${hasNoVersions ? 'cursor-not-allowed' : ''}`}
      >
        {/* Album cover image */}
        <div className={`
          w-10 h-10 rounded flex items-center justify-center flex-shrink-0 overflow-hidden relative
          ${isExpanded ? 'ring-2 ring-[#e8a050]/40' : ''}
        `}>
          {isTrackPlaying ? (
            // Animated bars when playing (overlay on image)
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-4">
                <div className="w-1 bg-[#e8a050] animate-[soundbar_0.5s_ease-in-out_infinite_alternate]" style={{ height: '60%' }} />
                <div className="w-1 bg-[#e8a050] animate-[soundbar_0.5s_ease-in-out_infinite_alternate_0.2s]" style={{ height: '100%' }} />
                <div className="w-1 bg-[#e8a050] animate-[soundbar_0.5s_ease-in-out_infinite_alternate_0.4s]" style={{ height: '40%' }} />
              </div>
            </div>
          ) : null}
          {track.breadcrumbs && track.breadcrumbs.length >= 3 ? (
            <Image
              src={`/images/albums/${track.breadcrumbs[2].category_url_key}.jpg`}
              alt={track.breadcrumbs[2].category_name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default album art
                (e.target as HTMLImageElement).src = '/images/songs/default.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-[#2a2520] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#d4a060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${hasNoVersions ? 'text-[#6a5a48]' : 'text-[#e8dcc8]'}`}>
            {track.name}
          </p>
          <p className={`text-sm flex items-center gap-1 ${hasNoVersions ? 'text-[#5a4a38]' : 'text-[#4a9a8a]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasNoVersions ? 'bg-[#5a4a38]' : 'bg-[#4a9a8a]'}`} />
            {/* Show "No recordings" for tracks with no versions */}
            {hasNoVersions ? (
              <span className="italic">No Track found for this Song</span>
            ) : versionCount !== undefined ? (
              // Pre-loaded versions with filter info
              <>
                {versionCount} {versionCount === 1 ? 'version' : 'versions'}
                {totalVersions !== undefined && totalVersions !== versionCount && (
                  <span className="text-[#6a5a48] ml-1">
                    (of {totalVersions})
                  </span>
                )}
              </>
            ) : hasLoaded ? (
              // Lazy-loaded versions (show actual counts)
              <>
                {displayVersions.length} {displayVersions.length === 1 ? 'version' : 'versions'}
                {filters && hasActiveFilters(filters) && allVersions.length !== displayVersions.length && (
                  <span className="text-[#6a5a48] ml-1">
                    (of {allVersions.length})
                  </span>
                )}
              </>
            ) : (
              // Not yet loaded - show product_count estimate
              <>
                {track.product_count} {track.product_count === 1 ? 'version' : 'versions'}
              </>
            )}
          </p>
        </div>

        {/* Go to album link */}
        {track.breadcrumbs && track.breadcrumbs.length >= 3 && (
          <Link
            href={`/artists/${track.breadcrumbs[1].category_url_key}/album/${track.breadcrumbs[2].category_url_key}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#d4a060] hover:text-[#e8a050] transition-colors rounded hover:bg-[#2a2520]"
          >
            Go to album
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* Expand/collapse chevron - hidden for tracks with no versions */}
        {!hasNoVersions && (
          <div className={`
            p-1 rounded transition-transform duration-200
            ${isExpanded ? 'rotate-180 text-[#e8a050]' : 'text-[#6a5a48]'}
          `}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </button>

      {/* Expanded panel with versions carousel */}
      {isExpanded && (
        <div className="px-3 pb-4 border-t border-[#e8a050]/10">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#e8a050] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-[#8a7a68] text-sm">Loading versions...</span>
            </div>
          )}

          {/* Versions carousel */}
          {!isLoading && displayVersions.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#8a7a68] text-sm">
                  Choose your recording
                </span>
                <span className="text-[#6a5a48] text-xs">
                  Sorted by rating
                </span>
              </div>
              <div
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#4a3a28] scrollbar-track-transparent"
              >
                {displayVersions.map((song) => (
                  <VersionCard
                    key={song.id}
                    song={song}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onPlay={() => handlePlay(song)}
                    onQueue={() => handleQueue(song)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No versions found */}
          {!isLoading && (hasLoaded || hasPreloadedVersions) && displayVersions.length === 0 && (
            <div className="py-6 text-center text-[#6a5a48] text-sm">
              No recordings found for this track.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchTrackResult;
