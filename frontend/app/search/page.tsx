'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { SearchTrackResult } from '@/components/SearchTrackResult';
import { SearchFilters } from '@/components/SearchFilters';
import { VinylSpinner } from '@/components/VinylSpinner';
import { SearchSilence } from '@/components/NoResultsIcons';
import { trackSearch, trackSearchResultClick } from '@/lib/analytics';
import { VALIDATION_LIMITS } from '@/lib/validation';

interface SearchResults {
  artists: Artist[];
  albums: AlbumCategory[];
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ artists: [], albums: [] });
  const [isSearching, setIsSearching] = useState(false);
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

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch all venues on mount for autocomplete
  useEffect(() => {
    fetch('/api/venues')
      .then(res => res.json())
      .then(data => {
        if (data.venues?.length > 0) {
          setCollectedVenues(new Set(data.venues));
        }
      })
      .catch(err => console.error('Failed to fetch venues:', err));
  }, []);

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
          const rawTracks = searchResults.tracks || [];
          const sortedTracks = [...rawTracks].sort((a: TrackCategory, b: TrackCategory) => {
            const aHasVersions = (a.product_count || 0) > 0;
            const bHasVersions = (b.product_count || 0) > 0;
            if (aHasVersions && !bHasVersions) return -1;
            if (!aHasVersions && bHasVersions) return 1;
            return 0;
          });
          setTracks(sortedTracks);

          // Collect venues from search results for autocomplete
          const newVenues = searchResults.venues || [];
          if (newVenues.length > 0) {
            setCollectedVenues(prev => {
              const merged = new Set(Array.from(prev).concat(newVenues));
              return merged;
            });
          }

          // Track search analytics
          const totalResults =
            (searchResults.artists?.length || 0) +
            (searchResults.albums?.length || 0) +
            (searchResults.tracks?.length || 0);
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

  const handleArtistClick = (artist: Artist, position: number) => {
    addSearch(artist.name);
    trackSearchResultClick(debouncedQuery, 'artist', artist.name, position);
    router.push(`/artists/${artist.slug}`);
  };

  const handleAlbumClick = (album: AlbumCategory, position: number) => {
    addSearch(album.name);
    trackSearchResultClick(debouncedQuery, 'album', album.name, position);
    const artistSlug = album.breadcrumbs?.[0]?.category_url_key || '';
    if (artistSlug) {
      router.push(`/artists/${artistSlug}/album/${album.url_key}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setTracks([]);
    setFilters({});
    inputRef.current?.focus();
  };

  const hasResults = results.artists.length > 0 || results.albums.length > 0 || tracks.length > 0;
  const showNoResults = debouncedQuery && !isSearching && !hasResults;

  return (
    <div className="min-h-screen bg-[#1c1a17] pb-[140px] md:pb-[90px] safe-top">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Search</h1>

          {/* Search input */}
          <div className="relative max-w-2xl">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.slice(0, VALIDATION_LIMITS.SEARCH_QUERY_MAX))}
              placeholder="What do you want to listen to?"
              maxLength={VALIDATION_LIMITS.SEARCH_QUERY_MAX}
              className="w-full bg-[#2d2a26] text-white placeholder-gray-400 rounded-full px-6 py-4 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-[#d4a060]"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                </svg>
              </button>
            )}
          </div>

          {/* Filters - show when there's a search query */}
          {debouncedQuery && !isSearching && tracks.length > 0 && (
            <div className="mt-4">
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
        <div className="px-6 md:px-8 py-6">
          {!debouncedQuery ? (
            /* Recent Searches */
            recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-xl">Recent searches</h2>
                  <button
                    onClick={clearSearches}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="group flex items-center gap-2 bg-[#2d2a26] hover:bg-[#3a3632] text-white px-4 py-2 rounded-full text-sm transition-colors"
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
            <div className="flex flex-col items-center justify-center gap-6 py-20">
              <VinylSpinner size="lg" />
              <span className="text-[#d4a060] text-lg font-medium tracking-wide">Searching the archives...</span>
            </div>
          ) : (
            /* Search Results */
            <div className="space-y-8">
              {showNoResults && (
                <div className="flex flex-col items-center justify-center py-16">
                  <SearchSilence size={160} />
                  <p className="text-[#b8a898] text-2xl font-medium mb-2">No recordings found</p>
                  <p className="text-[#8a7a68] text-lg">
                    Nothing in the archives for &quot;{debouncedQuery}&quot;
                  </p>
                  <p className="text-[#6a5a4a] text-base mt-4">
                    Try searching for artists, shows, or song titles
                  </p>
                </div>
              )}

              {hasResults && (
                <>
                  {/* Artists */}
                  {results.artists.length > 0 && (
                    <div>
                      <h3 className="text-white font-bold text-xl mb-4">Artists</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {results.artists.map((artist, index) => (
                          <button
                            key={artist.id}
                            onClick={() => handleArtistClick(artist, index + 1)}
                            className="flex flex-col items-center p-4 bg-[#252220] hover:bg-[#2d2a26] rounded-lg transition-colors text-left"
                          >
                            <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-3 overflow-hidden relative">
                              {artist.image ? (
                                <Image src={artist.image} alt={artist.name || 'Artist'} fill sizes="128px" quality={80} className="object-cover" />
                              ) : (
                                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                              )}
                            </div>
                            <p className="text-white font-medium text-center w-full truncate">{artist.name}</p>
                            <p className="text-gray-400 text-sm">Artist</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Albums */}
                  {results.albums.length > 0 && (
                    <div>
                      <h3 className="text-white font-bold text-xl mb-4">Albums</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {results.albums.map((album, index) => {
                          const artistName = album.breadcrumbs?.[0]?.category_name || 'Unknown Artist';
                          return (
                            <button
                              key={album.uid}
                              onClick={() => handleAlbumClick(album, index + 1)}
                              className="flex flex-col p-4 bg-[#252220] hover:bg-[#2d2a26] rounded-lg transition-colors text-left"
                            >
                              <div className="w-full aspect-square bg-gray-700 rounded mb-3 overflow-hidden relative">
                                {album.wikipedia_artwork_url ? (
                                  <Image src={album.wikipedia_artwork_url} alt={album.name || 'Album'} fill sizes="200px" quality={80} className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3a3632] to-[#252220]">
                                    <svg className="w-12 h-12 text-[#d4a060]" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <p className="text-white font-medium truncate" title={album.name}>{album.name}</p>
                              <p className="text-gray-400 text-sm truncate">
                                {artistName} • {album.product_count || 0} tracks
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tracks Section */}
                  {tracks.length > 0 && (
                    <section className="mb-8">
                      <h2 className="text-xl font-semibold text-[#e8dcc8] mb-4 flex items-center gap-2">
                        Tracks
                        {hasActiveFilters(filters) && (
                          <span className="text-xs text-[#d4a060]">
                            (filtered)
                          </span>
                        )}
                      </h2>

                      <div className="space-y-2">
                        {tracks.map((track) => (
                          <SearchTrackResult
                            key={track.uid}
                            track={track}
                            filters={filters}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
