// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// =============================================================================
// Mocks - must be before imports that use them
// =============================================================================

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; width?: number; height?: number; className?: string; quality?: number }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Mock SwipeableQueueItem
vi.mock('@/components/SwipeableQueueItem', () => ({
  default: ({ children, onDelete, className }: { children: React.ReactNode; onDelete: () => void; className: string }) => (
    <div data-testid="swipeable-item" className={className}>
      {children}
      <button onClick={onDelete} data-testid="swipe-delete">Delete</button>
    </div>
  ),
}));

// Mock validation
vi.mock('@/lib/validation', () => ({
  VALIDATION_LIMITS: { PLAYLIST_NAME_MAX: 100 },
}));

// Mock formatDuration
vi.mock('@/lib/api', () => ({
  formatDuration: (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
}));

import type { QueueItem, QueueItemAlbumSource, UnifiedQueue, AlbumGroup } from '@/lib/queueTypes';
import type { Song } from '@/lib/types';

// =============================================================================
// Test Helpers
// =============================================================================

let idCounter = 0;

beforeEach(() => {
  idCounter = 0;
});

function makeSong(overrides: Partial<Song> = {}): Song {
  idCounter++;
  return {
    id: `song-${idCounter}`,
    sku: `sku-${idCounter}`,
    title: `Song ${idCounter}`,
    artistId: 'artist-1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroad-earth',
    duration: 300,
    streamUrl: `https://example.com/song-${idCounter}.mp3`,
    albumArt: '',
    albumIdentifier: 're-2024-01-01',
    albumName: 'Railroad Earth 2024-01-01',
    trackTitle: `Song ${idCounter}`,
    ...overrides,
  };
}

function makeAlbumSource(
  overrides: Partial<QueueItemAlbumSource> = {},
): QueueItemAlbumSource {
  return {
    albumId: 'album-1',
    albumIdentifier: 're-2024-01-01',
    albumName: 'Railroad Earth 2024-01-01',
    artistSlug: 'railroad-earth',
    artistName: 'Railroad Earth',
    originalTrackIndex: 0,
    ...overrides,
  };
}

function makeQueueItem(overrides: Partial<QueueItem> = {}): QueueItem {
  idCounter++;
  const song = makeSong();
  return {
    queueId: `q-${idCounter}`,
    batchId: 'batch-default',
    song,
    trackTitle: song.trackTitle || song.title,
    trackSlug: `song-${idCounter}`,
    availableVersions: [song],
    albumSource: null,
    played: false,
    source: { type: 'album-load' as const },
    ...overrides,
  };
}

// =============================================================================
// Mock Context Providers
// =============================================================================

const mockPlayerContext = {
  isPlaying: false,
  isBuffering: false,
  volume: 1,
  currentTime: 0,
  duration: 300,
  isQueueOpen: true,
  crossfadeDuration: 0,
  announcement: '',
  currentSong: null as Song | null,
  playSong: vi.fn(),
  togglePlay: vi.fn(),
  pause: vi.fn(),
  setVolume: vi.fn(),
  seek: vi.fn(),
  playNext: vi.fn(),
  playPrev: vi.fn(),
  toggleQueue: vi.fn(),
  playFromQueue: vi.fn(),
  playAlbum: vi.fn(),
  playAlbumFromTrack: vi.fn(),
  setCrossfadeDuration: vi.fn(),
  analyzerData: { frequencyData: new Uint8Array(0), waveformData: new Uint8Array(0), isActive: false },
};

const mockQueueContext = {
  queue: { items: [] as QueueItem[], cursorIndex: -1, repeat: 'off' as const },
  currentItem: null as QueueItem | null,
  currentSong: null as Song | null,
  albumGroups: [] as AlbumGroup[],
  totalItems: 0,
  hasItems: false,
  isLastItem: false,
  isFirstItem: true,
  playAlbum: vi.fn(),
  playNext: vi.fn(),
  addToQueue: vi.fn(),
  removeItem: vi.fn(),
  moveItem: vi.fn(),
  moveBlock: vi.fn(),
  setCursor: vi.fn(),
  advanceCursor: vi.fn(),
  retreatCursor: vi.fn(),
  peekNext: vi.fn(),
  selectVersion: vi.fn(),
  markPlayed: vi.fn(),
  setRepeat: vi.fn(),
  clearQueue: vi.fn(),
  clearUpcoming: vi.fn(),
  albumToItems: vi.fn(),
  trackToItem: vi.fn(),
};

const mockPlaylistContext = {
  playlists: [],
  isLoaded: true,
  createPlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  updatePlaylist: vi.fn(),
  addToPlaylist: vi.fn(),
  removeFromPlaylist: vi.fn(),
  reorderPlaylist: vi.fn(),
  getPlaylist: vi.fn(),
};

const mockMobileUIContext = {
  isSidebarOpen: false,
  isMobile: false,
  isPlayerExpanded: false,
  isTransitioning: false,
  dragOffset: 0,
  toggleSidebar: vi.fn(),
  closeSidebar: vi.fn(),
  openSidebar: vi.fn(),
  expandPlayer: vi.fn(),
  collapsePlayer: vi.fn(),
  togglePlayer: vi.fn(),
  setDragOffset: vi.fn(),
};

// Mock context modules
vi.mock('@/context/PlayerContext', () => ({
  usePlayer: () => mockPlayerContext,
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/QueueContext', () => ({
  useQueue: () => mockQueueContext,
  QueueProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  queueReducer: vi.fn(),
}));

vi.mock('@/context/PlaylistContext', () => ({
  usePlaylists: () => mockPlaylistContext,
  PlaylistProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/MobileUIContext', () => ({
  useMobileUI: () => mockMobileUIContext,
  MobileUIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import Queue component after mocks are set up
import Queue from '@/components/Queue';

// =============================================================================
// Tests
// =============================================================================

describe('Queue Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default empty state
    mockPlayerContext.isQueueOpen = true;
    mockQueueContext.queue = { items: [], cursorIndex: -1, repeat: 'off' };
    mockQueueContext.currentItem = null;
    mockQueueContext.currentSong = null;
    mockQueueContext.albumGroups = [];
    mockQueueContext.totalItems = 0;
    mockQueueContext.hasItems = false;
  });

  describe('empty queue', () => {
    it('renders "Queue is empty" message when no items', () => {
      render(<Queue />);

      expect(screen.getByText('Queue is empty')).toBeInTheDocument();
      expect(
        screen.getByText('Add songs or albums to get started'),
      ).toBeInTheDocument();
    });

    it('does not show "Save as Playlist" button when empty', () => {
      render(<Queue />);

      expect(screen.queryByText('Save as Playlist')).not.toBeInTheDocument();
    });
  });

  describe('queue not open', () => {
    it('returns null when isQueueOpen is false', () => {
      mockPlayerContext.isQueueOpen = false;
      const { container } = render(<Queue />);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('queue with items', () => {
    beforeEach(() => {
      const currentSong = makeSong({ title: 'Bird in a House' });
      const currentItem = makeQueueItem({
        queueId: 'q-current',
        song: currentSong,
        trackTitle: 'Bird in a House',
        albumSource: makeAlbumSource({
          albumName: 'RE Live at Red Rocks',
          coverArt: 'https://example.com/cover.jpg',
        }),
      });

      const upcomingItems = [
        makeQueueItem({
          queueId: 'q-next-1',
          song: makeSong({ title: 'Elko', artistName: 'Railroad Earth', duration: 240 }),
          trackTitle: 'Elko',
        }),
        makeQueueItem({
          queueId: 'q-next-2',
          song: makeSong({ title: 'Long Way to Go', artistName: 'Railroad Earth', duration: 180 }),
          trackTitle: 'Long Way to Go',
        }),
      ];

      const allItems = [currentItem, ...upcomingItems];

      mockQueueContext.queue = { items: allItems, cursorIndex: 0, repeat: 'off' };
      mockQueueContext.currentItem = currentItem;
      mockQueueContext.currentSong = currentSong;
      mockQueueContext.hasItems = true;
      mockQueueContext.totalItems = 3;
      mockQueueContext.albumGroups = [];
    });

    it('shows "Now Playing" section with current track', () => {
      render(<Queue />);

      expect(screen.getByText('Now Playing')).toBeInTheDocument();
      expect(screen.getByText('Bird in a House')).toBeInTheDocument();
    });

    it('shows "Up Next" section with upcoming count', () => {
      render(<Queue />);

      expect(screen.getByText('Up Next (2)')).toBeInTheDocument();
    });

    it('shows upcoming track titles', () => {
      render(<Queue />);

      expect(screen.getByText('Elko')).toBeInTheDocument();
      expect(screen.getByText('Long Way to Go')).toBeInTheDocument();
    });

    it('shows "Clear" button for upcoming tracks', () => {
      render(<Queue />);

      const clearBtn = screen.getByLabelText('Clear upcoming queue (2 songs)');
      expect(clearBtn).toBeInTheDocument();
    });

    it('calls clearUpcoming when Clear button clicked', () => {
      render(<Queue />);

      const clearBtn = screen.getByLabelText('Clear upcoming queue (2 songs)');
      fireEvent.click(clearBtn);

      expect(mockQueueContext.clearUpcoming).toHaveBeenCalledTimes(1);
    });

    it('shows remove button on desktop for upcoming tracks', () => {
      render(<Queue />);

      const removeButtons = screen.getAllByLabelText(/Remove .* from queue/);
      expect(removeButtons).toHaveLength(2);
    });

    it('calls removeItem when remove button clicked', () => {
      render(<Queue />);

      const removeButtons = screen.getAllByLabelText(/Remove .* from queue/);
      fireEvent.click(removeButtons[0]);

      expect(mockQueueContext.removeItem).toHaveBeenCalledTimes(1);
    });

    it('shows "Save as Playlist" button', () => {
      render(<Queue />);

      expect(screen.getByText('Save as Playlist')).toBeInTheDocument();
    });

    it('shows "Clear all" button on desktop', () => {
      render(<Queue />);

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('calls clearQueue when Clear all is clicked', () => {
      render(<Queue />);

      const clearAll = screen.getByText('Clear all');
      fireEvent.click(clearAll);

      expect(mockQueueContext.clearQueue).toHaveBeenCalledTimes(1);
    });

    it('calls playFromQueue when an upcoming track is clicked', () => {
      render(<Queue />);

      // Click on the Elko track row (the li element with hover:bg class)
      const upcomingTracks = screen.getByText('Elko').closest('li');
      if (upcomingTracks) {
        fireEvent.click(upcomingTracks);
        expect(mockPlayerContext.playFromQueue).toHaveBeenCalled();
      }
    });
  });

  describe('album group headers', () => {
    beforeEach(() => {
      const currentSong = makeSong({ title: 'Current Track' });
      const currentItem = makeQueueItem({
        queueId: 'q-current',
        song: currentSong,
        trackTitle: 'Current Track',
      });

      const albumSource = makeAlbumSource({
        albumName: 'RE Live at Red Rocks 2024',
        coverArt: 'https://example.com/cover.jpg',
      });

      const upcomingItems = [
        makeQueueItem({
          queueId: 'q-a1',
          batchId: 'batch-album',
          song: makeSong({ title: 'Track A1' }),
          trackTitle: 'Track A1',
          albumSource,
        }),
        makeQueueItem({
          queueId: 'q-a2',
          batchId: 'batch-album',
          song: makeSong({ title: 'Track A2' }),
          trackTitle: 'Track A2',
          albumSource: { ...albumSource, originalTrackIndex: 1 },
        }),
      ];

      const allItems = [currentItem, ...upcomingItems];

      const albumGroup: AlbumGroup = {
        batchId: 'batch-album',
        albumSource,
        startIndex: 1,
        endIndex: 2,
        isContinuation: false,
        items: upcomingItems,
      };

      mockQueueContext.queue = { items: allItems, cursorIndex: 0, repeat: 'off' };
      mockQueueContext.currentItem = currentItem;
      mockQueueContext.currentSong = currentSong;
      mockQueueContext.hasItems = true;
      mockQueueContext.totalItems = 3;
      mockQueueContext.albumGroups = [albumGroup];
    });

    it('renders album group header with album name', () => {
      render(<Queue />);

      expect(screen.getByText('RE Live at Red Rocks 2024')).toBeInTheDocument();
    });

    it('renders group tracks within the album', () => {
      render(<Queue />);

      expect(screen.getByText('Track A1')).toBeInTheDocument();
      expect(screen.getByText('Track A2')).toBeInTheDocument();
    });
  });

  describe('continuation label', () => {
    beforeEach(() => {
      const currentSong = makeSong({ title: 'Current' });
      const currentItem = makeQueueItem({
        queueId: 'q-current',
        song: currentSong,
        trackTitle: 'Current',
      });

      const albumSource = makeAlbumSource({
        albumName: 'RE Live at Telluride',
      });

      const upcomingItem = makeQueueItem({
        queueId: 'q-cont',
        batchId: 'batch-cont',
        song: makeSong({ title: 'Continued Track' }),
        trackTitle: 'Continued Track',
        albumSource,
      });

      const allItems = [currentItem, upcomingItem];

      const albumGroup: AlbumGroup = {
        batchId: 'batch-cont',
        albumSource,
        startIndex: 1,
        endIndex: 1,
        isContinuation: true,
        items: [upcomingItem],
      };

      mockQueueContext.queue = { items: allItems, cursorIndex: 0, repeat: 'off' };
      mockQueueContext.currentItem = currentItem;
      mockQueueContext.currentSong = currentSong;
      mockQueueContext.hasItems = true;
      mockQueueContext.totalItems = 2;
      mockQueueContext.albumGroups = [albumGroup];
    });

    it('shows "(continued)" label for continuation groups', () => {
      render(<Queue />);

      expect(
        screen.getByText('RE Live at Telluride (continued)'),
      ).toBeInTheDocument();
    });
  });

  describe('close queue', () => {
    it('calls toggleQueue when close button is clicked', () => {
      render(<Queue />);

      const closeBtn = screen.getByLabelText('Close queue');
      fireEvent.click(closeBtn);

      expect(mockPlayerContext.toggleQueue).toHaveBeenCalledTimes(1);
    });

    it('calls toggleQueue when backdrop is clicked', () => {
      render(<Queue />);

      // The backdrop is the first div with bg-black/60
      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockPlayerContext.toggleQueue).toHaveBeenCalledTimes(1);
      }
    });
  });
});
