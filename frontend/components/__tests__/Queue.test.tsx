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

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick, ...props }: { children: React.ReactNode; href: string; onClick?: () => void; className?: string }) => (
    <a href={href} onClick={onClick} {...props}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Mock dnd-kit (pass-through, no drag functionality)
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    setActivatorNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: {},
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

// Mock sub-components used by Queue
vi.mock('@/components/VersionPickerModal', () => ({
  default: () => null,
}));

vi.mock('@/components/TicketStub', () => ({
  default: ({ albumName }: { albumName: string }) => (
    <div data-testid="ticket-stub">{albumName}</div>
  ),
}));

vi.mock('@/components/version-row', () => ({
  VersionsIcon: () => null,
  RecordingRow: ({ song }: { song: { title: string } }) => (
    <span data-testid="recording-row">{song.title}</span>
  ),
}));

// Mock useBackToClose (no-op in tests)
vi.mock('@/hooks/useBackToClose', () => ({
  useBackToClose: vi.fn(),
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

// Mock chipGlow
vi.mock('@/lib/chipGlow', () => ({
  glowClassName: () => '',
  ChipGlow: null,
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
  closeQueue: vi.fn(),
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
  chipGlow: null,
  playAlbum: vi.fn(),
  playNext: vi.fn(),
  addToQueue: vi.fn(),
  removeItem: vi.fn(),
  removeBatch: vi.fn(),
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

const mockCollectionContext = {
  minidiscs: [],
  cassettes: [],
  isLoading: false,
  syncStatus: 'idle' as const,
  createMiniDisc: vi.fn(),
  deleteMiniDisc: vi.fn(),
  addToMiniDisc: vi.fn(),
  removeFromMiniDisc: vi.fn(),
  updateMiniDisc: vi.fn(),
  reorderMiniDisc: vi.fn(),
  getMiniDisc: vi.fn(),
  saveCassette: vi.fn(),
  deleteCassette: vi.fn(),
  updateCassette: vi.fn(),
  getCassette: vi.fn(),
  getCassettesForAlbum: vi.fn().mockReturnValue([]),
  forceSync: vi.fn(),
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

vi.mock('@/context/CollectionContext', () => ({
  useMiniDiscs: () => mockCollectionContext,
  useCassettes: () => mockCollectionContext,
  useCollections: () => mockCollectionContext,
  CollectionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/MobileUIContext', () => ({
  useMobileUI: () => mockMobileUIContext,
  MobileUIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/QualityContext', () => ({
  useQuality: () => ({ preferredQuality: 'best', setPreferredQuality: vi.fn() }),
  QualityProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/MagentoAuthContext', () => ({
  useMagentoAuth: () => ({ isAuthenticated: false }),
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
    mockPlayerContext.isPlaying = false;
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

    it('does not show "Save" button when empty', () => {
      render(<Queue />);

      expect(screen.queryByText('Save')).not.toBeInTheDocument();
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
          batchId: 'batch-upcoming',
          song: makeSong({ title: 'Elko', artistName: 'Railroad Earth', duration: 240 }),
          trackTitle: 'Elko',
          albumSource: makeAlbumSource({
            albumName: 'RE Live at Red Rocks',
            originalTrackIndex: 1,
          }),
        }),
        makeQueueItem({
          queueId: 'q-next-2',
          batchId: 'batch-upcoming',
          song: makeSong({ title: 'Long Way to Go', artistName: 'Railroad Earth', duration: 180 }),
          trackTitle: 'Long Way to Go',
          albumSource: makeAlbumSource({
            albumName: 'RE Live at Red Rocks',
            originalTrackIndex: 2,
          }),
        }),
      ];

      const allItems = [currentItem, ...upcomingItems];

      const albumGroup: AlbumGroup = {
        batchId: 'batch-upcoming',
        albumSource: makeAlbumSource({
          albumName: 'RE Live at Red Rocks',
          originalTrackIndex: 1,
        }),
        startIndex: 1,
        endIndex: 2,
        isContinuation: true,
        items: upcomingItems,
      };

      mockQueueContext.queue = { items: allItems, cursorIndex: 0, repeat: 'off' };
      mockQueueContext.currentItem = currentItem;
      mockQueueContext.currentSong = currentSong;
      mockQueueContext.hasItems = true;
      mockQueueContext.totalItems = 3;
      mockQueueContext.albumGroups = [albumGroup];
    });

    it('shows "Now Playing" section with current track', () => {
      render(<Queue />);

      expect(screen.getByText('Now Playing')).toBeInTheDocument();
      expect(screen.getByText('Bird in a House')).toBeInTheDocument();
    });

    it('shows "Up Next" header with track count', () => {
      render(<Queue />);

      expect(screen.getByText('UP')).toBeInTheDocument();
      expect(screen.getByText('NEXT')).toBeInTheDocument();
      // upcomingCount = 3 - (0 + 1) = 2
      expect(screen.getByText(/2 TRACKS/)).toBeInTheDocument();
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

    it('shows remove button for upcoming tracks', () => {
      render(<Queue />);

      const removeButtons = screen.getAllByLabelText(/Remove .* from queue/);
      expect(removeButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('calls removeItem when track remove button clicked', () => {
      render(<Queue />);

      // Target track-specific remove buttons (not album group remove)
      const removeButtons = screen.getAllByLabelText(/Remove .* from queue/);
      // Find a button that matches a track title (not album name)
      const trackRemoveBtn = removeButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('Elko') ||
        btn.getAttribute('aria-label')?.includes('Long Way to Go')
      );
      expect(trackRemoveBtn).toBeDefined();
      fireEvent.click(trackRemoveBtn!);

      expect(mockQueueContext.removeItem).toHaveBeenCalledTimes(1);
    });

    it('shows "Save" button', () => {
      render(<Queue />);

      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('renders transport controls (previous, play/pause, next)', () => {
      render(<Queue />);

      expect(screen.getByLabelText('Previous track')).toBeInTheDocument();
      expect(screen.getByLabelText('Play')).toBeInTheDocument();
      expect(screen.getByLabelText('Next track')).toBeInTheDocument();
    });

    it('calls togglePlay when play/pause button is clicked', () => {
      render(<Queue />);

      const playBtn = screen.getByLabelText('Play');
      fireEvent.click(playBtn);

      expect(mockPlayerContext.togglePlay).toHaveBeenCalledTimes(1);
    });

    it('calls playPrev and playNext when prev/next buttons are clicked', () => {
      render(<Queue />);

      fireEvent.click(screen.getByLabelText('Previous track'));
      expect(mockPlayerContext.playPrev).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByLabelText('Next track'));
      expect(mockPlayerContext.playNext).toHaveBeenCalledTimes(1);
    });

    it('shows Pause label when isPlaying is true', () => {
      mockPlayerContext.isPlaying = true;
      render(<Queue />);

      expect(screen.getByLabelText('Pause')).toBeInTheDocument();
      expect(screen.queryByLabelText('Play')).not.toBeInTheDocument();
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

      // Album name appears in both TicketStub and the header text
      const matches = screen.getAllByText('RE Live at Red Rocks 2024');
      expect(matches.length).toBeGreaterThanOrEqual(1);
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

    it('shows "(cont.)" label for continuation groups', () => {
      render(<Queue />);

      // Continuation name appears in both TicketStub and the header text
      const matches = screen.getAllByText('RE Live at Telluride (cont.)');
      expect(matches.length).toBeGreaterThanOrEqual(1);
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

      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);
      expect(mockPlayerContext.toggleQueue).toHaveBeenCalledTimes(1);
    });
  });
});
