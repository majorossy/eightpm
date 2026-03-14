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
import { useTrackPreferences } from '@/hooks/useTrackPreferences';
import { trackAlbumView, trackCassetteSave } from '@/lib/analytics';
import { useCassettes } from '@/context/CollectionContext';
import { CassetteTape } from './album/CassetteTape';
import { TrackRow } from './album/TrackRow';
import DiscographyCard from '@/components/DiscographyCard';
import JewelCase from '@/components/JewelCase';
import DecorativeStars from '@/components/DecorativeStars';
import MiniCassette from '@/components/MiniCassette';
import OldCassette from '@/components/OldCassette';
import NewCassette from '@/components/NewCassette';
import BestCassette from '@/components/BestCassette';
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
  const { getPreferred, setPreferred, clearPreferred, setAll, getOverridesMap } = useTrackPreferences(album.identifier);
  const { saveCassette, updateCassette, deleteCassette, getCassettesForAlbum } = useCassettes();
  const savedCassettes = getCassettesForAlbum(album.identifier);
  const [selectedCassetteId, setSelectedCassetteId] = useState<string | null>(null);
  const [cassetteSaved, setCassetteSaved] = useState(false);
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

  // Auto-load cassette from ?cassette=<id> query param (supports virtual + saved IDs)
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
    }
  }, [searchParams, savedCassettes, setAll, bestOverrides, oldestOverrides, newestOverrides]);

  // Check if this album is currently loaded in the queue
  const isCurrentAlbum = currentItem?.albumSource?.albumIdentifier === album.identifier;
  const albumIsPlaying = isCurrentAlbum && isPlaying;

  // Check if album is followed
  const isFollowed = isAlbumFollowed(album.artistSlug, album.name);

  useEffect(() => {
    setBreadcrumbs([
      { label: album.artistName, href: `/artists/${album.artistSlug}`, type: 'artist' },
      { label: album.name, type: 'album' }
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, album.artistName, album.artistSlug, album.name]);

  // Track album page view (once per mount)
  useEffect(() => {
    if (!hasTrackedView.current) {
      trackAlbumView(album);
      hasTrackedView.current = true;
    }
  }, [album]);

  const handleLoadVirtualCassette = (virtualId: string) => {
    vibrate(BUTTON_PRESS);
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
    } else {
      const items = albumToItems(album, overrides);
      addToQueue(items);
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
      setCassetteSaved(true);
      setTimeout(() => setCassetteSaved(false), 2000);
    } else {
      const sd = album.showDate?.split('-');
      const datePart = sd?.length === 3 ? `${sd[1]}/${sd[2]}/${sd[0].slice(2)} ` : '';
      setCassetteName(`${datePart}${album.name}`.slice(0, 33));
      setIsNaming(true);
      setTimeout(() => nameInputRef.current?.select(), 0);
    }
  };

  const confirmSaveCassette = () => {
    const sd2 = album.showDate?.split('-');
    const dateFallback = sd2?.length === 3 ? `${sd2[1]}/${sd2[2]}/${sd2[0].slice(2)} ` : '';
    const name = cassetteName.trim() || `${dateFallback}${album.name}`.slice(0, 33);
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
    });
    trackCassetteSave(name, album.artistName);
    setIsNaming(false);
    setCassetteSaved(true);
    setTimeout(() => setCassetteSaved(false), 2000);
  };

  const handleLoadCassette = (cassetteId: string) => {
    vibrate(BUTTON_PRESS);
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

      {/* Single-column centered layout */}
      <div className="max-w-[740px] mx-auto px-4 sm:px-8 pt-8 flex flex-col items-center">

        {/* My Cassettes — top of page */}
        <div className="w-full mt-2 mb-6">
            <div className="text-[var(--text-subdued)] text-[10px] tracking-[2px] uppercase mb-3 text-center">
              My Cassettes
            </div>
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
                  selected={selectedCassetteId === null}
                />
              </button>
              {/* Virtual cassettes — computed auto-mixes */}
              {showVirtualCassettes && (
                <>
                  <button
                    onClick={() => handleLoadVirtualCassette(VIRTUAL_BEST_ID)}
                    className="w-full text-left transition-transform hover:scale-[1.02]"
                  >
                    <BestCassette
                      name={VIRTUAL_BEST_NAME}
                      albumName={album.name}
                      artistName={album.artistName}
                      showVenue={album.showVenue}
                      selected={selectedCassetteId === VIRTUAL_BEST_ID}
                      versionCount={album.totalSongs}
                    />
                  </button>
                  <button
                    onClick={() => handleLoadVirtualCassette(VIRTUAL_OLDEST_ID)}
                    className="w-full text-left transition-transform hover:scale-[1.02]"
                  >
                    <OldCassette
                      name={VIRTUAL_OLDEST_NAME}
                      albumName={album.name}
                      artistName={album.artistName}
                      showVenue={album.showVenue}
                      showDate={album.showDate}
                      selected={selectedCassetteId === VIRTUAL_OLDEST_ID}
                      pickCount={Object.keys(oldestOverrides).length}
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
                      showVenue={album.showVenue}
                      showDate={album.showDate}
                      selected={selectedCassetteId === VIRTUAL_NEWEST_ID}
                      pickCount={Object.keys(newestOverrides).length}
                    />
                  </button>
                </>
              )}
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
                        coverArt={c.coverArt}
                        selected={selectedCassetteId === c.id}
                        pickCount={picks}
                        tintIndex={i + 2}
                        onNameChange={(newName) => updateCassette(c.id, { name: newName })}
                      />
                    </button>
                    <div className="absolute top-1.5 right-1.5 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* Action buttons row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {/* Queue Cassette */}
          <button
            onClick={handleAddToQueue}
            className="album-play-button px-6 py-3 rounded-full flex items-center justify-center text-sm font-semibold transition-all hover:scale-105 gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h12M4 18h8" />
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
              {cassetteSaved ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cassette {selectedCassetteId && !isVirtualCassette(selectedCassetteId) ? 'Updated' : 'Saved'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <circle cx="8" cy="12" r="2" />
                    <circle cx="16" cy="12" r="2" />
                    <path d="M8 14h8" />
                  </svg>
                  {selectedCassetteId && !isVirtualCassette(selectedCassetteId) ? 'Update Cassette' : 'Save Cassette'}
                </>
              )}
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

        {/* Cassette shell with tracks inside */}
        <CassetteTape
          album={album}
          isPlaying={albumIsPlaying}
          artistImageUrl={artist?.image}
          tintStyle={getVirtualCassetteTint(selectedCassetteId)}
          tintIndex={!isVirtualCassette(selectedCassetteId) && selectedCassetteId != null
            ? savedCassettes.findIndex(c => c.id === selectedCassetteId) + 2
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {artistAlbums
              .filter((a) => a.slug !== album.slug)
              .map((a) => (
                <DiscographyCard key={a.id} album={a} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
