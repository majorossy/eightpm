'use client';

import { useState } from 'react';

interface Props {
  size?: number;
  className?: string;
}

export default function CDRIcon({ size = 1, className = '' }: Props) {
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
        {/* cdr-disc */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: [
              'conic-gradient(',
              'from 30deg,',
              '#e8dcc8, #ddd0b8, #d4c8a8, #ccc0a0,',
              '#e0d4b8, #e8dcc0, #d8ccb0, #d0c4a0,',
              '#ddd0b0, #e4d8c0, #d6cab0, #e0d4b8, #e8dcc8',
              ')',
            ].join(' '),
            boxShadow: [
              'inset 0 0 0 4px rgba(255,255,255,0.2)',
              `inset 0 0 ${sc(20)}px rgba(200,180,140,0.15)`,
              `0 ${sc(6)}px ${sc(20)}px rgba(0,0,0,0.4)`,
              `0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.2)`,
            ].join(', '),
          }}
        >
          {/* cdr-disc::before — shimmer band */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, transparent 25%, rgba(255,245,220,0.2) 38%, rgba(255,245,220,0.4) 42%, rgba(255,250,230,0.55) 48%, rgba(255,245,220,0.4) 54%, rgba(255,245,220,0.2) 58%, transparent 75%)',
              zIndex: 2,
              transition: 'transform 0.4s',
              transform: hovered ? 'rotate(15deg)' : 'none',
              pointerEvents: 'none',
            }}
          />

          {/* cdr-disc::after — data ring grooves */}
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

          {/* cdr-hub-ring */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: sc(32),
              height: sc(32),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 42% 38%, #e8e0d0 0%, #d0c8b8 25%, #b8b0a0 50%, #a09888 80%, #887868 100%)',
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.3)',
              border: '2px solid rgba(0,0,0,0.08)',
            }}
          >
            {/* cdr-center-hole */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: sc(14),
                height: sc(14),
                borderRadius: '50%',
                background: '#0f1c22',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
                border: '1px solid rgba(0,0,0,0.2)',
              }}
            />
          </div>

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
    </div>
  );
}
