/**
 * Integration test: Recent searches hook
 *
 * Tests useRecentSearches from hooks/useRecentSearches.ts:
 * - Starts empty
 * - addSearch adds to front, deduplicates (case-insensitive), caps at 10
 * - removeSearch removes exact match
 * - clearSearches empties list
 * - Persists to localStorage key 'jamify-recent-searches'
 * - Restores from localStorage on mount
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches } from '@/hooks/useRecentSearches';

describe('Recent Searches Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty list', () => {
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.recentSearches).toEqual([]);
  });

  it('adds a search to front', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.addSearch('Railroad Earth'));
    expect(result.current.recentSearches).toEqual(['Railroad Earth']);
  });

  it('ignores empty/whitespace-only queries', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.addSearch(''));
    act(() => result.current.addSearch('   '));
    expect(result.current.recentSearches).toEqual([]);
  });

  it('deduplicates case-insensitively, keeping latest at front', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.addSearch('Phish'));
    act(() => result.current.addSearch('Goose'));
    act(() => result.current.addSearch('phish'));
    expect(result.current.recentSearches).toEqual(['phish', 'Goose']);
  });

  it('caps at 10 entries', () => {
    const { result } = renderHook(() => useRecentSearches());
    for (let i = 1; i <= 12; i++) {
      act(() => result.current.addSearch(`search-${i}`));
    }
    expect(result.current.recentSearches).toHaveLength(10);
    expect(result.current.recentSearches[0]).toBe('search-12');
    expect(result.current.recentSearches[9]).toBe('search-3');
  });

  it('removes exact match', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.addSearch('Grateful Dead'));
    act(() => result.current.addSearch('Phish'));
    act(() => result.current.removeSearch('Grateful Dead'));
    expect(result.current.recentSearches).toEqual(['Phish']);
  });

  it('clearSearches empties the list', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.addSearch('Phish'));
    act(() => result.current.addSearch('moe.'));
    act(() => result.current.clearSearches());
    expect(result.current.recentSearches).toEqual([]);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.addSearch('Railroad Earth'));
    const stored = JSON.parse(localStorage.getItem('jamify-recent-searches')!);
    expect(stored).toEqual(['Railroad Earth']);
  });

  it('restores from localStorage on mount', () => {
    localStorage.setItem(
      'jamify-recent-searches',
      JSON.stringify(['Goose', 'Phish', 'moe.'])
    );
    const { result } = renderHook(() => useRecentSearches());
    // useEffect runs async, wait for it
    expect(result.current.recentSearches).toEqual(['Goose', 'Phish', 'moe.']);
  });

  it('trims whitespace from search queries', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.addSearch('  Railroad Earth  '));
    expect(result.current.recentSearches).toEqual(['Railroad Earth']);
  });
});
