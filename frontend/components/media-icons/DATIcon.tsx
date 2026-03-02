'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E";

export default function DATIcon({ size = 1, className = '' }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = size;
  const sc = (px: number) => Math.round(px * 0.555 * s);

  const w = sc(110);
  const h = sc(78);

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: w, height: h, cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transition: 'transform 0.3s ease, filter 0.3s',
          transform: hovered ? 'translateY(-4px)' : 'none',
          filter: hovered ? 'brightness(1.04)' : 'none',
        }}
      >
        {/* === DARK BODY === */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${sc(4)}px ${sc(4)}px ${sc(3)}px ${sc(3)}px`,
            background: 'linear-gradient(175deg, #3a3530 0%, #322e28 30%, #2a2620 60%, #221e18 100%)',
            boxShadow: `inset 0 ${sc(1)}px 0 rgba(255,255,255,0.1), inset 0 -${sc(1)}px 0 rgba(0,0,0,0.15), 0 ${sc(5)}px ${sc(18)}px rgba(0,0,0,0.5), 0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.3)`,
            border: '1px solid rgba(80,70,55,0.3)',
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
              pointerEvents: 'none' as const,
            }}
          />
        </div>

        {/* === GOLD/OCHRE TOP STRIPE === */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: sc(16),
            background: 'linear-gradient(180deg, #a08848 0%, #8a7438 50%, #786430 100%)',
            borderBottom: '1px solid rgba(0,0,0,0.25)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${sc(8)}px`,
            justifyContent: 'space-between',
            borderRadius: `${sc(4)}px ${sc(4)}px 0 0`,
          }}
        >
          {/* DAT brand text */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: sc(7),
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.12em',
              lineHeight: 1,
            }}
          >
            DAT
          </div>
          {/* Spec text */}
          <div
            style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: sc(5),
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}
          >
            16BIT / 48kHz
          </div>
        </div>

        {/* === LABEL AREA === */}
        <div
          style={{
            position: 'absolute',
            top: sc(20),
            left: sc(10),
            right: sc(10),
            height: sc(22),
            borderRadius: sc(2),
            background: 'linear-gradient(135deg, #e8e3d2, #ddd8c6)',
            border: '0.5px solid rgba(0,0,0,0.12)',
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
              background: 'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(100,100,140,0.12) 6px, rgba(100,100,140,0.12) 7px)',
              pointerEvents: 'none' as const,
            }}
          />
          {/* Label text */}
          <div
            style={{
              fontFamily: "'Special Elite', serif",
              fontSize: sc(7),
              color: '#333',
              zIndex: 1,
              lineHeight: 1,
            }}
          >
            Digital Audio Tape
          </div>
        </div>

        {/* === TAPE DOOR === */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: sc(28),
            background: 'linear-gradient(175deg, #4a4438 0%, #3e382c 40%, #322c22 100%)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            zIndex: 2,
            overflow: 'hidden',
            borderRadius: `0 0 ${sc(3)}px ${sc(3)}px`,
          }}
        >
          {/* Horizontal ridges */}
          <div
            style={{
              position: 'absolute',
              inset: `${sc(3)}px 0`,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2.5px, rgba(0,0,0,0.06) 2.5px, rgba(0,0,0,0.06) 3px)',
              pointerEvents: 'none' as const,
            }}
          />

          {/* Window holes container */}
          <div
            style={{
              position: 'absolute',
              top: sc(6),
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: sc(18),
            }}
          >
            {/* Left hole */}
            <div
              style={{
                width: sc(12),
                height: sc(12),
                borderRadius: '50%',
                background: 'radial-gradient(circle, #0c0a08, #060504)',
                border: '1px solid rgba(0,0,0,0.3)',
                boxShadow: `inset 0 ${sc(1)}px ${sc(3)}px rgba(0,0,0,0.5)`,
              }}
            />
            {/* Right hole */}
            <div
              style={{
                width: sc(12),
                height: sc(12),
                borderRadius: '50%',
                background: 'radial-gradient(circle, #0c0a08, #060504)',
                border: '1px solid rgba(0,0,0,0.3)',
                boxShadow: `inset 0 ${sc(1)}px ${sc(3)}px rgba(0,0,0,0.5)`,
              }}
            />
          </div>
        </div>

        {/* === WRITE-PROTECT TAB === */}
        <div
          style={{
            position: 'absolute',
            top: sc(22),
            left: sc(10),
            width: sc(8),
            height: sc(4),
            borderRadius: sc(1),
            background: 'linear-gradient(180deg, #c4706e, #a05550)',
            boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
            zIndex: 3,
          }}
        />
      </div>
    </div>
  );
}
