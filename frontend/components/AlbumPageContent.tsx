'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Album, Track, Song, Artist } from '@/lib/api';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useWishlist } from '@/context/WishlistContext';
import { useHaptic } from '@/hooks/useHaptic';
import { useToast } from '@/hooks/useToast';
import { useTrackPreferences } from '@/hooks/useTrackPreferences';
import { trackAlbumView, trackCassetteSave, trackSharedCassetteImport } from '@/lib/analytics';
import { useCassettes } from '@/context/CollectionContext';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { useSharedCassettes } from '@/hooks/useSharedCassettes';
import { toggleCassettePublicSync, SharedCassette } from '@/lib/magentoSync';
import { CassetteTape } from './album/CassetteTape';
import { TrackRow } from './album/TrackRow';
import AlbumResult from '@/components/AlbumResult';
import JewelCase from '@/components/JewelCase';
import DecorativeStars from '@/components/DecorativeStars';
import MiniCassette, { CASSETTE_COLOR_COUNT } from '@/components/MiniCassette';
import { resolveCassetteTint } from '@/lib/cassetteColors';
import { getCassetteBrand } from '@/lib/cassetteBrands';
import OldCassette from '@/components/OldCassette';
import NewCassette from '@/components/NewCassette';
import RatingsCassette from '@/components/RatingsCassette';
import {
  VIRTUAL_BEST_ID, VIRTUAL_OLDEST_ID, VIRTUAL_NEWEST_ID,
  VIRTUAL_BEST_NAME, VIRTUAL_OLDEST_NAME, VIRTUAL_NEWEST_NAME,
  computeVirtualOverrides, isVirtualCassette, hasMultiVersionTracks,
  getVirtualCassetteTint,
} from '@/lib/virtualCassettes';

interface AlbumWithTracks extends Album {
  tracks: Track[];
}

// Related show for internal linking
interface RelatedShow {
  slug: string;
  name: string;
  artistSlug: string;
  artistName: string;
  showDate?: string;
  showVenue?: string;
  coverArt?: string;
  totalTracks: number;
}

interface AlbumPageContentProps {
  album: AlbumWithTracks;
  moreFromVenue?: RelatedShow[];
  artistAlbums?: Album[];
  artist?: Artist;
}

export default function AlbumPageContent({ album, moreFromVenue = [], artistAlbums = [], artist }: AlbumPageContentProps) {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { currentSong, isPlaying, togglePlay, playSong, analyzerData } = usePlayer();
  const { currentItem, addToQueue, albumToItems, playAlbum } = useQueue();
  const { followAlbum, unfollowAlbum, isAlbumFollowed } = useWishlist();
  const { vibrate, BUTTON_PRESS } = useHaptic();
  const toast = useToast();
  const { getPreferred, setPreferred, clearPreferred, setAll, getOverridesMap } = useTrackPreferences(album.identifier);
  const { saveCassette, updateCassette, deleteCassette, getCassettesForAlbum } = useCassettes();
  const { isAuthenticated } = useMagentoAuth();
  const savedCassettes = getCassettesForAlbum(album.identifier);
  const { sharedCassettes, isLoading: sharedLoading, refresh: refreshShared } = useSharedCassettes(album.identifier);
  const [selectedCassetteId, setSelectedCassetteId] = useState<string | null>(null);
  const [loadedSharedCassette, setLoadedSharedCassette] = useState<SharedCassette | null>(null);
  const [isNaming, setIsNaming] = useState(false);
  const [cassetteName, setCassetteName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const hasTrackedView = useRef(false);
  const searchParams = useSearchParams();

  const allTracks = album.tracks;

  // Virtual cassette computation
  const showVirtualCassettes = useMemo(() => hasMultiVersionTracks(allTracks), [allTracks]);
  const bestOverrides = useMemo(() => computeVirtualOverrides(allTracks, 'best'), [allTracks]);
  const oldestOverrides = useMemo(() => computeVirtualOverrides(allTracks, 'oldest'), [allTracks]);
  const newestOverrides = useMemo(() => computeVirtualOverrides(allTracks, 'newest'), [allTracks]);

  // Auto-load cassette from ?cassette=<id> query param, or default to Best Versions
  const hasAutoLoaded = useRef(false);
  useEffect(() => {
    if (hasAutoLoaded.current) return;
    const cassetteId = searchParams.get('cassette');
    if (cassetteId) {
      if (isVirtualCassette(cassetteId)) {
        hasAutoLoaded.current = true;
        const overrides = cassetteId === VIRTUAL_BEST_ID ? bestOverrides
          : cassetteId === VIRTUAL_OLDEST_ID ? oldestOverrides : newestOverrides;
        setSelectedCassetteId(cassetteId);
        setAll(overrides);
      } else {
        const cassette = savedCassettes.find(c => c.id === cassetteId);
        if (cassette) {
          hasAutoLoaded.current = true;
          setSelectedCassetteId(cassetteId);
          setAll(cassette.versionOverrides);
        }
      }
    } else if (showVirtualCassettes && getOverridesMap().size === 0) {
      // No query param, no saved preferences — auto-select Best Versions
      hasAutoLoaded.current = true;
      setSelectedCassetteId(VIRTUAL_BEST_ID);
      setAll(bestOverrides);
    }
  }, [searchParams, savedCassettes, setAll, bestOverrides, oldestOverrides, newestOverrides, showVirtualCassettes, getOverridesMap]);

  // Check if this album is currently loaded in the queue
  const isCurrentAlbum = currentItem?.albumSource?.albumIdentifier === album.identifier;
  const albumIsPlaying = isCurrentAlbum && isPlaying;

  // Check if album is followed
  const isFollowed = isAlbumFollowed(album.artistSlug, album.name);

  useEffect(() => {
    setBreadcrumbs([
      { label: album.artistName, shortLabel: artist?.shortName, href: `/artists/${album.artistSlug}`, type: 'artist' },
      { label: album.name, type: 'album' }
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, album.artistName, album.artistSlug, album.name, artist?.shortName]);

  // Track album page view (once per mount)
  useEffect(() => {
    if (!hasTrackedView.current) {
      trackAlbumView(album);
      hasTrackedView.current = true;
    }
  }, [album]);

  const handleLoadVirtualCassette = (virtualId: string) => {
    vibrate(BUTTON_PRESS);
    setLoadedSharedCassette(null);
    if (selectedCassetteId === virtualId) {
      setSelectedCassetteId(null);
      setAll({});
    } else {
      const overrides = virtualId === VIRTUAL_BEST_ID ? bestOverrides
        : virtualId === VIRTUAL_OLDEST_ID ? oldestOverrides : newestOverrides;
      setSelectedCassetteId(virtualId);
      setAll(overrides);
    }
  };

  const handleAddToQueue = () => {
    vibrate(BUTTON_PRESS);
    const overrides = getOverridesMap();
    if (!currentSong) {
      playAlbum(album, undefined, overrides);
      toast.showSuccess('Now playing', {
        bg: 'color-mix(in srgb, var(--action-play) 12%, transparent)',
        border: 'color-mix(in srgb, var(--action-play) 25%, transparent)',
        text: 'var(--cream)',
        icon: 'var(--action-play)',
      });
    } else {
      const items = albumToItems(album, overrides);
      addToQueue(items);
      toast.showSuccess('Queued cassette', {
        bg: 'color-mix(in srgb, var(--action-queue) 12%, transparent)',
        border: 'color-mix(in srgb, var(--action-queue) 25%, transparent)',
        text: 'var(--cream)',
        icon: 'var(--action-queue)',
      });
    }
  };

  const handleSaveCassette = () => {
    vibrate(BUTTON_PRESS);
    const isVirtual = isVirtualCassette(selectedCassetteId);
    if (selectedCassetteId && !isVirtual) {
      const overrides = getOverridesMap();
      const overridesObj: Record<string, string> = {};
      overrides.forEach((songId, trackId) => { overridesObj[trackId] = songId; });
      updateCassette(selectedCassetteId, { versionOverrides: overridesObj });
      toast.showSuccess('Cassette updated', {
        bg: 'color-mix(in srgb, var(--tertiary) 12%, transparent)',
        border: 'color-mix(in srgb, var(--tertiary) 25%, transparent)',
        text: 'var(--cream)',
        icon: 'var(--tertiary)',
      });
    } else {
      setCassetteName(`My Mix ${savedCassettes.length + 1}`);
      setIsNaming(true);
      setTimeout(() => nameInputRef.current?.select(), 0);
    }
  };

  const confirmSaveCassette = () => {
    const name = cassetteName.trim() || `My Mix ${savedCassettes.length + 1}`;
    const overrides = getOverridesMap();
    const overridesObj: Record<string, string> = {};
    overrides.forEach((songId, trackId) => { overridesObj[trackId] = songId; });
    saveCassette({
      name,
      albumIdentifier: album.identifier,
      artistSlug: album.artistSlug,
      artistName: album.artistName,
      albumName: album.name,
      coverArt: album.coverArt,
      showDate: album.showDate,
      showVenue: album.showVenue,
      showLocation: album.showLocation,
      versionOverrides: overridesObj,
      colorIndex: savedCassettes.length % CASSETTE_COLOR_COUNT,
    });
    trackCassetteSave(name, album.artistName);
    setIsNaming(false);
    toast.showSuccess('Cassette saved', {
      bg: 'color-mix(in srgb, var(--tertiary) 12%, transparent)',
      border: 'color-mix(in srgb, var(--tertiary) 25%, transparent)',
      text: 'var(--cream)',
      icon: 'var(--tertiary)',
    });
  };

  const handleLoadCassette = (cassetteId: string) => {
    vibrate(BUTTON_PRESS);
    setLoadedSharedCassette(null);
    if (selectedCassetteId === cassetteId) {
      setSelectedCassetteId(null);
      setAll({});
    } else {
      const cassette = savedCassettes.find(c => c.id === cassetteId);
      if (cassette) {
        setSelectedCassetteId(cassetteId);
        setAll(cassette.versionOverrides);
      }
    }
  };

  const handleCloneCassette = (e: React.MouseEvent, cassette: typeof savedCassettes[number]) => {
    e.stopPropagation();
    vibrate(BUTTON_PRESS);
    const cloned = saveCassette({
      name: `${cassette.name} copy`,
      albumIdentifier: cassette.albumIdentifier,
      artistSlug: cassette.artistSlug,
      artistName: cassette.artistName,
      albumName: cassette.albumName,
      coverArt: cassette.coverArt,
      showDate: cassette.showDate,
      showVenue: cassette.showVenue,
      showLocation: cassette.showLocation,
      versionOverrides: { ...cassette.versionOverrides },
      colorIndex: cassette.colorIndex,
    });
    setSelectedCassetteId(cloned.id);
    setAll(cloned.versionOverrides);
  };

  const handleDeleteCassette = (e: React.MouseEvent, cassetteId: string) => {
    e.stopPropagation();
    vibrate(BUTTON_PRESS);
    if (selectedCassetteId === cassetteId) {
      setSelectedCassetteId(null);
      setAll({});
    }
    deleteCassette(cassetteId);
  };

  const handleTogglePublic = async (e: React.MouseEvent, cassetteId: string, currentlyPublic: boolean) => {
    e.stopPropagation();
    vibrate(BUTTON_PRESS);
    const newPublic = !currentlyPublic;
    // Optimistic update
    updateCassette(cassetteId, { isPublic: newPublic });
    try {
      await toggleCassettePublicSync(cassetteId, newPublic);
      toast.showSuccess(newPublic ? 'Cassette shared' : 'Cassette unshared', {
        bg: 'color-mix(in srgb, var(--tertiary) 12%, transparent)',
        border: 'color-mix(in srgb, var(--tertiary) 25%, transparent)',
        text: 'var(--cream)',
        icon: 'var(--tertiary)',
      });
      refreshShared();
    } catch {
      // Revert on failure
      updateCassette(cassetteId, { isPublic: currentlyPublic });
      toast.showWarning('Failed to update sharing');
    }
  };

  const handleLoadSharedCassette = (shared: SharedCassette) => {
    vibrate(BUTTON_PRESS);
    let overrides: Record<string, string> = {};
    try { if (shared.version_overrides) overrides = JSON.parse(shared.version_overrides); } catch { /* malformed */ }
    setSelectedCassetteId(null);
    setLoadedSharedCassette(shared);
    setAll(overrides);
  };

  const handleSaveSharedToMine = () => {
    if (!loadedSharedCassette) return;
    vibrate(BUTTON_PRESS);
    let overrides: Record<string, string> = {};
    try { if (loadedSharedCassette.version_overrides) overrides = JSON.parse(loadedSharedCassette.version_overrides); } catch { /* malformed */ }
    const cloned = saveCassette({
      name: `${loadedSharedCassette.name} (via ${loadedSharedCassette.created_by_username})`.slice(0, 33),
      albumIdentifier: album.identifier,
      artistSlug: album.artistSlug,
      artistName: album.artistName,
      albumName: album.name,
      coverArt: album.coverArt,
      showDate: album.showDate,
      showVenue: album.showVenue,
      showLocation: album.showLocation,
      versionOverrides: overrides,
      colorIndex: savedCassettes.length % CASSETTE_COLOR_COUNT,
    });
    trackSharedCassetteImport(loadedSharedCassette.name, loadedSharedCassette.created_by_username, album.artistName);
    setLoadedSharedCassette(null);
    setSelectedCassetteId(cloned.id);
    toast.showSuccess('Cassette saved to your collection', {
      bg: 'color-mix(in srgb, var(--tertiary) 12%, transparent)',
      border: 'color-mix(in srgb, var(--tertiary) 25%, transparent)',
      text: 'var(--cream)',
      icon: 'var(--tertiary)',
    });
  };

  const handleFollowToggle = () => {
    vibrate(BUTTON_PRESS);
    if (isFollowed) {
      unfollowAlbum(album.artistSlug, album.name);
    } else {
      followAlbum(album.artistSlug, album.name);
    }
  };

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id && isPlaying) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  return (
    <div className="min-h-screen font-serif text-[var(--text)] relative">
      {/* Decorative stars */}
      <DecorativeStars />
      {/* Page fireflies */}
      <div className="firefly fixed top-[20%] left-[10%] w-1.5 h-1.5" />
      <div className="firefly-2 fixed top-[60%] left-[85%] w-1 h-1" />
      <div className="firefly-3 fixed top-[40%] left-[75%] w-1.5 h-1.5" />

      {/* My Cassettes */}
      <div className="max-w-[850px] lg:max-w-[1100px] mx-auto px-4 sm:px-8 pt-8">
        <div className="w-full mt-2 mb-6">
            <div className="text-[var(--text-subdued)] text-[10px] tracking-[2px] uppercase mb-3 text-center">
              My Cassettes
            </div>
            {/* Virtual cassettes — own row, larger */}
            {showVirtualCassettes && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <button
                  onClick={() => handleLoadVirtualCassette(VIRTUAL_OLDEST_ID)}
                  className="w-full text-left transition-transform hover:scale-[1.02]"
                >
                  <OldCassette
                    name={VIRTUAL_OLDEST_NAME}
                    albumName={album.name}
                    artistName={album.artistName}
                    selected={selectedCassetteId === VIRTUAL_OLDEST_ID}
                  />
                </button>
                <button
                  onClick={() => handleLoadVirtualCassette(VIRTUAL_BEST_ID)}
                  className="w-full text-left transition-transform hover:scale-[1.02]"
                >
                  <RatingsCassette
                    name={VIRTUAL_BEST_NAME}
                    albumName={album.name}
                    artistName={album.artistName}
                    selected={selectedCassetteId === VIRTUAL_BEST_ID}
                    versionCount={album.totalSongs}
                  />
                </button>
                <button
                  onClick={() => handleLoadVirtualCassette(VIRTUAL_NEWEST_ID)}
                  className="w-full text-left transition-transform hover:scale-[1.02]"
                >
                  <NewCassette
                    name={VIRTUAL_NEWEST_NAME}
                    albumName={album.name}
                    artistName={album.artistName}
                    selected={selectedCassetteId === VIRTUAL_NEWEST_ID}
                    pickCount={Object.keys(newestOverrides).length}
                  />
                </button>
              </div>
            )}
            {/* User cassettes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Blank tape — clears all version selections */}
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  setSelectedCassetteId(null);
                  setAll({});
                }}
                className="w-full text-left transition-transform hover:scale-[1.02]"
              >
                <MiniCassette
                  name=""
                  albumName=""
                  artistName=""
                  blank
                  coverArt={album.coverArt}
                  selected={selectedCassetteId === null}
                />
              </button>
              {/* User-saved cassettes */}
              {savedCassettes.map((c, i) => {
                const picks = Object.keys(c.versionOverrides).length;
                return (
                  <div key={c.id} className="relative group">
                    <button
                      onClick={() => handleLoadCassette(c.id)}
                      className="w-full text-left transition-transform hover:scale-[1.02]"
                    >
                      <MiniCassette
                        name={c.name}
                        albumName={c.albumName}
                        artistName={c.artistName}
                        showDate={c.showDate}
                        selected={selectedCassetteId === c.id}
                        pickCount={picks}
                        tintStyle={resolveCassetteTint({ ...c, colorIndex: c.colorIndex ?? i })}
                        headerLabel={c.colorBrand ? getCassetteBrand(c.colorBrand)?.headerLabel : undefined}
                        onNameChange={(newName) => {
                          updateCassette(c.id, { name: newName });
                          toast.showSuccess('Cassette updated', {
                            bg: 'color-mix(in srgb, var(--tertiary) 12%, transparent)',
                            border: 'color-mix(in srgb, var(--tertiary) 25%, transparent)',
                            text: 'var(--cream)',
                            icon: 'var(--tertiary)',
                          });
                        }}
                      />
                    </button>
                    {/* Persistent public indicator */}
                    {c.isPublic && (
                      <div className="absolute top-1.5 left-1.5 z-10 w-4 h-4 flex items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--tertiary)_20%,transparent)]">
                        <svg className="w-2.5 h-2.5 text-[var(--tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAuthenticated && (
                        <button
                          onClick={(e) => handleTogglePublic(e, c.id, !!c.isPublic)}
                          className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors ${
                            c.isPublic
                              ? 'bg-[color-mix(in_srgb,var(--tertiary)_30%,transparent)] text-[var(--tertiary)] hover:bg-[color-mix(in_srgb,var(--tertiary)_50%,transparent)]'
                              : 'bg-black/50 text-white/70 hover:text-white hover:bg-black/70'
                          }`}
                          aria-label={c.isPublic ? `Make ${c.name} private` : `Share ${c.name}`}
                        >
                          {c.isPublic ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <circle cx="12" cy="12" r="10" />
                              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                          )}
                        </button>
                      )}
                      <button
                        onClick={(e) => handleCloneCassette(e, c)}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70"
                        aria-label={`Duplicate ${c.name}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteCassette(e, c.id)}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70"
                        aria-label={`Delete ${c.name}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>

      {/* Single-column centered layout */}
      <div className="max-w-[740px] md:max-w-[900px] lg:max-w-[1060px] mx-auto px-[2%] sm:px-0 flex flex-col items-center">

        {/* Action buttons row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {/* Queue Cassette */}
          <button
            onClick={handleAddToQueue}
            className="px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:scale-105 bg-[color-mix(in_srgb,var(--action-queue)_15%,transparent)] border border-[color-mix(in_srgb,var(--action-queue)_50%,transparent)] text-[var(--action-queue)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Queue Cassette
          </button>

          {/* Save Cassette */}
          {isNaming ? (
            <div className="flex items-center gap-2 w-full max-w-[320px]">
              <input
                ref={nameInputRef}
                type="text"
                value={cassetteName}
                onChange={(e) => setCassetteName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmSaveCassette();
                  if (e.key === 'Escape') setIsNaming(false);
                }}
                className="flex-1 min-w-0 px-3 py-2 rounded-full bg-[var(--surface-card)] text-[var(--text)] text-sm border border-[var(--border-subtle-token)] focus:border-[var(--secondary)] focus:outline-none"
                placeholder="Name your cassette..."
              />
              <button
                onClick={confirmSaveCassette}
                className="album-play-button px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 shrink-0"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={handleSaveCassette}
              className="album-play-button px-6 py-3 rounded-full flex items-center justify-center text-sm font-semibold transition-all hover:scale-105 gap-2"
              aria-label="Save Cassette"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <circle cx="8" cy="12" r="2" />
                <circle cx="16" cy="12" r="2" />
                <path d="M8 14h8" />
              </svg>
              {selectedCassetteId && !isVirtualCassette(selectedCassetteId) ? 'Update Cassette' : 'Save Cassette'}
            </button>
          )}

          {/* Save shared cassette to mine */}
          {loadedSharedCassette && (
            <button
              onClick={handleSaveSharedToMine}
              className="px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:scale-105 bg-[color-mix(in_srgb,var(--tertiary)_15%,transparent)] border border-[color-mix(in_srgb,var(--tertiary)_50%,transparent)] text-[var(--tertiary)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save to my cassettes
            </button>
          )}

          {/* Favorite Album */}
          <button
            onClick={handleFollowToggle}
            className="flex items-center gap-2 px-4 py-2 border border-default hover:border-accent rounded-full transition-all hover:scale-105"
            aria-label={isFollowed ? 'Unfavorite album' : 'Favorite album'}
          >
            <svg
              className="w-5 h-5"
              fill={isFollowed ? 'var(--secondary)' : 'none'}
              stroke={isFollowed ? 'var(--secondary)' : 'var(--text)'}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm" style={{ color: isFollowed ? 'var(--secondary)' : 'var(--text)' }}>
              {isFollowed ? 'Favorited Album' : 'Favorite Album'}
            </span>
          </button>
        </div>

        {/* Cassette shell with tracks inside — negative margin cancels parent px-4 on mobile */}
        <div className="w-full -mx-4 sm:mx-0">
        <CassetteTape
          album={album}
          isPlaying={albumIsPlaying}
          artistImageUrl={artist?.image}
          tintStyle={getVirtualCassetteTint(selectedCassetteId)}
          tintIndex={!isVirtualCassette(selectedCassetteId) && selectedCassetteId != null
            ? savedCassettes.find(c => c.id === selectedCassetteId)?.colorIndex ?? 0
            : undefined
          }
        >
          {allTracks.map((track, idx) => {
            return (
              <div key={track.id} className="tape-trk">
                <TrackRow
                  track={track}
                  displayIndex={idx + 1}
                  onPlay={handlePlaySong}
                  currentSong={null}
                  isPlaying={false}
                  waveform={analyzerData.waveform}
                  preferredSongId={getPreferred(track.id)}
                  onSwapVersion={(songId) => {
                    if (getPreferred(track.id) === songId) clearPreferred(track.id);
                    else setPreferred(track.id, songId);
                  }}
                  artistName={album.artistName}
                  coverArt={album.coverArt}
                />
              </div>
            );
          })}
        </CassetteTape>
        </div>

        {/* Album description quote */}
        {album.description && (
          <div className="mt-8 max-w-[500px] w-full">
            <div
              className="album-quote-box text-[var(--text-subdued)] text-sm italic px-4 py-3 rounded-lg border-l-[3px] border-[var(--tertiary)]"
            >
              &ldquo;{album.description}&rdquo;
            </div>
          </div>
        )}
      </div>

      {/* More from this Venue - Internal Linking for SEO */}
      {moreFromVenue.length > 0 && album.showVenue && (
        <div className="max-w-[1000px] mx-auto px-4 sm:px-8 mt-12">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, var(--overlay-light))' }}
            />
            <div className="text-[var(--text-subdued)] text-[11px] tracking-[4px] flex items-center gap-2.5">
              <span className="text-[var(--secondary)]">🏛</span>
              MORE FROM {album.showVenue.toUpperCase()}
              <span className="text-[var(--secondary)]">🏛</span>
            </div>
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(90deg, var(--overlay-light), transparent)' }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {moreFromVenue.map((show) => (
              <Link
                key={show.slug}
                href={`/artists/${show.artistSlug}/album/${show.slug}`}
                className="group block"
              >
                <div className="relative aspect-square rounded-lg mb-2 bg-surface-card p-2">
                  <JewelCase coverArt={show.coverArt} fill trackCount={show.totalTracks} />
                </div>
                <div className="text-sm text-[var(--text-dim)] group-hover:text-[var(--text)] transition-colors truncate">
                  {show.showDate || show.name}
                </div>
                <div className="text-xs text-[var(--text-subdued)] truncate">
                  {show.totalTracks} tracks
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Shared Cassettes */}
      {(sharedLoading || sharedCassettes.length > 0) && (
        <div className="max-w-[850px] mx-auto px-4 sm:px-8 mt-12">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, var(--overlay-light))' }}
            />
            <div className="text-[var(--text-subdued)] text-[11px] tracking-[4px] flex items-center gap-2.5">
              SHARED CASSETTES
            </div>
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(90deg, var(--overlay-light), transparent)' }}
            />
          </div>

          {sharedLoading ? (
            <div className="flex items-center justify-center py-8 gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: 'var(--text-subdued)',
                    animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sharedCassettes.map((sc) => {
                let picks = 0;
                try { if (sc.version_overrides) picks = Object.keys(JSON.parse(sc.version_overrides)).length; } catch { /* malformed */ }
                const isLoaded = loadedSharedCassette?.client_id === sc.client_id;
                return (
                  <button
                    key={sc.client_id}
                    onClick={() => handleLoadSharedCassette(sc)}
                    className="w-full text-left transition-transform hover:scale-[1.02]"
                  >
                    <MiniCassette
                      name={sc.name || ''}
                      albumName={sc.album_name || ''}
                      artistName={sc.artist_name || ''}
                      selected={isLoaded}
                      pickCount={picks}
                      tintStyle={resolveCassetteTint({ colorIndex: sc.color_index ?? 0, colorHex: sc.color_hex ?? undefined, colorBrand: sc.color_brand ?? undefined })}
                      headerLabel={sc.color_brand ? getCassetteBrand(sc.color_brand)?.headerLabel : `BY ${(sc.created_by_username || 'anonymous').toUpperCase()}`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Artist discography grid — full width */}
      {artistAlbums && artistAlbums.length > 1 && (
        <section className="pb-8 max-w-[1400px] mx-auto px-2 sm:px-4 md:px-8 mt-12">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/artists/${album.artistSlug}`}
              className="text-2xl sm:text-3xl font-serif text-[var(--text)] hover:text-[var(--secondary)] transition-colors"
            >
              {album.artistName}
            </Link>
            <Link
              href={`/artists/${album.artistSlug}`}
              className="text-sm text-[var(--text-subdued)] hover:text-[var(--text)] flex items-center gap-1"
            >
              All shows <span className="text-[var(--secondary)]">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {artistAlbums
              .filter((a) => a.slug !== album.slug)
              .map((a) => {
                const subtitle = [a.showDate, a.showVenue].filter(Boolean).join(' · ');
                return (
                  <AlbumResult
                    key={a.id}
                    name={a.name}
                    href={`/artists/${a.artistSlug}/album/${a.slug}`}
                    image={a.coverArt || a.wikipediaArtworkUrl}
                    subtitle={subtitle || `${a.totalSongs} recordings`}
                  />
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
}
