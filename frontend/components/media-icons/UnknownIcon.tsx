'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
  isPlaying?: boolean;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E";

export default function UnknownIcon({ size = 1, className = '', isPlaying }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = size;
  const sc = (px: number) => Math.round(px * 0.75 * s);

  const w = sc(72);
  const h = sc(72);

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
      {/* uu-body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: sc(8),
          background: 'linear-gradient(175deg, #2a2622 0%, #222018 30%, #1a1812 60%, #14120c 100%)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.12), 0 ${sc(4)}px ${sc(14)}px rgba(0,0,0,0.45), 0 1px ${sc(3)}px rgba(0,0,0,0.25)`,
          border: '1px solid rgba(80,70,55,0.2)',
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

      {/* uu-cross-h — Horizontal crosshair */}
      {isPlaying && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: sc(12),
          right: sc(12),
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(196,112,110,0.15) 30%, rgba(196,112,110,0.15) 70%, transparent)',
          transform: 'translateY(-50%)',
          zIndex: 1,
          pointerEvents: 'none' as const,
        }} />
      )}

      {/* uu-cross-v — Vertical crosshair */}
      {isPlaying && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: sc(12),
          bottom: sc(12),
          width: 1,
          background: 'linear-gradient(180deg, transparent, rgba(196,112,110,0.15) 30%, rgba(196,112,110,0.15) 70%, transparent)',
          transform: 'translateX(-50%)',
          zIndex: 1,
          pointerEvents: 'none' as const,
        }} />
      )}

      {/* uu-ring — 3 sonar rings */}
      {isPlaying && [0, 1, 2].map((i) => (
        <div
          key={`sonar-${i}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: sc(55),
            height: sc(55),
            borderRadius: '50%',
            border: '2px solid rgba(196,112,110,0.45)',
            boxShadow: '0 0 12px rgba(196,112,110,0.15)',
            animation: `mi-sonar-ping 2.5s ease-out infinite ${i * 0.8}s`,
            pointerEvents: 'none' as const,
            zIndex: 1,
          }}
        />
      ))}

      {/* Outer dashed ring (static only) */}
      {!isPlaying && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: sc(52),
            height: sc(52),
            borderRadius: '50%',
            border: `${sc(2)}px dashed rgba(200,180,140,0.1)`,
            zIndex: 1,
          }}
        />
      )}

      {/* uu-inner — Dashed ring (spins when playing) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: sc(34),
          height: sc(34),
          borderRadius: '50%',
          border: isPlaying
            ? '1.5px dashed rgba(196,112,110,0.25)'
            : '1px dashed rgba(200,180,140,0.07)',
          zIndex: 1,
          ...(isPlaying ? { animation: 'mi-spin-center 10s linear infinite' } : {}),
        }}
      />

      {/* uu-dot — 4 corner dots */}
      {isPlaying && [
        { top: sc(10), left: sc(10) },
        { top: sc(10), right: sc(10) },
        { bottom: sc(10), left: sc(10) },
        { bottom: sc(10), right: sc(10) },
      ].map((pos, i) => (
        <div
          key={`corner-${i}`}
          style={{
            position: 'absolute',
            ...pos,
            width: sc(3),
            height: sc(3),
            borderRadius: '50%',
            background: 'rgba(196,112,110,0.25)',
            zIndex: 2,
            pointerEvents: 'none' as const,
          }}
        />
      ))}

      {/* uu-q — Question mark */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          fontFamily: "'Courier Prime', monospace",
          fontSize: sc(32),
          fontWeight: 700,
          color: isPlaying ? 'rgba(196,112,110,0.3)' : 'rgba(200,180,140,0.12)',
          zIndex: 3,
          lineHeight: 1,
          ...(isPlaying
            ? {
                animation: 'mi-q-pulse 2.5s ease infinite',
                textShadow: '0 0 16px rgba(196,112,110,0.15)',
              }
            : {}),
        }}
      >
        ?
      </div>

      {/* "UNKNOWN SRC" label */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(8),
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: font,
          fontSize: sc(5),
          fontWeight: 700,
          color: 'rgba(200,180,140,0.18)',
          letterSpacing: '0.1em',
          zIndex: 2,
          whiteSpace: 'nowrap',
        }}
      >
        UNKNOWN SRC
      </div>
    </div>
  );
}
