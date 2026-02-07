'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useQueue } from '@/context/QueueContext';
import { useRecentlyPlayed } from '@/context/RecentlyPlayedContext';
import { useHaptic } from '@/hooks/useHaptic';
import { formatDuration } from '@/lib/api';
import { getRecordingBadge } from '@/lib/lineageUtils';
import Link from 'next/link';

type TabType = 'songs' | 'artists' | 'albums' | 'recent';

// Inner component that uses useSearchParams
function LibraryPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize from URL or default to 'songs'
  const initialTab = (searchParams.get('tab') as TabType) || 'songs';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const { wishlist, removeFromWishlist, followedArtists, followedAlbums } = useWishlist();
  const { addToQueue, trackToItem } = useQueue();
  const { recentlyPlayed } = useRecentlyPlayed();
  const { vibrate, BUTTON_PRESS, DELETE_ACTION } = useHaptic();

  // Update URL when tab changes
  const changeTab = (tab: TabType) => {
    vibrate(BUTTON_PRESS);
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Format relative time (e.g., "2 hours ago", "Yesterday")
  const formatRelativeTime = (isoDate: string): string => {
    const now = new Date();
    const date = new Date(isoDate);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? 'month' : 'months'} ago`;
    return `${Math.floor(diffDays / 365)} ${Math.floor(diffDays / 365) === 1 ? 'year' : 'years'} ago`;
  };

  const formatShowDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: '2-digit'
    });
  };

  const getAlbumHref = (song: { artistSlug: string; albumIdentifier: string }) =>
    `/artists/${song.artistSlug}/album/${song.albumIdentifier}`;

  const RecordingBadge = ({ song }: { song: { lineage?: string; recordingType?: string } }) => {
    const badge = getRecordingBadge(song.lineage, song.recordingType);
    if (!badge || !badge.show) return null;
    return (
      <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full"
        style={{ backgroundColor: badge.bgColor, color: badge.textColor }}>
        {badge.text}
      </span>
    );
  };

  const ShowContext = ({ song }: { song: { showVenue?: string; showDate?: string; artistSlug: string; albumIdentifier: string } }) => {
    if (!song.showVenue && !song.showDate) return null;
    const text = song.showVenue && song.showDate
      ? `${song.showVenue} · ${formatShowDate(song.showDate)}`
      : song.showVenue || formatShowDate(song.showDate);
    return (
      <Link href={getAlbumHref(song)} className="text-[#5a564e] text-xs hover:text-[#8a8478] truncate block">
        {text}
      </Link>
    );
  };

  const renderSongs = () => {
    if (wishlist.items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <svg className="w-16 h-16 text-[#3a3632] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-white font-bold text-lg mb-2">No liked songs yet</h3>
          <p className="text-[#8a8478] text-sm text-center">
            Songs you like will appear here. Tap the heart icon to save your favorites.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1 px-4 pb-4">
        {wishlist.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded hover:bg-white/10 transition-colors group"
          >
            {/* Album art */}
            <Link href={getAlbumHref(item.song)} className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[#2d2a26] relative">
              {item.song.albumArt ? (
                <Image src={item.song.albumArt} alt={item.song.albumName || 'Album'} fill sizes="40px" quality={75} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#3a3632]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                  </svg>
                </div>
              )}
            </Link>

            {/* Play button (hidden, shows on hover/mobile always) */}
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                addToQueue(trackToItem(item.song));
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#d4a060] text-black opacity-0 md:group-hover:opacity-100 hover:scale-105 transition-all btn-touch"
              aria-label={`Play ${item.song.title}`}
            >
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            {/* Song info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={getAlbumHref(item.song)} className="text-white font-medium truncate hover:underline">
                  {item.song.title}
                </Link>
                <RecordingBadge song={item.song} />
              </div>
              <Link
                href={`/artists/${item.song.artistSlug}`}
                className="text-[#8a8478] text-sm hover:text-white hover:underline truncate block"
              >
                {item.song.artistName}
              </Link>
              <ShowContext song={item.song} />
            </div>

            {/* Duration */}
            <div className="text-[#8a8478] text-sm font-mono hidden md:block">
              {formatDuration(item.song.duration)}
            </div>

            {/* Unlike button */}
            <button
              onClick={() => {
                vibrate(DELETE_ACTION);
                removeFromWishlist(item.id);
              }}
              className="p-2 text-[#d4a060] hover:text-white transition-colors btn-touch"
              aria-label="Remove from favorites"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderArtists = () => {
    if (followedArtists.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <svg className="w-16 h-16 text-[#3a3632] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-white font-bold text-lg mb-2">No followed artists</h3>
          <p className="text-[#8a8478] text-sm text-center">
            Follow artists to see them here. Tap the heart icon on an artist page.
          </p>
        </div>
      );
    }

    // Build artist info from both liked songs and recently played
    const artistInfoMap = new Map<string, { name: string; slug: string; art?: string; likedCount: number }>();
    const allSongs = [
      ...wishlist.items.map(i => i.song),
      ...recentlyPlayed.map(i => i.song),
    ];
    for (const song of allSongs) {
      const existing = artistInfoMap.get(song.artistSlug);
      if (!existing) {
        artistInfoMap.set(song.artistSlug, {
          name: song.artistName,
          slug: song.artistSlug,
          art: song.albumArt,
          likedCount: 0,
        });
      } else if (!existing.art && song.albumArt) {
        existing.art = song.albumArt;
      }
    }
    // Count liked songs per artist
    for (const item of wishlist.items) {
      const info = artistInfoMap.get(item.song.artistSlug);
      if (info) info.likedCount++;
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {followedArtists.map((slug) => {
          const info = artistInfoMap.get(slug);
          const name = info?.name || slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          const art = info?.art;
          const likedCount = info?.likedCount || 0;
          return (
            <Link
              key={slug}
              href={`/artists/${slug}`}
              className="flex flex-col gap-3 p-4 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="w-full aspect-square rounded-full bg-[#2d2a26] overflow-hidden relative">
                {art ? (
                  <Image src={art} alt={name} fill sizes="200px" quality={80} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#3a3632]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-medium truncate">{name}</p>
                <p className="text-[#8a8478] text-sm">
                  {likedCount > 0 ? `${likedCount} liked song${likedCount !== 1 ? 's' : ''}` : 'Following'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  const renderAlbums = () => {
    if (followedAlbums.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <svg className="w-16 h-16 text-[#3a3632] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-white font-bold text-lg mb-2">No followed albums</h3>
          <p className="text-[#8a8478] text-sm text-center">
            Follow albums to see them here. Tap the heart icon on an album page.
          </p>
        </div>
      );
    }

    // Build album info from both liked songs and recently played
    // Key: "artistSlug::albumName" (matches followedAlbums format)
    const albumInfoMap = new Map<string, {
      artistName: string; artistSlug: string; albumName: string;
      albumIdentifier: string; art?: string; showVenue?: string;
      showDate?: string; likedCount: number;
    }>();
    const allSongs = [
      ...wishlist.items.map(i => i.song),
      ...recentlyPlayed.map(i => i.song),
    ];
    for (const song of allSongs) {
      const key = `${song.artistSlug}::${song.albumName}`;
      const existing = albumInfoMap.get(key);
      if (!existing) {
        albumInfoMap.set(key, {
          artistName: song.artistName,
          artistSlug: song.artistSlug,
          albumName: song.albumName,
          albumIdentifier: song.albumIdentifier,
          art: song.albumArt,
          showVenue: song.showVenue,
          showDate: song.showDate,
          likedCount: 0,
        });
      } else {
        if (!existing.art && song.albumArt) existing.art = song.albumArt;
        if (!existing.showVenue && song.showVenue) existing.showVenue = song.showVenue;
        if (!existing.showDate && song.showDate) existing.showDate = song.showDate;
        if (!existing.albumIdentifier && song.albumIdentifier) existing.albumIdentifier = song.albumIdentifier;
      }
    }
    // Count liked songs per album
    for (const item of wishlist.items) {
      const key = `${item.song.artistSlug}::${item.song.albumName}`;
      const info = albumInfoMap.get(key);
      if (info) info.likedCount++;
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {followedAlbums.map((identifier) => {
          const info = albumInfoMap.get(identifier);
          const [artistSlug] = identifier.split('::');
          const artistName = info?.artistName || artistSlug;
          const albumIdentifier = info?.albumIdentifier || '';
          const art = info?.art;
          const venue = info?.showVenue;
          const date = info?.showDate;
          const likedCount = info?.likedCount || 0;
          const href = albumIdentifier ? `/artists/${artistSlug}/album/${albumIdentifier}` : `/artists/${artistSlug}`;

          return (
            <Link
              key={identifier}
              href={href}
              className="flex flex-col gap-3 p-4 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="w-full aspect-square rounded bg-[#2d2a26] overflow-hidden relative">
                {art ? (
                  <Image src={art} alt={artistName} fill sizes="200px" quality={80} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#3a3632]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-medium truncate">{artistName}</p>
                {(venue || date) && (
                  <p className="text-[#5a564e] text-xs truncate">
                    {venue && date ? `${venue} · ${formatShowDate(date)}` : venue || formatShowDate(date)}
                  </p>
                )}
                <p className="text-[#8a8478] text-xs">
                  {likedCount > 0 ? `${likedCount} liked song${likedCount !== 1 ? 's' : ''}` : 'Following'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  const renderRecentlyPlayed = () => {
    if (recentlyPlayed.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <svg className="w-16 h-16 text-[#3a3632] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-white font-bold text-lg mb-2">No listening history</h3>
          <p className="text-[#8a8478] text-sm text-center">
            Songs you play will appear here. Listen to at least 30 seconds to track them.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1 px-4 pb-4">
        {recentlyPlayed.map((item) => (
          <div
            key={`${item.songId}-${item.playedAt}`}
            className="flex items-center gap-3 p-3 rounded hover:bg-white/10 transition-colors group"
          >
            {/* Album art - links to album */}
            <Link href={getAlbumHref(item.song)} className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-[#2d2a26] relative">
              {item.song.albumArt ? (
                <Image src={item.song.albumArt} alt={item.song.albumName || 'Album'} fill sizes="48px" quality={75} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#3a3632]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                  </svg>
                </div>
              )}
            </Link>

            {/* Play button (hidden, shows on hover/mobile always) */}
            <button
              onClick={() => {
                vibrate(BUTTON_PRESS);
                addToQueue(trackToItem(item.song));
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#d4a060] text-black opacity-0 md:group-hover:opacity-100 hover:scale-105 transition-all btn-touch"
              aria-label={`Play ${item.song.title}`}
            >
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            {/* Song info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={getAlbumHref(item.song)} className="text-white font-medium truncate hover:underline">
                  {item.song.title}
                </Link>
                <RecordingBadge song={item.song} />
              </div>
              <Link
                href={`/artists/${item.song.artistSlug}`}
                className="text-[#8a8478] text-sm hover:text-white hover:underline truncate block"
              >
                {item.song.artistName}
              </Link>
              <ShowContext song={item.song} />
            </div>

            {/* Play count and time */}
            <div className="text-right flex-shrink-0">
              <p className="text-[#8a8478] text-xs">
                {formatRelativeTime(item.playedAt)}
              </p>
              {item.playCount > 1 && (
                <p className="text-[#3a3632] text-xs">
                  {item.playCount} plays
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="text-[#8a8478] text-sm font-mono hidden md:block">
              {formatDuration(item.song.duration)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1c1a17] pb-[140px] md:pb-[90px] safe-top">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Your Library</h1>
          <p className="text-[#8a8478]">{wishlist.itemCount} liked songs</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 mb-4 border-b border-white/10">
        <button
          onClick={() => changeTab('songs')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'songs'
              ? 'text-white border-b-2 border-[#d4a060]'
              : 'text-[#8a8478] hover:text-white'
          }`}
        >
          Songs
        </button>
        <button
          onClick={() => changeTab('artists')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'artists'
              ? 'text-white border-b-2 border-[#d4a060]'
              : 'text-[#8a8478] hover:text-white'
          }`}
        >
          Artists
        </button>
        <button
          onClick={() => changeTab('albums')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'albums'
              ? 'text-white border-b-2 border-[#d4a060]'
              : 'text-[#8a8478] hover:text-white'
          }`}
        >
          Albums
        </button>
        <button
          onClick={() => changeTab('recent')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'recent'
              ? 'text-white border-b-2 border-[#d4a060]'
              : 'text-[#8a8478] hover:text-white'
          }`}
        >
          Recently Played
        </button>
      </div>

        {/* Tab content */}
        <div>
          {activeTab === 'songs' && renderSongs()}
          {activeTab === 'artists' && renderArtists()}
          {activeTab === 'albums' && renderAlbums()}
          {activeTab === 'recent' && renderRecentlyPlayed()}
        </div>
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1c1a17] pb-[140px] md:pb-[90px] safe-top">
        <div className="p-6 md:p-8">
          <div className="h-10 w-48 bg-[#2d2a26] rounded animate-pulse mb-2" />
          <div className="h-5 w-24 bg-[#2d2a26] rounded animate-pulse" />
        </div>
      </div>
    }>
      <LibraryPageInner />
    </Suspense>
  );
}
