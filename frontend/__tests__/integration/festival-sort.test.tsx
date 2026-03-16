/**
 * Integration test: Festival sort context
 *
 * Tests FestivalSortContext behavior:
 * - Default algorithm is 'shows'
 * - setAlgorithm changes sort order
 * - Alpha mode sorts alphabetically
 * - setAlgorithm resets alpha mode
 * - toggleAlphaMode toggles A-Z sorting
 * - localStorage persistence for algorithm and alpha mode
 * - Invalid algorithm rejected
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { FestivalSortProvider, useFestivalSort } from '@/context/FestivalSortContext';
import { ArtistWithStats } from '@/utils/festivalSorting';

const testArtists: ArtistWithStats[] = [
  { slug: 'grateful-dead', name: 'Grateful Dead', songCount: 5000, albumCount: 200, totalShows: 2300, totalHours: 4500 },
  { slug: 'phish', name: 'Phish', songCount: 8000, albumCount: 300, totalShows: 1800, totalHours: 3500 },
  { slug: 'billy-strings', name: 'Billy Strings', songCount: 1000, albumCount: 50, totalShows: 500, totalHours: 800 },
];

function SortDisplay() {
  const sort = useFestivalSort();

  return (
    <div>
      <div data-testid="algorithm">{sort.algorithm}</div>
      <div data-testid="alpha-mode">{String(sort.isAlphaMode)}</div>
      <div data-testid="is-loading">{String(sort.isLoading)}</div>
      <div data-testid="sorted-names">
        {sort.sortedArtists.map(a => a.name).join(',')}
      </div>
      <button data-testid="set-shows" onClick={() => sort.setAlgorithm('shows')}>
        Shows
      </button>
      <button data-testid="set-versions" onClick={() => sort.setAlgorithm('songVersions')}>
        Song Versions
      </button>
      <button data-testid="set-hours" onClick={() => sort.setAlgorithm('hours')}>
        Hours
      </button>
      <button data-testid="toggle-alpha" onClick={() => sort.toggleAlphaMode()}>
        Toggle Alpha
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <FestivalSortProvider artists={testArtists}>
      <SortDisplay />
    </FestivalSortProvider>
  );
}

describe('Festival Sort Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('default algorithm is shows', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('algorithm').textContent).toBe('shows');
  });

  it('sorts by shows descending (default)', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    // Grateful Dead (2300) > Phish (1800) > Billy Strings (500)
    expect(screen.getByTestId('sorted-names').textContent).toBe(
      'Grateful Dead,Phish,Billy Strings'
    );
  });

  it('songVersions sorts by songCount descending', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('set-versions').click(); });

    expect(screen.getByTestId('algorithm').textContent).toBe('songVersions');
    // Phish (8000) > Grateful Dead (5000) > Billy Strings (1000)
    expect(screen.getByTestId('sorted-names').textContent).toBe(
      'Phish,Grateful Dead,Billy Strings'
    );
  });

  it('hours sorts by totalHours descending', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('set-hours').click(); });

    expect(screen.getByTestId('algorithm').textContent).toBe('hours');
    // Grateful Dead (4500) > Phish (3500) > Billy Strings (800)
    expect(screen.getByTestId('sorted-names').textContent).toBe(
      'Grateful Dead,Phish,Billy Strings'
    );
  });

  it('alpha mode sorts alphabetically', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('toggle-alpha').click(); });

    expect(screen.getByTestId('alpha-mode').textContent).toBe('true');
    expect(screen.getByTestId('sorted-names').textContent).toBe(
      'Billy Strings,Grateful Dead,Phish'
    );
  });

  it('setAlgorithm resets alpha mode', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('toggle-alpha').click(); });
    expect(screen.getByTestId('alpha-mode').textContent).toBe('true');

    act(() => { screen.getByTestId('set-versions').click(); });
    expect(screen.getByTestId('alpha-mode').textContent).toBe('false');
  });

  it('persists algorithm to localStorage', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('set-versions').click(); });

    expect(localStorage.getItem('festivalSortAlgorithm')).toBe('songVersions');
  });

  it('persists alpha mode to localStorage', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    act(() => { screen.getByTestId('toggle-alpha').click(); });

    expect(localStorage.getItem('festivalSortAlphaMode')).toBe('true');

    act(() => { screen.getByTestId('toggle-alpha').click(); });

    expect(localStorage.getItem('festivalSortAlphaMode')).toBe('false');
  });

  it('restores algorithm from localStorage on mount', async () => {
    localStorage.setItem('festivalSortAlgorithm', 'hours');

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('algorithm').textContent).toBe('hours');
    // Should be hours sort: Grateful Dead > Phish > Billy Strings
    expect(screen.getByTestId('sorted-names').textContent).toBe(
      'Grateful Dead,Phish,Billy Strings'
    );
  });

  it('restores alpha mode from localStorage on mount', async () => {
    localStorage.setItem('festivalSortAlphaMode', 'true');

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('alpha-mode').textContent).toBe('true');
    expect(screen.getByTestId('sorted-names').textContent).toBe(
      'Billy Strings,Grateful Dead,Phish'
    );
  });
});
