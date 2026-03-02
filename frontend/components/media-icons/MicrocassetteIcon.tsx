'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E";

export default function MicrocassetteIcon({ size = 1, className = '' }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = size;
  const sc = (px: number) => Math.round(px * 0.57 * s);

  const w = sc(86);
  const h = sc(54);

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{
        width: w,
        height: h,
        cursor: 'pointer',
        transition: 'transform 0.3s ease, filter 0.3s',
        transform: hovered ? 'translateY(-4px)' : 'none',
        filter: hovered ? 'brightness(1.04)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: sc(3),
          background: 'linear-gradient(175deg, #9a9a9a 0%, #888 30%, #767676 60%, #666 100%)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.08), 0 ${sc(3)}px ${sc(12)}px rgba(0,0,0,0.4), 0 1px ${sc(3)}px rgba(0,0,0,0.2)`,
          border: '1px solid rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Noise texture overlay */}
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

      {/* Label strip at top */}
      <div
        style={{
          position: 'absolute',
          top: sc(3),
          left: sc(5),
          right: sc(5),
          height: sc(12),
          borderRadius: sc(1),
          background: 'linear-gradient(135deg, #f0ebd8, #e4dec8)',
          border: '0.5px solid rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        {/* Ruled lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(0deg, transparent, transparent ${sc(5)}px, rgba(100,140,180,0.12) ${sc(5)}px, rgba(100,140,180,0.12) ${sc(6)}px)`,
          }}
        />
        {/* Label text */}
        <div
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: Math.max(4, sc(5)),
            color: '#444',
            letterSpacing: '0.06em',
            zIndex: 1,
            whiteSpace: 'nowrap',
          }}
        >
          MICRO MC-60
        </div>
      </div>

      {/* Left reel opening */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(3),
          left: sc(6),
          width: sc(32),
          height: sc(32),
          borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 38%, #1c1a16 0%, #12100c 50%, #080604 100%)',
          border: `${Math.max(1, sc(2))}px solid rgba(90,85,75,0.3)`,
          boxShadow: `inset 0 ${sc(2)}px ${sc(6)}px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08)`,
          zIndex: 2,
        }}
      >
        {/* Hub spool */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: sc(22),
            height: sc(22),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 36%, #ece4d6 0%, #ddd4c2 30%, #ccc4b2 60%, #bcb4a2 100%)',
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: `inset 0 1px ${sc(2)}px rgba(255,255,255,0.5), 0 1px ${sc(3)}px rgba(0,0,0,0.25)`,
          }}
        />
        {/* Center drive hole */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: sc(6),
            height: sc(6),
            borderRadius: '50%',
            background: 'radial-gradient(circle, #1c1a16, #080604)',
            boxShadow: `inset 0 1px ${sc(2)}px rgba(0,0,0,0.6)`,
            zIndex: 1,
          }}
        />
      </div>

      {/* Right reel opening */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(3),
          right: sc(6),
          width: sc(32),
          height: sc(32),
          borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 38%, #1c1a16 0%, #12100c 50%, #080604 100%)',
          border: `${Math.max(1, sc(2))}px solid rgba(90,85,75,0.3)`,
          boxShadow: `inset 0 ${sc(2)}px ${sc(6)}px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08)`,
          zIndex: 2,
        }}
      >
        {/* Hub spool */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: sc(22),
            height: sc(22),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 36%, #ece4d6 0%, #ddd4c2 30%, #ccc4b2 60%, #bcb4a2 100%)',
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: `inset 0 1px ${sc(2)}px rgba(255,255,255,0.5), 0 1px ${sc(3)}px rgba(0,0,0,0.25)`,
          }}
        />
        {/* Center drive hole */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: sc(6),
            height: sc(6),
            borderRadius: '50%',
            background: 'radial-gradient(circle, #1c1a16, #080604)',
            boxShadow: `inset 0 1px ${sc(2)}px rgba(0,0,0,0.6)`,
            zIndex: 1,
          }}
        />
      </div>

      {/* Speed selector knob */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(5),
          right: sc(6),
          width: sc(6),
          height: sc(6),
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 35%, #aaa, #777)',
          boxShadow: `inset 0 0.5px 0.5px rgba(255,255,255,0.3), 0 1px ${sc(2)}px rgba(0,0,0,0.3)`,
          zIndex: 3,
        }}
      />
    </div>
  );
}
