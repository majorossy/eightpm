'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

const STORAGE_KEY = '8pm-early-access';

// Lot palette colors for procedural mosaic tiles
const TILE_PALETTES = [
  // Teal family
  ['#5ab8a0', '#4a9a88', '#3e8878'],
  // Lavender family
  ['#9088c8', '#7a70b0', '#6860a0'],
  // Gold family
  ['#c8b468', '#b8a458', '#a89448'],
  // Coral family
  ['#cc2828', '#b02020', '#981818'],
  // Navy family (most common — blends with bg)
  ['#1e2e45', '#253850', '#2a4060', '#1a2840', '#223450'],
  // Senary blue-gray
  ['#3e5878', '#4a6888', '#345068'],
];

// Deterministic pseudo-random from seed (no Math.random — stable across renders)
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function EarlyAccessGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Allow Lighthouse / dev bypass via ?_lh=1
    if (process.env.NODE_ENV === 'development') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('_lh') === '1') {
        setIsAuthenticated(true);
        return;
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setIsAuthenticated(true);
      fetch('/api/auth/early-access')
        .then(r => r.json())
        .then(data => {
          if (!data.authenticated) {
            localStorage.removeItem(STORAGE_KEY);
            setIsAuthenticated(false);
          }
        })
        .catch(() => {});
    } else {
      fetch('/api/auth/early-access')
        .then(r => r.json())
        .then(data => {
          if (data.authenticated) {
            localStorage.setItem(STORAGE_KEY, 'true');
          }
          setIsAuthenticated(data.authenticated);
        })
        .catch(() => setIsAuthenticated(false));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setSuccess(true);
        setTimeout(() => setIsAuthenticated(true), 800);
      } else {
        setError('That\u2019s not it \u2014 try again');
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
        inputRef.current?.select();
      }
    } catch {
      setError('Connection error. Try again.');
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate stable mosaic tiles — weighted toward navy so pops of color feel like highlights
  const tiles = useMemo(() => {
    return Array.from({ length: 144 }, (_, i) => {
      const r = seededRandom(i);
      // 60% navy/senary (blends), 10% each for teal/lavender/gold/coral
      let paletteIndex: number;
      if (r < 0.35) paletteIndex = 4;      // navy
      else if (r < 0.50) paletteIndex = 5; // senary
      else if (r < 0.65) paletteIndex = 0; // teal
      else if (r < 0.78) paletteIndex = 1; // lavender
      else if (r < 0.90) paletteIndex = 2; // gold
      else paletteIndex = 3;               // coral (rarest)

      const palette = TILE_PALETTES[paletteIndex];
      const colorIndex = Math.floor(seededRandom(i + 500) * palette.length);
      const color = palette[colorIndex];
      const opacity = 0.15 + seededRandom(i + 1000) * 0.25;

      // Some tiles get a subtle gradient for depth
      const useGradient = seededRandom(i + 2000) > 0.6;
      const color2Index = (colorIndex + 1) % palette.length;
      const angle = Math.floor(seededRandom(i + 3000) * 360);

      const bg = useGradient
        ? `linear-gradient(${angle}deg, ${color}, ${palette[color2Index]})`
        : color;

      return (
        <div
          key={i}
          className="rounded-md"
          style={{
            aspectRatio: '1',
            opacity,
            background: bg,
          }}
          aria-hidden="true"
        />
      );
    });
  }, []);

  // Still checking
  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 bg-[#111d2e] z-[99999] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-white/80 tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>8pm.me</h1>
        <div className="w-8 h-8 border-2 border-[#5ab8a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-[#111d2e] overflow-hidden">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-6px); }
          30%, 70% { transform: translateX(6px); }
        }
        @keyframes mosaic-scroll {
          0% { transform: translate(-10%, -10%) rotate(-8deg); }
          100% { transform: translate(-10%, -35%) rotate(-8deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(90, 184, 160, 0.15), 0 0 60px rgba(30, 46, 69, 0.4); }
          50% { box-shadow: 0 0 50px rgba(90, 184, 160, 0.25), 0 0 80px rgba(30, 46, 69, 0.6); }
        }
        @keyframes success-flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        .shake-card { animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
        .mosaic-scroll { animation: mosaic-scroll 90s linear infinite alternate; }
        .fade-up { animation: fade-up 0.6s ease-out both; }
        .fade-up-delay-1 { animation-delay: 0.1s; }
        .fade-up-delay-2 { animation-delay: 0.2s; }
        .fade-up-delay-3 { animation-delay: 0.35s; }
        .fade-up-delay-4 { animation-delay: 0.5s; }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .success-overlay { animation: success-flash 0.8s ease-out forwards; }
      `}</style>

      {/* Procedural mosaic background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="mosaic-scroll"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 100px)',
            gap: '6px',
            width: '200%',
            height: '200%',
            position: 'absolute',
            top: '-20%',
            left: '-20%',
          }}
        >
          {tiles}
        </div>
        {/* Dark overlay to keep text readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#111d2e]/50 via-[#111d2e]/75 to-[#111d2e]/95" />
        {/* Teal glow (top-center) */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(90,184,160,0.1) 0%, transparent 65%)' }}
        />
        {/* Lavender glow (bottom-right accent) */}
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(144,136,200,0.06) 0%, transparent 60%)' }}
        />
      </div>

      {/* Center card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6">

          {/* Logo + waveform */}
          <div className="text-center fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#1e2e45] border border-[#5ab8a0]/30 mb-5 pulse-glow">
              <svg viewBox="0 0 64 64" className="w-12 h-12">
                <rect x="4"  y="28" width="4.5" height="8"  rx="2.25" fill="rgba(62,88,120,0.5)"/>
                <rect x="10" y="22" width="4.5" height="20" rx="2.25" fill="#5ab8a0" opacity="0.75"/>
                <rect x="16" y="16" width="4.5" height="32" rx="2.25" fill="#c8b468"/>
                <rect x="22" y="24" width="4.5" height="16" rx="2.25" fill="#9088c8" opacity="0.6"/>
                <rect x="28" y="12" width="4.5" height="40" rx="2.25" fill="#f5f0e8" opacity="0.9"/>
                <rect x="34" y="20" width="4.5" height="24" rx="2.25" fill="#cc2828" opacity="0.7"/>
                <rect x="40" y="14" width="4.5" height="36" rx="2.25" fill="#5ab8a0"/>
                <rect x="46" y="22" width="4.5" height="20" rx="2.25" fill="#9088c8" opacity="0.45"/>
                <rect x="52" y="27" width="4.5" height="10" rx="2.25" fill="rgba(62,88,120,0.5)"/>
              </svg>
            </div>
            <h1
              className="text-4xl font-bold text-white mb-1 tracking-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              8pm.me
            </h1>
          </div>

          {/* Alpha badge + messaging */}
          <div className="text-center fade-up fade-up-delay-1 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9088c8]/10 border border-[#9088c8]/25">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5ab8a0] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5ab8a0]" />
              </span>
              <span className="text-xs font-semibold text-[#9088c8] tracking-wider uppercase">
                Alpha Build
              </span>
            </div>
            <p className="text-[#5ab8a0]/50 text-lg italic tracking-wide" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Pedo mellon a minno
            </p>
            <p className="text-[#6a8a9a]/60 text-xs tracking-wider uppercase">
              Band venue
            </p>
          </div>

          {/* Password form */}
          <form
            onSubmit={handleSubmit}
            className={`fade-up fade-up-delay-2 ${shaking ? 'shake-card' : ''}`}
          >
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className={`w-full px-5 py-4 bg-[#1e2e45]/60 border rounded-xl text-white placeholder-[#3e5878] text-center text-lg tracking-widest focus:outline-none transition-all duration-200 ${
                  error
                    ? 'border-[#cc2828]/50 focus:border-[#cc2828]/70'
                    : 'border-[#3e5878]/50 focus:border-[#5ab8a0]/50 focus:bg-[#1e2e45]/80'
                }`}
                placeholder="where'd we meet?"
                autoComplete="current-password"
                autoFocus
              />
              {error && (
                <p className="absolute -bottom-6 left-0 right-0 text-[#cc2828]/80 text-xs text-center">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="w-full mt-8 py-3.5 rounded-xl font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-sm tracking-wider uppercase text-[#111d2e]"
              style={{ background: 'linear-gradient(to right, #c8b468, #d4c478)' }}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Checking...
                </span>
              ) : (
                'Enter'
              )}
            </button>
          </form>

          {/* Tester callout */}
          <div className="fade-up fade-up-delay-3 flex items-start gap-3 p-4 rounded-xl bg-[#1e2e45]/40 border border-[#3e5878]/30">
            <span className="text-2xl mt-0.5" role="img" aria-label="test tube">&#x1F9EA;</span>
            <div>
              <p className="text-[#5ab8a0]/90 text-xs font-semibold uppercase tracking-wider mb-1">
                You&apos;re an alpha tester
              </p>
              <p className="text-[#6a8a9a]/70 text-xs leading-relaxed">
                Poke around, break stuff, and tell us what you think.
                Your feedback shapes what 8pm becomes.
              </p>
            </div>
          </div>

          {/* Footer stats */}
          <div className="fade-up fade-up-delay-4 flex justify-center gap-6 pt-2">
            <div className="text-center">
              <div className="text-[#f5f0e8]/80 text-lg font-bold">35+</div>
              <div className="text-[#3e5878] text-[10px] uppercase tracking-wider">Artists</div>
            </div>
            <div className="text-[#3e5878]/50">|</div>
            <div className="text-center">
              <div className="text-[#f5f0e8]/80 text-lg font-bold">50k+</div>
              <div className="text-[#3e5878] text-[10px] uppercase tracking-wider">Tracks</div>
            </div>
            <div className="text-[#3e5878]/50">|</div>
            <div className="text-center">
              <div className="text-[#f5f0e8]/80 text-lg font-bold">Free</div>
              <div className="text-[#3e5878] text-[10px] uppercase tracking-wider">Always</div>
            </div>
          </div>
        </div>
      </div>

      {/* Success flash overlay */}
      {success && (
        <div className="fixed inset-0 z-50 bg-[#5ab8a0]/10 success-overlay pointer-events-none" />
      )}
    </div>
  );
}
