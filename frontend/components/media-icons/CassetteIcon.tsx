'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E";

export default function CassetteIcon({ size = 1, className = '' }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = size;
  const sc = (px: number) => Math.round(px * 0.45 * s);

  const w = sc(160);
  const h = sc(102);

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
          borderRadius: `${sc(6)}px ${sc(6)}px ${sc(4)}px ${sc(4)}px`,
          background: 'linear-gradient(175deg, #d8d2c0 0%, #c8c0aa 30%, #b8b098 60%, #a8a088 100%)',
          boxShadow: `inset 0 ${sc(2)}px 0 rgba(255,255,255,0.4), inset 0 -${sc(2)}px 0 rgba(0,0,0,0.06), inset ${sc(2)}px 0 0 rgba(255,255,255,0.12), inset -${sc(2)}px 0 0 rgba(0,0,0,0.04), 0 ${sc(5)}px ${sc(18)}px rgba(0,0,0,0.4), 0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.2)`,
          border: '1px solid rgba(0,0,0,0.1)',
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
        {/* Top bevel highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: sc(4),
            background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.35) 75%, transparent 95%)',
            zIndex: 4,
          }}
        />
      </div>

      {/* Seam line */}
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: 0,
          right: 0,
          height: sc(2),
          background: 'rgba(0,0,0,0.07)',
          boxShadow: `0 1px 0 rgba(255,255,255,0.15)`,
          zIndex: 2,
        }}
      />

      {/* Ridge tabs at top */}
      <div
        style={{
          position: 'absolute',
          top: sc(4),
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: sc(2.5),
          zIndex: 3,
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: sc(14),
              height: sc(2.5),
              borderRadius: sc(1),
              background: 'rgba(0,0,0,0.08)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Label area */}
      <div
        style={{
          position: 'absolute',
          top: sc(10),
          left: sc(14),
          right: sc(14),
          height: sc(38),
          borderRadius: sc(3),
          background: 'linear-gradient(135deg, #f5f0df, #ede7d0)',
          border: '1px solid rgba(0,0,0,0.1)',
          boxShadow: 'inset 0 0 4px rgba(0,0,0,0.04)',
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
            background: `repeating-linear-gradient(0deg, transparent, transparent ${sc(8)}px, rgba(100,140,180,0.15) ${sc(8)}px, rgba(100,140,180,0.15) ${sc(9)}px)`,
          }}
        />
        {/* Label text */}
        <div
          style={{
            fontFamily: "'Special Elite', serif",
            fontSize: sc(9),
            color: '#2a2a2a',
            zIndex: 1,
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          TDK SA-90
          <br />
          <span style={{ fontSize: sc(7) }}>High Position</span>
        </div>
      </div>

      {/* Tape window */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(8),
          left: sc(22),
          right: sc(22),
          height: sc(30),
          borderRadius: `${sc(12)}px ${sc(12)}px ${sc(5)}px ${sc(5)}px`,
          background: 'linear-gradient(180deg, #1c1a16 0%, #12100c 40%, #0a0806 100%)',
          border: `${Math.max(1, sc(2.5))}px solid rgba(170,160,140,0.35)`,
          boxShadow: `inset 0 ${sc(3)}px ${sc(8)}px rgba(0,0,0,0.7), 0 ${sc(2)}px 0 rgba(255,255,255,0.12)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: sc(36),
          zIndex: 2,
        }}
      >
        {/* Glass sheen overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 35%)',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
        {/* Tape strip between reels */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: sc(20),
            right: sc(20),
            height: sc(3),
            transform: 'translateY(-50%)',
            background: 'linear-gradient(180deg, #3a2810, #2a1a08, #3a2810)',
            zIndex: 1,
          }}
        />

        {/* Supply reel (more tape wound) */}
        <div
          style={{
            width: sc(22),
            height: sc(22),
            borderRadius: '50%',
            position: 'relative',
            zIndex: 2,
            background: 'radial-gradient(circle at 42% 38%, transparent 0%, transparent 34%, #2a1c0c 35%, #3a2810 40%, #2a1c0c 44%, #3a2810 48%, #1a1208 52%)',
            boxShadow: `inset 0 0 0 ${sc(2)}px rgba(42,28,12,0.4)`,
          }}
        >
          {/* Hub spool */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(14),
              height: sc(14),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 42% 36%, #e8e0d4 0%, #ddd4c2 30%, #ccc4b2 60%, #bcb4a2 100%)',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.5), 0 1px ${sc(2)}px rgba(0,0,0,0.2)`,
              zIndex: 2,
            }}
          />
          {/* Drive hole */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(4),
              height: sc(4),
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1c1a16, #080604)',
              boxShadow: `inset 0 1px ${sc(2)}px rgba(0,0,0,0.5)`,
              zIndex: 3,
            }}
          />
        </div>

        {/* Takeup reel (less tape wound) */}
        <div
          style={{
            width: sc(22),
            height: sc(22),
            borderRadius: '50%',
            position: 'relative',
            zIndex: 2,
            background: 'radial-gradient(circle at 42% 38%, transparent 0%, transparent 40%, #2a1c0c 41%, #3a2810 45%, #1a1208 48%)',
            boxShadow: 'inset 0 0 0 1px rgba(42,28,12,0.3)',
          }}
        >
          {/* Hub spool */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(14),
              height: sc(14),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 42% 36%, #e8e0d4 0%, #ddd4c2 30%, #ccc4b2 60%, #bcb4a2 100%)',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.5), 0 1px ${sc(2)}px rgba(0,0,0,0.2)`,
              zIndex: 2,
            }}
          />
          {/* Drive hole */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(4),
              height: sc(4),
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1c1a16, #080604)',
              boxShadow: `inset 0 1px ${sc(2)}px rgba(0,0,0,0.5)`,
              zIndex: 3,
            }}
          />
        </div>
      </div>

      {/* Screws */}
      {([
        { top: sc(6), left: sc(8) },
        { top: sc(6), right: sc(8) },
        { bottom: sc(6), left: sc(8) },
        { bottom: sc(6), right: sc(8) },
      ] as const).map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            width: sc(7),
            height: sc(7),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 36% 34%, #c8c8c8 0%, #a0a0a0 30%, #808080 60%, #606060 100%)',
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.35), 0 ${sc(2)}px ${sc(3)}px rgba(0,0,0,0.3)`,
            zIndex: 3,
          }}
        >
          {/* Crosshair horizontal */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(4),
              height: 1,
              background: 'rgba(0,0,0,0.25)',
            }}
          />
          {/* Crosshair vertical */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 1,
              height: sc(4),
              background: 'rgba(0,0,0,0.25)',
            }}
          />
        </div>
      ))}
    </div>
  );
}
