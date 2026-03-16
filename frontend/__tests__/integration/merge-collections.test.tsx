/**
 * Integration test: Collection merge logic (MiniDiscs, Liked Songs, Follows)
 *
 * Tests from lib/magentoSync.ts:
 * - mergeMiniDiscs: timestamp-based merge like cassettes
 * - serverMiniDiscToLocal: converts server format, parses song snapshots
 * - mergeLikedSongs: set-based merge by song_id
 * - serverLikedSongToLocal: converts server liked song with snapshot
 * - mergeFollowedArtists: set-based merge by slug
 * - mergeFollowedAlbums: set-based merge by "artistSlug::albumTitle"
 */
import { describe, it, expect } from 'vitest';
import {
  mergeMiniDiscs,
  serverMiniDiscToLocal,
  mergeLikedSongs,
  serverLikedSongToLocal,
  mergeFollowedArtists,
  mergeFollowedAlbums,
  type ServerMiniDisc,
  type ServerLikedSong,
  type ServerFollowedAlbum,
} from '@/lib/magentoSync';
import { MiniDisc } from '@/lib/minidiscTypes';
import { WishlistItem, Song } from '@/lib/types';

function buildSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-1',
    sku: 'song-1',
    title: 'Test Song',
    artistId: 'a1',
    artistName: 'Railroad Earth',
    artistSlug: 'railroadearth',
    duration: 300,
    streamUrl: 'https://example.com/test.mp3',
    albumArt: '',
    qualityUrls: {},
    albumIdentifier: 'rre-2024',
    albumName: 'Test Show',
    trackTitle: 'Test Song',
    ...overrides,
  };
}

function buildServerMiniDisc(overrides: Partial<ServerMiniDisc> = {}): ServerMiniDisc {
  return {
    entity_id: 1,
    client_id: 'minidisc-100',
    name: 'Road Trip Mix',
    description: 'Best jams',
    cover_art: null,
    songs: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    ...overrides,
  };
}

function buildLocalMiniDisc(overrides: Partial<MiniDisc> = {}): MiniDisc {
  return {
    id: 'minidisc-100',
    name: 'Road Trip Mix',
    description: 'Best jams',
    songs: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    ...overrides,
  };
}

describe('Merge Collections Integration', () => {
  describe('serverMiniDiscToLocal', () => {
    it('converts basic fields', () => {
      const smd = buildServerMiniDisc({
        client_id: 'md-1',
        name: 'Spring Tour',
        description: 'Great shows',
      });

      const local = serverMiniDiscToLocal(smd);

      expect(local.id).toBe('md-1');
      expect(local.name).toBe('Spring Tour');
      expect(local.description).toBe('Great shows');
      expect(local.songs).toEqual([]);
    });

    it('parses song snapshots from server format', () => {
      const songData = buildSong({ id: 's1', title: 'Bird on a Wire' });
      const smd = buildServerMiniDisc({
        songs: [
          { song_id: 's1', sku: 's1', position: 0, song_data_snapshot: JSON.stringify(songData) },
        ],
      });

      const local = serverMiniDiscToLocal(smd);

      expect(local.songs).toHaveLength(1);
      expect(local.songs[0].id).toBe('s1');
      expect(local.songs[0].title).toBe('Bird on a Wire');
    });

    it('sorts songs by position', () => {
      const smd = buildServerMiniDisc({
        songs: [
          { song_id: 's2', sku: 's2', position: 1, song_data_snapshot: JSON.stringify(buildSong({ id: 's2', title: 'Second' })) },
          { song_id: 's1', sku: 's1', position: 0, song_data_snapshot: JSON.stringify(buildSong({ id: 's1', title: 'First' })) },
        ],
      });

      const local = serverMiniDiscToLocal(smd);

      expect(local.songs[0].title).toBe('First');
      expect(local.songs[1].title).toBe('Second');
    });

    it('falls back to defaults when snapshot is null', () => {
      const smd = buildServerMiniDisc({
        songs: [
          { song_id: 'fallback-id', sku: 'fallback-sku', position: 0, song_data_snapshot: null },
        ],
      });

      const local = serverMiniDiscToLocal(smd);

      expect(local.songs).toHaveLength(1);
      expect(local.songs[0].id).toBe('fallback-id');
      expect(local.songs[0].title).toBe('Unknown');
    });
  });

  describe('mergeMiniDiscs', () => {
    it('server-only items added to merged', () => {
      const server = [buildServerMiniDisc({ client_id: 'md-server' })];
      const { merged, toSync, updatedFromServer } = mergeMiniDiscs([], server);

      expect(merged).toHaveLength(1);
      expect(merged[0].id).toBe('md-server');
      expect(toSync).toHaveLength(0);
      expect(updatedFromServer).toBe(1);
    });

    it('local-only items added to merged and toSync', () => {
      const local = [buildLocalMiniDisc({ id: 'md-local' })];
      const { merged, toSync } = mergeMiniDiscs(local, []);

      expect(merged).toHaveLength(1);
      expect(toSync).toHaveLength(1);
      expect(toSync[0].id).toBe('md-local');
    });

    it('server wins when strictly newer', () => {
      const server = [buildServerMiniDisc({
        client_id: 'md-1',
        name: 'Server Name',
        updated_at: '2026-03-01T00:00:00Z',
      })];
      const local = [buildLocalMiniDisc({
        id: 'md-1',
        name: 'Local Name',
        updatedAt: '2026-02-01T00:00:00Z',
      })];

      const { merged } = mergeMiniDiscs(local, server);

      expect(merged[0].name).toBe('Server Name');
    });

    it('local wins when newer or same', () => {
      const server = [buildServerMiniDisc({
        client_id: 'md-1',
        name: 'Server Name',
        updated_at: '2026-01-01T00:00:00Z',
      })];
      const local = [buildLocalMiniDisc({
        id: 'md-1',
        name: 'Local Name',
        updatedAt: '2026-02-01T00:00:00Z',
      })];

      const { merged } = mergeMiniDiscs(local, server);

      expect(merged[0].name).toBe('Local Name');
    });
  });

  describe('serverLikedSongToLocal', () => {
    it('converts server liked song with snapshot', () => {
      const songData = buildSong({ id: 's1', title: 'Dark Star' });
      const sls: ServerLikedSong = {
        song_id: 's1',
        sku: 's1-sku',
        song_data_snapshot: JSON.stringify(songData),
        added_at: '2026-01-15T00:00:00Z',
      };

      const item = serverLikedSongToLocal(sls);

      expect(item).not.toBeNull();
      expect(item!.song.id).toBe('s1');
      expect(item!.song.title).toBe('Dark Star');
      expect(item!.addedAt).toBe('2026-01-15T00:00:00Z');
    });

    it('handles null snapshot with fallback', () => {
      const sls: ServerLikedSong = {
        song_id: 'fallback-id',
        sku: 'fallback-sku',
        song_data_snapshot: null,
        added_at: '2026-01-15T00:00:00Z',
      };

      const item = serverLikedSongToLocal(sls);

      expect(item).not.toBeNull();
      expect(item!.song.id).toBe('fallback-id');
      expect(item!.song.title).toBe('Unknown');
    });
  });

  describe('mergeLikedSongs', () => {
    it('server items appear first in merged', () => {
      const serverSong: ServerLikedSong = {
        song_id: 's-server',
        sku: 'sku-1',
        song_data_snapshot: JSON.stringify(buildSong({ id: 's-server' })),
        added_at: '2026-01-01T00:00:00Z',
      };
      const { merged, toSync } = mergeLikedSongs([], [serverSong]);

      expect(merged).toHaveLength(1);
      expect(merged[0].song.id).toBe('s-server');
      expect(toSync).toHaveLength(0);
    });

    it('local-only items added to toSync', () => {
      const localItem: WishlistItem = {
        id: 'w-1',
        song: buildSong({ id: 's-local' }),
        addedAt: '2026-01-01T00:00:00Z',
      };
      const { merged, toSync } = mergeLikedSongs([localItem], []);

      expect(merged).toHaveLength(1);
      expect(toSync).toHaveLength(1);
      expect(toSync[0].song.id).toBe('s-local');
    });

    it('deduplicates by song_id', () => {
      const serverSong: ServerLikedSong = {
        song_id: 'shared-song',
        sku: 'sku-1',
        song_data_snapshot: JSON.stringify(buildSong({ id: 'shared-song' })),
        added_at: '2026-01-01T00:00:00Z',
      };
      const localItem: WishlistItem = {
        id: 'w-1',
        song: buildSong({ id: 'shared-song' }),
        addedAt: '2026-02-01T00:00:00Z',
      };

      const { merged, toSync } = mergeLikedSongs([localItem], [serverSong]);

      expect(merged).toHaveLength(1); // no duplicate
      expect(toSync).toHaveLength(0); // already on server
    });
  });

  describe('mergeFollowedArtists', () => {
    it('merges server and local slugs', () => {
      const { merged, toSync } = mergeFollowedArtists(
        ['grateful-dead', 'phish'],
        ['grateful-dead', 'sts9'],
      );

      expect(merged).toContain('grateful-dead');
      expect(merged).toContain('sts9');
      expect(merged).toContain('phish');
      expect(merged).toHaveLength(3);
    });

    it('toSync contains local-only slugs', () => {
      const { toSync } = mergeFollowedArtists(
        ['grateful-dead', 'phish'],
        ['grateful-dead'],
      );

      expect(toSync).toEqual(['phish']);
    });

    it('returns empty for empty inputs', () => {
      const { merged, toSync } = mergeFollowedArtists([], []);
      expect(merged).toEqual([]);
      expect(toSync).toEqual([]);
    });
  });

  describe('mergeFollowedAlbums', () => {
    it('merges server and local albums', () => {
      const serverAlbums: ServerFollowedAlbum[] = [
        { artist_slug: 'grateful-dead', album_title: 'Cornell 77', followed_at: '2026-01-01T00:00:00Z' },
      ];
      const localAlbums = [
        'grateful-dead::Cornell 77',
        'phish::NYE 95',
      ];

      const { merged, toSync } = mergeFollowedAlbums(localAlbums, serverAlbums);

      expect(merged).toContain('grateful-dead::Cornell 77');
      expect(merged).toContain('phish::NYE 95');
      expect(merged).toHaveLength(2);
      expect(toSync).toEqual(['phish::NYE 95']);
    });

    it('returns empty for empty inputs', () => {
      const { merged, toSync } = mergeFollowedAlbums([], []);
      expect(merged).toEqual([]);
      expect(toSync).toEqual([]);
    });
  });
});
