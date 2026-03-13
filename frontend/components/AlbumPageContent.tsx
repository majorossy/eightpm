'use client';

import { useEffect, useRef, useState } from 'react';
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

  // Auto-load cassette from ?cassette=<id> query param
  const hasAutoLoaded = useRef(false);
  useEffect(() => {
    if (hasAutoLoaded.current) return;
    const cassetteId = searchParams.get('cassette');
    if (cassetteId) {
      const cassette = savedCassettes.find(c => c.id === cassetteId);
      if (cassette) {
        hasAutoLoaded.current = true;
        setSelectedCassetteId(cassetteId);
        setAll(cassette.versionOverrides);
      }
    }
  }, [searchParams, savedCassettes, setAll]);

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

  const allTracks = album.tracks;

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
    if (selectedCassetteId) {
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

        {/* Cassette shell with tracks inside */}
        <CassetteTape album={album} isPlaying={albumIsPlaying} artistImageUrl={artist?.image}>
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

        {/* Action buttons row — below cassette */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
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
                  Cassette {selectedCassetteId ? 'Updated' : 'Saved'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <circle cx="8" cy="12" r="2" />
                    <circle cx="16" cy="12" r="2" />
                    <path d="M8 14h8" />
                  </svg>
                  {selectedCassetteId ? 'Update Cassette' : 'Save Cassette'}
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

        {/* Saved cassettes — Your Takes */}
        {savedCassettes.length > 0 && (
          <div className="w-full max-w-[400px] mt-6">
            <div className="text-[var(--text-subdued)] text-[10px] tracking-[2px] uppercase mb-2 text-center">
              Your Takes
            </div>
            <div className="flex flex-col gap-1.5">
              {savedCassettes.map(c => (
                <div key={c.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleLoadCassette(c.id)}
                    className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      selectedCassetteId === c.id
                        ? 'bg-[var(--secondary)] text-[var(--primary)] font-semibold'
                        : 'bg-[var(--surface-card)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-card-hover)]'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <circle cx="8" cy="12" r="2" />
                      <circle cx="16" cy="12" r="2" />
                      <path d="M8 14h8" />
                    </svg>
                    <span className="truncate">{c.name}</span>
                    {Object.keys(c.versionOverrides).length > 0 && (
                      <span className="ml-auto text-[10px] opacity-60 shrink-0">
                        {Object.keys(c.versionOverrides).length} pick{Object.keys(c.versionOverrides).length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDeleteCassette(e, c.id)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-subdued)] hover:text-[var(--secondary)] hover:bg-[var(--surface-card-hover)] transition-all"
                    aria-label={`Delete ${c.name}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
