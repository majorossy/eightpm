'use client';

interface Props {
  size?: number;
  className?: string;
  isPlaying?: boolean;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E";

export default function MiniDiscIcon({ size = 1, className = '', isPlaying }: Props) {
  const s = size;
  const sc = (px: number) => Math.round(px * 0.529 * s);

  const w = sc(104);
  const h = sc(100);

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: w, height: h }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          borderRadius: sc(6),
        }}
      >
        {/* md-body */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'linear-gradient(175deg, #c4b898 0%, #b8aa88 30%, #aa9c78 60%, #9c8e6a 100%)',
            boxShadow: [
              'inset 0 1px 0 rgba(255,255,255,0.3)',
              'inset 0 -1px 0 rgba(0,0,0,0.08)',
              `0 ${sc(5)}px ${sc(18)}px rgba(0,0,0,0.4)`,
              `0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.2)`,
            ].join(', '),
            border: '1px solid rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* md-body::before -- noise texture */}
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
          {/* md-body::after -- top bevel highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: sc(4),
              background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.3) 75%, transparent 95%)',
              zIndex: 5,
              borderRadius: `${sc(6)}px ${sc(6)}px 0 0`,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* md-label-area */}
        <div
          style={{
            position: 'absolute',
            top: sc(6),
            left: sc(8),
            right: sc(8),
            height: sc(36),
            borderRadius: sc(3),
            background: 'linear-gradient(135deg, #f5f0e0, #ede7d4)',
            border: '0.5px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          {/* md-label-area::before -- ruled lines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(100,140,180,0.12) 8px, rgba(100,140,180,0.12) 9px)',
              borderRadius: 'inherit',
              pointerEvents: 'none',
            }}
          />
          {/* md-label-text */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: sc(8),
              color: '#2a2a2a',
              zIndex: 1,
              textAlign: 'center' as const,
              lineHeight: 1.3,
            }}
          >
            MiniDisc<br />74 min
          </div>
        </div>

        {/* md-shutter */}
        <div
          style={{
            position: 'absolute',
            bottom: sc(8),
            left: sc(8),
            width: sc(44),
            height: sc(38),
            borderRadius: sc(3),
            background: 'linear-gradient(135deg, #b0b0b0 0%, #a0a0a0 15%, #909090 30%, #a8a8a8 45%, #989898 60%, #888888 75%, #a0a0a0 90%, #909090 100%)',
            border: '1px solid rgba(0,0,0,0.2)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35), 0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 2,
            overflow: 'hidden',
          }}
        >
          {/* md-shutter::before -- horizontal ridges */}
          <div
            style={{
              position: 'absolute',
              top: sc(4),
              bottom: sc(4) || 0,
              left: 0,
              right: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 3.5px)',
              pointerEvents: 'none',
            }}
          />
          {/* md-shutter-arrow */}
          <div
            style={{
              position: 'absolute',
              top: sc(4),
              right: sc(4),
              width: 0,
              height: 0,
              borderLeft: `${sc(3)}px solid transparent`,
              borderRight: `${sc(3)}px solid transparent`,
              borderTop: `${sc(4)}px solid rgba(0,0,0,0.2)`,
            }}
          />
        </div>

        {/* mu-disc-area */}
        <div
          style={{
            position: 'absolute',
            bottom: sc(10),
            right: sc(10),
            width: sc(34),
            height: sc(34),
            borderRadius: '50%',
            background: isPlaying
              ? 'radial-gradient(circle, #0c0806 35%, #181410 36%)'
              : 'radial-gradient(circle, rgba(200,190,170,0.3) 20%, rgba(180,170,150,0.2) 40%, rgba(150,140,120,0.15) 60%, rgba(40,35,25,0.4) 80%, rgba(30,25,18,0.5) 100%)',
            border: isPlaying
              ? '1.5px solid rgba(196,112,110,0.2)'
              : '1px solid rgba(0,0,0,0.15)',
            boxShadow: isPlaying
              ? 'inset 0 2px 6px rgba(0,0,0,0.5), 0 0 10px rgba(196,112,110,0.12), 0 0 20px rgba(196,112,110,0.05)'
              : 'inset 0 1px 4px rgba(0,0,0,0.3)',
            zIndex: 2,
            overflow: 'hidden',
          }}
        >
          {/* Spinning coral disc */}
          {isPlaying && (
            <div style={{
              position: 'absolute',
              inset: sc(2),
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, #c4706e, #d4908e, #b8605e, #daa0a0, #c4706e, #a85856, #d89898, #c4706e, #d4908e, #b06060, #c4706e)',
              animation: 'mi-spin 1.8s linear infinite',
              pointerEvents: 'none' as const,
            }}>
              {/* Inner groove ring 1 (inset 4px) */}
              <div style={{
                position: 'absolute',
                inset: sc(4),
                borderRadius: '50%',
                border: '0.5px solid rgba(196,112,110,0.25)',
                pointerEvents: 'none' as const,
              }} />
              {/* Inner groove ring 2 (inset 8px) */}
              <div style={{
                position: 'absolute',
                inset: sc(8),
                borderRadius: '50%',
                border: '0.5px solid rgba(196,112,110,0.18)',
                pointerEvents: 'none' as const,
              }} />
            </div>
          )}

          {/* Disc hub */}
          {isPlaying && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: sc(8),
              height: sc(8),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #d89898, #c4706e)',
              border: '0.5px solid rgba(140,60,58,0.4)',
              zIndex: 1,
              pointerEvents: 'none' as const,
            }} />
          )}
        </div>

        {/* Laser dot */}
        {isPlaying && (
          <div style={{
            position: 'absolute',
            bottom: sc(24),
            right: sc(22),
            width: sc(3),
            height: sc(3),
            borderRadius: '50%',
            background: '#c4706e',
            boxShadow: '0 0 5px rgba(196,112,110,0.6), 0 0 12px rgba(196,112,110,0.25)',
            animation: 'mi-pulse 0.5s ease infinite',
            zIndex: 4,
            pointerEvents: 'none' as const,
          }} />
        )}

        {/* Laser track line */}
        {isPlaying && (
          <div style={{
            position: 'absolute',
            bottom: sc(25),
            right: sc(18),
            width: sc(12),
            height: sc(1),
            background: 'linear-gradient(90deg, transparent, rgba(196,112,110,0.12), transparent)',
            zIndex: 3,
            pointerEvents: 'none' as const,
          }} />
        )}

        {/* md-brand-mark "MD" */}
        <div
          style={{
            position: 'absolute',
            bottom: sc(10),
            right: sc(10),
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: sc(5),
            fontWeight: 700,
            color: 'rgba(60,50,30,0.3)',
            letterSpacing: '0.08em',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          MD
        </div>

        {/* md-cap "74" */}
        <div
          style={{
            position: 'absolute',
            top: sc(8),
            right: sc(10),
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: sc(5),
            fontWeight: 700,
            color: 'rgba(60,50,30,0.25)',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          74
        </div>
      </div>
    </div>
  );
}
