'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Album } from '@/lib/types';
import { WikipediaSummary } from '@/lib/types';
import { setArtworkOverride, removeArtworkOverride, fetchStudioAlbumsLockStatus } from '@/lib/api/artwork';
import ImageEditPopover from './ImageEditPopover';

interface EnrichedArtist {
  id: string;       // base64 uid
  name: string;
  slug: string;
  image: string;
  bandImageUrl?: string;
  albums: Album[];
  wikiSummary: WikipediaSummary | null;
}

// Decode Magento base64 uid to numeric category ID
function uidToId(uid: string): number {
  try {
    return parseInt(atob(uid), 10);
  } catch {
    return 0;
  }
}

interface PopoverState {
  categoryId: number;
  currentUrl: string;
  type: 'album_artwork' | 'band_image';
  artistName: string;
  albumName?: string;
  isLocked: boolean;
  anchorRect: DOMRect;
}

export default function DebugImagesClient({ initialArtists }: { initialArtists: EnrichedArtist[] }) {
  const [artists, setArtists] = useState(initialArtists);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [lockMap, setLockMap] = useState<Map<number, boolean>>(new Map());

  // Fetch lock status for all artists on mount
  useEffect(() => {
    const artistNames = artists.map(a => a.name);
    Promise.all(
      artistNames.map(name => fetchStudioAlbumsLockStatus(name).catch(() => new Map<number, boolean>()))
    ).then(results => {
      const merged = new Map<number, boolean>();
      for (const m of results) {
        m.forEach((v, k) => merged.set(k, v));
      }
      setLockMap(merged);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async (categoryId: number, url: string, type: 'album_artwork' | 'band_image', notes: string) => {
    const result = await setArtworkOverride({
      category_id: categoryId,
      artwork_url: url,
      type,
      notes: notes || undefined,
    });
    if (!result.success) {
      throw new Error(result.message || 'Save failed');
    }
    setLockMap(prev => {
      const next = new Map(prev);
      next.set(categoryId, true);
      return next;
    });
    setArtists(prev => prev.map(artist => {
      if (type === 'band_image' && uidToId(artist.id) === categoryId) {
        return { ...artist, bandImageUrl: url };
      }
      if (type === 'album_artwork') {
        return {
          ...artist,
          albums: artist.albums.map(album =>
            uidToId(album.id) === categoryId
              ? { ...album, coverArt: url, wikipediaArtworkUrl: url }
              : album
          ),
        };
      }
      return artist;
    }));
  }, []);

  const handleUnlock = useCallback(async (categoryId: number, type: 'album_artwork' | 'band_image') => {
    const result = await removeArtworkOverride(categoryId, type);
    if (!result.success) {
      throw new Error(result.message || 'Unlock failed');
    }
    setLockMap(prev => {
      const next = new Map(prev);
      next.set(categoryId, false);
      return next;
    });
  }, []);

  const openPopover = (e: React.MouseEvent, state: Omit<PopoverState, 'anchorRect'>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({ ...state, anchorRect: rect });
  };

  return (
    <div className="min-h-screen bg-surface-base text-neutral-200 p-6" style={{ fontSize: '137.5%' }}>
      <h1 className="text-3xl font-bold mb-1">
        <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
          Image Sources Debug
        </span>
      </h1>
      <p className="text-neutral-400 mb-6 text-sm">
        <span className="text-neutral-300">{artists.length}</span> artists &middot; Click to edit &middot;{' '}
        <span className="text-amber-400">&#x1F512; locked</span> = protected from auto-update
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {artists.map((artist) => {
          const artistCatId = uidToId(artist.id);
          const bandImageLocked = lockMap.get(artistCatId) ?? false;

          return (
            <div
              key={artist.id}
              className="bg-neutral-900/60 border border-neutral-800/60 rounded-xl p-4 hover:border-neutral-700 transition-colors"
            >
              <h2 className="font-semibold text-lg mb-3 text-amber-400">{artist.name}</h2>

              {/* Image sources — one per row */}
              <div className="space-y-2 mb-3">
                <ImageRow
                  label="Category Image"
                  src={artist.image}
                  source={`Static file: /media/catalog/category/${artist.slug}.jpg`}
                  usedIn={['Artist cards (home, find)', 'Polaroid card', 'Related artists', 'SEO fallback']}
                  color="cyan"
                  editable
                  isLocked={bandImageLocked}
                  onClick={(e) => openPopover(e, {
                    categoryId: artistCatId,
                    currentUrl: artist.image || '',
                    type: 'band_image',
                    artistName: artist.name,
                    isLocked: bandImageLocked,
                  })}
                />

                <ImageRow
                  label="Band Image URL"
                  src={artist.bandImageUrl}
                  source="DB attribute: band_image_url — set by artist:enrich"
                  usedIn={['SEO og:image (primary)', 'Schema.org structured data', 'Artist page meta tags']}
                  color="pink"
                  editable
                  isLocked={bandImageLocked}
                  onClick={(e) => openPopover(e, {
                    categoryId: artistCatId,
                    currentUrl: artist.bandImageUrl || '',
                    type: 'band_image',
                    artistName: artist.name,
                    isLocked: bandImageLocked,
                  })}
                />

                <ImageRow
                  label="Wikipedia Thumb"
                  src={artist.wikiSummary?.thumbnail?.source}
                  source="Live fetch from Wikipedia REST API (not stored)"
                  usedIn={['Hero cassette artwork', 'Biography section', 'Band info sidebar']}
                  color="violet"
                  editable
                  isLocked={bandImageLocked}
                  onClick={(e) => openPopover(e, {
                    categoryId: artistCatId,
                    currentUrl: artist.wikiSummary?.thumbnail?.source || '',
                    type: 'band_image',
                    artistName: artist.name,
                    isLocked: bandImageLocked,
                  })}
                />
              </div>

              {/* Album covers */}
              {artist.albums.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wide">
                    <span className="text-orange-400">Album Covers</span>{' '}
                    <span className="text-neutral-500">
                      {artist.albums.filter((a) => a.coverArt).length}
                      <span className="text-neutral-600">/</span>
                      {artist.albums.length}
                    </span>
                  </span>
                  <div className="flex gap-2 mt-1 overflow-x-auto pb-2">
                    {artist.albums.slice(0, 30).map((album) => {
                      const albumCatId = uidToId(album.id);
                      const albumLocked = lockMap.get(albumCatId) ?? false;

                      return (
                        <div
                          key={album.id}
                          className="relative flex-shrink-0 w-10 h-10 rounded border border-neutral-700/50 overflow-hidden bg-neutral-900 flex items-center justify-center cursor-pointer hover:border-orange-400 hover:shadow-[0_0_8px_rgba(251,146,60,0.3)] transition-all"
                          title={`${album.name}\n${album.coverArt || 'No cover'}\nClick to edit`}
                          onClick={(e) => openPopover(e, {
                            categoryId: albumCatId,
                            currentUrl: album.coverArt || album.wikipediaArtworkUrl || '',
                            type: 'album_artwork',
                            artistName: artist.name,
                            albumName: album.name,
                            isLocked: albumLocked,
                          })}
                        >
                          {album.coverArt ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={album.coverArt}
                              alt={album.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-red-500 text-[8px] font-bold">X</span>
                          )}
                          {albumLocked && (
                            <span className="absolute -top-0.5 -left-0.5 text-[8px] text-amber-400" title="Locked">
                              &#x1F512;
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {artist.albums.length > 30 && (
                      <span className="text-xs text-neutral-500 self-center pl-1">
                        +{artist.albums.length - 30}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Single popover rendered via portal — escapes overflow clipping */}
      {popover && (
        <ImageEditPopover
          categoryId={popover.categoryId}
          currentUrl={popover.currentUrl}
          type={popover.type}
          artistName={popover.artistName}
          albumName={popover.albumName}
          isLocked={popover.isLocked}
          anchorRect={popover.anchorRect}
          onSave={handleSave}
          onUnlock={handleUnlock}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}

const COLOR_SCHEMES = {
  cyan: {
    border: 'border-cyan-900/30 hover:border-cyan-700/40',
    glow: 'hover:shadow-[0_0_8px_rgba(34,211,238,0.08)]',
    thumb: 'border-cyan-800/40',
    label: 'text-cyan-400/70',
    dot: { on: 'bg-cyan-400/60', off: 'bg-red-400/60' },
    tag: 'bg-cyan-950/30 text-cyan-400/60 border-cyan-800/25',
    src: 'text-cyan-700/60',
  },
  pink: {
    border: 'border-pink-900/30 hover:border-pink-700/40',
    glow: 'hover:shadow-[0_0_8px_rgba(236,72,153,0.08)]',
    thumb: 'border-pink-800/40',
    label: 'text-pink-400/70',
    dot: { on: 'bg-pink-400/60', off: 'bg-red-400/60' },
    tag: 'bg-pink-950/30 text-pink-400/60 border-pink-800/25',
    src: 'text-pink-700/60',
  },
  violet: {
    border: 'border-violet-900/30 hover:border-violet-700/40',
    glow: 'hover:shadow-[0_0_8px_rgba(139,92,246,0.08)]',
    thumb: 'border-violet-800/40',
    label: 'text-violet-400/70',
    dot: { on: 'bg-violet-400/60', off: 'bg-red-400/60' },
    tag: 'bg-violet-950/30 text-violet-400/60 border-violet-800/25',
    src: 'text-violet-700/60',
  },
} as const;

function ImageRow({
  label,
  src,
  source,
  usedIn,
  color,
  editable = false,
  isLocked = false,
  onClick,
}: {
  label: string;
  src?: string | null;
  source: string;
  usedIn: string[];
  color: keyof typeof COLOR_SCHEMES;
  editable?: boolean;
  isLocked?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const present = !!src && !imgError;
  const c = COLOR_SCHEMES[color];
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
        present ? 'bg-green-950/20' : 'bg-red-950/25'
      } ${
        editable ? `${c.border} ${c.glow} cursor-pointer` : 'border-neutral-700/40'
      }`}
      onClick={editable ? onClick : undefined}
    >
      {/* Thumbnail */}
      <div className={`relative flex-shrink-0 w-16 h-16 rounded-lg border overflow-hidden bg-neutral-950 ${c.thumb}`}>
        {present ? (
          <Image
            src={src!}
            alt={label}
            fill
            sizes="64px"
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized={!src!.includes('localhost') && !src!.includes('magento.test')}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-neutral-600 font-bold text-xs">N/A</span>
        )}
        {isLocked && (
          <span className="absolute -top-0.5 -left-0.5 text-[9px] text-amber-400 z-10">&#x1F512;</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-sm font-semibold ${c.label}`}>{label}</span>
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${present ? c.dot.on : c.dot.off}`} />
        </div>

        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {usedIn.map((usage) => (
            <span key={usage} className={`px-2 py-0.5 text-xs rounded-md border ${c.tag}`}>
              {usage}
            </span>
          ))}
        </div>

        <p className="text-[11px] text-neutral-500 truncate" title={src || source}>
          <span className={c.src}>src:</span> {src || source}
        </p>
      </div>
    </div>
  );
}
