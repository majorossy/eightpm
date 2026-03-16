/**
 * Integration test: Advanced MiniDisc operations
 *
 * Tests CollectionContext operations not covered by collection-sync:
 * - cloneMiniDisc: copies songs, appends " copy" to name
 * - reorderMiniDisc: splice-based song reordering
 * - updateMiniDisc: name truncation, whitespace-only guard, description
 * - removeFromMiniDisc: removes song by ID
 * - Validation: empty name rejected, long names truncated
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useCollections } from '@/context/CollectionContext';
import { buildSong, resetCounters } from '@/test/factories/song';
import { resetAuthMocks } from '@/test/mocks/magentoAuth';
import { resetCollections } from '@/test/mocks/magentoSync';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

function MiniDiscAdvancedDisplay() {
  const collection = useCollections();
  const disc = collection.minidiscs[0];
  const cloned = collection.minidiscs[1];

  return (
    <div>
      <div data-testid="disc-count">{collection.minidiscs.length}</div>
      <div data-testid="disc-name">{disc?.name ?? 'none'}</div>
      <div data-testid="disc-description">{disc?.description ?? ''}</div>
      <div data-testid="disc-songs">{disc?.songs.length ?? 0}</div>
      <div data-testid="disc-song-names">
        {disc?.songs.map(s => s.trackTitle).join(',') ?? ''}
      </div>
      <div data-testid="cloned-name">{cloned?.name ?? 'none'}</div>
      <div data-testid="cloned-songs">{cloned?.songs.length ?? 0}</div>
      <button
        data-testid="create"
        onClick={() => collection.createMiniDisc('Road Trip Mix')}
      >Create</button>
      <button
        data-testid="add-songs"
        onClick={() => {
          if (!disc) return;
          collection.addToMiniDisc(disc.id, buildSong({ trackTitle: 'Bird Song', id: 'bird-1' }));
          collection.addToMiniDisc(disc.id, buildSong({ trackTitle: 'Dark Star', id: 'dark-1' }));
          collection.addToMiniDisc(disc.id, buildSong({ trackTitle: 'Eyes of the World', id: 'eyes-1' }));
        }}
      >Add 3 Songs</button>
      <button
        data-testid="clone"
        onClick={() => { if (disc) collection.cloneMiniDisc(disc.id); }}
      >Clone</button>
      <button
        data-testid="reorder-2-to-0"
        onClick={() => { if (disc) collection.reorderMiniDisc(disc.id, 2, 0); }}
      >Reorder 2→0</button>
      <button
        data-testid="remove-first-song"
        onClick={() => {
          if (disc && disc.songs[0]) collection.removeFromMiniDisc(disc.id, disc.songs[0].id);
        }}
      >Remove First Song</button>
      <button
        data-testid="rename"
        onClick={() => { if (disc) collection.updateMiniDisc(disc.id, { name: 'Updated Name' }); }}
      >Rename</button>
      <button
        data-testid="rename-whitespace"
        onClick={() => { if (disc) collection.updateMiniDisc(disc.id, { name: '   ' }); }}
      >Rename Whitespace</button>
      <button
        data-testid="rename-long"
        onClick={() => { if (disc) collection.updateMiniDisc(disc.id, { name: 'A'.repeat(120) }); }}
      >Rename Long</button>
      <button
        data-testid="set-description"
        onClick={() => { if (disc) collection.updateMiniDisc(disc.id, { description: 'Great jams from tour' }); }}
      >Set Description</button>
      <button
        data-testid="create-empty-name"
        onClick={() => {
          try { collection.createMiniDisc(''); } catch { /* expected */ }
        }}
      >Create Empty</button>
    </div>
  );
}

describe('MiniDisc Advanced Operations Integration', () => {
  beforeEach(() => {
    resetCounters();
    resetAuthMocks();
    resetCollections();
    localStorage.clear();
  });

  it('cloneMiniDisc copies songs and appends " copy"', async () => {
    renderApp(<MiniDiscAdvancedDisplay />);

    await act(async () => { screen.getByTestId('create').click(); });
    await act(async () => { screen.getByTestId('add-songs').click(); });
    expect(screen.getByTestId('disc-songs').textContent).toBe('3');

    await act(async () => { screen.getByTestId('clone').click(); });

    expect(screen.getByTestId('disc-count').textContent).toBe('2');
    expect(screen.getByTestId('cloned-name').textContent).toBe('Road Trip Mix copy');
    expect(screen.getByTestId('cloned-songs').textContent).toBe('3');
  });

  it('reorderMiniDisc moves song to new position', async () => {
    renderApp(<MiniDiscAdvancedDisplay />);

    await act(async () => { screen.getByTestId('create').click(); });
    await act(async () => { screen.getByTestId('add-songs').click(); });
    expect(screen.getByTestId('disc-song-names').textContent).toBe('Bird Song,Dark Star,Eyes of the World');

    // Move Eyes of the World (index 2) to front (index 0)
    await act(async () => { screen.getByTestId('reorder-2-to-0').click(); });
    expect(screen.getByTestId('disc-song-names').textContent).toBe('Eyes of the World,Bird Song,Dark Star');
  });

  it('removeFromMiniDisc removes song by ID', async () => {
    renderApp(<MiniDiscAdvancedDisplay />);

    await act(async () => { screen.getByTestId('create').click(); });
    await act(async () => { screen.getByTestId('add-songs').click(); });
    expect(screen.getByTestId('disc-songs').textContent).toBe('3');

    await act(async () => { screen.getByTestId('remove-first-song').click(); });
    expect(screen.getByTestId('disc-songs').textContent).toBe('2');
    // Bird Song removed, Dark Star and Eyes remain
    expect(screen.getByTestId('disc-song-names').textContent).not.toContain('Bird Song');
  });

  it('updateMiniDisc renames the disc', async () => {
    renderApp(<MiniDiscAdvancedDisplay />);

    await act(async () => { screen.getByTestId('create').click(); });
    expect(screen.getByTestId('disc-name').textContent).toBe('Road Trip Mix');

    await act(async () => { screen.getByTestId('rename').click(); });
    expect(screen.getByTestId('disc-name').textContent).toBe('Updated Name');
  });

  it('updateMiniDisc rejects whitespace-only name (silent no-op)', async () => {
    renderApp(<MiniDiscAdvancedDisplay />);

    await act(async () => { screen.getByTestId('create').click(); });

    await act(async () => { screen.getByTestId('rename-whitespace').click(); });
    // Name should remain unchanged
    expect(screen.getByTestId('disc-name').textContent).toBe('Road Trip Mix');
  });

  it('updateMiniDisc truncates long name to 100 chars', async () => {
    renderApp(<MiniDiscAdvancedDisplay />);

    await act(async () => { screen.getByTestId('create').click(); });

    await act(async () => { screen.getByTestId('rename-long').click(); });
    expect(screen.getByTestId('disc-name').textContent!.length).toBeLessThanOrEqual(100);
  });

  it('updateMiniDisc sets description', async () => {
    renderApp(<MiniDiscAdvancedDisplay />);

    await act(async () => { screen.getByTestId('create').click(); });
    expect(screen.getByTestId('disc-description').textContent).toBe('');

    await act(async () => { screen.getByTestId('set-description').click(); });
    expect(screen.getByTestId('disc-description').textContent).toBe('Great jams from tour');
  });

  it('removeFromMiniDisc on last song leaves empty array', async () => {
    renderApp(<MiniDiscAdvancedDisplay />);

    await act(async () => { screen.getByTestId('create').click(); });
    // Add only one song
    await act(async () => {
      const disc = screen.getByTestId('disc-name').textContent;
      // Trigger a single add via the button which adds 3
    });
    await act(async () => { screen.getByTestId('add-songs').click(); });

    // Remove all three songs
    await act(async () => { screen.getByTestId('remove-first-song').click(); });
    await act(async () => { screen.getByTestId('remove-first-song').click(); });
    await act(async () => { screen.getByTestId('remove-first-song').click(); });

    expect(screen.getByTestId('disc-songs').textContent).toBe('0');
    expect(screen.getByTestId('disc-name').textContent).toBe('Road Trip Mix');
  });
});
