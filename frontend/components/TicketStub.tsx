'use client';

// TicketStub — vintage concert ticket with perforation, stripe, and album art.
// Renders a ticket-shaped card; falls back to a vinyl icon when no art.
// All colors derive from theme palette tokens — zero hardcoded hex.

import { useState } from 'react';
import Image from 'next/image';

interface TicketStubProps {
  coverArt?: string;
  albumName?: string;
  size?: number;          // Controls width — height derives from ticket aspect ratio
  trackCount?: number;
  className?: string;
  /** When set, renders a small chevron arrow on the left spine stripe. */
  chevronDirection?: 'left' | 'right';
}

export default function TicketStub({ coverArt, albumName, size = 48, trackCount, className = '', chevronDirection }: TicketStubProps) {
  const [hovered, setHovered] = useState(false);

  const w = size;
  const h = Math.round(size * 1.5);
  const isSmall = size <= 52;

  // Proportional sizing
  const artSize = Math.round(w * 0.82);
  const artTop = Math.round(h * 0.02);
  const stripeW = Math.max(3, Math.round(w * 0.065));
  const labelTop = artTop + artSize + 1;
  const tearH = h - labelTop;
  const radius = isSmall ? 2 : 3;

  // Tear-off label: album name preferred, then track count, then star
  const tearLabel = albumName || (trackCount != null ? `${trackCount} trk` : null);

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: w, height: h, cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-full h-full relative overflow-hidden"
        style={{
          borderRadius: radius,
          background: `linear-gradient(175deg, var(--cream), color-mix(in srgb, var(--cream) 82%, var(--quinary)))`,
          border: '1px solid color-mix(in srgb, var(--primary) 18%, transparent)',
          boxShadow: hovered
            ? `0 4px 12px color-mix(in srgb, black 45%, transparent),
               inset 0 0 0 0.5px color-mix(in srgb, white 10%, transparent)`
            : `0 1px 4px color-mix(in srgb, black 30%, transparent),
               inset 0 0 0 0.5px color-mix(in srgb, white 8%, transparent)`,
          transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
          transform: hovered ? 'translateY(-3px) rotate(-2deg)' : 'none',
        }}
      >
        {/* Left stripe — repeating coral/accent bars */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: stripeW,
            background: `repeating-linear-gradient(
              180deg,
              var(--secondary),
              var(--secondary) 2.5px,
              color-mix(in srgb, var(--secondary) 30%, transparent) 2.5px,
              color-mix(in srgb, var(--secondary) 30%, transparent) 4px
            )`,
          }}
        />

        {/* Album art — hard-edged, no border-radius */}
        <div
          className="absolute left-1/2 overflow-hidden"
          style={{
            top: artTop,
            width: artSize,
            height: artSize,
            transform: 'translateX(-47%)',
            border: '1px solid color-mix(in srgb, var(--primary) 22%, transparent)',
            imageRendering: 'auto',
          }}
        >
          {coverArt ? (
            <Image
              src={coverArt}
              alt=""
              width={artSize}
              height={artSize}
              quality={75}
              className="w-full h-full object-cover"
              style={{ imageRendering: 'auto' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
            >
              <VinylIcon size={Math.round(artSize * 0.45)} />
            </div>
          )}
        </div>

        {/* Tear-off section — album name or track count */}
        <div
          className="absolute left-0 right-0 flex items-start justify-center overflow-hidden"
          style={{ top: labelTop, height: tearH, padding: `1px ${stripeW + 1}px 0` }}
        >
          {tearLabel ? (
            <span
              className="font-jb-mono font-bold text-center w-full"
              style={{
                fontSize: Math.max(7, Math.round(8 * (size / 48))),
                color: 'color-mix(in srgb, var(--primary) 85%, transparent)',
                lineHeight: 1.15,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
                wordBreak: 'break-word' as const,
              }}
            >
              {tearLabel}
            </span>
          ) : (
            <div
              style={{
                fontSize: Math.max(6, Math.round(7 * (size / 48))),
                color: 'color-mix(in srgb, var(--primary) 22%, transparent)',
              }}
            >
              ★
            </div>
          )}
        </div>

        {/* Paper highlight — sharp top edge */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: '40%',
            background: 'linear-gradient(180deg, color-mix(in srgb, white 8%, transparent), transparent)',
            borderRadius: `${radius}px ${radius}px 0 0`,
          }}
        />
      </div>

      {/* Chevron — positioned just right of the ticket, vertically centered */}
      {chevronDirection && (
        <svg
          className="absolute pointer-events-none"
          style={{
            width: isSmall ? 6 : 8,
            height: isSmall ? 9 : 12,
            top: '50%',
            right: isSmall ? -7 : -10,
            transform: `translateY(-50%) scaleX(${chevronDirection === 'left' ? -1 : 1})`,
            transition: 'transform 0.2s ease-out',
          }}
          viewBox="0 0 6 10"
          fill="none"
          stroke="var(--text-tertiary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1L5 5L1 9" />
        </svg>
      )}
    </div>
  );
}

// Minimal vinyl disc icon for empty state
function VinylIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: 'var(--primary)', opacity: 0.25 }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
