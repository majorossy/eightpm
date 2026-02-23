'use client';

// AlbumCard - displays an album card (Jamify/Spotify style only)

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Album } from '@/lib/api';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
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
          ? 'bg-[#1a1715] cursor-default'
          : 'bg-[#252220] hover:bg-[#2d2a26] hover:scale-105 cursor-pointer'
      }`}>
        {/* Album artwork with play button overlay */}
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className="relative aspect-square overflow-hidden shadow-lg"
        >
          {album.coverArt ? (
            <>
              {/* Blur placeholder - shown until image loads */}
              <div
                className={`absolute inset-0 bg-[#2d2a26] transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {/* Animated shimmer effect for dark theme */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#333333] to-transparent animate-shimmer" />
              </div>

              {/* Actual image - only load when in viewport */}
              {isIntersecting && (
                <Image
                  src={album.coverArt || '/images/default-album.jpg'}
                  alt={album.name || 'Album cover'}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
                  quality={80}
                  onLoad={() => setImageLoaded(true)}
                  className={`object-cover transition-opacity duration-500 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  } ${isComingSoon ? 'grayscale opacity-30' : ''}`}
                />
              )}
            </>
          ) : (
            <div className={`w-full h-full bg-[#2d2a26] flex items-center justify-center ${
              isComingSoon ? 'opacity-30' : ''
            }`}>
              <svg className="w-16 h-16 text-[#3a3632]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </div>
          )}

          {/* Coming Soon overlay - like a sold-out ticket stamp */}
          {isComingSoon && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Ticket-style stamp */}
                <div
                  className="transform -rotate-12 border-4 border-[#d4a060] bg-[#1a1715]/90 px-6 py-3 backdrop-blur-sm"
                  style={{
                    boxShadow: '0 4px 20px rgba(212, 160, 96, 0.3)',
                  }}
                >
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold tracking-wider text-[#d4a060]"
                      style={{
                        fontFamily: 'Georgia, serif',
                        textShadow: '0 0 10px rgba(212, 160, 96, 0.5)',
                      }}
                    >
                      COMING
                    </div>
                    <div
                      className="text-2xl font-bold tracking-wider text-[#d4a060] -mt-1"
                      style={{
                        fontFamily: 'Georgia, serif',
                        textShadow: '0 0 10px rgba(212, 160, 96, 0.5)',
                      }}
                    >
                      SOON
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Album info */}
        <div className="p-2">
          <div className={`text-sm font-medium truncate ${
            isComingSoon ? 'text-[#4a4540]' : 'text-white'
          }`}>
            {album.name}
          </div>
          <div className={`text-xs truncate ${
            isComingSoon ? 'text-[#3a3530]' : 'text-[#8a8478]'
          }`}>
            {album.showDate && <span>{album.showDate} </span>}
            <span>{isComingSoon ? 'No recordings yet' : `${album.totalTracks} ${album.totalTracks === 1 ? 'track' : 'tracks'}`}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
