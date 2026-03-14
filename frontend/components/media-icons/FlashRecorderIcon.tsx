'use client';

interface Props {
  size?: number;
  className?: string;
  isPlaying?: boolean;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E";

export default function FlashRecorderIcon({ size = 1, className = '', isPlaying }: Props) {
  const s = size;
  const sc = (px: number) => Math.round(px * 0.5 * s);

  const w = sc(88);
  const h = sc(140);

  const font = "'JetBrains Mono', monospace";

  // Static meter segments for non-playing state
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

  // Playing-state meter: 10 segments per row with staggered animation
  // Row 1: 6 green on, 2 yellow on, 2 red off
  // Row 2: 5 green on, 3 yellow on, 1 red on, 1 red off
  const playingRow1 = [
    { color: 'g', on: true }, { color: 'g', on: true }, { color: 'g', on: true },
    { color: 'g', on: true }, { color: 'g', on: true }, { color: 'g', on: true },
    { color: 'y', on: true }, { color: 'y', on: true },
    { color: 'r', on: false }, { color: 'r', on: false },
  ];
  const playingRow2 = [
    { color: 'g', on: true }, { color: 'g', on: true }, { color: 'g', on: true },
    { color: 'g', on: true }, { color: 'g', on: true },
    { color: 'y', on: true }, { color: 'y', on: true }, { color: 'y', on: true },
    { color: 'r', on: true }, { color: 'r', on: false },
  ];

  // Row 1 delays: first 8 at 0.7s duration with 0.05s increments, last 2 at 0.65s with specific delays
  const row1Delays = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.12, 0.18];
  const row1Durations = [0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.65, 0.65];

  const playingSegBg = (color: string) => {
    switch (color) {
      case 'g': return 'rgba(196,112,110,0.5)';
      case 'y': return 'rgba(196,112,110,0.7)';
      case 'r': return '#c4706e';
      default: return 'rgba(196,112,110,0.5)';
    }
  };

  const playingSegShadow = (color: string, on: boolean) => {
    if (!on) return 'none';
    switch (color) {
      case 'g': return '0 0 3px rgba(196,112,110,0.15)';
      case 'y': return '0 0 3px rgba(196,112,110,0.2)';
      case 'r': return '0 0 3px rgba(196,112,110,0.3)';
      default: return 'none';
    }
  };

  // Mic element builder (shared between states)
  const renderMic = (side: 'left' | 'right') => (
    <div
      style={{
        position: 'absolute',
        top: sc(4),
        [side === 'left' ? 'left' : 'right']: sc(14),
        width: sc(16),
        height: sc(18),
        borderRadius: `${sc(7)}px ${sc(7)}px ${sc(4)}px ${sc(4)}px`,
        background: 'linear-gradient(178deg, #4a4438, #36322c)',
        border: '1px solid rgba(255,255,255,0.05)',
        zIndex: 2,
        overflow: 'hidden',
      }}
    >
      {/* Grille dots (::before) */}
      <div
        style={{
          position: 'absolute',
          inset: sc(2),
          background: 'repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 1.5px, rgba(0,0,0,0.08) 1.5px, rgba(0,0,0,0.08) 2px)',
          borderRadius: 'inherit',
          pointerEvents: 'none' as const,
        }}
      />
      {/* Coral glow (::after — playing only) */}
      {isPlaying && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'radial-gradient(circle at 50% 40%, rgba(196,112,110,0.12), transparent 70%)',
            animation: 'mi-breathe 2s ease infinite',
            pointerEvents: 'none' as const,
          }}
        />
      )}
    </div>
  );

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{
        width: w,
        height: h,
      }}
    >
      {/* ru-body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: sc(10),
          background: 'linear-gradient(178deg, #403c36, #2a2620, #1e1a14)',
          boxShadow: `inset 0 2px 0 rgba(255,255,255,0.08), 0 ${sc(6)}px ${sc(22)}px rgba(0,0,0,0.55)`,
          border: '1px solid rgba(80,70,55,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* ru-body::before — left grip lines */}
        <div
          style={{
            position: 'absolute',
            top: sc(50),
            bottom: sc(10),
            left: 0,
            width: sc(4),
            background: 'repeating-linear-gradient(180deg, transparent 0px, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
            pointerEvents: 'none' as const,
          }}
        />
        {/* ru-body::after — right grip lines */}
        <div
          style={{
            position: 'absolute',
            top: sc(50),
            bottom: sc(10),
            right: 0,
            width: sc(4),
            background: 'repeating-linear-gradient(180deg, transparent 0px, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
            pointerEvents: 'none' as const,
          }}
        />
        {/* noise texture overlay */}
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

      {/* ru-mic left + right */}
      {renderMic('left')}
      {renderMic('right')}

      {/* ru-lcd */}
      <div
        style={{
          position: 'absolute',
          top: sc(28),
          left: sc(6),
          right: sc(6),
          height: sc(46),
          borderRadius: sc(4),
          background: 'linear-gradient(180deg, #100e08, #0a0806)',
          border: `${sc(2)}px solid rgba(0,0,0,0.5)`,
          boxShadow: `inset 0 ${sc(2)}px ${sc(8)}px rgba(0,0,0,0.6)`,
          zIndex: 2,
          padding: `${sc(3)}px ${sc(4)}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: sc(2),
        }}
      >
        {isPlaying ? (
          <>
            {/* Playing: Row 1 — animated meter */}
            <div style={{ height: sc(7), display: 'flex', gap: 1 }}>
              {playingRow1.map((seg, i) => (
                <div
                  key={`p1-${i}`}
                  style={{
                    flex: 1,
                    borderRadius: 0.5,
                    background: playingSegBg(seg.color),
                    opacity: seg.on ? 1 : 0.2,
                    boxShadow: playingSegShadow(seg.color, seg.on),
                    animation: `mi-seg-flash ${row1Durations[i]}s ease infinite ${row1Delays[i]}s`,
                  }}
                />
              ))}
            </div>
            {/* Playing: Row 2 — animated meter (0.1s base delay offset) */}
            <div style={{ height: sc(7), display: 'flex', gap: 1 }}>
              {playingRow2.map((seg, i) => (
                <div
                  key={`p2-${i}`}
                  style={{
                    flex: 1,
                    borderRadius: 0.5,
                    background: playingSegBg(seg.color),
                    opacity: seg.on ? 1 : 0.2,
                    boxShadow: playingSegShadow(seg.color, seg.on),
                    animation: `mi-seg-flash ${row1Durations[i]}s ease infinite ${row1Delays[i] + 0.1}s`,
                  }}
                />
              ))}
            </div>
            {/* Playing: LCD info row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
              <div>
                <div style={{
                  fontFamily: font,
                  fontSize: sc(5),
                  fontWeight: 600,
                  color: 'rgba(196,112,110,0.35)',
                  lineHeight: 1,
                }}>WAV 24bit</div>
                <div style={{
                  fontFamily: font,
                  fontSize: sc(4.5),
                  color: 'rgba(196,112,110,0.25)',
                  lineHeight: 1,
                  marginTop: 1,
                }}>96kHz</div>
              </div>
              <div style={{
                fontFamily: font,
                fontSize: sc(8),
                fontWeight: 700,
                color: '#c4706e',
                textShadow: '0 0 4px rgba(196,112,110,0.35)',
                lineHeight: 1,
              }}>01:23:45</div>
            </div>
          </>
        ) : (
          <>
            {/* Static: Meter L */}
            <div style={{ width: '100%', height: sc(6), display: 'flex', gap: sc(1), alignItems: 'flex-end' }}>
              {meterL.map((type, i) => (
                <div key={`l-${i}`} style={{
                  flex: 1, height: '100%', borderRadius: sc(0.5),
                  ...segColor(type),
                }} />
              ))}
            </div>
            {/* Static: Meter R */}
            <div style={{ width: '100%', height: sc(6), display: 'flex', gap: sc(1), alignItems: 'flex-end', marginTop: sc(1) }}>
              {meterR.map((type, i) => (
                <div key={`r-${i}`} style={{
                  flex: 1, height: '100%', borderRadius: sc(0.5),
                  ...segColor(type),
                }} />
              ))}
            </div>
            {/* Static: Format + Timer row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: sc(2) }}>
              <div style={{
                fontFamily: font,
                fontSize: sc(5),
                fontWeight: 600,
                color: 'rgba(200,168,72,0.5)',
                letterSpacing: '0.06em',
              }}>WAV 24/96</div>
              <div style={{
                fontFamily: font,
                fontSize: sc(8),
                fontWeight: 700,
                color: '#c8a848',
                textShadow: '0 0 4px rgba(200,168,72,0.3)',
                letterSpacing: '0.08em',
              }}>01:23:45</div>
            </div>
          </>
        )}
      </div>

      {/* ru-rec — REC indicator dot (playing only) */}
      {isPlaying && (
        <div style={{
          position: 'absolute',
          top: sc(30),
          right: sc(8),
          width: sc(6),
          height: sc(6),
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #d48080, #c4706e)',
          boxShadow: '0 0 5px rgba(196,112,110,0.5), 0 0 12px rgba(196,112,110,0.2)',
          zIndex: 3,
          animation: 'mi-pulse 0.8s ease infinite',
          pointerEvents: 'none' as const,
        }} />
      )}

      {/* ru-transport (3 buttons — playing state) / (4 buttons — static state) */}
      <div
        style={{
          position: 'absolute',
          top: sc(80),
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: sc(5),
          zIndex: 2,
        }}
      >
        {isPlaying ? (
          <>
            {/* rec button — coral with breathe */}
            <div style={{
              width: sc(14),
              height: sc(14),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 32%, #d48080, #c4706e)',
              boxShadow: `0 0 ${sc(8)}px rgba(196,112,110,0.2)`,
              animation: 'mi-breathe 1.5s ease infinite',
            }} />
            {/* stop button */}
            <div style={{
              width: sc(14),
              height: sc(14),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 32%, #5a5448, #3a3630)',
              boxShadow: `0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.3)`,
            }} />
            {/* play button */}
            <div style={{
              width: sc(14),
              height: sc(14),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 32%, #5a5448, #3a3630)',
              boxShadow: `0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.3)`,
            }} />
          </>
        ) : (
          <>
            {/* Record button (red) */}
            <div style={{
              width: sc(14),
              height: sc(14),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #c4706e, #8a4a48)',
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.15), 0 ${sc(2)}px ${sc(3)}px rgba(0,0,0,0.4), 0 0 ${sc(6)}px rgba(196,112,110,0.25)`,
            }} />
            {/* Play button */}
            <div style={{
              width: sc(14),
              height: sc(14),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #5a5448, #3a3630)',
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.08), 0 ${sc(2)}px ${sc(3)}px rgba(0,0,0,0.4)`,
            }} />
            {/* Pause button */}
            <div style={{
              width: sc(14),
              height: sc(14),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #5a5448, #3a3630)',
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.08), 0 ${sc(2)}px ${sc(3)}px rgba(0,0,0,0.4)`,
            }} />
            {/* Stop button */}
            <div style={{
              width: sc(14),
              height: sc(14),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #5a5448, #3a3630)',
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.08), 0 ${sc(2)}px ${sc(3)}px rgba(0,0,0,0.4)`,
            }} />
          </>
        )}
      </div>

      {/* ru-dial — jog wheel */}
      <div
        style={{
          position: 'absolute',
          top: sc(100),
          left: '50%',
          transform: 'translateX(-50%)',
          width: sc(26),
          height: sc(26),
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #444038, #504c44, #444038, #3c3830, #444038, #504c44, #444038)',
          border: `${sc(2)}px solid rgba(255,255,255,0.03)`,
          boxShadow: `inset 0 1px ${sc(2)}px rgba(255,255,255,0.06), 0 ${sc(3)}px ${sc(6)}px rgba(0,0,0,0.4)`,
          zIndex: 2,
          ...(isPlaying ? { animation: 'mi-spin 6s linear infinite' } : {}),
        }}
      >
        {/* Notch indicator at top (::before) */}
        <div
          style={{
            position: 'absolute',
            top: sc(2),
            left: '50%',
            transform: 'translateX(-50%)',
            width: sc(2),
            height: sc(4),
            borderRadius: sc(1),
            background: 'rgba(255,255,255,0.12)',
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
