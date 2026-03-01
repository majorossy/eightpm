'use client';

// AlbumCard - displays an album card (Jamify/Spotify style only)

import Link from 'next/link';
import { Album } from '@/lib/api';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import JewelCase from '@/components/JewelCase';

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: '100px', // Start loading 100px before visible
    freezeOnceVisible: true,
  });

  // Check if album has no song versions (coming soon)
  // Albums with artwork are not coming soon even if totalSongs is 0
  const isComingSoon = album.totalSongs === 0 && !album.coverArt;

  // Jamify/Spotify style - rounded cards with hover play button
  return (
    <Link href={isComingSoon ? '#' : `/artists/${album.artistSlug}/album/${album.slug}`}>
      <div className={`group rounded-lg overflow-hidden transition-all duration-300 ${
        isComingSoon
          ? 'bg-surface-sunken cursor-default'
          : 'bg-surface-card hover:bg-surface-elevated hover:scale-105 cursor-pointer'
      }`}>
        {/* Album artwork — Jewel Case */}
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className="relative aspect-square p-3"
        >
          <div className={isComingSoon ? 'grayscale opacity-30' : ''}>
            <JewelCase
              coverArt={isIntersecting ? album.coverArt : undefined}
              fill
              trackCount={album.trackCount}
            />
          </div>

          {/* Coming Soon overlay */}
          {isComingSoon && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="transform -rotate-12 border-4 border-accent bg-surface-sunken/90 px-6 py-3 backdrop-blur-sm"
                style={{ boxShadow: '0 4px 20px var(--accent-glow-subtle)' }}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold tracking-wider text-accent" style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 10px var(--accent-glow)' }}>
                    COMING
                  </div>
                  <div className="text-2xl font-bold tracking-wider text-accent -mt-1" style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 10px var(--accent-glow)' }}>
                    SOON
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Album info */}
        <div className="p-2">
          <div className={`text-sm font-medium truncate ${
            isComingSoon ? 'text-tertiary' : 'text-white'
          }`}>
            {album.name}
          </div>
          {(album.releaseYear || album.showDate) && (
            <div className={`text-xs truncate ${
              isComingSoon ? 'text-tertiary' : 'text-secondary'
            }`}>
              {album.releaseYear || album.showDate}
            </div>
          )}
          {album.trackCount && (
            <div className={`text-xs truncate ${
              isComingSoon ? 'text-tertiary' : 'text-secondary'
            }`}>
              {album.trackCount} {album.trackCount === 1 ? 'track' : 'tracks'}
            </div>
          )}
          <div className={`text-xs truncate ${
            isComingSoon ? 'text-tertiary' : 'text-secondary'
          }`}>
            <span>{isComingSoon ? 'No recordings yet' : `${album.totalSongs.toLocaleString()} ${album.totalSongs === 1 ? 'song' : 'songs'}`}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
