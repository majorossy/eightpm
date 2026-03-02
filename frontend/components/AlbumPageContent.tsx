'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Album, Track, Song, Artist } from '@/lib/api';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useWishlist } from '@/context/WishlistContext';
import { useHaptic } from '@/hooks/useHaptic';
import { useTrackPreferences } from '@/hooks/useTrackPreferences';
import { trackAlbumView } from '@/lib/analytics';
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
  const { getPreferred, setPreferred, clearPreferred, getOverridesMap } = useTrackPreferences(album.identifier);

  const hasTrackedView = useRef(false);

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
      // Nothing playing — load album and start playback
      playAlbum(album, undefined, overrides);
    } else {
      // Already playing — append to end of queue
      const items = albumToItems(album, overrides);
      addToQueue(items);
    }
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

      {/* Vault header badge */}
      <div className="text-center pt-8 pb-4">
        <div className="text-[var(--text-subdued)] text-[11px] tracking-[4px]">
          ✦ LIVE FROM THE VAULT ✦
        </div>
      </div>

      {/* Main content - max width centered, also the sticky parent + flex container */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 lg:flex lg:gap-12 lg:items-start">

          {/* Left column — sticky on all sizes, top offset clears fixed header (h-14 mobile / h-16 desktop) */}
          <div className="sticky top-14 md:top-16 lg:top-20 self-start z-10 bg-[var(--bg)] flex-shrink-0 flex flex-col items-center lg:items-start gap-6 pb-4 mb-8 lg:mb-0">
            <CassetteTape album={album} isPlaying={albumIsPlaying} artistImageUrl={artist?.image} />

            {/* Add to queue — centered under cassette */}
            <button
              onClick={handleAddToQueue}
              className="album-play-button px-6 py-3 rounded-full flex items-center justify-center text-sm font-semibold transition-all hover:scale-105 gap-2"
            >
              + Add Album to Queue
            </button>

            {/* Album info */}
            <div className="max-w-[400px] text-center lg:text-left">
              {/* Quote box */}
              {album.description && (
                <div
                  className="album-quote-box text-[var(--text-subdued)] text-sm italic mb-6 px-4 py-3 rounded-lg border-l-[3px] border-[var(--tertiary)]"
                >
                  "{album.description}"
                </div>
              )}

              <button
                onClick={handleFollowToggle}
                className="album-follow-btn w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all"
              >
                {isFollowed ? '♥' : '♡'}
              </button>
            </div>
          </div>

          {/* Right column — tracks scroll naturally */}
          <div className="flex-1 min-w-0">
            {/* Track list */}
            <div className="mb-8 track-list-container">
              {allTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  displayIndex={idx + 1}
                  onPlay={handlePlaySong}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  waveform={analyzerData.waveform}
                  preferredSongId={getPreferred(track.id)}
                  onSwapVersion={(songId) => {
                    if (getPreferred(track.id) === songId) clearPreferred(track.id);
                    else setPreferred(track.id, songId);
                  }}
                  artistName={album.artistName}
                  coverArt={album.coverArt}
                />
              ))}
            </div>
            {/* More from this Venue - Internal Linking for SEO */}
            {moreFromVenue.length > 0 && album.showVenue && (
              <div className="mt-12">
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
          </div>
      </div>

      {/* Artist discography grid — full width, matches artist page layout */}
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

      {/* Footer */}
      <div className="mt-12 pb-36 text-center text-[var(--text-subdued)] opacity-50 text-[11px] flex flex-col items-center gap-2">
        <div className="text-[var(--text-subdued)]">☮ Please copy freely — never sell ☮</div>
        <div>POWERED BY ARCHIVE.ORG</div>
      </div>
    </div>
  );
}
