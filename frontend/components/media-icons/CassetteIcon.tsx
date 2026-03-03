'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
  isPlaying?: boolean;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E";

export default function CassetteIcon({ size = 1, className = '', isPlaying }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = size;
  const sc = (px: number) => Math.round(px * 0.45 * s);

  const w = sc(160);
  const h = sc(102);

  // EQ bar animation assignments per the reference
  const eqBars = [
    { anim: 'mi-eq-bounce1', dur: '1.2s', delay: '' },
    { anim: 'mi-eq-bounce2', dur: '1.0s', delay: '' },
    { anim: 'mi-eq-bounce3', dur: '0.9s', delay: '' },
    { anim: 'mi-eq-bounce4', dur: '1.1s', delay: '' },
    { anim: 'mi-eq-bounce5', dur: '0.85s', delay: '' },
    { anim: 'mi-eq-bounce1', dur: '1.05s', delay: '0.1s' },
    { anim: 'mi-eq-bounce3', dur: '0.95s', delay: '0.15s' },
    { anim: 'mi-eq-bounce2', dur: '1.15s', delay: '0.05s' },
  ];

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
        ...(isPlaying ? { animation: 'mi-wobble 4s ease-in-out infinite' } : {}),
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
            pointerEvents: 'none' as const,
          }}
        />
        {/* Vertical grain lines (::before equivalent) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.008) 3px, rgba(0,0,0,0.008) 4px)',
            pointerEvents: 'none' as const,
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
          boxShadow: '0 1px 0 rgba(255,255,255,0.15)',
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
        {/* Bottom ruled lines (label ::after equivalent) */}
        <div
          style={{
            position: 'absolute',
            bottom: sc(5),
            left: sc(8),
            right: sc(8),
            height: sc(12),
            background: `repeating-linear-gradient(180deg, transparent, transparent ${sc(5)}px, rgba(0,0,0,0.04) ${sc(5)}px, rgba(0,0,0,0.04) ${sc(5.5)}px)`,
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

      {/* SIDE A text */}
      <div
        style={{
          position: 'absolute',
          top: sc(8),
          right: sc(16),
          zIndex: 3,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: sc(5),
          fontWeight: 700,
          color: 'rgba(0,0,0,0.15)',
          letterSpacing: '0.05em',
          pointerEvents: 'none' as const,
        }}
      >
        SIDE A ▸
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
          overflow: 'hidden',
        }}
      >
        {/* Glass sheen overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 35%)',
            zIndex: 5,
            pointerEvents: 'none' as const,
          }}
        />

        {/* Tape strip between reels */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: sc(18),
            right: sc(18),
            height: sc(4),
            transform: 'translateY(-50%)',
            background: isPlaying
              ? 'repeating-linear-gradient(90deg, #6a3838, #804848 2px, #6a3838 4px)'
              : 'linear-gradient(180deg, #3a2810, #2a1a08, #3a2810)',
            backgroundSize: isPlaying ? '4px 4px' : undefined,
            zIndex: 1,
            ...(isPlaying ? { animation: 'mi-tape-advance 0.5s linear infinite' } : {}),
          }}
        />

        {/* EQ bars (playing only) */}
        {isPlaying && (
          <div style={{
            position: 'absolute',
            bottom: sc(1),
            left: '50%',
            transform: 'translateX(-50%)',
            width: sc(44),
            height: sc(16),
            display: 'flex',
            alignItems: 'flex-end',
            gap: sc(1.5),
            zIndex: 2,
            opacity: 0.6,
            pointerEvents: 'none' as const,
          }}>
            {eqBars.map((bar, i) => (
              <div key={i} style={{
                flex: 1,
                height: '50%',
                borderRadius: `${sc(0.5)}px ${sc(0.5)}px 0 0`,
                background: 'linear-gradient(180deg, #c4706e, #a05a58)',
                animation: `${bar.anim} ${bar.dur} ease infinite${bar.delay ? ` ${bar.delay}` : ''}`,
              }} />
            ))}
          </div>
        )}

        {/* Supply reel (left, more tape wound) */}
        <div
          style={{
            width: sc(20),
            height: sc(20),
            borderRadius: '50%',
            position: 'relative',
            zIndex: 3,
            background: isPlaying
              ? 'conic-gradient(from 0deg, #c4706e, #d89898, #b86060, #daa0a0, #c4706e, #d4908e)'
              : 'radial-gradient(circle at 42% 38%, transparent 0%, transparent 34%, #2a1c0c 35%, #3a2810 40%, #2a1c0c 44%, #3a2810 48%, #1a1208 52%)',
            border: isPlaying ? '1px solid rgba(140,60,58,0.12)' : undefined,
            boxShadow: isPlaying
              ? `inset 0 1px 2px rgba(255,200,195,0.4), 0 1px 3px rgba(0,0,0,0.25)`
              : `inset 0 0 0 ${sc(2)}px rgba(42,28,12,0.4)`,
            ...(isPlaying ? { animation: 'mi-spin 1.2s linear infinite' } : {}),
          }}
        >
          {/* Hub spool (static only) */}
          {!isPlaying && (
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
          )}
          {/* Center drive hole */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(5),
              height: sc(5),
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1c1a16, #080604)',
              boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.4)',
              zIndex: 4,
            }}
          />
          {/* Spoke mark (playing only) */}
          {isPlaying && (
            <div
              style={{
                position: 'absolute',
                top: sc(2),
                left: '50%',
                width: 1,
                height: sc(5),
                background: 'rgba(0,0,0,0.12)',
                transform: 'translateX(-50%)',
                zIndex: 3,
                pointerEvents: 'none' as const,
              }}
            />
          )}
        </div>

        {/* Takeup reel (right, less tape wound) */}
        <div
          style={{
            width: sc(20),
            height: sc(20),
            borderRadius: '50%',
            position: 'relative',
            zIndex: 3,
            background: isPlaying
              ? 'conic-gradient(from 0deg, #c4706e, #d89898, #b86060, #daa0a0, #c4706e, #d4908e)'
              : 'radial-gradient(circle at 42% 38%, transparent 0%, transparent 40%, #2a1c0c 41%, #3a2810 45%, #1a1208 48%)',
            border: isPlaying ? '1px solid rgba(140,60,58,0.12)' : undefined,
            boxShadow: isPlaying
              ? 'inset 0 1px 2px rgba(255,200,195,0.4), 0 1px 3px rgba(0,0,0,0.25)'
              : 'inset 0 0 0 1px rgba(42,28,12,0.3)',
            ...(isPlaying ? { animation: 'mi-spin 1.2s linear infinite reverse' } : {}),
          }}
        >
          {/* Hub spool (static only) */}
          {!isPlaying && (
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
          )}
          {/* Center drive hole */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(5),
              height: sc(5),
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1c1a16, #080604)',
              boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.4)',
              zIndex: 4,
            }}
          />
          {/* Spoke mark (playing only) */}
          {isPlaying && (
            <div
              style={{
                position: 'absolute',
                top: sc(2),
                left: '50%',
                width: 1,
                height: sc(5),
                background: 'rgba(0,0,0,0.12)',
                transform: 'translateX(-50%)',
                zIndex: 3,
                pointerEvents: 'none' as const,
              }}
            />
          )}
        </div>
      </div>

      {/* Roller guides */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(8),
          left: sc(22),
          width: sc(4),
          height: sc(14),
          borderRadius: sc(2),
          background: 'linear-gradient(90deg, #6a6258, #4a4438, #5a5448)',
          border: '0.5px solid rgba(0,0,0,0.15)',
          zIndex: 4,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: sc(8),
          right: sc(22),
          width: sc(4),
          height: sc(14),
          borderRadius: sc(2),
          background: 'linear-gradient(90deg, #6a6258, #4a4438, #5a5448)',
          border: '0.5px solid rgba(0,0,0,0.15)',
          zIndex: 4,
        }}
      />

      {/* Screws (4 corners) */}
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
            width: sc(5),
            height: sc(5),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 35%, #b0a890, #8a8270)',
            border: '0.5px solid rgba(0,0,0,0.15)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -0.5px 0.5px rgba(0,0,0,0.1)',
            zIndex: 4,
          }}
        >
          {/* Slot */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%) rotate(30deg)',
              width: sc(2.5),
              height: sc(0.5),
              background: 'rgba(0,0,0,0.15)',
            }}
          />
        </div>
      ))}

      {/* Middle screw */}
      <div
        style={{
          position: 'absolute',
          top: sc(46),
          left: '50%',
          transform: 'translateX(-50%)',
          width: sc(5),
          height: sc(5),
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 35%, #b0a890, #8a8270)',
          border: '0.5px solid rgba(0,0,0,0.15)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -0.5px 0.5px rgba(0,0,0,0.1)',
          zIndex: 4,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%) rotate(30deg)',
            width: sc(2.5),
            height: sc(0.5),
            background: 'rgba(0,0,0,0.15)',
          }}
        />
      </div>
    </div>
  );
}
