'use client';

// JewelCase — CD jewel case with transparent plastic shell, spine, and light sweep.
// Renders album art inside a realistic case; falls back to a vinyl icon when no art.
// All colors derive from theme palette tokens — zero hardcoded hex.

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface JewelCaseProps {
  coverArt?: string;
  size?: number;
  /** Fill parent container responsively. Uses ResizeObserver for proportional scaling. */
  fill?: boolean;
  trackCount?: number;
  className?: string;
}

export default function JewelCase({ coverArt, size = 48, fill = false, trackCount, className = '' }: JewelCaseProps) {
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredSize, setMeasuredSize] = useState(112);

  // In fill mode, observe container width for proportional scaling
  useEffect(() => {
    if (!fill || !containerRef.current) return;
    const el = containerRef.current;
    const update = () => { const w = el.clientWidth; if (w > 0) setMeasuredSize(w); };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fill]);

  const effectiveSize = fill ? measuredSize : size;

  // Proportions that stay visible even at small sizes (38-48px).
  // At small sizes we use fixed minimums; at large sizes we scale from 112px ref.
  const s = effectiveSize / 112;
  const isSmall = effectiveSize <= 52;

  const spineW   = isSmall ? 5  : Math.round(7 * s);
  const spineLeft = isSmall ? -3 : Math.round(-4 * s);
  const inset    = isSmall ? 2  : Math.round(3 * s);
  const radius   = isSmall ? 3  : Math.round(4 * s);
  const spineR   = isSmall ? 2  : Math.round(2 * s);

  // Shell/shine intensities — cranked up for small sizes
  const shellWhiteTop    = isSmall ? 14 : 7;
  const shellWhiteMid    = isSmall ? 4  : 1;
  const shellDarkBot     = isSmall ? 15 : 8;
  const shellBorder      = isSmall ? 22 : 12;
  const shellInsetTop    = isSmall ? 18 : 10;
  const shineStripe      = isSmall ? 28 : 15;
  const shineIdle        = isSmall ? 0.12 : 0.06;
  const shineHover       = isSmall ? 0.32 : 0.18;

  const badgeFontSize = Math.max(7, Math.round(8 * s));
  const badgeBottom   = isSmall ? 2 : Math.round(6 * s);
  const badgePadH     = Math.max(4, Math.round(6 * s));

  return (
    <div
      ref={containerRef}
      className={`relative flex-shrink-0 ${className}`}
      style={{
        ...(fill ? { width: '100%', aspectRatio: '1' } : { width: size, height: size }),
        perspective: 400,
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Inner wrapper — tilts on hover */}
      <div
        className="w-full h-full relative"
        style={{
          transition: 'transform 0.3s',
          transform: hovered ? 'rotateY(-6deg) scale(1.05)' : 'none',
        }}
      >
        {/* Spine edge (left side) */}
        <div
          className="absolute"
          style={{
            left: spineLeft,
            top: inset,
            bottom: inset,
            width: spineW,
            background: `linear-gradient(90deg,
              color-mix(in srgb, var(--surface-sunken) 80%, black),
              var(--surface-card),
              color-mix(in srgb, var(--surface-sunken) 80%, black)
            )`,
            borderRadius: `${spineR}px 0 0 ${spineR}px`,
            boxShadow: `-2px 0 4px color-mix(in srgb, black 50%, transparent)`,
            zIndex: 4,
          }}
        />

        {/* Album art fills the booklet */}
        {coverArt ? (
          <div
            className="absolute overflow-hidden"
            style={{
              inset: inset,
              borderRadius: spineR,
              zIndex: 1,
            }}
          >
            <Image
              src={coverArt}
              alt=""
              {...(fill
                ? { fill: true, sizes: '(max-width: 768px) 50vw, 200px' }
                : { width: effectiveSize, height: effectiveSize }
              )}
              quality={60}
              className={`object-cover ${fill ? '' : 'w-full h-full'}`}
            />
          </div>
        ) : (
          <div
            className="absolute flex items-center justify-center"
            style={{
              inset: inset,
              borderRadius: spineR,
              background: `linear-gradient(135deg, var(--surface-elevated), var(--surface-card))`,
              zIndex: 1,
            }}
          >
            <VinylIcon size={Math.round(effectiveSize * 0.35)} />
          </div>
        )}

        {/* Transparent plastic shell overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: radius,
            background: `linear-gradient(135deg,
              color-mix(in srgb, white ${shellWhiteTop}%, transparent),
              color-mix(in srgb, white ${shellWhiteMid}%, transparent),
              color-mix(in srgb, var(--primary) ${shellDarkBot}%, transparent)
            )`,
            border: `1px solid color-mix(in srgb, white ${shellBorder}%, transparent)`,
            boxShadow: `0 3px 12px color-mix(in srgb, black 45%, transparent),
                         inset 0 1px 0 color-mix(in srgb, white ${shellInsetTop}%, transparent)`,
            zIndex: 3,
          }}
        />

        {/* Light sweep — brighter on hover */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: radius,
            background: `linear-gradient(120deg,
              transparent 25%,
              color-mix(in srgb, white ${shineStripe}%, transparent) 45%,
              transparent 60%
            )`,
            opacity: hovered ? shineHover : shineIdle,
            transition: 'opacity 0.3s',
            zIndex: 5,
          }}
        />

        {/* Track count badge */}
        {trackCount != null && (
          <span
            className="absolute font-jb-mono font-semibold pointer-events-none"
            style={{
              bottom: badgeBottom,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: badgeFontSize,
              color: 'var(--text-primary)',
              background: 'color-mix(in srgb, var(--player-surface-deep) 85%, transparent)',
              padding: `2px ${badgePadH}px`,
              borderRadius: 3,
              backdropFilter: 'blur(4px)',
              zIndex: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {trackCount} trk
          </span>
        )}
      </div>
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
      style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
