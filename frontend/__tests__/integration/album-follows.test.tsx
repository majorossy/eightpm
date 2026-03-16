/**
 * Integration test: Album follows in WishlistContext
 *
 * Tests followAlbum / unfollowAlbum / isAlbumFollowed:
 * - Follow an album creates "artistSlug::albumTitle" identifier
 * - Unfollow removes the identifier
 * - isAlbumFollowed checks correctly
 * - Duplicate follow is a no-op
 * - localStorage persistence (written when non-empty, removed when empty)
 * - Multiple albums from different artists
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useWishlist } from '@/context/WishlistContext';
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

function AlbumFollowDisplay() {
  const wishlist = useWishlist();

  const isRailroadFollowed = wishlist.isAlbumFollowed('railroadearth', '2024-06-15');
  const isMoeFollowed = wishlist.isAlbumFollowed('moe', '2023-12-31');

  return (
    <div>
      <div data-testid="album-count">{wishlist.followedAlbums.length}</div>
      <div data-testid="albums">{wishlist.followedAlbums.join(',')}</div>
      <div data-testid="railroad-followed">{String(isRailroadFollowed)}</div>
      <div data-testid="moe-followed">{String(isMoeFollowed)}</div>
      <button
        data-testid="follow-railroad"
        onClick={() => wishlist.followAlbum('railroadearth', '2024-06-15')}
      >Follow Railroad Earth</button>
      <button
        data-testid="unfollow-railroad"
        onClick={() => wishlist.unfollowAlbum('railroadearth', '2024-06-15')}
      >Unfollow Railroad Earth</button>
      <button
        data-testid="follow-moe"
        onClick={() => wishlist.followAlbum('moe', '2023-12-31')}
      >Follow moe.</button>
      <button
        data-testid="unfollow-moe"
        onClick={() => wishlist.unfollowAlbum('moe', '2023-12-31')}
      >Unfollow moe.</button>
    </div>
  );
}

describe('Album Follows Integration', () => {
  beforeEach(() => {
    resetAuthMocks();
    resetCollections();
    localStorage.clear();
  });

  it('follow album adds identifier', async () => {
    renderApp(<AlbumFollowDisplay />);

    expect(screen.getByTestId('album-count').textContent).toBe('0');
    expect(screen.getByTestId('railroad-followed').textContent).toBe('false');

    await act(async () => { screen.getByTestId('follow-railroad').click(); });

    expect(screen.getByTestId('album-count').textContent).toBe('1');
    expect(screen.getByTestId('railroad-followed').textContent).toBe('true');
    expect(screen.getByTestId('albums').textContent).toBe('railroadearth::2024-06-15');
  });

  it('unfollow album removes identifier', async () => {
    renderApp(<AlbumFollowDisplay />);

    await act(async () => { screen.getByTestId('follow-railroad').click(); });
    expect(screen.getByTestId('railroad-followed').textContent).toBe('true');

    await act(async () => { screen.getByTestId('unfollow-railroad').click(); });
    expect(screen.getByTestId('railroad-followed').textContent).toBe('false');
    expect(screen.getByTestId('album-count').textContent).toBe('0');
  });

  it('duplicate follow is a no-op', async () => {
    renderApp(<AlbumFollowDisplay />);

    await act(async () => { screen.getByTestId('follow-railroad').click(); });
    await act(async () => { screen.getByTestId('follow-railroad').click(); });

    expect(screen.getByTestId('album-count').textContent).toBe('1');
  });

  it('multiple albums from different artists', async () => {
    renderApp(<AlbumFollowDisplay />);

    await act(async () => { screen.getByTestId('follow-railroad').click(); });
    await act(async () => { screen.getByTestId('follow-moe').click(); });

    expect(screen.getByTestId('album-count').textContent).toBe('2');
    expect(screen.getByTestId('railroad-followed').textContent).toBe('true');
    expect(screen.getByTestId('moe-followed').textContent).toBe('true');
  });

  it('unfollow one album does not affect others', async () => {
    renderApp(<AlbumFollowDisplay />);

    await act(async () => { screen.getByTestId('follow-railroad').click(); });
    await act(async () => { screen.getByTestId('follow-moe').click(); });

    await act(async () => { screen.getByTestId('unfollow-railroad').click(); });

    expect(screen.getByTestId('album-count').textContent).toBe('1');
    expect(screen.getByTestId('railroad-followed').textContent).toBe('false');
    expect(screen.getByTestId('moe-followed').textContent).toBe('true');
  });

  it('persists followed albums to localStorage', async () => {
    renderApp(<AlbumFollowDisplay />);

    await act(async () => { screen.getByTestId('follow-railroad').click(); });

    await waitFor(() => {
      const stored = localStorage.getItem('8pm_followed_albums');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed).toContain('railroadearth::2024-06-15');
    });
  });

  it('removes localStorage key when all albums unfollowed', async () => {
    renderApp(<AlbumFollowDisplay />);

    await act(async () => { screen.getByTestId('follow-railroad').click(); });
    await waitFor(() => {
      expect(localStorage.getItem('8pm_followed_albums')).not.toBeNull();
    });

    await act(async () => { screen.getByTestId('unfollow-railroad').click(); });
    await waitFor(() => {
      expect(localStorage.getItem('8pm_followed_albums')).toBeNull();
    });
  });
});
