/**
 * Integration test: Breadcrumb context
 *
 * Tests BreadcrumbContext behavior:
 * - setBreadcrumbs sets the trail
 * - clearBreadcrumbs empties the trail
 * - Multiple breadcrumbs with labels, hrefs, and types
 * - Replacing breadcrumbs replaces entire trail
 * - shortLabel is accessible
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { screen, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { BreadcrumbProvider, useBreadcrumbs, BreadcrumbItem } from '@/context/BreadcrumbContext';

function BreadcrumbDisplay() {
  const { breadcrumbs, setBreadcrumbs, clearBreadcrumbs } = useBreadcrumbs();

  return (
    <div>
      <div data-testid="count">{breadcrumbs.length}</div>
      <div data-testid="labels">
        {breadcrumbs.map(b => b.label).join(' > ')}
      </div>
      <div data-testid="hrefs">
        {breadcrumbs.map(b => b.href ?? 'none').join(',')}
      </div>
      <div data-testid="types">
        {breadcrumbs.map(b => b.type ?? 'none').join(',')}
      </div>
      <div data-testid="short-labels">
        {breadcrumbs.map(b => b.shortLabel ?? b.label).join(',')}
      </div>
      <button
        data-testid="set-artist"
        onClick={() => setBreadcrumbs([
          { label: 'Library', href: '/library', type: 'library' },
          { label: 'Grateful Dead', shortLabel: 'GD', href: '/artists/grateful-dead', type: 'artist' },
        ])}
      >Set Artist</button>
      <button
        data-testid="set-album"
        onClick={() => setBreadcrumbs([
          { label: 'Library', href: '/library', type: 'library' },
          { label: 'Grateful Dead', shortLabel: 'GD', href: '/artists/grateful-dead', type: 'artist' },
          { label: 'Cornell 77', href: '/artists/grateful-dead/album/gd1977-05-08', type: 'album' },
        ])}
      >Set Album</button>
      <button
        data-testid="set-track"
        onClick={() => setBreadcrumbs([
          { label: 'Library', href: '/library', type: 'library' },
          { label: 'Railroad Earth', href: '/artists/railroadearth', type: 'artist' },
          { label: '2024-06-15', type: 'album' },
          { label: 'Bird on a Wire', type: 'track' },
        ])}
      >Set Track</button>
      <button data-testid="clear" onClick={() => clearBreadcrumbs()}>
        Clear
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <BreadcrumbProvider>
      <BreadcrumbDisplay />
    </BreadcrumbProvider>
  );
}

describe('Breadcrumb Context Integration', () => {
  it('starts with empty breadcrumbs', () => {
    renderWithProvider();

    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('labels').textContent).toBe('');
  });

  it('setBreadcrumbs sets artist trail', () => {
    renderWithProvider();

    act(() => { screen.getByTestId('set-artist').click(); });

    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('labels').textContent).toBe('Library > Grateful Dead');
    expect(screen.getByTestId('types').textContent).toBe('library,artist');
  });

  it('setBreadcrumbs sets album trail with hrefs', () => {
    renderWithProvider();

    act(() => { screen.getByTestId('set-album').click(); });

    expect(screen.getByTestId('count').textContent).toBe('3');
    expect(screen.getByTestId('labels').textContent).toBe('Library > Grateful Dead > Cornell 77');
    expect(screen.getByTestId('hrefs').textContent).toContain('/library');
    expect(screen.getByTestId('hrefs').textContent).toContain('/artists/grateful-dead');
    expect(screen.getByTestId('hrefs').textContent).toContain('gd1977-05-08');
  });

  it('shortLabel is accessible', () => {
    renderWithProvider();

    act(() => { screen.getByTestId('set-artist').click(); });

    expect(screen.getByTestId('short-labels').textContent).toBe('Library,GD');
  });

  it('replacing breadcrumbs replaces entire trail', () => {
    renderWithProvider();

    act(() => { screen.getByTestId('set-artist').click(); });
    expect(screen.getByTestId('count').textContent).toBe('2');

    act(() => { screen.getByTestId('set-track').click(); });
    expect(screen.getByTestId('count').textContent).toBe('4');
    expect(screen.getByTestId('labels').textContent).toBe(
      'Library > Railroad Earth > 2024-06-15 > Bird on a Wire'
    );
    expect(screen.getByTestId('types').textContent).toBe('library,artist,album,track');
  });

  it('clearBreadcrumbs empties the trail', () => {
    renderWithProvider();

    act(() => { screen.getByTestId('set-album').click(); });
    expect(screen.getByTestId('count').textContent).toBe('3');

    act(() => { screen.getByTestId('clear').click(); });
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('labels').textContent).toBe('');
  });

  it('missing hrefs show as none', () => {
    renderWithProvider();

    act(() => { screen.getByTestId('set-track').click(); });

    // Track breadcrumb items: Library has href, Railroad Earth has href,
    // '2024-06-15' has no href, 'Bird on a Wire' has no href
    const hrefs = screen.getByTestId('hrefs').textContent!;
    expect(hrefs).toContain('/library');
    expect(hrefs).toContain('none');
  });
});
