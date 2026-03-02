'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E";

const BAR_HEIGHTS = [35, 55, 80, 100, 70, 90, 60, 85, 45, 75, 95, 50, 65, 40];

export default function BandcampIcon({ size = 1, className = '' }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = size;
  const sc = (px: number) => Math.round(px * 0.7 * s);

  const w = sc(80);
  const h = sc(80);

  const font = "'JetBrains Mono', monospace";

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{
        width: w,
        height: h,
        cursor: 'pointer',
        transition: 'transform 0.3s ease, filter 0.3s',
        transform: hovered ? 'translateY(-4px)' : 'none',
        filter: hovered ? 'brightness(1.06)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: sc(8),
          background: 'linear-gradient(175deg, #2e2a24 0%, #262220 30%, #1e1a16 60%, #161210 100%)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.15), 0 ${sc(4)}px ${sc(14)}px rgba(0,0,0,0.45), 0 1px ${sc(3)}px rgba(0,0,0,0.25)`,
          border: '1px solid rgba(80,70,55,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Noise texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            backgroundImage: `url("${NOISE_SVG}")`,
            mixBlendMode: 'overlay' as const,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Download arrow */}
      <div
        style={{
          position: 'absolute',
          top: sc(12),
          left: '50%',
          transform: 'translateX(-50%)',
          width: sc(16),
          height: sc(20),
          zIndex: 2,
        }}
      >
        {/* Stem */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: sc(4),
            height: sc(12),
            background: 'linear-gradient(180deg, rgba(200,180,140,0.4), rgba(200,180,140,0.25))',
            borderRadius: sc(1),
          }}
        />
        {/* Arrowhead */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: `${sc(7)}px solid transparent`,
            borderRight: `${sc(7)}px solid transparent`,
            borderTop: `${sc(7)}px solid rgba(200,180,140,0.35)`,
          }}
        />
      </div>

      {/* Waveform bars */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(22),
          left: sc(12),
          right: sc(12),
          height: sc(26),
          display: 'flex',
          alignItems: 'flex-end',
          gap: sc(2),
          zIndex: 2,
        }}
      >
        {BAR_HEIGHTS.map((pct, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${pct}%`,
              borderRadius: `${sc(1)}px ${sc(1)}px 0 0`,
              background: 'linear-gradient(180deg, #c8a848 0%, #a08838 60%, #887028 100%)',
              boxShadow: '0 0 3px rgba(200,168,72,0.15)',
            }}
          />
        ))}
      </div>

      {/* "DIGITAL" text */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(8),
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: font,
          fontSize: sc(5),
          fontWeight: 700,
          color: 'rgba(200,180,140,0.25)',
          letterSpacing: '0.12em',
          zIndex: 2,
          whiteSpace: 'nowrap',
        }}
      >
        DIGITAL
      </div>
    </div>
  );
}
