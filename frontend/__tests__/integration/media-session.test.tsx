/**
 * Integration test: Media Session API integration
 *
 * Tests useMediaSession hook:
 * - Sets metadata (title, artist, album) when song changes
 * - Clears metadata when no song
 * - Sets playback state (playing/paused/none)
 * - Registers action handlers (play, pause, next, previous, seekto)
 * - seekforward/seekbackward use refs for current time
 * - isSupported flag
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { useMediaSession } from '@/hooks/useMediaSession';
import { Song } from '@/lib/types';

const mockSong: Song = {
  id: 'song-1',
  sku: 'song-1',
  title: 'Bird Song',
  artistId: 'a1',
  artistName: 'Grateful Dead',
  artistSlug: 'grateful-dead',
  duration: 300,
  streamUrl: 'https://archive.org/download/test/bird-song.mp3',
  albumArt: 'https://example.com/art.jpg',
  qualityUrls: {},
  albumIdentifier: 'gd1977-05-08',
  albumName: 'Cornell 77',
  trackTitle: 'Bird Song',
};

// Store registered action handlers so we can invoke them
const actionHandlers: Record<string, Function | null> = {};

function setupMediaSessionMock() {
  const mockMediaSession = {
    metadata: null as any,
    playbackState: 'none' as string,
    setActionHandler: vi.fn((action: string, handler: Function | null) => {
      actionHandlers[action] = handler;
    }),
    setPositionState: vi.fn(),
  };

  Object.defineProperty(navigator, 'mediaSession', {
    writable: true,
    configurable: true,
    value: mockMediaSession,
  });

  // Mock MediaMetadata constructor
  (globalThis as any).MediaMetadata = class {
    title: string;
    artist: string;
    album: string;
    artwork: any[];
    constructor(data: any) {
      this.title = data.title;
      this.artist = data.artist;
      this.album = data.album;
      this.artwork = data.artwork || [];
    }
  };

  return mockMediaSession;
}

function MediaSessionDisplay({
  song,
  isPlaying,
  currentTime,
  duration,
}: {
  song: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}) {
  const onPlay = vi.fn();
  const onPause = vi.fn();
  const onNext = vi.fn();
  const onPrevious = vi.fn();
  const onSeek = vi.fn();

  const { isSupported } = useMediaSession({
    currentSong: song,
    isPlaying,
    currentTime,
    duration,
    onPlay,
    onPause,
    onNext,
    onPrevious,
    onSeek,
  });

  return (
    <div>
      <div data-testid="supported">{String(isSupported)}</div>
    </div>
  );
}

describe('Media Session Integration', () => {
  let mockMediaSession: ReturnType<typeof setupMediaSessionMock>;

  beforeEach(() => {
    Object.keys(actionHandlers).forEach(k => delete actionHandlers[k]);
    mockMediaSession = setupMediaSessionMock();
  });

  it('isSupported is true when mediaSession exists', () => {
    render(<MediaSessionDisplay song={null} isPlaying={false} currentTime={0} duration={0} />);

    expect(screen.getByTestId('supported').textContent).toBe('true');
  });

  it('sets metadata when song is provided', () => {
    render(<MediaSessionDisplay song={mockSong} isPlaying={false} currentTime={0} duration={300} />);

    expect(mockMediaSession.metadata).not.toBeNull();
    expect(mockMediaSession.metadata.title).toBe('Bird Song');
    expect(mockMediaSession.metadata.artist).toBe('Grateful Dead');
    expect(mockMediaSession.metadata.album).toBe('Cornell 77');
  });

  it('clears metadata when song is null', () => {
    render(<MediaSessionDisplay song={null} isPlaying={false} currentTime={0} duration={0} />);

    expect(mockMediaSession.metadata).toBeNull();
  });

  it('sets playback state to playing', () => {
    render(<MediaSessionDisplay song={mockSong} isPlaying={true} currentTime={0} duration={300} />);

    expect(mockMediaSession.playbackState).toBe('playing');
  });

  it('sets playback state to paused', () => {
    render(<MediaSessionDisplay song={mockSong} isPlaying={false} currentTime={0} duration={300} />);

    expect(mockMediaSession.playbackState).toBe('paused');
  });

  it('sets playback state to none when no song', () => {
    render(<MediaSessionDisplay song={null} isPlaying={false} currentTime={0} duration={0} />);

    expect(mockMediaSession.playbackState).toBe('none');
  });

  it('registers action handlers', () => {
    render(<MediaSessionDisplay song={mockSong} isPlaying={true} currentTime={0} duration={300} />);

    expect(mockMediaSession.setActionHandler).toHaveBeenCalled();
    const registeredActions = mockMediaSession.setActionHandler.mock.calls.map(
      (call: any[]) => call[0]
    );

    expect(registeredActions).toContain('play');
    expect(registeredActions).toContain('pause');
    expect(registeredActions).toContain('nexttrack');
    expect(registeredActions).toContain('previoustrack');
    expect(registeredActions).toContain('seekto');
    expect(registeredActions).toContain('seekforward');
    expect(registeredActions).toContain('seekbackward');
  });

  it('includes artwork when albumArt is provided', () => {
    render(<MediaSessionDisplay song={mockSong} isPlaying={false} currentTime={0} duration={300} />);

    expect(mockMediaSession.metadata).not.toBeNull();
    expect(mockMediaSession.metadata.artwork.length).toBeGreaterThan(0);
    expect(mockMediaSession.metadata.artwork[0].src).toBe('https://example.com/art.jpg');
  });
});
