'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import { Album } from '@/lib/api';
import { Track } from '@/lib/types';
import { usePlayer } from '@/context/PlayerContext';
import { VUMeter } from '@/components/AudioVisualizations';
import VenueLink from '@/components/VenueLink';

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
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <VUMeter volume={analyzerData.volume} size="normal" />
    </div>
  );
}

export const CassetteTape = memo(function CassetteTape({
  album,
  isPlaying,
  artistImageUrl,
}: {
  album: AlbumWithTracks;
  isPlaying: boolean;
  artistImageUrl?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const year = album.showDate?.split('-')[0] || '';

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
            <div className="absolute top-10 left-3 right-3 h-px" style={{ background: 'var(--cassette-label-ruled)' }} />
            <div className="absolute top-14 left-3 right-3 h-px" style={{ background: 'var(--cassette-label-ruled)', opacity: 0.5 }} />

            <div className="flex justify-between items-start">
              <div>
                <div className="text-[#1a0f08] text-base sm:text-lg font-semibold font-serif truncate max-w-[180px] sm:max-w-[220px]">
                  {album.name} ☮
                </div>
                <div className="text-[10px] sm:text-xs italic truncate max-w-[180px] sm:max-w-[220px]" style={{ color: 'var(--cassette-label-text)' }}>
                  {album.artistName} — {album.showVenue ? <VenueLink venueName={album.showVenue} className="text-[var(--cassette-label-text)] hover:underline" truncateLength={24} /> : 'Live'}
                </div>
              </div>
              <div className="flex items-center gap-2 relative">
                {/* Year display */}
                <div className="text-sm sm:text-base italic font-serif" style={{ color: 'var(--cassette-label-subtle)' }}>
                  '{year.slice(-2)}
                </div>
              </div>
            </div>

            {/* Stealie doodle */}
            <div className="absolute bottom-1 right-3 text-base opacity-30">💀</div>
          </div>

          {/* Bottom bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-4 sm:h-5 flex items-center justify-center gap-3 text-[8px] sm:text-[9px] border-t"
            style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--cassette-label-muted)', borderColor: 'var(--cassette-label-ruled)' }}
          >
            <span>{album.totalTracks} tracks</span>
            <span style={{ color: 'var(--cassette-label-accent)' }}>✦</span>
            <span>{formatHours(album.totalDuration)}</span>
            <span style={{ color: 'var(--cassette-label-accent)' }}>✦</span>
            <span>archive</span>
          </div>
        </div>

        {/* Album cover art polaroid stamp (upper right) */}
        {album.coverArt && !imgError ? (
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
                onError={() => setImgError(true)}
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
              sizes="40px"
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
          <CassetteVUMeter />

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
});
