'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useRouter } from 'next/navigation';
import {
  type Artist,
  type AlbumCategory,
  type TrackCategory,
  type VersionFilters,
} from '@/lib/api';
import { hasActiveFilters } from '@/lib/filters';
import { SearchTrackResult } from './SearchTrackResult';
import { SearchFilters } from './SearchFilters';
import { VinylSpinner } from './VinylSpinner';
import { SearchSilence } from './NoResultsIcons';
import { trackSearch, trackSearchResultClick } from '@/lib/analytics';
import { VALIDATION_LIMITS } from '@/lib/validation';

interface EightPmSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResults {
  artists: Artist[];
  albums: AlbumCategory[];
}

export function EightPmSearchOverlay({ isOpen, onClose }: EightPmSearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ artists: [], albums: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();
  const router = useRouter();

  // Filter state
  const [filters, setFilters] = useState<VersionFilters>({});
  const [tracks, setTracks] = useState<TrackCategory[]>([]);
  const [collectedVenues, setCollectedVenues] = useState<Set<string>>(new Set());

  // Get unique artists from search results for the filter dropdown
  const availableArtists = useMemo(() => {
    return results.artists.map(artist => ({
      slug: artist.slug,
      name: artist.name,
    }));
  }, [results.artists]);

  // Venues for autocomplete
  const availableVenues = useMemo(() => {
    return Array.from(collectedVenues).sort();
  }, [collectedVenues]);

  // Fetch venues when overlay opens
  useEffect(() => {
    if (isOpen && collectedVenues.size === 0) {
      fetch('/api/venues')
        .then(res => res.json())
        .then(data => {
          if (data.venues?.length > 0) {
            setCollectedVenues(new Set(data.venues));
          }
        })
        .catch(err => console.error('Failed to fetch venues:', err));
    }
  }, [isOpen, collectedVenues.size]);

  // Handle animation state
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      // Clear search when closing
      setSearchQuery('');
      setDebouncedQuery('');
      setResults({ artists: [], albums: [] });
      setTracks([]);
      setFilters({});
    }
  }, [isOpen]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ artists: [], albums: [] });
      setTracks([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();

    const performSearch = async () => {
      setIsSearching(true);

      try {
        // Fetch all search results from API (runs server-side, no CORS issues)
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);

        if (!response.ok) {
          throw new Error(`Search API returned ${response.status}`);
        }
        const searchResults = await response.json();

        if (!controller.signal.aborted) {
          setResults({
            artists: searchResults.artists || [],
            albums: searchResults.albums || [],
          });
          // Tracks come from the same API response (no separate client-side call)
          // Sort: tracks with versions first, then tracks with no versions at the end
          const sortedTracks = [...(searchResults.tracks || [])].sort((a, b) => {
            const aHasVersions = (a.product_count || 0) > 0;
            const bHasVersions = (b.product_count || 0) > 0;
            if (aHasVersions && !bHasVersions) return -1;
            if (!aHasVersions && bHasVersions) return 1;
            return 0;
          });
          setTracks(sortedTracks);

          // Track search analytics
          const totalResults =
            (searchResults.artists?.length || 0) +
            (searchResults.albums?.length || 0) +
            sortedTracks.length;
          trackSearch(debouncedQuery, totalResults);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search failed:', error);
        }
        setResults({ artists: [], albums: [] });
        setTracks([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    performSearch();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  // Handle filter changes - filters are passed to SearchTrackResult for lazy application
  const handleFiltersChange = useCallback((newFilters: VersionFilters) => {
    setFilters(newFilters);
  }, []);

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    setDebouncedQuery(query);
  };

  const handleArtistClick = (artist: Artist, index: number) => {
    addSearch(artist.name);
    // Track search result click
    trackSearchResultClick(debouncedQuery, 'artist', artist.name, index);
    onClose();
    router.push(`/artists/${artist.slug}`);
  };

  const handleAlbumClick = (album: AlbumCategory, index: number) => {
    addSearch(album.name);
    // Track search result click
    trackSearchResultClick(debouncedQuery, 'album', album.name, index);
    onClose();
    const artistSlug = album.breadcrumbs?.[0]?.category_url_key || '';
    if (artistSlug) {
      router.push(`/artists/${artistSlug}/album/${album.url_key}`);
    }
  };

  const handleClearInput = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setTracks([]);
    setFilters({});
    inputRef.current?.focus();
  };

  const hasResults = results.artists.length > 0 || results.albums.length > 0 || tracks.length > 0;
  const showNoResults = debouncedQuery && !isSearching && !hasResults;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={`fixed inset-0 bg-black/80 z-[9998] transition-opacity duration-300 ${
            isAnimating ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <Dialog.Content
          className={`fixed inset-0 z-[9999] bg-[var(--bg)] overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isAnimating ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <div className="flex flex-col h-full safe-top">
            <div className="max-w-[1000px] mx-auto w-full">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <Dialog.Close asChild>
                  <button
                    className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors btn-touch"
                    aria-label="Close search"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Dialog.Close>

                <div className="flex-1 relative">
                  <label htmlFor="search-input" className="sr-only">
                    Search for artists, albums, or tracks
                  </label>
                  <input
                    id="search-input"
                    ref={inputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.slice(0, VALIDATION_LIMITS.SEARCH_QUERY_MAX))}
                    placeholder="What do you want to listen to?"
                    maxLength={VALIDATION_LIMITS.SEARCH_QUERY_MAX}
                    className="w-full bg-[#2d2a26] text-white placeholder-gray-400 rounded-full px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a060]"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearInput}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Filters - show when there's a search query */}
              {debouncedQuery && !isSearching && tracks.length > 0 && (
                <div className="px-4 py-3 border-b border-white/10">
                  <SearchFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    availableYears={[]} // Years populated per-track on expand
                    availableArtists={availableArtists}
                    availableVenues={availableVenues}
                  />
                  {hasActiveFilters(filters) && (
                    <p className="text-sm text-[#8a7a68] mt-2">
                      Filters apply when you expand each track
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[1000px] mx-auto w-full">
                {!debouncedQuery ? (
                  /* Recent Searches */
                  recentSearches.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-bold text-lg">Recent searches</h2>
                        <button
                          onClick={clearSearches}
                          className="text-gray-400 hover:text-white text-sm transition-colors btn-touch"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleRecentSearchClick(search)}
                            className="group flex items-center gap-2 bg-[#2d2a26] hover:bg-[#3a3632] text-white px-4 py-2 rounded-full text-sm transition-colors btn-touch"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{search}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSearch(search);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
                              aria-label={`Remove ${search}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ) : isSearching ? (
                  /* Loading State */
                  <div className="flex flex-col items-center justify-center gap-5 py-16" role="status" aria-live="polite">
                    <VinylSpinner size="lg" />
                    <span className="text-[#d4a060] text-base font-medium tracking-wide">Searching the archives...</span>
                  </div>
                ) : (
                  /* Search Results */
                  <div className="p-4 space-y-6">
                    {showNoResults && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <SearchSilence size={140} />
                        <p className="text-[#b8a898] text-xl font-medium mb-2">No recordings found</p>
                        <p className="text-[#8a7a68] text-base">
                          Nothing in the archives for &quot;{debouncedQuery}&quot;
                        </p>
                        <p className="text-[#6a5a4a] text-sm mt-3">
                          Try searching for artists, shows, or song titles
                        </p>
                      </div>
                    )}

                    {hasResults && (
                      <>
                        {/* Artists */}
                        {results.artists.length > 0 && (
                          <div>
                            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                              </svg>
                              Artists
                            </h3>
                            <div className="space-y-2">
                              {results.artists.map((artist, index) => (
                                <button
                                  key={artist.id}
                                  onClick={() => handleArtistClick(artist, index)}
                                  className="w-full flex items-center gap-3 p-3 bg-[#2d2a26] hover:bg-[#3a3632] rounded-lg cursor-pointer transition-colors btn-touch text-left"
                                >
                                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                    {artist.image ? (
                                      <Image src={artist.image} alt={artist.name || 'Artist'} fill sizes="48px" quality={75} className="object-cover" />
                                    ) : (
                                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{artist.name}</p>
                                    <p className="text-gray-400 text-sm">Artist • {artist.songCount} songs</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Albums */}
                        {results.albums.length > 0 && (
                          <div>
                            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                              </svg>
                              Albums
                            </h3>
                            <div className="space-y-2">
                              {results.albums.map((album, index) => {
                                const artistName = album.breadcrumbs?.[0]?.category_name || 'Unknown Artist';
                                return (
                                  <button
                                    key={album.uid}
                                    onClick={() => handleAlbumClick(album, index)}
                                    className="w-full flex items-center gap-3 p-3 bg-[#2d2a26] hover:bg-[#3a3632] rounded-lg cursor-pointer transition-colors btn-touch text-left"
                                  >
                                    <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                      {album.wikipedia_artwork_url ? (
                                        <Image src={album.wikipedia_artwork_url} alt={album.name || 'Album'} fill sizes="48px" quality={75} className="object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3a3632] to-[#252220]">
                                          <svg className="w-6 h-6 text-[#d4a060]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white font-medium truncate">{album.name}</p>
                                      <p className="text-gray-400 text-sm truncate">{artistName} • {album.product_count || 0} tracks</p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Tracks Section */}
                        {tracks.length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                              </svg>
                              Tracks
                              {hasActiveFilters(filters) && (
                                <span className="text-xs text-[#d4a060] ml-2">
                                  (filtered)
                                </span>
                              )}
                            </h3>

                            <div className="space-y-2">
                              {tracks.map((track) => (
                                <SearchTrackResult
                                  key={track.uid}
                                  track={track}
                                  filters={filters}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
