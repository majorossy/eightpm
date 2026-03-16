/**
 * Integration test: Share URL generation and modal
 *
 * Tests useShare hook:
 * - generateShareUrl for song/track/artist/album/playlist types
 * - Fallback to root when slugs are missing
 * - openShareModal sets URL + title + shows modal
 * - closeShareModal resets state
 * - shareableSong / shareableTrack / shareableAlbum helpers
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { screen, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useShare } from '@/hooks/useShare';

// Mock analytics
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

function ShareDisplay() {
  const share = useShare();

  const songUrl = share.generateShareUrl({
    type: 'song',
    id: 'song-1',
    title: 'Bird Song',
    artistSlug: 'grateful-dead',
    albumIdentifier: 'gd1977-05-08',
  });

  const artistUrl = share.generateShareUrl({
    type: 'artist',
    id: 'artist-1',
    title: 'Grateful Dead',
    artistSlug: 'grateful-dead',
  });

  const albumUrl = share.generateShareUrl({
    type: 'album',
    id: 'album-1',
    title: 'Cornell 77',
    artistSlug: 'grateful-dead',
    albumIdentifier: 'gd1977-05-08',
  });

  const playlistUrl = share.generateShareUrl({
    type: 'playlist',
    id: 'pl-1',
    title: 'Road Trip',
    playlistId: 'playlist-abc',
  });

  const noSlugUrl = share.generateShareUrl({
    type: 'artist',
    id: 'a-1',
    title: 'Unknown',
  });

  return (
    <div>
      <div data-testid="song-url">{songUrl}</div>
      <div data-testid="artist-url">{artistUrl}</div>
      <div data-testid="album-url">{albumUrl}</div>
      <div data-testid="playlist-url">{playlistUrl}</div>
      <div data-testid="no-slug-url">{noSlugUrl}</div>
      <div data-testid="modal-open">{String(share.showShareModal)}</div>
      <div data-testid="share-url">{share.shareUrl}</div>
      <div data-testid="share-title">{share.shareTitle}</div>
      <div data-testid="copied">{String(share.copiedToClipboard)}</div>
      <button
        data-testid="open-modal"
        onClick={() => share.openShareModal({
          type: 'song',
          id: 's-1',
          title: 'Dark Star',
          artistSlug: 'grateful-dead',
          albumIdentifier: 'gd1968-02-14',
        })}
      >Open Modal</button>
      <button data-testid="close-modal" onClick={() => share.closeShareModal()}>
        Close Modal
      </button>
    </div>
  );
}

describe('Share URL Integration', () => {
  it('generates correct song URL', () => {
    render(<ShareDisplay />);

    expect(screen.getByTestId('song-url').textContent).toBe(
      'http://localhost:3000/artists/grateful-dead/album/gd1977-05-08'
    );
  });

  it('generates correct artist URL', () => {
    render(<ShareDisplay />);

    expect(screen.getByTestId('artist-url').textContent).toBe(
      'http://localhost:3000/artists/grateful-dead'
    );
  });

  it('generates correct album URL', () => {
    render(<ShareDisplay />);

    expect(screen.getByTestId('album-url').textContent).toBe(
      'http://localhost:3000/artists/grateful-dead/album/gd1977-05-08'
    );
  });

  it('generates correct playlist URL', () => {
    render(<ShareDisplay />);

    expect(screen.getByTestId('playlist-url').textContent).toBe(
      'http://localhost:3000/playlists/playlist-abc'
    );
  });

  it('falls back to root when slugs are missing', () => {
    render(<ShareDisplay />);

    expect(screen.getByTestId('no-slug-url').textContent).toBe('http://localhost:3000/');
  });

  it('openShareModal sets URL, title, and shows modal', () => {
    render(<ShareDisplay />);

    expect(screen.getByTestId('modal-open').textContent).toBe('false');

    act(() => { screen.getByTestId('open-modal').click(); });

    expect(screen.getByTestId('modal-open').textContent).toBe('true');
    expect(screen.getByTestId('share-title').textContent).toBe('Dark Star');
    expect(screen.getByTestId('share-url').textContent).toContain(
      '/artists/grateful-dead/album/gd1968-02-14'
    );
  });

  it('closeShareModal resets state', () => {
    render(<ShareDisplay />);

    act(() => { screen.getByTestId('open-modal').click(); });
    expect(screen.getByTestId('modal-open').textContent).toBe('true');

    act(() => { screen.getByTestId('close-modal').click(); });
    expect(screen.getByTestId('modal-open').textContent).toBe('false');
    expect(screen.getByTestId('copied').textContent).toBe('false');
  });
});
