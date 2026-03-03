'use client';

import { useState, useCallback, useMemo } from 'react';
import { hasActiveFilters, type VersionFilters } from '@/lib/filters';
import { CustomSelect, type SelectOption } from './CustomSelect';
import { VenueAutocomplete } from './VenueAutocomplete';
import { VALIDATION_LIMITS } from '@/lib/validation';

export type { VersionFilters } from '@/lib/filters';

interface ArtistOption {
  slug: string;
  name: string;
}

interface SearchFiltersProps {
  filters: VersionFilters;
  onFiltersChange: (filters: VersionFilters) => void;
  availableYears?: number[];
  availableArtists?: ArtistOption[];
  availableVenues?: string[];
  className?: string;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  availableYears = [],
  availableArtists = [],
  availableVenues = [],
  className = '',
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Year options
  const yearOptions: SelectOption[] = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = availableYears.length > 0
      ? availableYears.sort((a, b) => b - a)
      : Array.from({ length: 60 }, (_, i) => currentYear - i);

    return [
      { value: '', label: 'All Years' },
      ...years.map(year => ({ value: String(year), label: String(year) }))
    ];
  }, [availableYears]);

  // Artist options
  const artistOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: 'All Artists' },
      ...availableArtists.map(artist => ({
        value: artist.slug,
        label: artist.name,
        icon: (
          <svg className="w-4 h-4 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ),
      }))
    ];
  }, [availableArtists]);

  // Rating options (1-5 stars)
  const ratingOptions: SelectOption[] = useMemo(() => {
    const starIcon = (filled: number) => (
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <svg
            key={n}
            className={`w-3 h-3 ${n <= filled ? 'text-accent' : 'text-border'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
    );

    return [
      { value: '', label: 'Any Rating' },
      { value: '5', label: '5 Stars', icon: starIcon(5) },
      { value: '4', label: '4+ Stars', icon: starIcon(4) },
      { value: '3', label: '3+ Stars', icon: starIcon(3) },
      { value: '2', label: '2+ Stars', icon: starIcon(2) },
      { value: '1', label: '1+ Stars', icon: starIcon(1) },
    ];
  }, []);

  const handleYearChange = useCallback((year: string) => {
    if (!year) {
      onFiltersChange({ ...filters, year: undefined });
      return;
    }
    const yearNum = parseInt(year, 10);
    // Validate year is in reasonable range
    if (!isNaN(yearNum) && yearNum >= VALIDATION_LIMITS.YEAR_MIN && yearNum <= VALIDATION_LIMITS.YEAR_MAX) {
      onFiltersChange({ ...filters, year: yearNum });
    }
  }, [filters, onFiltersChange]);

  const handleArtistChange = useCallback((artist: string) => {
    onFiltersChange({ ...filters, artist: artist || undefined });
  }, [filters, onFiltersChange]);

  const handleRatingChange = useCallback((rating: string) => {
    if (!rating) {
      onFiltersChange({ ...filters, minRating: undefined });
      return;
    }
    const ratingNum = parseInt(rating, 10);
    // Validate rating is 1-5
    if (!isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
      onFiltersChange({ ...filters, minRating: ratingNum });
    }
  }, [filters, onFiltersChange]);

  const handleVenueChange = useCallback((venue: string) => {
    onFiltersChange({ ...filters, venue: venue || undefined });
  }, [filters, onFiltersChange]);

  const handleSoundboardToggle = useCallback(() => {
    onFiltersChange({ ...filters, isSoundboard: !filters.isSoundboard });
  }, [filters, onFiltersChange]);

  const handleClearAll = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  const activeFilterCount = [
    filters.year,
    filters.venue,
    filters.isSoundboard,
    filters.artist,
    filters.minRating
  ].filter(Boolean).length;

  return (
    <div className={`search-filters ${className}`}>
      {/* Filter Toggle Button (Mobile) */}
      <div className="flex items-center gap-2 mb-2 md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                     bg-surface-card text-primary hover:bg-border transition-colors
                     border border-default"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-inverse text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>
        {hasActiveFilters(filters) && (
          <button
            onClick={handleClearAll}
            className="text-xs text-secondary hover:text-accent transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className={`flex flex-wrap items-center gap-2 ${!isExpanded ? 'hidden md:flex' : 'flex'}`}>
        {/* Artist Dropdown */}
        {availableArtists.length > 0 && (
          <CustomSelect
            options={artistOptions}
            value={filters.artist || ''}
            onChange={handleArtistChange}
            placeholder="All Artists"
            className="min-w-[140px]"
          />
        )}

        {/* Year Dropdown */}
        <CustomSelect
          options={yearOptions}
          value={filters.year ? String(filters.year) : ''}
          onChange={handleYearChange}
          placeholder="All Years"
          className="min-w-[120px]"
        />

        {/* Rating Dropdown */}
        <CustomSelect
          options={ratingOptions}
          value={filters.minRating ? String(filters.minRating) : ''}
          onChange={handleRatingChange}
          placeholder="Any Rating"
          className="min-w-[130px]"
        />

        {/* Venue Autocomplete */}
        <VenueAutocomplete
          value={filters.venue || ''}
          onChange={handleVenueChange}
          suggestions={availableVenues}
          placeholder="Venue..."
          className="w-40 md:w-48"
        />

        {/* Soundboard Toggle */}
        <button
          onClick={handleSoundboardToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200
                     ${filters.isSoundboard
                       ? 'bg-gradient-to-r from-accent to-accent-hover text-inverse font-medium shadow-md shadow-accent/20'
                       : 'bg-surface-card text-primary border border-default hover:border-accent'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          SBD Only
        </button>

        {/* Clear Filters (Desktop) */}
        {hasActiveFilters(filters) && (
          <button
            onClick={handleClearAll}
            className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full text-sm
                       text-secondary hover:text-accent transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchFilters;
