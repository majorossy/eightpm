/**
 * Integration test: Collection sync (Cassettes + MiniDiscs)
 *
 * Tests CollectionContext + MagentoAuthContext interaction:
 * - Create/delete cassettes and minidiscs
 * - Server sync triggers on login
 * - Add/remove songs from minidiscs
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { useCollections } from '@/context/CollectionContext';
import { buildSong, resetCounters } from '@/test/factories/song';
import { buildCustomer } from '@/test/factories/customer';
import { setCustomerToReturn, resetAuthMocks } from '@/test/mocks/magentoAuth';
import {
  resetCollections,
  fetchCustomerCollections,
  saveCassette as saveCassetteSync,
  saveMiniDisc as saveMiniDiscSync,
  deleteMiniDisc as deleteMiniDiscSync,
} from '@/test/mocks/magentoSync';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

function CollectionDisplay() {
  const auth = useMagentoAuth();
  const collection = useCollections();

  return (
    <div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="minidisc-count">{collection.minidiscs.length}</div>
      <div data-testid="cassette-count">{collection.cassettes.length}</div>
      <div data-testid="first-minidisc-name">
        {collection.minidiscs[0]?.name ?? ''}
      </div>
      <div data-testid="first-minidisc-songs">
        {collection.minidiscs[0]?.songs.length ?? 0}
      </div>
      <button
        data-testid="create-minidisc-btn"
        onClick={() => collection.createMiniDisc('Summer Jams')}
      >
        Create MiniDisc
      </button>
      <button
        data-testid="add-song-to-minidisc-btn"
        onClick={() => {
          const md = collection.minidiscs[0];
          if (md) {
            const song = buildSong({ trackTitle: 'Bird Song' });
            collection.addToMiniDisc(md.id, song);
          }
        }}
      >
        Add Song
      </button>
      <button
        data-testid="delete-minidisc-btn"
        onClick={() => {
          const md = collection.minidiscs[0];
          if (md) collection.deleteMiniDisc(md.id);
        }}
      >
        Delete MiniDisc
      </button>
      <button
        data-testid="save-cassette-btn"
        onClick={() => {
          collection.saveCassette({
            name: 'My Cassette',
            albumIdentifier: 're-2024-01-01',
            artistSlug: 'railroad-earth',
            artistName: 'Railroad Earth',
            albumName: 'Railroad Earth Live',
            versionOverrides: {},
          });
        }}
      >
        Save Cassette
      </button>
      <button
        data-testid="sign-in-btn"
        onClick={() => auth.signIn('trey', 'password123')}
      >
        Sign In
      </button>
    </div>
  );
}

describe('Collection Sync Integration', () => {
  beforeEach(() => {
    resetCounters();
    resetAuthMocks();
    resetCollections();
    localStorage.clear();
  });

  it('creates a minidisc', async () => {
    renderApp(<CollectionDisplay />);

    expect(screen.getByTestId('minidisc-count').textContent).toBe('0');

    await act(async () => {
      screen.getByTestId('create-minidisc-btn').click();
    });

    expect(screen.getByTestId('minidisc-count').textContent).toBe('1');
    expect(screen.getByTestId('first-minidisc-name').textContent).toBe('Summer Jams');
  });

  it('adds a song to a minidisc', async () => {
    renderApp(<CollectionDisplay />);

    // Create first
    await act(async () => {
      screen.getByTestId('create-minidisc-btn').click();
    });

    // Add song
    await act(async () => {
      screen.getByTestId('add-song-to-minidisc-btn').click();
    });

    expect(screen.getByTestId('first-minidisc-songs').textContent).toBe('1');
  });

  it('deletes a minidisc', async () => {
    renderApp(<CollectionDisplay />);

    await act(async () => {
      screen.getByTestId('create-minidisc-btn').click();
    });

    expect(screen.getByTestId('minidisc-count').textContent).toBe('1');

    await act(async () => {
      screen.getByTestId('delete-minidisc-btn').click();
    });

    expect(screen.getByTestId('minidisc-count').textContent).toBe('0');
  });

  it('saves a cassette', async () => {
    renderApp(<CollectionDisplay />);

    expect(screen.getByTestId('cassette-count').textContent).toBe('0');

    await act(async () => {
      screen.getByTestId('save-cassette-btn').click();
    });

    expect(screen.getByTestId('cassette-count').textContent).toBe('1');
  });

  it('syncs collections from server on login', async () => {
    const customer = buildCustomer({ firstname: 'Mike' });
    setCustomerToReturn(customer);

    renderApp(<CollectionDisplay />);

    await act(async () => {
      screen.getByTestId('sign-in-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await waitFor(() => {
      expect(fetchCustomerCollections).toHaveBeenCalled();
    });
  });

  it('syncs minidisc save to server when authenticated', async () => {
    const customer = buildCustomer({ firstname: 'Trey' });
    setCustomerToReturn(customer);

    renderApp(<CollectionDisplay />);

    // Sign in
    await act(async () => {
      screen.getByTestId('sign-in-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // Create minidisc while authenticated
    await act(async () => {
      screen.getByTestId('create-minidisc-btn').click();
    });

    await waitFor(() => {
      expect(saveMiniDiscSync).toHaveBeenCalled();
    });
  });
});
