/**
 * Integration test: Wishlist sync on login
 *
 * Tests the WishlistContext + MagentoAuthContext interaction:
 * - Like/unlike a song in localStorage
 * - Follow/unfollow an artist
 * - Server sync triggers on login
 * - Merge resolves local + server data
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { buildSong, resetCounters } from '@/test/factories/song';
import { buildCustomer } from '@/test/factories/customer';
import {
  setCustomerToReturn,
  resetAuthMocks,
} from '@/test/mocks/magentoAuth';
import {
  setCollections,
  resetCollections,
  fetchCustomerCollections,
  likeSong as likeSongSync,
  followArtist as followArtistSync,
} from '@/test/mocks/magentoSync';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

// Component that exposes wishlist + auth state
function WishlistDisplay() {
  const auth = useMagentoAuth();
  const wishlist = useWishlist();

  const song = buildSong({ id: 'song-fixed-1', trackTitle: 'Elko' });

  return (
    <div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="wishlist-count">{wishlist.wishlist.itemCount}</div>
      <div data-testid="is-liked">{String(wishlist.isInWishlist('song-fixed-1'))}</div>
      <div data-testid="artist-followed">{String(wishlist.isArtistFollowed('railroad-earth'))}</div>
      <div data-testid="sync-status">{wishlist.syncStatus}</div>
      <button
        data-testid="like-btn"
        onClick={() => wishlist.addToWishlist(song)}
      >
        Like
      </button>
      <button
        data-testid="unlike-btn"
        onClick={() => {
          const item = wishlist.wishlist.items.find(i => i.song.id === 'song-fixed-1');
          if (item) wishlist.removeFromWishlist(item.id);
        }}
      >
        Unlike
      </button>
      <button
        data-testid="follow-artist-btn"
        onClick={() => wishlist.followArtist('railroad-earth')}
      >
        Follow Artist
      </button>
      <button
        data-testid="unfollow-artist-btn"
        onClick={() => wishlist.unfollowArtist('railroad-earth')}
      >
        Unfollow Artist
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

describe('Wishlist Sync Integration', () => {
  beforeEach(() => {
    resetCounters();
    resetAuthMocks();
    resetCollections();
    localStorage.clear();
  });

  it('likes a song and persists in wishlist', async () => {
    renderApp(<WishlistDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('wishlist-count').textContent).toBe('0');
    });

    await act(async () => {
      screen.getByTestId('like-btn').click();
    });

    expect(screen.getByTestId('wishlist-count').textContent).toBe('1');
    expect(screen.getByTestId('is-liked').textContent).toBe('true');
  });

  it('unlikes a song', async () => {
    renderApp(<WishlistDisplay />);

    await act(async () => {
      screen.getByTestId('like-btn').click();
    });

    expect(screen.getByTestId('is-liked').textContent).toBe('true');

    await act(async () => {
      screen.getByTestId('unlike-btn').click();
    });

    expect(screen.getByTestId('is-liked').textContent).toBe('false');
    expect(screen.getByTestId('wishlist-count').textContent).toBe('0');
  });

  it('follows an artist', async () => {
    renderApp(<WishlistDisplay />);

    expect(screen.getByTestId('artist-followed').textContent).toBe('false');

    await act(async () => {
      screen.getByTestId('follow-artist-btn').click();
    });

    expect(screen.getByTestId('artist-followed').textContent).toBe('true');
  });

  it('unfollows an artist', async () => {
    renderApp(<WishlistDisplay />);

    await act(async () => {
      screen.getByTestId('follow-artist-btn').click();
    });

    await act(async () => {
      screen.getByTestId('unfollow-artist-btn').click();
    });

    expect(screen.getByTestId('artist-followed').textContent).toBe('false');
  });

  it('syncs liked songs from server on login', async () => {
    const customer = buildCustomer({ firstname: 'Trey' });
    setCustomerToReturn(customer);

    renderApp(<WishlistDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByTestId('sign-in-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // fetchCustomerCollections should have been called
    await waitFor(() => {
      expect(fetchCustomerCollections).toHaveBeenCalled();
    });
  });

  it('syncs liked song to server when authenticated', async () => {
    const customer = buildCustomer({ firstname: 'Page' });
    setCustomerToReturn(customer);

    renderApp(<WishlistDisplay />);

    // Sign in first
    await act(async () => {
      screen.getByTestId('sign-in-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // Like a song while authenticated
    await act(async () => {
      screen.getByTestId('like-btn').click();
    });

    // Should fire the sync call
    await waitFor(() => {
      expect(likeSongSync).toHaveBeenCalled();
    });
  });
});
