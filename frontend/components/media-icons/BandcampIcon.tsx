'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
  isPlaying?: boolean;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E";

const BAR_HEIGHTS = [35, 55, 80, 100, 70, 90, 60, 85, 45, 75, 95, 50, 65, 40];

/* Per-bar animation mapping from reference: keyframe name, duration, delay */
const BAR_ANIMATIONS: [string, string, string][] = [
  ['mi-eq1', '1.3s',  '0s'],
  ['mi-eq2', '1.05s', '0s'],
  ['mi-eq3', '0.95s', '0s'],
  ['mi-eq4', '1.15s', '0s'],
  ['mi-eq5', '0.88s', '0s'],
  ['mi-eq1', '1.08s', '0.12s'],
  ['mi-eq3', '1s',    '0.08s'],
  ['mi-eq2', '1.18s', '0.05s'],
  ['mi-eq4', '0.92s', '0.18s'],
  ['mi-eq5', '1.12s', '0.1s'],
  ['mi-eq1', '0.98s', '0.15s'],
  ['mi-eq3', '1.1s',  '0.06s'],
];

export default function BandcampIcon({ size = 1, className = '', isPlaying }: Props) {
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
          ...(isPlaying ? {
            animation: 'mi-wave-float 2.5s ease infinite',
            opacity: 0.3,
          } : {}),
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
            background: isPlaying
              ? 'rgba(200,180,140,0.5)'
              : 'linear-gradient(180deg, rgba(200,180,140,0.4), rgba(200,180,140,0.25))',
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
            borderTop: `${sc(7)}px solid ${isPlaying ? 'rgba(200,180,140,0.5)' : 'rgba(200,180,140,0.35)'}`,
          }}
        />
      </div>

      {/* Waveform bars */}
      <div
        style={{
          position: 'absolute',
          bottom: isPlaying ? sc(14) : sc(22),
          left: isPlaying ? sc(6) : sc(12),
          right: isPlaying ? sc(6) : sc(12),
          height: isPlaying ? sc(36) : sc(26),
          display: 'flex',
          alignItems: 'flex-end',
          gap: isPlaying ? sc(1.5) : sc(2),
          zIndex: 2,
        }}
      >
        {(isPlaying ? BAR_ANIMATIONS : BAR_HEIGHTS).map((item, i) => {
          if (isPlaying) {
            const [name, dur, delay] = item as [string, string, string];
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRadius: `${sc(1)}px ${sc(1)}px 0 0`,
                  background: 'linear-gradient(180deg, #c4706e, #a05a58)',
                  minHeight: sc(2),
                  animation: `${name} ${dur} ease infinite ${delay}`,
                }}
              />
            );
          }
          const pct = item as number;
          return (
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
          );
        })}
      </div>

      {/* Scan line */}
      {isPlaying && (
        <div style={{
          position: 'absolute',
          bottom: sc(14),
          left: sc(6),
          width: sc(2),
          height: sc(36),
          background: 'linear-gradient(180deg, rgba(196,112,110,0.6), rgba(196,112,110,0.1))',
          zIndex: 3,
          animation: 'mi-scan-line 2s linear infinite',
          boxShadow: '0 0 4px rgba(196,112,110,0.25)',
          pointerEvents: 'none' as const,
        }} />
      )}

      {/* "DIGITAL" text */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(4),
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: font,
          fontSize: sc(5),
          fontWeight: 700,
          color: 'rgba(200,180,140,0.15)',
          letterSpacing: '0.15em',
          zIndex: 2,
          whiteSpace: 'nowrap',
        }}
      >
        DIGITAL
      </div>
    </div>
  );
}
