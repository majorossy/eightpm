'use client';

// useCassetteResolution — Resolves a Cassette into a playable track list
// Fetches the album via API, then applies versionOverrides per track.
// Falls back to getBestVersion for tracks without overrides.

import { useState, useEffect, useCallback } from 'react';
import { Cassette } from '@/lib/cassetteTypes';
import { getAlbum, type Album, type Track, type Song } from '@/lib/api';
import { getBestVersion } from '@/lib/queueTypes';

export interface ResolvedTrack {
  track: Track;
  selectedSong: Song;
  isOverridden: boolean; // true if a custom version was picked
}

interface CassetteResolution {
  resolvedTracks: ResolvedTrack[];
  album: Album | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCassetteResolution(cassette: Cassette | null | undefined): CassetteResolution {
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!cassette) {
      setAlbum(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getAlbum(cassette.artistSlug, cassette.albumIdentifier)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError('Album not found');
          setAlbum(null);
        } else {
          setAlbum(result);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('Failed to load album');
        setAlbum(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cassette?.albumIdentifier, cassette?.artistSlug, fetchKey]);

  // Resolve tracks by applying version overrides
  const resolvedTracks: ResolvedTrack[] = [];

  if (album && cassette) {
    for (const track of album.tracks) {
      if (!track.songs || track.songs.length === 0) continue;

      const overrideId = cassette.versionOverrides[track.id];
      let selectedSong: Song;
      let isOverridden = false;

      if (overrideId) {
        const found = track.songs.find((s) => s.id === overrideId);
        if (found) {
          selectedSong = found;
          isOverridden = true;
        } else {
          // Override references a stale ID — fall back gracefully
          selectedSong = getBestVersion(track.songs)!;
        }
      } else {
        selectedSong = getBestVersion(track.songs)!;
      }

      resolvedTracks.push({ track, selectedSong, isOverridden });
    }
  }

  return { resolvedTracks, album, isLoading, error, refetch };
}
