'use client';

// CassetteTape — miniature cassette tape indicator for queue tracks.
// Shows cover art + artist label on a vintage tape shell with reels.
// All colors derive from theme palette tokens — zero hardcoded hex.

import { useState } from 'react';
import Image from 'next/image';

interface CassetteTapeProps {
  coverArt?: string;
  label?: string;           // Single line (artist name)
  size?: number;            // Controls height — width derives from cassette ratio
  className?: string;
}

export default function CassetteTape({ coverArt, label, size = 48, className = '' }: CassetteTapeProps) {
  const [hovered, setHovered] = useState(false);

  const h = size;
  const w = Math.round(size * 1.55);
  const isSmall = size <= 52;
  const s = size / 90; // Scale factor from 90px reference

  // Proportional sizing
  const labelH = Math.round(h * 0.44);
  const labelTop = Math.round(4 * s);
  const labelSide = Math.round(8 * s);
  const artW = Math.round(40 * s);
  const windowW = Math.round(64 * s);
  const windowH = Math.round(24 * s);
  const windowBottom = Math.round(10 * s);
  const reelSize = Math.round(14 * s);
  const reelGap = Math.round(18 * s);
  const screwSize = Math.max(3, Math.round(5 * s));
  const screwInset = Math.round(5 * s);
  const radius = isSmall ? 3 : 5;
  const fontSize = Math.max(6, Math.round(8 * s));
  const lineSpacing = Math.round(8 * s);
  const lineThin = Math.round(9 * s);

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
          background: `linear-gradient(180deg,
            var(--cream),
            color-mix(in srgb, var(--cream) 90%, var(--quinary)),
            color-mix(in srgb, var(--cream) 75%, var(--quinary))
          )`,
          border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)',
          boxShadow: hovered
            ? `0 3px 12px color-mix(in srgb, black 40%, transparent),
               inset 0 1px 0 color-mix(in srgb, white 30%, transparent)`
            : `0 1px 6px color-mix(in srgb, black 25%, transparent),
               inset 0 1px 0 color-mix(in srgb, white 25%, transparent)`,
          transition: 'transform 0.25s ease-out, box-shadow 0.25s ease-out',
          transform: hovered ? 'translateY(-3px) rotate(-1deg)' : 'none',
        }}
      >
        {/* Label area — art + text */}
        <div
          className="absolute flex overflow-hidden"
          style={{
            top: labelTop,
            left: labelSide,
            right: labelSide,
            height: labelH,
            borderRadius: 2,
            border: '1px solid color-mix(in srgb, var(--primary) 10%, transparent)',
          }}
        >
          {/* Album art strip */}
          <div
            className="flex-shrink-0 overflow-hidden"
            style={{
              width: artW,
              height: '100%',
              borderRight: '1px solid color-mix(in srgb, var(--primary) 10%, transparent)',
            }}
          >
            {coverArt ? (
              <Image
                src={coverArt}
                alt=""
                width={artW}
                height={labelH}
                quality={70}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}
              />
            )}
          </div>

          {/* Text area with ruled-paper lines */}
          <div
            className="flex-1 flex items-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg,
                color-mix(in srgb, var(--cream) 95%, white),
                color-mix(in srgb, var(--cream) 85%, var(--quinary))
              )`,
              padding: `0 ${Math.round(5 * s)}px`,
            }}
          >
            {/* Ruled lines */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `repeating-linear-gradient(0deg,
                  transparent,
                  transparent ${lineSpacing}px,
                  color-mix(in srgb, var(--tertiary) 12%, transparent) ${lineSpacing}px,
                  color-mix(in srgb, var(--tertiary) 12%, transparent) ${lineThin}px
                )`,
              }}
            />

            {label && (
              <span
                className="font-serif truncate relative"
                style={{
                  fontSize,
                  color: 'color-mix(in srgb, var(--primary) 85%, black)',
                  lineHeight: 1.15,
                }}
              >
                {label}
              </span>
            )}
          </div>
        </div>

        {/* Tape window — dark with reels */}
        <div
          className="absolute left-1/2 flex items-center justify-center"
          style={{
            bottom: windowBottom,
            transform: 'translateX(-50%)',
            width: windowW,
            height: windowH,
            background: `linear-gradient(180deg,
              color-mix(in srgb, var(--primary) 18%, black),
              color-mix(in srgb, var(--primary) 10%, black)
            )`,
            borderRadius: `${Math.round(10 * s)}px ${Math.round(10 * s)}px ${Math.round(4 * s)}px ${Math.round(4 * s)}px`,
            border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
            boxShadow: 'inset 0 1px 3px color-mix(in srgb, black 50%, transparent)',
            gap: reelGap,
          }}
        >
          <Reel size={reelSize} />
          <Reel size={reelSize} />
        </div>

        {/* Corner screws — hidden at small sizes */}
        {!isSmall && (
          <>
            <Screw size={screwSize} top={screwInset} left={screwInset} />
            <Screw size={screwSize} top={screwInset} right={screwInset} />
            <Screw size={screwSize} bottom={screwInset} left={screwInset} />
            <Screw size={screwSize} bottom={screwInset} right={screwInset} />
          </>
        )}

        {/* Side "A" label */}
        <span
          className="absolute font-jb-mono font-bold"
          style={{
            top: Math.round(6 * s),
            right: labelSide + Math.round(2 * s),
            fontSize: Math.max(5, Math.round(7 * s)),
            color: 'var(--secondary)',
            opacity: 0.6,
          }}
        >
          A
        </span>
      </div>
    </div>
  );
}

function Reel({ size }: { size: number }) {
  return (
    <div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        border: '1px solid color-mix(in srgb, white 10%, transparent)',
        background: `radial-gradient(circle,
          color-mix(in srgb, var(--primary) 30%, black) 40%,
          color-mix(in srgb, var(--primary) 15%, black) 100%
        )`,
      }}
    >
      <div
        className="absolute top-1/2 left-1/2 rounded-full"
        style={{
          width: Math.round(size * 0.3),
          height: Math.round(size * 0.3),
          transform: 'translate(-50%, -50%)',
          background: 'color-mix(in srgb, white 18%, transparent)',
        }}
      />
    </div>
  );
}

function Screw({ size, top, bottom, left, right }: {
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        top,
        bottom,
        left,
        right,
        background: `radial-gradient(circle,
          color-mix(in srgb, white 45%, transparent),
          color-mix(in srgb, white 30%, transparent)
        )`,
        border: '0.5px solid color-mix(in srgb, var(--primary) 18%, transparent)',
      }}
    />
  );
}
