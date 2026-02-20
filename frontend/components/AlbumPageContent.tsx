'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Album, Track, Song, Artist } from '@/lib/api';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useWishlist } from '@/context/WishlistContext';
import { useHaptic } from '@/hooks/useHaptic';
import VenueLink from '@/components/VenueLink';
import { trackAlbumView } from '@/lib/analytics';
import { CassetteTape } from './album/CassetteTape';
import { TrackRow, SideDivider } from './album/TrackRow';

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
  const { currentItem, addToQueue, albumToItems } = useQueue();
  const { followAlbum, unfollowAlbum, isAlbumFollowed } = useWishlist();
  const { vibrate, BUTTON_PRESS } = useHaptic();

  const [expandedTrack, setExpandedTrack] = useState<number>(-1);
  const prevSongIdRef = useRef<string | null>(null);
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

  // Auto-expand accordion when track changes (not on every render)
  useEffect(() => {
    if (!currentSong || !isCurrentAlbum) return;

    if (currentSong.id === prevSongIdRef.current) return;
    prevSongIdRef.current = currentSong.id;

    const trackIndex = album.tracks.findIndex(track =>
      track.songs.some(song => song.id === currentSong.id)
    );

    if (trackIndex !== -1) {
      setExpandedTrack(trackIndex);
    }
  }, [currentSong, isCurrentAlbum, album.tracks]);

  // Split tracks for Side A/B
  const midpoint = Math.ceil(album.tracks.length / 2);
  const sideATracks = album.tracks.slice(0, midpoint);
  const sideBTracks = album.tracks.slice(midpoint);

  const handleAddToQueue = () => {
    vibrate(BUTTON_PRESS);
    const items = albumToItems(album);
    addToQueue(items);
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
      {/* Page fireflies */}
      <div className="firefly fixed top-[20%] left-[10%] w-1.5 h-1.5" />
      <div className="firefly-2 fixed top-[60%] left-[85%] w-1 h-1" />
      <div className="firefly-3 fixed top-[40%] left-[75%] w-1.5 h-1.5" />

      {/* Artist discography header - compact carousel at top */}
      {artistAlbums && artistAlbums.length > 1 && (
        <div className="bg-[#1a1815]/80 border-b border-[#2a2520]">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-4">
            {/* Artist name row */}
            <div className="flex items-center justify-between mb-3">
              <Link
                href={`/artists/${album.artistSlug}`}
                className="text-2xl sm:text-3xl font-serif text-[var(--text)] hover:text-[var(--neon-pink)] transition-colors"
              >
                {album.artistName}
              </Link>
              <Link
                href={`/artists/${album.artistSlug}`}
                className="text-sm text-[var(--text-subdued)] hover:text-[var(--text)] flex items-center gap-1"
              >
                All shows <span className="text-[var(--neon-pink)]">→</span>
              </Link>
            </div>

            {/* Compact album carousel */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#4a4038] scrollbar-track-transparent">
              {artistAlbums.map((a) => (
                <Link
                  key={a.id}
                  href={`/artists/${a.artistSlug}/album/${a.slug}`}
                  className={`flex-shrink-0 group ${
                    a.slug === album.slug ? 'pointer-events-none' : ''
                  }`}
                >
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden relative ${
                    a.slug === album.slug
                      ? 'ring-2 ring-[#d4a060] ring-offset-2 ring-offset-[#1a1815]'
                      : 'opacity-70 hover:opacity-100 transition-opacity'
                  }`}>
                    {a.coverArt ? (
                      <Image src={a.coverArt} alt={a.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#2a2520] flex items-center justify-center">
                        <span className="text-[#4a4038] text-xs">♫</span>
                      </div>
                    )}
                  </div>
                  <div className={`text-[10px] mt-1 text-center truncate w-16 sm:w-20 ${
                    a.slug === album.slug
                      ? 'text-[#d4a060]'
                      : 'text-[var(--text-subdued)] group-hover:text-[var(--text)]'
                  }`}>
                    {a.showDate || a.name.slice(0, 10)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vault header badge */}
      <div className="text-center pt-8 pb-4">
        <div className="text-[var(--text-subdued)] text-[11px] tracking-[4px]">
          ✦ LIVE FROM THE VAULT ✦
        </div>
      </div>

      {/* Main content - max width centered */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 pb-36">

        {/* Hero section */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-12 items-center lg:items-start justify-center">
          {/* Cassette tape */}
          <div className="flex flex-col items-center gap-6">
            <CassetteTape album={album} isPlaying={albumIsPlaying} artistImageUrl={artist?.image} />
          </div>

          {/* Album info */}
          <div className="pt-4 max-w-[400px] text-center lg:text-left">
            <div className="text-[var(--campfire-teal)] text-[10px] tracking-[3px] mb-2.5">
              ☮ LIVE ALBUM
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-[var(--text)] mb-2 leading-tight">
              {album.name}
            </h1>
            {album.showVenue && (
              <div className="text-xl text-[var(--text-dim)] mb-1.5 italic">
                <VenueLink venueName={album.showVenue} className="text-[var(--text-dim)] hover:text-[#d4a060] hover:underline transition-colors" />
              </div>
            )}
            <div className="text-[var(--text-subdued)] text-sm mb-6">
              <Link href={`/artists/${album.artistSlug}`} className="text-[var(--neon-pink)] hover:underline">
                {album.artistName}
              </Link>
              {album.showDate && <> • {album.showDate}</>}
              {' • '}{album.totalTracks} tracks
            </div>

            {/* Quote box */}
            {album.description && (
              <div
                className="album-quote-box text-[var(--text-subdued)] text-sm italic mb-6 px-4 py-3 rounded-lg border-l-[3px] border-[var(--campfire-teal)]"
              >
                "{album.description}"
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3.5 items-center justify-center lg:justify-start">
              <button
                onClick={handleAddToQueue}
                className="album-play-button px-6 py-3.5 rounded-full flex items-center justify-center text-[var(--bg)] text-sm font-semibold shadow-lg transition-all hover:scale-105 gap-2"
              >
                + Add Album to Queue
              </button>
              <button
                onClick={handleFollowToggle}
                className="album-follow-btn w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all"
              >
                {isFollowed ? '♥' : '♡'}
              </button>
            </div>
          </div>
        </div>

        {/* Side A divider */}
        <SideDivider side="A" />

        {/* Side A tracks */}
        <div className="mb-8 track-list-container">
          {sideATracks.map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              displayIndex={idx + 1}
              isExpanded={expandedTrack === idx}
              onToggle={() => setExpandedTrack(expandedTrack === idx ? -1 : idx)}
              onPlay={handlePlaySong}
              currentSong={currentSong}
              isPlaying={isPlaying}
              waveform={analyzerData.waveform}
            />
          ))}
        </div>

        {/* Side B divider */}
        {sideBTracks.length > 0 && (
          <>
            <SideDivider side="B" />

            {/* Side B tracks */}
            <div className="mb-8 track-list-container">
              {sideBTracks.map((track, idx) => {
                const actualIndex = midpoint + idx;
                return (
                  <TrackRow
                    key={track.id}
                    track={track}
                    displayIndex={actualIndex + 1}
                    isExpanded={expandedTrack === actualIndex}
                    onToggle={() => setExpandedTrack(expandedTrack === actualIndex ? -1 : actualIndex)}
                    onPlay={handlePlaySong}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    waveform={analyzerData.waveform}
                  />
                );
              })}
            </div>
          </>
        )}



        {/* More from this Venue - Internal Linking for SEO */}
        {moreFromVenue.length > 0 && album.showVenue && (
          <div className="mt-12">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="flex-1 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--overlay-light))' }}
              />
              <div className="text-[var(--text-subdued)] text-[11px] tracking-[4px] flex items-center gap-2.5">
                <span className="text-[var(--neon-pink)]">🏛</span>
                MORE FROM {album.showVenue.toUpperCase()}
                <span className="text-[var(--neon-pink)]">🏛</span>
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
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-[#2a2520]">
                    {show.coverArt ? (
                      <Image
                        src={show.coverArt}
                        alt={show.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#8a7a68]">
                        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <circle cx="12" cy="12" r="3" fill="currentColor"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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

        {/* Footer */}
        <div className="mt-12 text-center text-[var(--text-subdued)] opacity-50 text-[11px] flex flex-col items-center gap-2">
          <div className="text-[var(--text-subdued)]">☮ Please copy freely — never sell ☮</div>
          <div>POWERED BY ARCHIVE.ORG</div>
        </div>
      </div>
    </div>
  );
}
