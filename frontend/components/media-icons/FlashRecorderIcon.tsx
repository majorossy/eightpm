'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E";

export default function FlashRecorderIcon({ size = 1, className = '' }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = size;
  const sc = (px: number) => Math.round(px * 0.5 * s);

  const w = sc(88);
  const h = sc(140);

  const font = "'JetBrains Mono', monospace";

  // Meter segments: L channel and R channel
  const meterL = ['green','green','green','green','green','green','green','yellow','yellow','off','off','off'] as const;
  const meterR = ['green','green','green','green','green','yellow','yellow','red','off','off','off','off'] as const;

  const segColor = (type: string) => {
    switch (type) {
      case 'green': return { background: '#8a9a3a', boxShadow: '0 0 2px rgba(138,154,58,0.3)' };
      case 'yellow': return { background: '#c8a848', boxShadow: '0 0 2px rgba(200,168,72,0.3)' };
      case 'red': return { background: '#c4706e', boxShadow: '0 0 2px rgba(196,112,110,0.3)' };
      default: return { background: 'rgba(138,154,58,0.15)', boxShadow: 'none' };
    }
  };

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
      {/* rec-body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${sc(10)}px ${sc(10)}px ${sc(8)}px ${sc(8)}px`,
          background: 'linear-gradient(175deg, #3a3630 0%, #322e28 20%, #2a2620 50%, #221e18 80%, #1a1610 100%)',
          boxShadow: `inset 0 ${sc(2)}px 0 rgba(255,255,255,0.08), inset 0 -${sc(2)}px 0 rgba(0,0,0,0.2), inset ${sc(2)}px 0 0 rgba(255,255,255,0.04), inset -${sc(2)}px 0 0 rgba(0,0,0,0.1), 0 ${sc(6)}px ${sc(22)}px rgba(0,0,0,0.5), 0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.3)`,
          border: '1px solid rgba(80,70,55,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* noise texture overlay (::before) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            backgroundImage: `url("${NOISE_SVG}")`,
            mixBlendMode: 'overlay' as const,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* rec-mic-l */}
      <div
        style={{
          position: 'absolute',
          top: sc(6),
          left: sc(18),
          width: sc(14),
          height: sc(20),
          borderRadius: `${sc(7)}px ${sc(7)}px ${sc(4)}px ${sc(4)}px`,
          background: 'linear-gradient(175deg, #4a4438 0%, #3a3630 50%, #2e2a24 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06)',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        {/* grille dots (::before) */}
        <div
          style={{
            position: 'absolute',
            inset: sc(3),
            background: 'radial-gradient(circle, rgba(200,180,140,0.05) 1px, transparent 1px)',
            backgroundSize: `${sc(3)}px ${sc(3)}px`,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* rec-mic-r */}
      <div
        style={{
          position: 'absolute',
          top: sc(6),
          right: sc(18),
          width: sc(14),
          height: sc(20),
          borderRadius: `${sc(7)}px ${sc(7)}px ${sc(4)}px ${sc(4)}px`,
          background: 'linear-gradient(175deg, #4a4438 0%, #3a3630 50%, #2e2a24 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06)',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        {/* grille dots (::before) */}
        <div
          style={{
            position: 'absolute',
            inset: sc(3),
            background: 'radial-gradient(circle, rgba(200,180,140,0.05) 1px, transparent 1px)',
            backgroundSize: `${sc(3)}px ${sc(3)}px`,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* rec-lcd */}
      <div
        style={{
          position: 'absolute',
          top: sc(32),
          left: sc(8),
          right: sc(8),
          height: sc(36),
          borderRadius: sc(4),
          background: 'linear-gradient(180deg, #2a2418 0%, #1e1a10 50%, #16120a 100%)',
          border: `${sc(2)}px solid rgba(0,0,0,0.4)`,
          boxShadow: `inset 0 ${sc(2)}px ${sc(6)}px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.03)`,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: sc(2),
          padding: sc(4),
        }}
      >
        {/* Meter L */}
        <div style={{ width: '100%', height: sc(6), display: 'flex', gap: sc(1), alignItems: 'flex-end' }}>
          {meterL.map((type, i) => (
            <div key={`l-${i}`} style={{ flex: 1, height: '100%', borderRadius: sc(0.5), ...segColor(type) }} />
          ))}
        </div>

        {/* Meter R */}
        <div style={{ width: '100%', height: sc(6), display: 'flex', gap: sc(1), alignItems: 'flex-end', marginTop: sc(1) }}>
          {meterR.map((type, i) => (
            <div key={`r-${i}`} style={{ flex: 1, height: '100%', borderRadius: sc(0.5), ...segColor(type) }} />
          ))}
        </div>

        {/* Format + Timer row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: sc(2) }}>
          <div
            style={{
              fontFamily: font,
              fontSize: sc(5),
              fontWeight: 600,
              color: 'rgba(200,168,72,0.5)',
              letterSpacing: '0.06em',
            }}
          >
            WAV 24/96
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: sc(8),
              fontWeight: 700,
              color: '#c8a848',
              textShadow: '0 0 4px rgba(200,168,72,0.3)',
              letterSpacing: '0.08em',
            }}
          >
            01:23:45
          </div>
        </div>
      </div>

      {/* rec-transport (4 buttons) */}
      <div
        style={{
          position: 'absolute',
          top: sc(76),
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: sc(6),
          zIndex: 2,
        }}
      >
        {/* Record button (red) */}
        <div
          style={{
            width: sc(14),
            height: sc(14),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #c4706e, #8a4a48)',
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.15), 0 ${sc(2)}px ${sc(3)}px rgba(0,0,0,0.4), 0 0 ${sc(6)}px rgba(196,112,110,0.25)`,
          }}
        />
        {/* Play button */}
        <div
          style={{
            width: sc(14),
            height: sc(14),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #5a5448, #3a3630)',
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.08), 0 ${sc(2)}px ${sc(3)}px rgba(0,0,0,0.4)`,
          }}
        />
        {/* Pause button */}
        <div
          style={{
            width: sc(14),
            height: sc(14),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #5a5448, #3a3630)',
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.08), 0 ${sc(2)}px ${sc(3)}px rgba(0,0,0,0.4)`,
          }}
        />
        {/* Stop button */}
        <div
          style={{
            width: sc(14),
            height: sc(14),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #5a5448, #3a3630)',
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.08), 0 ${sc(2)}px ${sc(3)}px rgba(0,0,0,0.4)`,
          }}
        />
      </div>

      {/* rec-dial (jog wheel) */}
      <div
        style={{
          position: 'absolute',
          top: sc(98),
          left: '50%',
          transform: 'translateX(-50%)',
          width: sc(28),
          height: sc(28),
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #3e3a34, #484440, #3e3a34, #363230, #3e3a34, #484440, #3e3a34, #363230, #3e3a34)',
          border: `${sc(2)}px solid rgba(255,255,255,0.04)`,
          boxShadow: `inset 0 1px ${sc(2)}px rgba(255,255,255,0.06), 0 ${sc(2)}px ${sc(6)}px rgba(0,0,0,0.4)`,
          zIndex: 2,
        }}
      >
        {/* Tick mark at top (::before) */}
        <div
          style={{
            position: 'absolute',
            top: sc(3),
            left: '50%',
            transform: 'translateX(-50%)',
            width: sc(2),
            height: sc(4),
            borderRadius: sc(1),
            background: 'rgba(255,255,255,0.15)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* rec-sd-slot */}
      <div
        style={{
          position: 'absolute',
          right: sc(5),
          top: sc(80),
          width: sc(7),
          height: sc(10),
          borderRadius: sc(1),
          background: 'linear-gradient(180deg, #4a4438, #3a3630)',
          border: '0.5px solid rgba(0,0,0,0.3)',
          zIndex: 3,
        }}
      />

      {/* rec-brand-text */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(8),
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: font,
          fontSize: sc(5),
          fontWeight: 700,
          color: 'rgba(200,180,140,0.15)',
          letterSpacing: '0.12em',
          zIndex: 3,
          whiteSpace: 'nowrap',
        }}
      >
        TASCAM DR
      </div>
    </div>
  );
}
