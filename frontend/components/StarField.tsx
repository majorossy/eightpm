'use client';

import { useMemo } from 'react';

// Deterministic pseudo-random from seed (mulberry32)
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Star {
  id: number;
  left: number;   // %
  top: number;     // %
  size: number;    // rem
  opacity: number;
  delay: number;   // s
}

const STAR_COUNT = 60;

export default function StarField() {
  const stars = useMemo<Star[]>(() => {
    const rand = mulberry32(8675309);
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      left: rand() * 100,
      top: rand() * 100,
      size: 0.35 + rand() * 0.45,       // 0.35–0.8rem
      opacity: 0.06 + rand() * 0.14,     // 0.06–0.20
      delay: rand() * 6,                  // 0–6s twinkle offset
    }));
  }, []);

  return (
    <div
      className="star-field"
      aria-hidden="true"
    >
      {stars.map((s) => (
        <span
          key={s.id}
          className="star-field-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}rem`,
            '--tw-base': s.opacity,
            animationDelay: `${s.delay}s`,
          } as React.CSSProperties}
        >
          ★
        </span>
      ))}
    </div>
  );
}
