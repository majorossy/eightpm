'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
}

export default function ReelToReelIcon({ size = 1, className = '' }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = size;
  const sc = (px: number) => Math.round(px * 0.44 * s);

  const w = sc(150);
  const h = sc(160);

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
        {/* === CARDBOARD BOX / SLEEVE === */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: sc(10),
            right: sc(10),
            height: sc(80),
            borderRadius: sc(4),
            background: 'linear-gradient(175deg, #8a7a5a 0%, #7a6a4a 40%, #6a5a3a 100%)',
            boxShadow: `inset 0 ${sc(1)}px 0 rgba(255,255,255,0.15), inset 0 -${sc(1)}px 0 rgba(0,0,0,0.1), 0 ${sc(4)}px ${sc(14)}px rgba(0,0,0,0.4)`,
            border: '1px solid rgba(0,0,0,0.15)',
          }}
        >
          {/* Label area */}
          <div
            style={{
              position: 'absolute',
              top: sc(8),
              left: sc(8),
              right: sc(8),
              height: sc(32),
              borderRadius: sc(2),
              background: 'linear-gradient(135deg, #f5f0dc, #e8e2cc)',
              border: '0.5px solid rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Brand text */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: sc(7),
                fontWeight: 700,
                color: '#1a4a2a',
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                lineHeight: 1,
              }}
            >
              Maxell UDXL
            </div>
            {/* Type text */}
            <div
              style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: sc(5),
                color: '#666',
                marginTop: sc(1),
                lineHeight: 1,
              }}
            >
              35-180B · 7&quot; Reel
            </div>
          </div>

          {/* Feet text */}
          <div
            style={{
              position: 'absolute',
              bottom: sc(6),
              right: sc(8),
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: sc(6),
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              lineHeight: 1,
            }}
          >
            1800 ft
          </div>
        </div>

        {/* === REEL DISC === */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: sc(130),
            height: sc(130),
            borderRadius: '50%',
          }}
        >
          {/* Brushed aluminum flange */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `conic-gradient(
                from 0deg,
                rgba(180,175,165,1) 0deg,
                rgba(160,155,145,1) 15deg,
                rgba(190,185,175,1) 30deg,
                rgba(150,145,135,1) 60deg,
                rgba(185,180,170,1) 90deg,
                rgba(155,150,140,1) 120deg,
                rgba(190,185,175,1) 150deg,
                rgba(160,155,145,1) 180deg,
                rgba(185,180,170,1) 210deg,
                rgba(150,145,135,1) 240deg,
                rgba(190,185,175,1) 270deg,
                rgba(155,150,140,1) 300deg,
                rgba(185,180,175,1) 330deg,
                rgba(180,175,165,1) 360deg
              )`,
              boxShadow: `inset 0 ${sc(2)}px ${sc(3)}px rgba(255,255,255,0.3), inset 0 -${sc(2)}px ${sc(3)}px rgba(0,0,0,0.15), 0 ${sc(6)}px ${sc(20)}px rgba(0,0,0,0.45), 0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.25)`,
              border: `${sc(2)}px solid rgba(0,0,0,0.12)`,
            }}
          />

          {/* Tape wound ring */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(100),
              height: sc(100),
              borderRadius: '50%',
              background: `radial-gradient(circle,
                transparent 0%, transparent 24%,
                #2a1c0c 25%, #3a2810 28%, #2a1c0c 30%, #3a2810 33%, #2a1c0c 35%,
                #3a2810 37%, #2a1c0c 39%, #3a2810 41%, #2a1c0c 43%,
                #3a2810 45%, #2a1c0c 47%, #3a2810 49%,
                transparent 50%
              )`,
            }}
          />

          {/* Hub outer (cream circle) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(52),
              height: sc(52),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 42% 38%, #e8e0d4 0%, #ddd4c4 20%, #ccc4b4 40%, #bcb4a4 60%, #aca494 80%, #9c9484 100%)',
              boxShadow: `inset 0 ${sc(2)}px ${sc(4)}px rgba(255,255,255,0.5), inset 0 -${sc(2)}px ${sc(3)}px rgba(0,0,0,0.15), 0 ${sc(2)}px ${sc(8)}px rgba(0,0,0,0.3)`,
              border: '1.5px solid rgba(0,0,0,0.1)',
            }}
          >
            {/* Three triangular cutout windows (conic-gradient with mask) */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                width: sc(42),
                height: sc(42),
                borderRadius: '50%',
                background: `conic-gradient(
                  transparent 0deg, transparent 10deg,
                  rgba(42,28,12,0.35) 15deg, rgba(42,28,12,0.35) 105deg,
                  transparent 110deg, transparent 130deg,
                  rgba(42,28,12,0.35) 135deg, rgba(42,28,12,0.35) 225deg,
                  transparent 230deg, transparent 250deg,
                  rgba(42,28,12,0.35) 255deg, rgba(42,28,12,0.35) 345deg,
                  transparent 350deg
                )`,
                WebkitMask: 'radial-gradient(circle, transparent 28%, black 30%, black 90%, transparent 92%)',
                mask: 'radial-gradient(circle, transparent 28%, black 30%, black 90%, transparent 92%)',
              }}
            />

            {/* Raised center collar */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                width: sc(20),
                height: sc(20),
                borderRadius: '50%',
                background: 'radial-gradient(circle at 42% 36%, #e0d8c8 0%, #d0c8b8 30%, #c0b8a8 60%, #b0a898 100%)',
                boxShadow: `inset 0 ${sc(1)}px ${sc(2)}px rgba(255,255,255,0.4), 0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.2)`,
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            />
          </div>

          {/* Spindle hole (dark center) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(10),
              height: sc(10),
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1a1816, #080604)',
              boxShadow: `inset 0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.6)`,
              border: '1px solid rgba(0,0,0,0.15)',
              zIndex: 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}
