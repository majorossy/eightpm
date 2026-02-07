'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { VenueDetail } from '@/lib/types';
import { getVenues } from '@/lib/api';

export default function VenueBrowseContent() {
  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const pageSize = 24;

  const loadVenues = useCallback(async (page: number, search?: string, state?: string) => {
    setLoading(true);
    try {
      const result = await getVenues({
        search: search || undefined,
        state: state || undefined,
        pageSize,
        currentPage: page,
      });
      setVenues(result.items);
      setTotalCount(result.total_count);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVenues(1);
  }, [loadVenues]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadVenues(1, searchQuery, stateFilter);
  }

  function handleClearFilters() {
    setSearchQuery('');
    setStateFilter('');
    loadVenues(1);
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasFilters = searchQuery.trim() !== '' || stateFilter.trim() !== '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-2">
            Venues
          </h1>
          <p className="text-[var(--text-subdued)]">
            Browse venues where live recordings were captured
          </p>
        </div>
        <Link
          href="/venues/map"
          className="px-4 py-2 bg-[#2d2a26] hover:bg-[#3a3632] text-[var(--text)] rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Map
        </Link>
      </div>

      {/* Search and filters */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search venues..."
            className="w-full px-4 py-2.5 bg-[#252220] border border-[#3a3632] rounded-lg text-[var(--text)] placeholder-[var(--text-subdued)] focus:outline-none focus:border-[#d4a060] transition-colors"
          />
        </div>
        <input
          type="text"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          placeholder="State (e.g. NY)"
          className="w-full sm:w-32 px-4 py-2.5 bg-[#252220] border border-[#3a3632] rounded-lg text-[var(--text)] placeholder-[var(--text-subdued)] focus:outline-none focus:border-[#d4a060] transition-colors"
        />
        <button
          type="submit"
          className="px-6 py-2.5 bg-[#d4a060] text-[#1c1a17] rounded-lg font-medium hover:bg-[#e8c090] transition-colors"
        >
          Search
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2.5 text-[var(--text-subdued)] hover:text-[var(--text)] transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Results count */}
      {!loading && (
        <div className="text-sm text-[var(--text-subdued)] mb-4">
          {totalCount.toLocaleString()} {totalCount === 1 ? 'venue' : 'venues'}
          {hasFilters ? ' found' : ''}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center text-[var(--text-subdued)]">
          Loading venues...
        </div>
      )}

      {/* Venue grid */}
      {!loading && venues.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((venue) => {
            const location = [venue.city, venue.state].filter(Boolean).join(', ');
            return (
              <Link
                key={venue.slug}
                href={`/venues/${venue.slug}`}
                className="bg-[#252220] hover:bg-[#2d2a26] rounded-lg p-5 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2d2a26] flex items-center justify-center flex-shrink-0 group-hover:bg-[#3a3632] transition-colors">
                    <svg className="w-5 h-5 text-[#d4a060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[var(--text)] font-medium truncate group-hover:text-[#d4a060] transition-colors">
                      {venue.normalized_name}
                    </div>
                    {location && (
                      <div className="text-[var(--text-subdued)] text-sm mt-0.5 truncate">
                        {location}
                      </div>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-[var(--text-subdued)]">
                      <span>{venue.total_shows} shows</span>
                      <span>{venue.total_artists} artists</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && venues.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-[var(--text-subdued)] mb-2">
            No venues found
          </div>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="text-[#d4a060] hover:underline text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pt-4 border-t border-[#2d2a26]">
          <button
            onClick={() => loadVenues(currentPage - 1, searchQuery, stateFilter)}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm rounded-lg bg-[#2d2a26] text-[var(--text)] disabled:opacity-40 hover:bg-[#3a3632] transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--text-subdued)] px-4">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => loadVenues(currentPage + 1, searchQuery, stateFilter)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm rounded-lg bg-[#2d2a26] text-[var(--text)] disabled:opacity-40 hover:bg-[#3a3632] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
