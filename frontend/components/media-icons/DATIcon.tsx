'use client';

interface Props {
  size?: number;
  className?: string;
  isPlaying?: boolean;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E";

export default function DATIcon({ size = 1, className = '', isPlaying }: Props) {
  const s = size;
  const sc = (px: number) => Math.round(px * 0.555 * s);

  const w = sc(110);
  const h = sc(78);

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
        }}
      >
        {/* === DARK BODY === */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${sc(4)}px ${sc(4)}px ${sc(3)}px ${sc(3)}px`,
            background: 'linear-gradient(178deg, #3c3832, #241e18, #1c1610)',
            boxShadow: `inset 0 ${sc(1)}px 0 rgba(255,255,255,0.1), inset 0 -${sc(1)}px 0 rgba(0,0,0,0.2), 0 ${sc(5)}px ${sc(18)}px rgba(0,0,0,0.5)`,
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
            background: 'linear-gradient(180deg, #b09848 0%, #907838 50%, #a08840 100%)',
            borderBottom: '1px solid rgba(0,0,0,0.3)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${sc(7)}px`,
            justifyContent: 'space-between',
            borderRadius: `${sc(4)}px ${sc(4)}px 0 0`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          {/* DAT brand text */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: sc(7),
              fontWeight: 800,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.12em',
              textShadow: '0 1px 0 rgba(0,0,0,0.3)',
              lineHeight: 1,
            }}
          >
            DAT
          </span>
          {/* Spec text */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: sc(5),
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.05em',
              lineHeight: 1,
            }}
          >
            Digital Audio Tape &middot; 48kHz
          </span>
        </div>

        {/* === SCREWS at LCD corners === */}
        <div
          style={{
            position: 'absolute',
            top: sc(20),
            left: sc(3),
            width: sc(4),
            height: sc(4),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #5a5448, #2a2622)',
            border: '0.5px solid rgba(0,0,0,0.2)',
            zIndex: 3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: sc(20),
            right: sc(3),
            width: sc(4),
            height: sc(4),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #5a5448, #2a2622)',
            border: '0.5px solid rgba(0,0,0,0.2)',
            zIndex: 3,
          }}
        />

        {/* === LCD / LABEL AREA === */}
        {isPlaying ? (
          /* Playing: LCD panel with VU meters */
          <div
            style={{
              position: 'absolute',
              top: sc(20),
              left: sc(7),
              right: sc(7),
              height: sc(28),
              borderRadius: sc(3),
              background: 'linear-gradient(180deg, #080604, #0c0a06)',
              border: '1.5px solid rgba(0,0,0,0.4)',
              boxShadow: `inset 0 ${sc(2)}px ${sc(8)}px rgba(0,0,0,0.7)`,
              zIndex: 2,
              padding: `${sc(3)}px ${sc(4)}px`,
              display: 'flex',
              flexDirection: 'column' as const,
              gap: sc(1),
              overflow: 'hidden',
            }}
          >
            {/* L meter row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: sc(2), height: sc(8) }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: sc(4.5),
                  fontWeight: 700,
                  color: 'rgba(196,112,110,0.4)',
                  width: sc(6),
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                L
              </span>
              <div
                style={{
                  flex: 1,
                  height: sc(6),
                  borderRadius: sc(1),
                  background: 'rgba(196,112,110,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    borderRadius: sc(1),
                    background: `repeating-linear-gradient(90deg,
                      rgba(196,112,110,0.3) 0px, rgba(196,112,110,0.3) 4px, transparent 4px, transparent 5px,
                      rgba(196,112,110,0.35) 5px, rgba(196,112,110,0.35) 9px, transparent 9px, transparent 10px,
                      rgba(196,112,110,0.45) 10px, rgba(196,112,110,0.45) 14px, transparent 14px, transparent 15px,
                      rgba(196,112,110,0.55) 15px, rgba(196,112,110,0.55) 19px, transparent 19px, transparent 20px,
                      rgba(196,112,110,0.65) 20px, rgba(196,112,110,0.65) 24px, transparent 24px, transparent 25px,
                      rgba(196,112,110,0.75) 25px, rgba(196,112,110,0.75) 29px, transparent 29px, transparent 30px,
                      rgba(196,112,110,0.88) 30px, rgba(196,112,110,0.88) 34px, transparent 34px, transparent 35px,
                      #c4706e 35px, #c4706e 39px, transparent 39px, transparent 40px)`,
                    boxShadow: '0 0 4px rgba(196,112,110,0.12)',
                    animation: 'mi-meter-l 1.6s ease infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 1,
                    bottom: 1,
                    width: sc(2),
                    background: '#c4706e',
                    boxShadow: '0 0 4px rgba(196,112,110,0.5)',
                    borderRadius: 0.5,
                    animation: 'mi-meter-peak-l 1.6s ease infinite',
                  }}
                />
              </div>
            </div>

            {/* R meter row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: sc(2), height: sc(8) }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: sc(4.5),
                  fontWeight: 700,
                  color: 'rgba(196,112,110,0.4)',
                  width: sc(6),
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                R
              </span>
              <div
                style={{
                  flex: 1,
                  height: sc(6),
                  borderRadius: sc(1),
                  background: 'rgba(196,112,110,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    borderRadius: sc(1),
                    background: `repeating-linear-gradient(90deg,
                      rgba(196,112,110,0.3) 0px, rgba(196,112,110,0.3) 4px, transparent 4px, transparent 5px,
                      rgba(196,112,110,0.35) 5px, rgba(196,112,110,0.35) 9px, transparent 9px, transparent 10px,
                      rgba(196,112,110,0.45) 10px, rgba(196,112,110,0.45) 14px, transparent 14px, transparent 15px,
                      rgba(196,112,110,0.55) 15px, rgba(196,112,110,0.55) 19px, transparent 19px, transparent 20px,
                      rgba(196,112,110,0.65) 20px, rgba(196,112,110,0.65) 24px, transparent 24px, transparent 25px,
                      rgba(196,112,110,0.75) 25px, rgba(196,112,110,0.75) 29px, transparent 29px, transparent 30px,
                      rgba(196,112,110,0.88) 30px, rgba(196,112,110,0.88) 34px, transparent 34px, transparent 35px,
                      #c4706e 35px, #c4706e 39px, transparent 39px, transparent 40px)`,
                    boxShadow: '0 0 4px rgba(196,112,110,0.12)',
                    animation: 'mi-meter-r 1.4s ease infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 1,
                    bottom: 1,
                    width: sc(2),
                    background: '#c4706e',
                    boxShadow: '0 0 4px rgba(196,112,110,0.5)',
                    borderRadius: 0.5,
                    animation: 'mi-meter-peak-r 1.4s ease infinite',
                  }}
                />
              </div>
            </div>

            {/* LCD bottom row: play indicator, timer, format tag */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: sc(1),
              }}
            >
              {/* Play triangle (CSS border trick) */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: `${sc(2)}px 0 ${sc(2)}px ${sc(4)}px`,
                  borderColor: 'transparent transparent transparent #c4706e',
                  boxShadow: '0 0 3px rgba(196,112,110,0.3)',
                  flexShrink: 0,
                }}
              />
              {/* Timer */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: sc(7),
                  fontWeight: 700,
                  color: '#c4706e',
                  textShadow: '0 0 4px rgba(196,112,110,0.3)',
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                }}
              >
                01:23:45
              </div>
              {/* Format tag */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: sc(4.5),
                  fontWeight: 600,
                  color: 'rgba(196,112,110,0.3)',
                  lineHeight: 1,
                }}
              >
                48kHz 16bit
              </div>
            </div>
          </div>
        ) : (
          /* Static: label area */
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
        )}

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

          {/* Drum holes container */}
          <div
            style={{
              position: 'absolute',
              top: sc(6),
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: sc(24),
            }}
          >
            {/* Left drum */}
            <div
              style={{
                position: 'relative',
                width: sc(16),
                height: sc(16),
                borderRadius: '50%',
                background: 'radial-gradient(circle at 45% 40%, #1a1816, #060504)',
                border: '1.5px solid rgba(40,36,30,0.5)',
                boxShadow: `inset 0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.6)`,
              }}
            >
              {isPlaying && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: sc(10),
                    height: sc(10),
                    borderRadius: '50%',
                    border: '1px solid rgba(200,180,140,0.06)',
                    borderTopColor: 'rgba(196,112,110,0.45)',
                    borderRightColor: 'rgba(196,112,110,0.2)',
                    animation: 'mi-spin-center 0.25s linear infinite',
                    pointerEvents: 'none' as const,
                  }}
                />
              )}
            </div>
            {/* Right drum */}
            <div
              style={{
                position: 'relative',
                width: sc(16),
                height: sc(16),
                borderRadius: '50%',
                background: 'radial-gradient(circle at 45% 40%, #1a1816, #060504)',
                border: '1.5px solid rgba(40,36,30,0.5)',
                boxShadow: `inset 0 ${sc(2)}px ${sc(4)}px rgba(0,0,0,0.6)`,
              }}
            >
              {isPlaying && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: sc(10),
                    height: sc(10),
                    borderRadius: '50%',
                    border: '1px solid rgba(200,180,140,0.06)',
                    borderTopColor: 'rgba(196,112,110,0.45)',
                    borderRightColor: 'rgba(196,112,110,0.2)',
                    animation: 'mi-spin-center 0.25s linear infinite',
                    pointerEvents: 'none' as const,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* === WRITE-PROTECT TAB === */}
        {!isPlaying && (
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
        )}
      </div>
    </div>
  );
}
