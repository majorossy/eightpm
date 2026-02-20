'use client';

// PodcastCard - displays a podcast card

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Podcast } from '@/lib/api';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface PodcastCardProps {
  podcast: Podcast;
}

export default function PodcastCard({ podcast }: PodcastCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: '100px', // Start loading 100px before visible
    freezeOnceVisible: true,
  });

  const hasValidImage = podcast.image && !podcast.image.includes('default');

  return (
    <Link href={`/podcasts/${podcast.slug}`}>
      <div className="group p-4 bg-[var(--bg-card)] rounded-lg hover:bg-[var(--bg-elevated)] transition-all duration-300 cursor-pointer">
        {/* Podcast cover art - square */}
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className="relative aspect-square mb-4 rounded-lg overflow-hidden shadow-lg"
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
                  src={podcast.image || '/images/default-podcast.jpg'}
                  alt={podcast.name || 'Podcast'}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
                  quality={80}
                  onLoad={() => setImageLoaded(true)}
                  className={`object-cover transition-opacity duration-500 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center">
              <span className="font-bold text-5xl text-[var(--text-subdued)]">
                {podcast.name.charAt(0)}
              </span>
            </div>
          )}
          {/* Play button overlay */}
          <div className="absolute bottom-2 right-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button className="w-12 h-12 bg-[var(--neon-pink)] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:brightness-110 transition-all">
              <svg className="w-5 h-5 text-[var(--bg)] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Podcast info */}
        <h3 className="font-semibold text-[var(--text)] truncate mb-1">
          {podcast.name}
        </h3>
        <p className="text-sm text-[var(--text-dim)]">
          {podcast.episodeCount ? `${podcast.episodeCount} episodes` : 'Podcast'}
        </p>
      </div>
    </Link>
  );
}
