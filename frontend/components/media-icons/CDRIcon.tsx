'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
  isPlaying?: boolean;
}

export default function CDRIcon({ size = 1, className = '', isPlaying }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = size;
  const sc = (px: number) => Math.round(px * 0.508 * s);

  const w = sc(120);
  const h = sc(120);

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: w, height: h, cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Outer wrapper with hover transform */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transition: 'transform 0.3s ease, filter 0.3s',
          transform: hovered ? 'translateY(-4px) rotate(3deg)' : 'none',
          filter: hovered ? 'brightness(1.08)' : 'none',
        }}
      >
        {/* cu-disc — main spinning disc */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: isPlaying
              ? 'conic-gradient(from 30deg, #e8dcc8,#d8ccac,#e4d8bc,#d0c4a0,#e8dcc8,#d4c8a4,#e0d4b4,#ccc0a0,#e8dcc8,#d8ccac,#e4d8bc)'
              : [
                  'conic-gradient(',
                  'from 30deg,',
                  '#e8dcc8, #ddd0b8, #d4c8a8, #ccc0a0,',
                  '#e0d4b8, #e8dcc0, #d8ccb0, #d0c4a0,',
                  '#ddd0b0, #e4d8c0, #d6cab0, #e0d4b8, #e8dcc8',
                  ')',
                ].join(' '),
            boxShadow: isPlaying
              ? `inset 0 0 0 3px rgba(255,255,255,0.15), 0 ${sc(5)}px ${sc(20)}px rgba(0,0,0,0.45)`
              : [
                  'inset 0 0 0 4px rgba(255,255,255,0.2)',
                  `inset 0 0 ${sc(20)}px rgba(200,180,140,0.15)`,
                  `0 ${sc(6)}px ${sc(20)}px rgba(0,0,0,0.4)`,
                  `0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.2)`,
                ].join(', '),
            ...(isPlaying ? { animation: 'mi-spin 1.5s linear infinite' } : {}),
          }}
        >
          {/* cu-disc::before — track grooves (non-playing) / groove rings (playing) */}
          {isPlaying ? (
            <div
              style={{
                position: 'absolute',
                inset: sc(18),
                borderRadius: '50%',
                border: '0.5px solid rgba(0,0,0,0.04)',
                boxShadow:
                  '0 0 0 6px transparent, 0 0 0 12px rgba(0,0,0,0.015), 0 0 0 18px transparent, 0 0 0 24px rgba(0,0,0,0.01)',
                pointerEvents: 'none' as const,
              }}
            />
          ) : (
            <>
              {/* Static shimmer band */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, transparent 25%, rgba(255,245,220,0.2) 38%, rgba(255,245,220,0.4) 42%, rgba(255,250,230,0.55) 48%, rgba(255,245,220,0.4) 54%, rgba(255,245,220,0.2) 58%, transparent 75%)',
                  zIndex: 2,
                  transition: 'transform 0.4s',
                  transform: hovered ? 'rotate(15deg)' : 'none',
                  pointerEvents: 'none',
                }}
              />
              {/* Static data ring grooves */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: sc(90),
                  height: sc(90),
                  borderRadius: '50%',
                  boxShadow: [
                    'inset 0 0 0 1px rgba(180,160,120,0.12)',
                    'inset 0 0 0 12px transparent',
                    'inset 0 0 0 13px rgba(180,160,120,0.08)',
                    'inset 0 0 0 24px transparent',
                    'inset 0 0 0 25px rgba(180,160,120,0.06)',
                  ].join(', '),
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
        </div>

        {/* cu-shimmer — coral shimmer overlay (playing only) */}
        {isPlaying && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: [
                'conic-gradient(from 0deg,',
                'rgba(196,112,110,0.14), rgba(210,140,138,0.1),',
                'rgba(196,112,110,0.16), rgba(180,100,98,0.08),',
                'rgba(196,112,110,0.12), rgba(210,140,138,0.1),',
                'rgba(196,112,110,0.18), rgba(180,100,98,0.06))',
              ].join(' '),
              animation: 'mi-spin 4s linear infinite reverse',
              zIndex: 1,
              mixBlendMode: 'screen' as const,
              pointerEvents: 'none' as const,
            }}
          />
        )}

        {/* cu-shimmer2 — sparse coral sectors (playing only) */}
        {isPlaying && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: [
                'conic-gradient(from 120deg,',
                'transparent 0%, rgba(196,112,110,0.08) 8%, transparent 16%,',
                'transparent 33%, rgba(196,112,110,0.06) 41%, transparent 49%,',
                'transparent 66%, rgba(196,112,110,0.1) 74%, transparent 82%)',
              ].join(' '),
              animation: 'mi-spin 1.5s linear infinite',
              zIndex: 2,
              pointerEvents: 'none' as const,
            }}
          />
        )}

        {/* cu-glint — fixed glint band (playing only, NOT animated) */}
        {isPlaying && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: [
                'linear-gradient(140deg,',
                'transparent 30%,',
                'rgba(196,112,110,0.15) 42%,',
                'rgba(255,200,195,0.35) 46%,',
                'rgba(255,220,218,0.5) 50%,',
                'rgba(255,200,195,0.35) 54%,',
                'rgba(196,112,110,0.15) 58%,',
                'transparent 70%)',
              ].join(' '),
              zIndex: 3,
              pointerEvents: 'none' as const,
            }}
          />
        )}

        {/* cu-hub — center hub */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: sc(isPlaying ? 30 : 32),
            height: sc(isPlaying ? 30 : 32),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 38%, #e8e0d4, #c8c0b0, #9a9284)',
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5), 0 2px 6px rgba(0,0,0,0.3)',
            border: '2px solid rgba(0,0,0,0.06)',
            zIndex: 4,
          }}
        >
          {/* cu-hole — center hole */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: sc(isPlaying ? 12 : 14),
              height: sc(isPlaying ? 12 : 14),
              borderRadius: '50%',
              background: isPlaying ? '#0b161b' : '#0f1c22',
              boxShadow: isPlaying
                ? 'inset 0 2px 4px rgba(0,0,0,0.7)'
                : 'inset 0 2px 4px rgba(0,0,0,0.6)',
              ...(isPlaying ? {} : { border: '1px solid rgba(0,0,0,0.2)' }),
            }}
          />
        </div>

        {/* cu-laser — pulsing laser dot (playing only) */}
        {isPlaying && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: sc(6),
              height: sc(6),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #e8a0a0, #c4706e)',
              boxShadow:
                '0 0 6px rgba(196,112,110,0.8), 0 0 14px rgba(196,112,110,0.4), 0 0 28px rgba(196,112,110,0.15)',
              zIndex: 6,
              animation: 'mi-pulse 2.5s ease infinite',
              pointerEvents: 'none' as const,
            }}
          />
        )}

        {/* cdr-top-label */}
        <div
          style={{
            position: 'absolute',
            top: sc(16),
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: sc(5),
            fontWeight: 700,
            color: 'rgba(90,70,40,0.45)',
            letterSpacing: '0.08em',
            zIndex: 3,
            whiteSpace: 'nowrap' as const,
            pointerEvents: 'none',
          }}
        >
          CD-R 700MB
        </div>

        {/* cdr-bottom-label */}
        <div
          style={{
            position: 'absolute',
            bottom: sc(16),
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: sc(5),
            color: 'rgba(90,70,40,0.35)',
            zIndex: 3,
            whiteSpace: 'nowrap' as const,
            pointerEvents: 'none',
          }}
        >
          80 MIN · 52×
        </div>
      </div>
    </div>
  );
}
