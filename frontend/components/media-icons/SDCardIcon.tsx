'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
  isPlaying?: boolean;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E";

const BIT_POSITIONS = [
  { left: '30%', delay: '0s' },
  { left: '50%', delay: '0.15s' },
  { left: '70%', delay: '0.3s' },
  { left: '40%', delay: '0.1s' },
  { left: '60%', delay: '0.25s' },
  { left: '35%', delay: '0.4s' },
];

export default function SDCardIcon({ size = 1, className = '', isPlaying }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = size;
  const sc = (px: number) => Math.round(px * 0.677 * s);

  const w = sc(62);
  const h = sc(84);

  const font = "'JetBrains Mono', monospace";
  const fontCourier = "'Courier Prime', monospace";

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
      {/* su-body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${sc(3)}px ${sc(3)}px ${sc(2)}px ${sc(2)}px`,
          background: 'linear-gradient(175deg, #2e2a24 0%, #262220 30%, #1e1a16 60%, #161210 100%)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.15), inset 1px 0 0 rgba(255,255,255,0.03), inset -1px 0 0 rgba(0,0,0,0.08), 0 ${sc(4)}px ${sc(14)}px rgba(0,0,0,0.45), 0 1px ${sc(3)}px rgba(0,0,0,0.25)`,
          border: '1px solid rgba(80,70,55,0.25)',
          overflow: 'visible',
          zIndex: 2,
        }}
      >
        {/* noise texture (::before) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            backgroundImage: `url("${NOISE_SVG}")`,
            mixBlendMode: 'overlay' as const,
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }}
        />

        {/* top highlight bevel (::after) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: sc(3),
            background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 75%, transparent 95%)',
            zIndex: 4,
            borderRadius: `${sc(3)}px ${sc(3)}px 0 0`,
            pointerEvents: 'none',
          }}
        />

        {/* su-notch (triangle at top-right) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: `0 ${sc(14)}px ${sc(14)}px 0`,
            borderColor: 'transparent #0f1c22 transparent transparent',
            zIndex: 5,
          }}
        />

        {/* su-label */}
        <div
          style={{
            position: 'absolute',
            top: sc(6),
            left: sc(5),
            right: sc(18),
            height: sc(30),
            borderRadius: sc(2),
            background: 'linear-gradient(135deg, #f5f0df, #ede7d0)',
            border: '0.5px solid rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            overflow: 'hidden',
          }}
        >
          {/* ruled lines (::before) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(100,140,180,0.12) 7px, rgba(100,140,180,0.12) 8px)',
              pointerEvents: 'none',
            }}
          />

          {/* su-label-brand */}
          <div
            style={{
              fontFamily: font,
              fontSize: sc(6),
              fontWeight: 700,
              color: '#c8a848',
              letterSpacing: '0.08em',
              zIndex: 1,
            }}
          >
            SDHC
          </div>

          {/* su-label-cap */}
          <div
            style={{
              fontFamily: fontCourier,
              fontSize: sc(5),
              color: '#555',
              zIndex: 1,
              marginTop: sc(1),
            }}
          >
            32GB Class 10
          </div>
        </div>

        {/* su-wp (write-protect switch) */}
        <div
          style={{
            position: 'absolute',
            top: sc(40),
            left: sc(3),
            width: sc(4),
            height: sc(10),
            borderRadius: sc(1),
            background: 'linear-gradient(180deg, #4a4438, #3a3630)',
            border: '0.5px solid rgba(0,0,0,0.2)',
            zIndex: 3,
          }}
        />

        {/* su-led — Activity LED */}
        <div
          style={{
            position: 'absolute',
            top: sc(36),
            left: '50%',
            transform: 'translateX(-50%)',
            width: sc(4),
            height: sc(4),
            borderRadius: '50%',
            background: isPlaying ? '#c4706e' : 'rgba(196, 112, 110, 0.1)',
            boxShadow: isPlaying ? '0 0 4px rgba(196, 112, 110, 0.4)' : 'none',
            zIndex: 3,
            ...(isPlaying ? { animation: 'mi-led-blink 0.3s ease infinite' } : {}),
          }}
        />

        {/* su-stream — Bit stream container */}
        {isPlaying && (
          <div
            style={{
              position: 'absolute',
              top: sc(42),
              left: '50%',
              transform: 'translateX(-50%)',
              width: sc(24),
              height: sc(22),
              zIndex: 2,
              overflow: 'hidden',
              pointerEvents: 'none' as const,
            }}
          >
            {BIT_POSITIONS.map((bit, i) => (
              <div
                key={`bit-${i}`}
                style={{
                  position: 'absolute',
                  left: bit.left,
                  transform: 'translateX(-50%)',
                  width: sc(2),
                  height: sc(2),
                  borderRadius: '50%',
                  background: '#c4706e',
                  boxShadow: '0 0 3px rgba(196,112,110,0.35)',
                  animation: `mi-bit-fall 0.6s linear infinite ${bit.delay}`,
                }}
              />
            ))}
          </div>
        )}

        {/* sd-mark ("SD" text) */}
        <div
          style={{
            position: 'absolute',
            top: sc(44),
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: font,
            fontSize: sc(8),
            fontWeight: 700,
            color: 'rgba(200,180,140,0.2)',
            letterSpacing: '0.06em',
            zIndex: 2,
          }}
        >
          SD
        </div>

        {/* sd-class (speed class circle with "10") */}
        <div
          style={{
            position: 'absolute',
            bottom: sc(20),
            left: '50%',
            transform: 'translateX(-50%)',
            width: sc(12),
            height: sc(12),
            borderRadius: '50%',
            border: '1px solid rgba(200,180,140,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontFamily: font,
              fontSize: sc(5),
              fontWeight: 700,
              color: 'rgba(200,180,140,0.2)',
            }}
          >
            10
          </div>
        </div>

        {/* su-contacts (9 gold pins) */}
        <div
          style={{
            position: 'absolute',
            bottom: sc(3),
            left: sc(5),
            right: sc(5),
            height: sc(11),
            display: 'flex',
            gap: sc(1.5),
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '100%',
                borderRadius: sc(1),
                background: 'linear-gradient(180deg, #d4b858, #a08830, #c8a848)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
