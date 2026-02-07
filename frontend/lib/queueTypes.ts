// Unified Queue Types - Single flat queue with visual album grouping
import { Song, Album, Track } from './types';

// =============================================================================
// Core Types
// =============================================================================

// Metadata about the album a queue item came from
export interface QueueItemAlbumSource {
  albumId: string;
  albumIdentifier: string;   // Archive.org identifier
  albumName: string;
  artistSlug: string;
  artistName: string;
  coverArt?: string;
  showDate?: string;
  showVenue?: string;
  showLocation?: string;
  originalTrackIndex: number; // Position in original album
}

// How an item entered the queue
export type QueueItemSource =
  | { type: 'album-load' }
  | { type: 'play-next'; addedAt: number }
  | { type: 'add-to-queue'; addedAt: number };

// A single item in the unified queue
export interface QueueItem {
  queueId: string;
  batchId: string;
  song: Song;
  trackTitle: string;
  trackSlug: string;
  availableVersions: Song[];
  albumSource: QueueItemAlbumSource | null;
  played: boolean;
  source: QueueItemSource;
}

// The complete queue state
export interface UnifiedQueue {
  items: QueueItem[];
  cursorIndex: number;  // -1 if none
  repeat: 'off' | 'all' | 'one';
}

// Computed album group (NOT stored, derived from items[])
export interface AlbumGroup {
  batchId: string;
  albumSource: QueueItemAlbumSource;
  startIndex: number;
  endIndex: number;     // inclusive
  isContinuation: boolean;
  items: QueueItem[];
}

// Initial empty queue state
export const initialQueueState: UnifiedQueue = {
  items: [],
  cursorIndex: -1,
  repeat: 'off',
};

// =============================================================================
// ID Generators
// =============================================================================

/** Generate a unique ID for queue items */
export function generateQueueId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Generate a unique batch ID for grouping items added together */
export function generateBatchId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the best version of a track (highest rated by avgRating)
 * Falls back to first version if all ratings are null
 */
export function getBestVersion(songs: Song[]): Song {
  if (songs.length === 0) {
    throw new Error('Cannot get best version from empty songs array');
  }

  if (songs.length === 1) {
    return songs[0];
  }

  // Sort by avgRating descending, treating null/undefined as -1
  const sorted = [...songs].sort((a, b) => {
    const ratingA = a.avgRating ?? -1;
    const ratingB = b.avgRating ?? -1;
    return ratingB - ratingA;
  });

  return sorted[0];
}

/**
 * Convert an Album to an array of QueueItems with best versions auto-selected.
 * All items share a single batchId for album grouping.
 */
export function albumToQueueItems(
  album: Album,
  versionOverrides?: Map<string, string>,
): QueueItem[] {
  const batchId = generateBatchId();

  const albumSource: Omit<QueueItemAlbumSource, 'originalTrackIndex'> = {
    albumId: album.id,
    albumIdentifier: album.identifier,
    albumName: album.name,
    artistSlug: album.artistSlug,
    artistName: album.artistName,
    coverArt: album.coverArt,
    showDate: album.showDate,
    showVenue: album.showVenue,
    showLocation: album.showLocation,
  };

  const items: QueueItem[] = [];

  album.tracks.forEach((track, index) => {
    if (!track.songs || track.songs.length === 0) return;

    let selectedSong: Song;
    const overrideId = versionOverrides?.get(track.id);

    if (overrideId) {
      const found = track.songs.find((s) => s.id === overrideId);
      selectedSong = found ?? getBestVersion(track.songs);
    } else {
      selectedSong = getBestVersion(track.songs);
    }

    items.push({
      queueId: generateQueueId(),
      batchId,
      song: selectedSong,
      trackTitle: track.title,
      trackSlug: track.slug,
      availableVersions: track.songs,
      albumSource: {
        ...albumSource,
        originalTrackIndex: index,
      },
      played: false,
      source: { type: 'album-load' },
    });
  });

  return items;
}

/**
 * Create a single QueueItem from a Song.
 * Each standalone item gets its own unique batchId.
 */
export function trackToQueueItem(
  song: Song,
  track?: Track,
  albumSource?: QueueItemAlbumSource,
): QueueItem {
  const trackTitle = song.trackTitle || song.title;
  const trackSlug = track?.slug || slugify(trackTitle);

  return {
    queueId: generateQueueId(),
    batchId: generateBatchId(),
    song,
    trackTitle,
    trackSlug,
    availableVersions: track ? track.songs : [song],
    albumSource: albumSource ?? null,
    played: false,
    source: { type: 'add-to-queue', addedAt: Date.now() },
  };
}

/**
 * Derive visual album groups from queue items after the cursor.
 * Groups consecutive items with the same batchId and non-null albumSource.
 * O(n) algorithm.
 */
export function computeAlbumGroups(
  items: QueueItem[],
  cursorIndex: number,
): AlbumGroup[] {
  const groups: AlbumGroup[] = [];
  const seenBatchIds = new Set<string>();

  // Collect batchIds from items at or before cursor
  for (let i = 0; i <= cursorIndex && i < items.length; i++) {
    if (items[i].albumSource) {
      seenBatchIds.add(items[i].batchId);
    }
  }

  const startFrom = cursorIndex + 1;
  if (startFrom >= items.length) return groups;

  let currentGroup: AlbumGroup | null = null;

  for (let i = startFrom; i < items.length; i++) {
    const item = items[i];

    if (
      item.albumSource &&
      currentGroup &&
      item.batchId === currentGroup.batchId
    ) {
      // Continue existing group
      currentGroup.endIndex = i;
      currentGroup.items.push(item);
    } else if (item.albumSource) {
      // Finalize previous group
      if (currentGroup) {
        groups.push(currentGroup);
      }
      // Start new group
      const isContinuation = seenBatchIds.has(item.batchId);
      seenBatchIds.add(item.batchId);
      currentGroup = {
        batchId: item.batchId,
        albumSource: item.albumSource,
        startIndex: i,
        endIndex: i,
        isContinuation,
        items: [item],
      };
    } else {
      // Standalone item (no albumSource) - finalize any current group
      if (currentGroup) {
        groups.push(currentGroup);
        currentGroup = null;
      }
    }
  }

  // Finalize last group
  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

// =============================================================================
// Internal Helpers
// =============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
