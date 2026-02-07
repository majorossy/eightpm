'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Album, Track, Song, Artist, formatDuration } from '@/lib/api';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { usePlayer } from '@/context/PlayerContext';
import { useQueue } from '@/context/QueueContext';
import { useWishlist } from '@/context/WishlistContext';
import { useHaptic } from '@/hooks/useHaptic';
import { VUMeter, Waveform } from '@/components/AudioVisualizations';
import TaperNotes from '@/components/TaperNotes';
import VenueLink from '@/components/VenueLink';
import { trackAlbumView } from '@/lib/analytics';
import RecordingSelector from '@/components/RecordingSelector';
import { getBestVersion } from '@/lib/queueTypes';

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

// Format hours from seconds
function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Cassette tape component
function CassetteTape({
  album,
  isPlaying,
  volume = 0,
  artistImageUrl,
}: {
  album: AlbumWithTracks;
  isPlaying: boolean;
  volume?: number;
  artistImageUrl?: string;
}) {
  const year = album.showDate?.split('-')[0] || '';
  const formattedDate = album.showDate
    ? new Date(album.showDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
    : '';

  return (
    <div className="relative flex-shrink-0">
      {/* Main cassette body */}
      <div
        className="w-[280px] sm:w-[340px] h-[180px] sm:h-[220px] relative rounded-xl shadow-2xl"
        style={{
          background: 'var(--cassette-body)',
          transform: 'rotate(-1deg)'
        }}
      >
        {/* Corner screws */}
        {[[12, 12], [268, 12], [12, 168], [268, 168]].map(([x, y], i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full hidden sm:block"
            style={{
              left: x - 6,
              top: y - 6,
              background: 'var(--cassette-screw)'
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-[#0a0908]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 w-1.5 h-0.5 bg-[#0a0908]" />
          </div>
        ))}

        {/* Label area - cream colored */}
        <div
          className="absolute top-3 left-5 right-5 h-20 sm:h-24 rounded overflow-hidden shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #faf4e8 0%, #f5ebda 50%, #efe1cc 100%)'
          }}
        >
          {/* Red header band */}
          <div
            className="h-5 sm:h-6 flex items-center justify-between px-3 text-[8px] sm:text-[9px] font-bold text-white tracking-wider"
            style={{ background: 'var(--cassette-header)' }}
          >
            <span>⚡ LIVE RECORDING ⚡</span>
            <span className="opacity-80 font-normal">Type II XL 90</span>
          </div>

          {/* Label content */}
          <div className="p-2 sm:p-3 relative">
            {/* Ruled lines */}
            <div className="absolute top-10 left-3 right-3 h-px bg-[#8b5a2b]/10" />
            <div className="absolute top-14 left-3 right-3 h-px bg-[#8b5a2b]/5" />

            <div className="flex justify-between items-start">
              <div>
                <div className="text-[#1a0f08] text-base sm:text-lg font-semibold font-serif truncate max-w-[180px] sm:max-w-[220px]">
                  {album.name} ☮
                </div>
                <div className="text-[#4a3020] text-[10px] sm:text-xs italic truncate max-w-[180px] sm:max-w-[220px]">
                  {album.artistName} — {album.showVenue ? <VenueLink venueName={album.showVenue} className="text-[#4a3020] hover:text-[#2a1810] hover:underline" truncateLength={24} /> : 'Live'}
                </div>
              </div>
              <div className="flex items-center gap-2 relative">
                {/* Year display */}
                <div className="text-[#8a6a50] text-sm sm:text-base italic font-serif">
                  '{year.slice(-2)}
                </div>
              </div>
            </div>

            {/* Stealie doodle */}
            <div className="absolute bottom-1 right-3 text-base opacity-30">💀</div>
          </div>

          {/* Bottom bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-4 sm:h-5 flex items-center justify-center gap-3 text-[8px] sm:text-[9px] text-[#6a5040] border-t border-[#8b5a2b]/10"
            style={{ background: 'rgba(0,0,0,0.04)' }}
          >
            <span>{album.totalTracks} tracks</span>
            <span className="text-[#c85028]">✦</span>
            <span>{formatHours(album.totalDuration)}</span>
            <span className="text-[#c85028]">✦</span>
            <span>archive</span>
          </div>
        </div>

        {/* Album cover art polaroid stamp (upper right) */}
        {album.coverArt ? (
          <div
            className="absolute top-[8px] right-[8px] sm:top-[10px] sm:right-[12px] h-16 w-16 sm:h-20 sm:w-20 z-50"
          >
            {/* Packing tape strip */}
            <div
              className="absolute -top-0.5 h-3 sm:h-4 z-10"
              style={{
                left: '73%',
                width: '40%',
                background: 'linear-gradient(180deg, rgba(255, 248, 220, 0.92) 0%, rgba(255, 240, 195, 0.85) 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                borderRadius: '1px',
                transform: 'translateX(-50%) rotate(12deg)'
              }}
            />

            {/* Photo with white border */}
            <div
              className="absolute inset-0"
              style={{ transform: 'rotate(6deg)' }}
            >
              <Image
                src={album.coverArt}
                alt={`${album.artistName}`}
                fill
                sizes="200px"
                quality={85}
                priority
                className="object-cover rounded-sm"
                style={{
                  border: '2px solid white',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement?.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full bg-[#f5ebda] flex items-center justify-center rounded-sm" style="border: 2px solid white; box-shadow: 0 4px 16px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)">
                        <svg class="w-8 h-8 sm:w-10 sm:h-10 text-[#8b5a2b]" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
                          <circle cx="12" cy="12" r="3" fill="currentColor"/>
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          </div>
        ) : (
          // Fallback: Vinyl icon with packing tape when no image
          <div
            className="absolute top-[8px] right-[8px] sm:top-[10px] sm:right-[12px] h-16 w-16 sm:h-20 sm:w-20 z-50"
          >
            {/* Packing tape strip */}
            <div
              className="absolute -top-0.5 h-3 sm:h-4 z-10"
              style={{
                left: '73%',
                width: '40%',
                background: 'linear-gradient(180deg, rgba(255, 248, 220, 0.92) 0%, rgba(255, 240, 195, 0.85) 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                borderRadius: '1px',
                transform: 'translateX(-50%) rotate(12deg)'
              }}
            />

            {/* Photo with white border */}
            <div
              className="absolute inset-0"
              style={{ transform: 'rotate(6deg)' }}
            >
              <div className="w-full h-full bg-[#f5ebda] flex items-center justify-center rounded-sm" style={{ border: '2px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)' }}>
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#8b5a2b]" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Artist logo sticker on cassette body */}
        {artistImageUrl && (
          <div
            className="absolute bottom-2 left-16 sm:left-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white shadow-lg z-10"
            style={{ transform: 'rotate(-8deg)' }}
          >
            <Image
              src={artistImageUrl}
              alt={album.artistName}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Tape window */}
        <div
          className="absolute top-[100px] sm:top-[118px] left-8 sm:left-10 right-8 sm:right-10 h-14 sm:h-[75px] rounded-md overflow-hidden"
          style={{
            background: 'var(--cassette-window)',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: 'var(--cassette-border)'
          }}
        >
          {/* Glass shine */}
          <div
            className="absolute top-0 left-0 right-0 h-2/5"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent)' }}
          />

          {/* Left reel */}
          <div
            className={`absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-10 sm:w-[52px] h-10 sm:h-[52px] rounded-full ${isPlaying ? 'reel-spin-left' : 'reel-spin-left reel-paused'}`}
            style={{
              background: 'var(--cassette-reel)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'var(--cassette-border)'
            }}
          >
            <div
              className="absolute inset-1 rounded-full"
              style={{ background: 'var(--cassette-tape)' }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0a0808]"
              style={{
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'var(--cassette-border)'
              }}
            >
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <div
                  key={deg}
                  className="absolute top-1/2 left-1/2 w-[7px] h-[1.5px]"
                  style={{
                    background: 'var(--text-subdued)',
                    transform: `translate(-50%, -50%) rotate(${deg}deg)`
                  }}
                />
              ))}
            </div>
          </div>

          {/* VU Meter centered between reels */}
          {isPlaying && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <VUMeter volume={volume} size="normal" />
            </div>
          )}

          {/* Right reel */}
          <div
            className={`absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-10 sm:w-[52px] h-10 sm:h-[52px] rounded-full ${isPlaying ? 'reel-spin-right' : 'reel-spin-right reel-paused'}`}
            style={{
              background: 'var(--cassette-reel)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'var(--cassette-border)'
            }}
          >
            <div
              className="absolute inset-3 sm:inset-[14px] rounded-full"
              style={{ background: 'var(--cassette-tape)' }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0a0808]"
              style={{
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'var(--cassette-border)'
              }}
            >
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <div
                  key={deg}
                  className="absolute top-1/2 left-1/2 w-[7px] h-[1.5px]"
                  style={{
                    background: 'var(--text-subdued)',
                    transform: `translate(-50%, -50%) rotate(${deg}deg)`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tape band */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-16 sm:left-[77px] right-16 sm:right-[77px] h-[3px]"
            style={{ background: 'var(--cassette-tape)' }}
          />
        </div>

        {/* Side indicators */}
        <div className="absolute bottom-2 left-5 sm:left-7 flex items-center gap-1.5 text-[8px] sm:text-[9px] tracking-wider" style={{ color: 'var(--text-subdued)' }}>
          <div
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: isPlaying ? 'var(--cassette-glow)' : 'var(--text-subdued)',
              boxShadow: isPlaying ? '0 0 10px var(--cassette-glow)' : 'none'
            }}
          />
          SIDE A
        </div>
        <div className="absolute bottom-2 right-5 sm:right-7 flex items-center gap-1.5 text-[8px] sm:text-[9px] tracking-wider" style={{ color: 'var(--text-subdued)' }}>
          SIDE B
          <div
            className="w-2 h-2 rounded-full"
            style={{
              border: '1px solid var(--text-subdued)'
            }}
          />
        </div>
      </div>

      {/* Fire glow under cassette */}
      <div className="cassette-glow" />

    </div>
  );
}

// Track row component
function TrackRow({
  track,
  displayIndex,
  isExpanded,
  onToggle,
  onPlay,
  currentSong,
  isPlaying,
  waveform = [],
}: {
  track: Track;
  displayIndex: number;  // 1-based display number
  isExpanded: boolean;
  onToggle: () => void;
  onPlay: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  waveform?: number[];
}) {
  const { addToQueue, trackToItem } = useQueue();
  const isCurrentTrack = track.songs.some(s => s.id === currentSong?.id);

  // Best version for header display
  const bestSong = useMemo(() => getBestVersion(track.songs), [track.songs]);
  const bestYear = bestSong?.showDate?.split('-')[0] || '';
  const bestVenue = bestSong?.showVenue || '';
  const bestRating = bestSong?.avgRating;
  const bestReviews = bestSong?.numReviews;

  // Truncate venue for header
  const truncateVenue = (venue: string, max: number) => {
    if (!venue) return '';
    return venue.length > max ? venue.slice(0, max) + '\u2026' : venue;
  };

  return (
    <div
      className={`track-row-wrapper ${isExpanded ? 'expanded rounded-b-xl mb-2' : ''}`}
    >
      {/* Track row */}
      <div
        onClick={onToggle}
        className={`
          track-row grid grid-cols-[44px_1fr_auto] items-center py-4 cursor-pointer
          ${isExpanded ? 'expanded rounded-t-xl' : ''}
        `}
      >
        <div className={`text-lg flex items-center justify-center ${isExpanded || isCurrentTrack ? 'text-[var(--neon-pink)]' : 'text-[var(--text-subdued)]'}`}>
          {isCurrentTrack && isPlaying ? (
            <Waveform waveform={waveform} size="small" />
          ) : isExpanded ? (
            '▶'
          ) : (
            `${displayIndex}.`
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-lg font-serif mb-1 ${isExpanded || isCurrentTrack ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}`}>
            {track.title}
          </div>
          {/* Best version info */}
          <div className="flex items-center gap-2 flex-wrap text-sm">
            {bestYear && (
              <span className="text-[var(--neon-pink)] font-semibold">{bestYear}</span>
            )}
            {bestVenue && (
              <>
                <span className="text-[var(--text-subdued)] opacity-50">•</span>
                <span className="text-[var(--text-dim)] truncate max-w-[180px] sm:max-w-[280px]">
                  {truncateVenue(bestVenue, 35)}
                </span>
              </>
            )}
            {bestRating && (
              <>
                <span className="text-[var(--text-subdued)] opacity-50">•</span>
                <span className="text-[var(--neon-pink)]">
                  {'★'.repeat(Math.round(bestRating))}
                  <span className="text-[var(--text-subdued)] ml-0.5">({bestReviews || 0})</span>
                </span>
              </>
            )}
            <span className="text-[var(--text-subdued)] opacity-50">•</span>
            <span className="text-[var(--campfire-teal)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--campfire-teal)]" />
              {track.songCount} recordings
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 text-[var(--text-subdued)] text-base pl-3">
          {isExpanded && <span className="text-[var(--neon-pink)] text-base">+</span>}
          {formatDuration(track.totalDuration)}
          <span className={`text-[11px] ${isExpanded ? 'text-[var(--neon-pink)]' : 'text-[var(--text-subdued)] opacity-50'}`}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Expanded recordings panel */}
      {isExpanded && (
        <div className="px-5 py-5" style={{ borderTop: '1px solid var(--overlay-light)' }}>
          <RecordingSelector
            songs={track.songs}
            currentSongId={currentSong?.id ?? null}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onQueue={(song) => addToQueue(trackToItem(song))}
          />
        </div>
      )}
    </div>
  );
}

// Side divider component
function SideDivider({ side }: { side: 'A' | 'B' }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--overlay-light))' }}
      />
      <div className="text-[var(--text-subdued)] text-[11px] tracking-[4px] flex items-center gap-2.5">
        <span className={side === 'A' ? 'text-[var(--neon-pink)]' : 'text-[var(--campfire-teal)]'}>
          {side === 'A' ? '✧' : '☽'}
        </span>
        SIDE {side}
        <span className={side === 'A' ? 'text-[var(--neon-pink)]' : 'text-[var(--campfire-teal)]'}>
          {side === 'A' ? '✧' : '☽'}
        </span>
      </div>
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(90deg, var(--overlay-light), transparent)' }}
      />
    </div>
  );
}

export default function AlbumPageContent({ album, moreFromVenue = [], artistAlbums = [], artist }: AlbumPageContentProps) {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { currentSong, isPlaying, togglePlay, playSong, analyzerData } = usePlayer();
  const { queue, currentItem, addToQueue, albumToItems, trackToItem } = useQueue();
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
  // This allows manual accordion control while still following track advancement
  useEffect(() => {
    if (!currentSong || !isCurrentAlbum) return;

    // Only act when the song actually changes
    if (currentSong.id === prevSongIdRef.current) return;
    prevSongIdRef.current = currentSong.id;

    // Find which track contains the new song
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

  // Calculate total versions
  const totalVersions = album.tracks.reduce((acc, track) => acc + track.songCount, 0);

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
            <CassetteTape album={album} isPlaying={albumIsPlaying} volume={analyzerData.volume} artistImageUrl={artist?.image} />
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

        {/* Taper Notes Section - Show recording info when available */}
        {album.tracks.length > 0 && (
          <TaperNotes
            track={album.tracks[0]}
            albumName={album.name}
            artistName={album.artistName}
            showDate={album.showDate}
            showVenue={album.showVenue}
          />
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
