'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Artist, Album } from '@/lib/api';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { FestivalSortProvider, useFestivalSort } from '@/context/FestivalSortContext';
import FestivalHero from '@/components/FestivalHero';
import SongsTable from '@/components/SongsTable';

interface ArtistWithAlbums extends Artist {
  albums: Album[];
}

interface ArtistsPageContentProps {
  artists: ArtistWithAlbums[];
}

interface AlbumWithArtist extends Album {
  artist: string;
  artistSlug: string;
  artistImage: string;
  color: string;
  isFirst: boolean;
}

// Artist color palette - distinct colors for easy visual identification
const ARTIST_COLORS: Record<string, string> = {
  'sts9': '#ff6b35',                    // Vibrant orange
  'disco-biscuits': '#4a90e2',          // Bright blue
  'railroad-earth': '#50c878',          // Emerald green
  'phish': '#e74c3c',                   // Red
  'grateful-dead': '#9b59b6',           // Purple
  'string-cheese-incident': '#f39c12',  // Golden yellow
  'umphrey-s-mcgee': '#1abc9c',         // Turquoise
  'widespread-panic': '#e91e63',        // Pink/magenta
  'moe': '#3498db',                     // Sky blue
  'leftover-salmon': '#ff8c42',         // Coral
  'yonder-mountain-string-band': '#27ae60', // Green
  'tea-leaf-green': '#16a085',          // Teal
  'keller-williams': '#f1c40f',         // Yellow
  'lotus': '#8e44ad',                   // Dark purple
  'the-new-deal': '#e67e22',            // Orange
  'big-gigantic': '#c0392b',            // Dark red
  'papadosio': '#2ecc71',               // Light green
  'dopapod': '#d35400',                 // Dark orange
  'aqueous': '#3498db',                 // Blue
  'pigeons-playing-ping-pong': '#e84393', // Hot pink
};

// Convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  // Handle both hex (#ff0000) and hsl formats
  if (hex.startsWith('hsl')) {
    return hex.replace('hsl', 'hsla').replace(')', `, ${opacity})`);
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Generate a color based on artist slug if not in palette
const getArtistColor = (slug: string): string => {
  if (ARTIST_COLORS[slug]) {
    return ARTIST_COLORS[slug];
  }

  // Generate a consistent color from the slug
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Create vibrant colors
  const hue = Math.abs(hash % 360);
  const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
  const lightness = 55 + (Math.abs(hash >> 8) % 15); // 55-70%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Internal component that uses the sorted artists from context
function ArtistsContentInner() {
  const { sortedArtists } = useFestivalSort();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  const scrollToArtists = () => {
    document.getElementById('artists-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Flatten albums with artist metadata - uses SORTED artists
  const allAlbums = useMemo(() => {
    return sortedArtists.flatMap((artist) => {
      const color = getArtistColor(artist.slug);
      // Need to get albums from the artist object
      const artistWithAlbums = artist as any; // Type assertion since sortedArtists has stats, not albums
      const albums = artistWithAlbums.albums || [];
      return albums.map((album: Album, idx: number) => ({
        ...album,
        artist: artist.name,
        artistSlug: artist.slug,
        artistImage: artistWithAlbums.image,
        color,
        isFirst: idx === 0,
      } as AlbumWithArtist));
    });
  }, [sortedArtists]);

  return (
    <div className="pb-8 max-w-[1800px] mx-auto">
      {/* Festival Hero */}
      <FestivalHero
        artists={sortedArtists.map((a: any) => {
          const mapped = {
            name: a.name,
            slug: a.slug,
            songCount: a.songCount ?? a.albums.reduce((sum: number, album: { totalSongs: number }) => sum + album.totalSongs, 0),
            albumCount: a.albumCount ?? a.albums.length,
            totalShows: a.totalShows,
            mostPlayedTrack: a.mostPlayedTrack,
            totalRecordings: a.totalRecordings,
            totalHours: a.totalHours,
            totalVenues: a.totalVenues,
            formationYear: a.formationYear,
          };
          return mapped;
        })}
        onStartListening={scrollToArtists}
      />

      {/* Songs Table - all artists */}
      <div className="px-2 sm:px-4 md:px-8 pt-4 md:pt-6 mx-auto max-w-[1400px]">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
          Tracks
        </h2>
        <p className="text-sm text-secondary mb-4 text-center">
          Studio compositions across all artists, sorted by most recorded
        </p>
        <SongsTable />
      </div>

      {/* All albums in continuous flow */}
      <div id="artists-content" className="px-2 sm:px-4 md:px-8 pt-4 md:pt-6 mx-auto max-w-[1400px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {allAlbums.map((album, index) => {
            const isComingSoon = album.totalSongs === 0 && !album.coverArt;
            return (
            <div
              key={`${album.artistSlug}-${album.id}`}
              style={{
                transition: prefersReducedMotion ? 'none' : 'transform 0.4s ease-out, opacity 0.4s ease-out',
              }}
            >
              <Link
                href={isComingSoon ? '#' : `/artists/${album.artistSlug}/album/${album.slug}`}
                className="group"
              >
              <div
                className={`rounded-lg overflow-hidden relative bg-[var(--bg-card)] transition-transform duration-200 w-full ${
                  isComingSoon ? 'cursor-default' : 'hover:scale-105'
                }`}
                style={{
                  border: `2px solid ${hexToRgba(album.color, isComingSoon ? 0.3 : 0.6)}`,
                  boxShadow: isComingSoon
                    ? `0 0 8px ${hexToRgba(album.color, 0.1)}`
                    : `0 0 16px ${hexToRgba(album.color, 0.25)}, 0 0 4px ${hexToRgba(album.color, 0.4)}`,
                }}
              >
                {/* Corner badge - Artist avatar */}
                <div
                  className="absolute top-2 left-2 z-10 rounded-full p-1 bg-[var(--bg)] shadow-lg"
                >
                  {album.artistImage && !album.artistImage.includes('default') ? (
                    <Image
                      src={album.artistImage}
                      alt={album.artist || 'Artist'}
                      width={24}
                      height={24}
                      quality={75}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-[var(--text)]">
                        {album.artist.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Album artwork */}
                <div className="relative aspect-square">
                  {album.coverArt ? (
                    <Image
                      src={album.coverArt}
                      alt={album.name || 'Album cover'}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
                      quality={80}
                      className={`object-cover ${isComingSoon ? 'grayscale opacity-30' : ''}`}
                    />
                  ) : (
                    <div className={`w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center ${
                      isComingSoon ? 'opacity-30' : ''
                    }`}>
                      <svg className="w-10 h-10 text-[var(--text-subdued)]" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <circle cx="12" cy="12" r="3" fill="currentColor"/>
                      </svg>
                    </div>
                  )}

                  {/* Coming Soon overlay - compact version */}
                  {isComingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="transform -rotate-12 border-2 border-[var(--secondary)] bg-[var(--bg)]/90 px-3 py-1.5 backdrop-blur-sm"
                        style={{
                          boxShadow: '0 2px 12px var(--secondary-muted)',
                        }}
                      >
                        <div className="text-center">
                          <div
                            className="text-xs font-bold tracking-wider text-[var(--secondary)]"
                            style={{
                              fontFamily: 'Georgia, serif',
                            }}
                          >
                            COMING
                          </div>
                          <div
                            className="text-xs font-bold tracking-wider text-[var(--secondary)] -mt-0.5"
                            style={{
                              fontFamily: 'Georgia, serif',
                            }}
                          >
                            SOON
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Artist name on first album - solid color label */}
                  {album.isFirst && (
                    <div
                      className="absolute bottom-0 left-0 right-0 py-2 px-2 text-center text-[10px] font-bold leading-tight"
                      style={{
                        backgroundColor: album.color,
                        color: 'white',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {album.artist}
                    </div>
                  )}
                </div>

                {/* Album info */}
                <div className="p-2">
                  <div className={`text-sm font-medium truncate ${
                    isComingSoon ? 'text-[var(--text-subdued)]' : 'text-[var(--text)]'
                  }`}>
                    {album.name}
                  </div>
                  <div className={`text-xs truncate ${
                    isComingSoon ? 'text-[var(--text-subdued)]' : 'text-[var(--text-dim)]'
                  }`}>
                    {isComingSoon
                      ? 'No recordings yet'
                      : `${album.totalTracks} ${album.totalTracks === 1 ? 'track' : 'tracks'}`
                    }
                  </div>
                </div>
              </div>
            </Link>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Main export - wraps content with FestivalSortProvider
export default function ArtistsPageContent({ artists }: ArtistsPageContentProps) {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    // Home page - no breadcrumbs needed
    setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Map artists to include stats for sorting
  const artistsWithStats = artists.map(a => ({
    ...a,
    name: a.name,
    slug: a.slug,
    songCount: a.songCount ?? a.albums.reduce((sum, album) => sum + album.totalSongs, 0),
    albumCount: a.albumCount ?? a.albums.length,
    totalShows: a.totalShows,
    mostPlayedTrack: a.mostPlayedTrack,
    totalRecordings: a.totalRecordings,
    totalHours: a.totalHours,
    totalVenues: a.totalVenues,
    formationYear: a.formationYear,
  }));

  return (
    <FestivalSortProvider artists={artistsWithStats}>
      <ArtistsContentInner />
    </FestivalSortProvider>
  );
}
