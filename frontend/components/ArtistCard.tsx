'use client';

// ArtistCard - displays an artist card

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Artist } from '@/lib/api';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: '100px', // Start loading 100px before visible
    freezeOnceVisible: true,
  });

  const hasValidImage = artist.image && !artist.image.includes('default');

  return (
    <Link href={`/artists/${artist.slug}`}>
      <div className="group p-4 bg-[var(--bg-card)] rounded-lg hover:bg-[var(--bg-elevated)] transition-all duration-300 cursor-pointer">
        {/* Artist avatar - circular */}
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className="relative aspect-square mb-4 rounded-full overflow-hidden shadow-lg"
        >
          {hasValidImage ? (
            <>
              {/* Blur placeholder - shown until image loads */}
              <div
                className={`absolute inset-0 bg-[var(--bg-elevated)] transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {/* Animated shimmer effect for dark theme */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--bg-elevated)] to-transparent animate-shimmer" />
              </div>

              {/* Actual image - only load when in viewport */}
              {isIntersecting && (
                <Image
                  src={artist.image || '/images/default-artist.jpg'}
                  alt={artist.name || 'Artist'}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
                  quality={80}
                  onLoad={() => setImageLoaded(true)}
                  className={`object-cover transition-opacity duration-500 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ objectPosition: 'left center' }}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center">
              <span className="font-bold text-5xl text-[var(--text-subdued)]">
                {artist.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Artist info */}
        <h3 className="font-semibold text-[var(--text)] truncate mb-1">
          {artist.name}
        </h3>
        <p className="text-sm text-[var(--text-dim)]">
          Artist
        </p>
      </div>
    </Link>
  );
}
