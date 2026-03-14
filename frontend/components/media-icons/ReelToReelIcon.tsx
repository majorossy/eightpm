'use client';

interface Props {
  size?: number;
  className?: string;
  isPlaying?: boolean;
}

export default function ReelToReelIcon({ size = 1, className = '', isPlaying }: Props) {
  const s = size;
  const sc = (px: number) => Math.round(px * 0.44 * s);

  const w = isPlaying ? sc(160) : sc(150);
  const h = isPlaying ? sc(120) : sc(160);

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
        {isPlaying ? <PlayingState sc={sc} /> : <StaticState sc={sc} />}
      </div>
    </div>
  );
}

/* ── Static state: single reel on cardboard box (unchanged) ── */
function StaticState({ sc }: { sc: (px: number) => number }) {
  return (
    <>
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
            35-180B &middot; 7&quot; Reel
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
          {/* Three triangular cutout windows */}
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
    </>
  );
}

/* ── Playing state: deck base plate with two reels ── */
function PlayingState({ sc }: { sc: (px: number) => number }) {
  return (
    <>
      {/* === BASE PLATE === */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: sc(6),
          background: 'linear-gradient(178deg, #3a3630, #2a2620, #1e1a14)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 ${sc(5)}px ${sc(18)}px rgba(0,0,0,0.5)`,
          border: '1px solid rgba(80,70,55,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Brushed texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.005) 1px, rgba(255,255,255,0.005) 2px)',
            pointerEvents: 'none' as const,
          }}
        />
      </div>

      {/* === SUPPLY REEL (left) === */}
      <div style={{ position: 'absolute', top: sc(8), left: sc(12), width: sc(60), height: sc(60) }}>
        {/* Coral flange */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #c4706e,#d89898,#b86060,#daa0a0,#c4706e,#a85856,#d4908e,#b86060,#c4706e)',
            boxShadow: `inset 0 ${sc(2)}px ${sc(4)}px rgba(255,200,195,0.3), inset 0 -${sc(2)}px ${sc(3)}px rgba(100,40,38,0.15), 0 ${sc(3)}px ${sc(10)}px rgba(0,0,0,0.35)`,
            border: '1.5px solid rgba(140,60,58,0.15)',
            animation: 'mi-spin 2s linear infinite',
          }}
        >
          {/* Grooves overlay */}
          <div
            style={{
              position: 'absolute',
              inset: sc(6),
              borderRadius: '50%',
              background: 'repeating-conic-gradient(rgba(100,40,38,0.04) 0deg 15deg, transparent 15deg 30deg)',
              pointerEvents: 'none' as const,
            }}
          />
        </div>
        {/* Tape ring (large - supply side) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: sc(44),
            height: sc(44),
            borderRadius: '50%',
            background: 'radial-gradient(circle, transparent 18%, #6a3838 19%, #804848 22%, #6a3838 25%, #804848 28%, #6a3838 31%, #804848 34%, #6a3838 37%, #804848 40%, #6a3838 42%, transparent 43%)',
            animation: 'mi-spin-center 2s linear infinite',
            pointerEvents: 'none' as const,
          }}
        />
        {/* Hub */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: sc(20),
            height: sc(20),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 38%, #e8b0ae, #d89090, #c4706e)',
            boxShadow: `inset 0 1px ${sc(3)}px rgba(255,200,195,0.5), 0 1px ${sc(4)}px rgba(0,0,0,0.3)`,
            border: '1px solid rgba(140,60,58,0.12)',
            zIndex: 2,
          }}
        >
          {/* Spindle hole */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(5),
              height: sc(5),
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1a1816, #080604)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      </div>

      {/* === TAKEUP REEL (right) === */}
      <div style={{ position: 'absolute', top: sc(8), right: sc(12), width: sc(60), height: sc(60) }}>
        {/* Coral flange */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #c4706e,#d89898,#b86060,#daa0a0,#c4706e,#a85856,#d4908e,#b86060,#c4706e)',
            boxShadow: `inset 0 ${sc(2)}px ${sc(4)}px rgba(255,200,195,0.3), inset 0 -${sc(2)}px ${sc(3)}px rgba(100,40,38,0.15), 0 ${sc(3)}px ${sc(10)}px rgba(0,0,0,0.35)`,
            border: '1.5px solid rgba(140,60,58,0.15)',
            animation: 'mi-spin 2.8s linear infinite',
          }}
        >
          {/* Grooves overlay */}
          <div
            style={{
              position: 'absolute',
              inset: sc(6),
              borderRadius: '50%',
              background: 'repeating-conic-gradient(rgba(100,40,38,0.04) 0deg 15deg, transparent 15deg 30deg)',
              pointerEvents: 'none' as const,
            }}
          />
        </div>
        {/* Tape ring (small - takeup side) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: sc(30),
            height: sc(30),
            borderRadius: '50%',
            background: 'radial-gradient(circle, transparent 22%, #6a3838 23%, #804848 27%, #6a3838 31%, #804848 35%, transparent 36%)',
            animation: 'mi-spin-center 2.8s linear infinite',
            pointerEvents: 'none' as const,
          }}
        />
        {/* Hub */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: sc(20),
            height: sc(20),
            borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 38%, #e8b0ae, #d89090, #c4706e)',
            boxShadow: `inset 0 1px ${sc(3)}px rgba(255,200,195,0.5), 0 1px ${sc(4)}px rgba(0,0,0,0.3)`,
            border: '1px solid rgba(140,60,58,0.12)',
            zIndex: 2,
          }}
        >
          {/* Spindle hole */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: sc(5),
              height: sc(5),
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1a1816, #080604)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      </div>

      {/* === TAPE PATH (horizontal bar between reels) === */}
      <div
        style={{
          position: 'absolute',
          top: sc(38),
          left: sc(42),
          right: sc(42),
          height: sc(2),
          background: 'linear-gradient(180deg, #804848, #6a3838)',
          zIndex: 3,
          opacity: 0.7,
        }}
      >
        {/* Curved guide below head */}
        <div
          style={{
            position: 'absolute',
            bottom: sc(-10),
            left: '50%',
            transform: 'translateX(-50%)',
            width: sc(40),
            height: sc(14),
            borderBottom: '2px solid rgba(128,72,72,0.5)',
            borderRadius: '0 0 50% 50%',
            pointerEvents: 'none' as const,
          }}
        />
      </div>

      {/* === HEAD BLOCK === */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(18),
          left: '50%',
          transform: 'translateX(-50%)',
          width: sc(24),
          height: sc(14),
          borderRadius: sc(2),
          background: 'linear-gradient(178deg, #6a6458, #4a4438)',
          border: '1px solid rgba(0,0,0,0.2)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
          zIndex: 4,
        }}
      >
        {/* Coral gap line */}
        <div
          style={{
            position: 'absolute',
            top: sc(2),
            left: '50%',
            transform: 'translateX(-50%)',
            width: sc(16),
            height: 1,
            background: 'rgba(196,112,110,0.3)',
            pointerEvents: 'none' as const,
          }}
        />
      </div>

      {/* === TENSION GUIDE DOTS === */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(24),
          left: sc(36),
          width: sc(6),
          height: sc(6),
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #888, #555)',
          border: '0.5px solid rgba(0,0,0,0.2)',
          zIndex: 4,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: sc(24),
          right: sc(36),
          width: sc(6),
          height: sc(6),
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #888, #555)',
          border: '0.5px solid rgba(0,0,0,0.2)',
          zIndex: 4,
        }}
      />

      {/* === VU METER === */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(4),
          left: sc(14),
          width: sc(36),
          height: sc(6),
          borderRadius: sc(2),
          background: '#0a0806',
          border: '1px solid rgba(0,0,0,0.3)',
          overflow: 'hidden',
          zIndex: 3,
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: sc(1),
            background: 'linear-gradient(90deg, rgba(196,112,110,0.3), rgba(196,112,110,0.5), rgba(196,112,110,0.8), #c4706e)',
            animation: 'mi-meter-l 1.4s ease infinite',
          }}
        />
      </div>

      {/* === COUNTER === */}
      <div
        style={{
          position: 'absolute',
          bottom: sc(4),
          right: sc(14),
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: sc(6),
          fontWeight: 700,
          color: '#c4706e',
          textShadow: '0 0 3px rgba(196,112,110,0.2)',
          background: 'rgba(0,0,0,0.4)',
          padding: `${sc(1)}px ${sc(4)}px`,
          borderRadius: sc(2),
          border: '1px solid rgba(0,0,0,0.3)',
          zIndex: 3,
          lineHeight: 1,
        }}
      >
        0347
      </div>
    </>
  );
}
