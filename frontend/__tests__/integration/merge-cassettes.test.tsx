/**
 * Integration test: Cassette merge logic
 *
 * Tests from lib/magentoSync.ts:
 * - mergeCassettes: identity-based merge, timestamp comparison
 *   - Server-only items added to merged
 *   - Local-only items added to merged + toSync
 *   - Both sides: server wins when strictly newer
 *   - Both sides: local wins when newer or same timestamp
 *   - updatedFromServer counter
 * - serverCassetteToLocal: converts server format to local
 */
import { describe, it, expect } from 'vitest';
import {
  mergeCassettes,
  serverCassetteToLocal,
  type ServerCassette,
} from '@/lib/magentoSync';
import { Cassette } from '@/lib/cassetteTypes';

function buildServerCassette(overrides: Partial<ServerCassette> = {}): ServerCassette {
  return {
    entity_id: 1,
    client_id: 'cassette-100',
    name: 'Cornell 77',
    album_identifier: 'gd1977-05-08',
    artist_slug: 'grateful-dead',
    artist_name: 'Grateful Dead',
    album_name: 'Cornell 77',
    cover_art: null,
    show_date: '1977-05-08',
    show_venue: 'Barton Hall',
    show_location: 'Ithaca, NY',
    version_overrides: null,
    color_index: 3,
    color_hex: null,
    color_brand: null,
    is_public: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    ...overrides,
  };
}

function buildLocalCassette(overrides: Partial<Cassette> = {}): Cassette {
  return {
    id: 'cassette-100',
    name: 'Cornell 77',
    albumIdentifier: 'gd1977-05-08',
    artistSlug: 'grateful-dead',
    artistName: 'Grateful Dead',
    albumName: 'Cornell 77',
    versionOverrides: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    ...overrides,
  };
}

describe('Merge Cassettes Integration', () => {
  describe('serverCassetteToLocal', () => {
    it('converts all fields from server to local format', () => {
      const sc = buildServerCassette({
        version_overrides: JSON.stringify({ 'track-1': 'song-sbd' }),
        color_hex: '#e84393',
        color_brand: 'maxell-xlii',
        is_public: true,
      });

      const local = serverCassetteToLocal(sc);

      expect(local.id).toBe('cassette-100');
      expect(local.name).toBe('Cornell 77');
      expect(local.albumIdentifier).toBe('gd1977-05-08');
      expect(local.artistSlug).toBe('grateful-dead');
      expect(local.showDate).toBe('1977-05-08');
      expect(local.showVenue).toBe('Barton Hall');
      expect(local.showLocation).toBe('Ithaca, NY');
      expect(local.versionOverrides).toEqual({ 'track-1': 'song-sbd' });
      expect(local.colorHex).toBe('#e84393');
      expect(local.colorBrand).toBe('maxell-xlii');
      expect(local.isPublic).toBe(true);
    });

    it('handles null optional fields', () => {
      const sc = buildServerCassette({
        cover_art: null,
        show_date: null,
        show_venue: null,
        version_overrides: null,
        color_index: null,
        color_hex: null,
        color_brand: null,
        is_public: null,
      });

      const local = serverCassetteToLocal(sc);

      expect(local.coverArt).toBeUndefined();
      expect(local.showDate).toBeUndefined();
      expect(local.showVenue).toBeUndefined();
      expect(local.versionOverrides).toEqual({});
      expect(local.colorIndex).toBeUndefined();
      expect(local.colorHex).toBeUndefined();
      expect(local.colorBrand).toBeUndefined();
      expect(local.isPublic).toBe(false);
    });
  });

  describe('mergeCassettes', () => {
    it('server-only items appear in merged', () => {
      const server = [buildServerCassette({ client_id: 'c-server' })];
      const { merged, toSync, updatedFromServer } = mergeCassettes([], server);

      expect(merged).toHaveLength(1);
      expect(merged[0].id).toBe('c-server');
      expect(toSync).toHaveLength(0);
      expect(updatedFromServer).toBe(1);
    });

    it('local-only items appear in merged and toSync', () => {
      const local = [buildLocalCassette({ id: 'c-local' })];
      const { merged, toSync, updatedFromServer } = mergeCassettes(local, []);

      expect(merged).toHaveLength(1);
      expect(merged[0].id).toBe('c-local');
      expect(toSync).toHaveLength(1);
      expect(toSync[0].id).toBe('c-local');
      expect(updatedFromServer).toBe(0);
    });

    it('server wins when strictly newer', () => {
      const server = [buildServerCassette({
        client_id: 'c-1',
        name: 'Server Version',
        updated_at: '2026-03-01T00:00:00Z',
      })];
      const local = [buildLocalCassette({
        id: 'c-1',
        name: 'Local Version',
        updatedAt: '2026-02-01T00:00:00Z',
      })];

      const { merged, toSync, updatedFromServer } = mergeCassettes(local, server);

      expect(merged).toHaveLength(1);
      expect(merged[0].name).toBe('Server Version');
      expect(toSync).toHaveLength(0);
      expect(updatedFromServer).toBe(1);
    });

    it('local wins when newer', () => {
      const server = [buildServerCassette({
        client_id: 'c-1',
        name: 'Server Version',
        updated_at: '2026-02-01T00:00:00Z',
      })];
      const local = [buildLocalCassette({
        id: 'c-1',
        name: 'Local Version',
        updatedAt: '2026-03-01T00:00:00Z',
      })];

      const { merged, toSync, updatedFromServer } = mergeCassettes(local, server);

      expect(merged).toHaveLength(1);
      expect(merged[0].name).toBe('Local Version');
      expect(toSync).toHaveLength(1); // local is newer, needs sync
      expect(updatedFromServer).toBe(0);
    });

    it('local wins when same timestamp', () => {
      const ts = '2026-02-15T12:00:00Z';
      const server = [buildServerCassette({
        client_id: 'c-1',
        name: 'Server Version',
        updated_at: ts,
      })];
      const local = [buildLocalCassette({
        id: 'c-1',
        name: 'Local Version',
        updatedAt: ts,
      })];

      const { merged, toSync } = mergeCassettes(local, server);

      expect(merged).toHaveLength(1);
      expect(merged[0].name).toBe('Local Version');
      expect(toSync).toHaveLength(0); // same time, no sync needed
    });

    it('handles mixed scenario: server-only + local-only + overlap', () => {
      const server = [
        buildServerCassette({ client_id: 'shared', name: 'Shared', updated_at: '2026-03-01T00:00:00Z' }),
        buildServerCassette({ client_id: 'server-only', name: 'Server Only' }),
      ];
      const local = [
        buildLocalCassette({ id: 'shared', name: 'Shared Local', updatedAt: '2026-01-01T00:00:00Z' }),
        buildLocalCassette({ id: 'local-only', name: 'Local Only' }),
      ];

      const { merged, toSync, updatedFromServer } = mergeCassettes(local, server);

      expect(merged).toHaveLength(3);
      expect(toSync).toHaveLength(1); // local-only
      expect(toSync[0].id).toBe('local-only');
      expect(updatedFromServer).toBe(2); // server-only + server wins shared
    });

    it('returns empty for empty inputs', () => {
      const { merged, toSync, updatedFromServer } = mergeCassettes([], []);
      expect(merged).toEqual([]);
      expect(toSync).toEqual([]);
      expect(updatedFromServer).toBe(0);
    });
  });
});
