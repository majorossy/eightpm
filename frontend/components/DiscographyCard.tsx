'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Album } from '@/lib/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface DiscographyCardProps {
  album: Album;
}

export default function DiscographyCard({ album }: DiscographyCardProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: '200px',
    freezeOnceVisible: true,
  });

  const isComingSoon = album.totalSongs === 0 && !album.coverArt;
  const hasCoverArt = !!album.coverArt;
  const tracks = album.trackChildren || [];

  // Stable pseudo-random rotation from album id
  const rotation = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < album.id.length; i++) {
      hash = ((hash << 5) - hash) + album.id.charCodeAt(i);
      hash |= 0;
    }
    return ((hash % 5) - 2) * 0.8; // -1.6 to 1.6 degrees
  }, [album.id]);

  const href = isComingSoon ? '#' : `/artists/${album.artistSlug}/album/${album.slug}`;

  return (
    <Link href={href} className="block group">
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={`relative rounded-sm overflow-hidden transition-all duration-300 ${
          isComingSoon
            ? 'opacity-60 cursor-default'
            : 'cursor-pointer hover:-translate-y-1'
        }`}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          if (!isComingSoon) {
            e.currentTarget.style.transform = `rotate(${rotation * 0.3}deg) translateY(-4px)`;
            e.currentTarget.style.boxShadow = '0 12px 32px color-mix(in srgb, black 40%, transparent)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = `rotate(${rotation}deg)`;
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {/* === Polaroid Section === */}
        <div
          className="relative p-2 pb-8"
          style={{ background: 'var(--cream)' }}
        >
          {/* Tape detail at top */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-3 rounded-sm z-10 opacity-60"
            style={{
              background: 'color-mix(in srgb, var(--quinary) 40%, transparent)',
              border: '1px solid color-mix(in srgb, var(--quinary) 20%, transparent)',
            }}
          />

          {/* Artwork area */}
          <div className={`relative aspect-square overflow-hidden ${isComingSoon ? 'grayscale' : ''}`}>
            {hasCoverArt && isIntersecting ? (
              <Image
                src={album.coverArt!}
                alt={album.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              /* Vinyl placeholder */
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--primary) 30%, var(--cream))' }}
              >
                <svg className="w-16 h-16 opacity-30" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <circle cx="12" cy="12" r="6.5" strokeDasharray="2 2" />
                </svg>
              </div>
            )}

            {/* Coming Soon overlay */}
            {isComingSoon && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div
                  className="transform -rotate-12 border-2 px-4 py-2"
                  style={{
                    borderColor: 'var(--secondary)',
                    background: 'color-mix(in srgb, var(--surface-sunken) 90%, transparent)',
                  }}
                >
                  <div className="text-lg font-bold tracking-wider" style={{ color: 'var(--secondary)', fontFamily: 'Georgia, serif' }}>
                    COMING SOON
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Album name in the thick bottom border */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-1.5 pt-1">
            <p
              className="text-xs font-medium truncate"
              style={{ color: 'var(--text-inverse)', fontFamily: 'Georgia, serif' }}
            >
              {album.name}
            </p>
            {album.releaseYear && (
              <p
                className="text-[10px] opacity-50"
                style={{ color: 'var(--text-inverse)', fontFamily: 'Georgia, serif' }}
              >
                {album.releaseYear}
              </p>
            )}
          </div>
        </div>

        {/* === Setlist Napkin Section === */}
        <div
          className="relative px-3 pt-3 pb-2"
          style={{
            background: 'color-mix(in srgb, var(--cream) 90%, var(--primary))',
            backgroundImage: `repeating-linear-gradient(
              180deg,
              transparent,
              transparent 23px,
              color-mix(in srgb, var(--secondary) 12%, transparent) 23px,
              color-mix(in srgb, var(--secondary) 12%, transparent) 24px
            )`,
            backgroundPosition: '0 8px',
          }}
        >
          {/* Header */}
          <div
            className="text-[10px] font-semibold tracking-wide uppercase mb-2 truncate"
            style={{
              color: 'var(--secondary)',
              fontFamily: 'Georgia, serif',
            }}
          >
            Tracklist &middot; {album.artistName}
          </div>

          {/* Track list */}
          {tracks.length > 0 ? (
            <div className="space-y-0">
              {tracks.map((track, i) => (
                <div
                  key={track.id}
                  className="flex items-baseline gap-1.5 leading-[24px]"
                  style={{
                    color: track.versionCount > 0
                      ? 'var(--text-inverse)'
                      : 'var(--text-tertiary)',
                  }}
                >
                  {/* Track number */}
                  <span
                    className="text-[10px] w-4 text-right flex-shrink-0 font-jb-mono"
                    style={{ opacity: 0.5 }}
                  >
                    {i + 1}
                  </span>

                  {/* Track name */}
                  <span className="text-xs truncate flex-1 font-jb-mono">
                    {track.name}
                  </span>

                  {/* Version count */}
                  <span
                    className="text-[10px] flex-shrink-0 font-jb-mono tabular-nums"
                    style={{
                      color: track.versionCount > 0
                        ? 'var(--secondary)'
                        : 'var(--text-tertiary)',
                    }}
                  >
                    {track.versionCount > 0 ? track.versionCount : '—'}
                  </span>
                </div>
              ))}

            </div>
          ) : (
            <div
              className="text-[10px] italic py-2 font-jb-mono"
              style={{ color: 'var(--text-tertiary)' }}
            >
              No tracks available
            </div>
          )}

          {/* Bottom torn edge effect */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--cream) 50%, transparent) 20%, transparent 40%, color-mix(in srgb, var(--cream) 40%, transparent) 60%, transparent 80%, color-mix(in srgb, var(--cream) 30%, transparent) 100%)',
              opacity: 0.3,
            }}
          />
        </div>
      </div>
    </Link>
  );
}
