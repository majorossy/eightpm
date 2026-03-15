'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import { Album } from '@/lib/api';
import { Track } from '@/lib/types';
import { usePlayer } from '@/context/PlayerContext';
import { VUMeter } from '@/components/AudioVisualizations';
import VenueLink from '@/components/VenueLink';
import { getCassetteTint } from '@/components/MiniCassette';

interface AlbumWithTracks extends Album {
  tracks: Track[];
}

export function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function CassetteVUMeter() {
  const { isPlaying, analyzerData } = usePlayer();
  if (!isPlaying) return null;
  return (
    <div className="z-10">
      <VUMeter volume={analyzerData.volume} size="normal" />
    </div>
  );
}

function Reel({ side, isPlaying }: { side: 'left' | 'right'; isPlaying: boolean }) {
  const spinClass = side === 'left' ? 'reel-spin-left' : 'reel-spin-right';
  const tapeInset = side === 'left' ? 'inset-1' : 'inset-3';

  return (
    <div
      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex-shrink-0 ${spinClass} ${isPlaying ? '' : 'reel-paused'}`}
      style={{
        background: 'var(--cassette-reel)',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: 'var(--cassette-border)',
      }}
    >
      <div
        className={`absolute ${tapeInset} rounded-full`}
        style={{ background: 'var(--cassette-tape)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0a0808]"
        style={{
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: 'var(--cassette-border)',
        }}
      >
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <div
            key={deg}
            className="absolute top-1/2 left-1/2 w-[7px] h-[1.5px]"
            style={{
              background: 'var(--text-subdued)',
              transform: `translate(-50%, -50%) rotate(${deg}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const CassetteTape = memo(function CassetteTape({
  album,
  isPlaying,
  artistImageUrl,
  tintIndex,
  tintStyle,
  children,
}: {
  album: AlbumWithTracks;
  isPlaying: boolean;
  artistImageUrl?: string;
  tintIndex?: number;
  tintStyle?: Record<string, string>;
  children?: React.ReactNode;
}) {
  const [imgError, setImgError] = useState(false);
  const year = album.showDate?.split('-')[0] || '';

  return (
    <div className="relative w-full transition-[background] duration-300" style={tintStyle ? tintStyle as React.CSSProperties : tintIndex != null ? getCassetteTint(tintIndex) as React.CSSProperties : undefined}>
      {/* Main cassette shell */}
      <div className="tape-shell">
        {/* Corner screws */}
        <div className="tape-screw" style={{ top: 8, left: 8 }} />
        <div className="tape-screw" style={{ top: 8, right: 8 }} />
        <div className="tape-screw" style={{ bottom: 8, left: 8 }} />
        <div className="tape-screw" style={{ bottom: 8, right: 8 }} />

        {/* Label area */}
        <div className="tape-label">
          {/* Header band */}
          <div
            className="h-6 sm:h-7 flex items-center justify-between px-4 text-[9px] sm:text-[10px] font-bold text-white tracking-wider"
            style={{ background: 'var(--cassette-header)' }}
          >
            <span>⚡ LIVE RECORDING ⚡</span>
            <span className="opacity-80 font-normal">Type II XL 90</span>
          </div>

          {/* Label content — cream background */}
          <div
            className="relative px-4 py-3 sm:py-4"
            style={{ background: 'linear-gradient(180deg, #faf4e8 0%, #f5ebda 50%, #efe1cc 100%)' }}
          >
            {/* Ruled lines */}
            <div className="absolute top-10 left-4 right-4 h-px" style={{ background: 'var(--cassette-label-ruled)' }} />
            <div className="absolute top-14 left-4 right-4 h-px" style={{ background: 'var(--cassette-label-ruled)', opacity: 0.5 }} />

            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[#1a0f08] text-lg sm:text-xl font-semibold font-serif truncate">
                  {album.name} ☮
                </div>
                <div className="text-[11px] sm:text-xs italic truncate" style={{ color: 'var(--cassette-label-text)' }}>
                  {album.artistName} — {album.showVenue ? <VenueLink venueName={album.showVenue} className="text-[var(--cassette-label-text)] hover:underline" truncateLength={40} /> : 'Live'}
                </div>
              </div>

              {/* Album cover polaroid */}
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                {/* Packing tape strip */}
                <div
                  className="absolute -top-0.5 h-3 sm:h-4 z-10"
                  style={{
                    left: '73%',
                    width: '40%',
                    background: 'linear-gradient(180deg, rgba(255, 248, 220, 0.92) 0%, rgba(255, 240, 195, 0.85) 100%)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    borderRadius: '1px',
                    transform: 'translateX(-50%) rotate(12deg)',
                  }}
                />
                <div className="absolute inset-0" style={{ transform: 'rotate(6deg)' }}>
                  {album.coverArt && !imgError ? (
                    <Image
                      src={album.coverArt}
                      alt={album.artistName}
                      fill
                      sizes="200px"
                      quality={85}
                      priority
                      className="object-cover rounded-sm"
                      style={{
                        border: '2px solid white',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)',
                      }}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div
                      className="w-full h-full bg-[#f5ebda] flex items-center justify-center rounded-sm"
                      style={{ border: '2px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)' }}
                    >
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#8b5a2b]" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <circle cx="12" cy="12" r="3" fill="currentColor"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stealie doodle */}
            <div className="absolute bottom-1 right-4 text-base opacity-30">💀</div>
          </div>

          {/* Bottom meta bar */}
          <div
            className="h-5 sm:h-6 flex items-center justify-center gap-3 text-[9px] sm:text-[10px] border-t"
            style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--cassette-label-muted)', borderColor: 'var(--cassette-label-ruled)' }}
          >
            <span>{album.totalTracks} tracks</span>
            <span style={{ color: 'var(--cassette-label-accent)' }}>✦</span>
            <span>{formatHours(album.totalDuration)}</span>
            <span style={{ color: 'var(--cassette-label-accent)' }}>✦</span>
            <span>archive</span>
          </div>
        </div>

        {/* Tape body — track list window */}
        {children && (
          <div className="tape-body">
            <div className="tape-track-scroll">
              {children}
            </div>
          </div>
        )}

        {/* Artist logo sticker on shell */}
        {artistImageUrl && (
          <div
            className="absolute bottom-[88px] left-8 w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-white shadow-lg z-10"
            style={{ transform: 'rotate(-8deg)' }}
          >
            <Image
              src={artistImageUrl}
              alt={album.artistName}
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
        )}

        {/* Reels + VU meter */}
        <div className="tape-reels">
          <div className="flex-1 flex justify-center">
            <Reel side="left" isPlaying={isPlaying} />
          </div>
          <CassetteVUMeter />
          <div className="flex-1 flex justify-center">
            <Reel side="right" isPlaying={isPlaying} />
          </div>
        </div>

        {/* Side indicators */}
        <div className="flex items-center justify-between px-3 pb-1 relative z-1">
          <div className="flex items-center gap-1.5 text-[9px] tracking-wider" style={{ color: 'var(--text-subdued)' }}>
            <div
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: isPlaying ? 'var(--cassette-glow)' : 'var(--text-subdued)',
                boxShadow: isPlaying ? '0 0 10px var(--cassette-glow)' : 'none',
              }}
            />
            SIDE A
          </div>
          <div className="flex items-center gap-1.5 text-[9px] tracking-wider" style={{ color: 'var(--text-subdued)' }}>
            SIDE B
            <div
              className="w-2 h-2 rounded-full"
              style={{ border: '1px solid var(--text-subdued)' }}
            />
          </div>
        </div>
      </div>

      {/* Fire glow under cassette */}
      <div className="cassette-glow" />
    </div>
  );
});
