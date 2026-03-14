'use client';

import { useId } from 'react';

interface BestCassetteProps {
  name: string;
  albumName: string;
  artistName: string;
  showVenue?: string;
  selected?: boolean;
  versionCount?: number;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}

export default function BestCassette({ name, albumName, artistName, showVenue, selected, versionCount }: BestCassetteProps) {
  const uid = useId().replace(/:/g, '');

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden transition-shadow"
      style={{
        aspectRatio: '380 / 225',
        boxShadow: selected
          ? '0 4px 20px rgba(0,0,0,0.4), 0 0 16px rgba(200,160,20,0.35)'
          : '0 4px 16px rgba(0,0,0,0.3)',
        border: selected ? '2px solid #c8940a' : '2px solid transparent',
        borderRadius: 12,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 380 225" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-shell`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1a10"/>
            <stop offset="50%" stopColor="#0e0c06"/>
            <stop offset="100%" stopColor="#1a1608"/>
          </linearGradient>
          <linearGradient id={`${uid}-foil`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5e070"/>
            <stop offset="18%" stopColor="#c8940a"/>
            <stop offset="35%" stopColor="#f0d040"/>
            <stop offset="52%" stopColor="#a07008"/>
            <stop offset="68%" stopColor="#e8c828"/>
            <stop offset="84%" stopColor="#b08010"/>
            <stop offset="100%" stopColor="#f0d848"/>
          </linearGradient>
          <pattern id={`${uid}-lines`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,240,120,0.18)" strokeWidth="1.2"/>
          </pattern>
          <linearGradient id={`${uid}-reel`} x1="15%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#f5e070"/>
            <stop offset="40%" stopColor="#c8940a"/>
            <stop offset="100%" stopColor="#7a5804"/>
          </linearGradient>
          <linearGradient id={`${uid}-emboss`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,240,120,0.3)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)"/>
          </linearGradient>
        </defs>

        {/* Shell: near-black, premium matte */}
        <rect x="4" y="4" width="372" height="217" rx="12" fill={`url(#${uid}-shell)`} stroke="#3a3010" strokeWidth="1.5"/>
        <rect x="4" y="4" width="372" height="217" rx="12" fill="none" stroke="rgba(200,160,20,0.18)" strokeWidth="3"/>
        <rect x="4" y="4" width="372" height="16" rx="12" fill="rgba(255,220,80,0.06)"/>

        {/* Corner screws - gold-toned */}
        {[[22,20],[358,20],[22,205],[358,205]].map(([cx,cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="6" fill="#1e1a10" stroke="#c8940a" strokeWidth="1.2"/>
            <line x1={cx-3} y1={cy} x2={cx+3} y2={cy} stroke="#c8940a" strokeWidth="1.2"/>
            <line x1={cx} y1={cy-3} x2={cx} y2={cy+3} stroke="#c8940a" strokeWidth="1.2"/>
          </g>
        ))}

        {/* Gold foil label */}
        <g transform="translate(24,14)">
          <rect x="0" y="0" width="332" height="108" rx="4" fill={`url(#${uid}-foil)`}/>
          <rect x="0" y="0" width="332" height="108" rx="4" fill={`url(#${uid}-lines)`}/>
          <rect x="0" y="0" width="332" height="108" rx="4" fill={`url(#${uid}-emboss)`} opacity="0.5"/>
          {/* Inner border: debossed gold rule */}
          <rect x="5" y="5" width="322" height="98" rx="2" fill="none" stroke="rgba(255,240,100,0.35)" strokeWidth="0.8"/>
          <rect x="7" y="7" width="318" height="94" rx="2" fill="none" stroke="rgba(80,50,0,0.2)" strokeWidth="0.5"/>

          {/* Top band */}
          <rect x="0" y="0" width="332" height="20" rx="4" fill="rgba(0,0,0,0.55)"/>
          <rect x="0" y="12" width="332" height="8" fill="rgba(0,0,0,0.55)"/>
          <text x="166" y="13.5" fontFamily="var(--font-space-mono), monospace" fontSize="10" fontWeight="700" fill="#f0c840" textAnchor="middle" letterSpacing="0.25em">
            ★  BEST VERSION  ★
          </text>

          {/* Gold rule below header */}
          <line x1="14" y1="21" x2="318" y2="21" stroke="rgba(200,150,10,0.6)" strokeWidth="0.5"/>

          {/* Star seal */}
          <polygon points="50,34 54.8,48.6 70,48.6 57.6,57.6 62.4,72.2 50,63.2 37.6,72.2 42.4,57.6 30,48.6 45.2,48.6" fill="rgba(0,0,0,0.3)" stroke="rgba(200,150,10,0.5)" strokeWidth="1"/>
          <polygon points="50,36 54.2,49 68,49 57,57.4 61.2,70.8 50,62.4 38.8,70.8 43,57.4 32,49 45.8,49" fill="rgba(255,220,60,0.15)" stroke="#c8940a" strokeWidth="0.8"/>
          <text x="50" y="57" fontFamily="var(--font-space-mono), monospace" fontSize="9" fontWeight="700" fill="#c8940a" textAnchor="middle">★</text>

          {/* Track title */}
          <text x="96" y="48" fontFamily="var(--font-dm-serif), serif" fontSize="36" fill="#0e0c06" letterSpacing="0.01em" opacity="0.85">
            {truncate(name, 16)}
          </text>
          <line x1="96" y1="55" x2="295" y2="55" stroke="rgba(100,70,0,0.3)" strokeWidth="0.6"/>
          <text x="96" y="67" fontFamily="var(--font-space-mono), monospace" fontSize="11.5" fill="#5a3a04" letterSpacing="0.05em">
            {truncate(showVenue || albumName, 24)}
          </text>
          <text x="96" y="81" fontFamily="var(--font-dm-serif), serif" fontStyle="italic" fontSize="16" fill="#7a5008">
            {truncate(artistName, 20)}
          </text>

          {/* Rating stars */}
          <text x="96" y="97" fontFamily="var(--font-space-mono), monospace" fontSize="16" fill="#c8940a" letterSpacing="0.12em">★ ★ ★ ★ ★</text>

          {/* Version count badge */}
          {versionCount != null && versionCount > 0 && (
            <g>
              <rect x="270" y="26" width="52" height="28" rx="3" fill="rgba(0,0,0,0.4)" stroke="rgba(200,150,10,0.4)" strokeWidth="0.7"/>
              <text x="296" y="37" fontFamily="var(--font-space-mono), monospace" fontSize="8.5" fill="#c8b060" textAnchor="middle" letterSpacing="0.08em">VERSION</text>
              <text x="296" y="50" fontFamily="var(--font-dm-serif), serif" fontSize="17" fill="#f0d040" textAnchor="middle">{versionCount}</text>
            </g>
          )}
        </g>

        {/* Reel window */}
        <rect x="16" y="134" width="348" height="78" rx="7" fill="#080604" stroke="rgba(200,150,10,0.25)" strokeWidth="1"/>
        <rect x="20" y="138" width="340" height="70" rx="5" fill="#0a0806"/>

        {/* Left reel: gold */}
        <circle cx="100" cy="173" r="28" fill={`url(#${uid}-reel)`} stroke="#c8940a" strokeWidth="1.2"/>
        <circle cx="100" cy="173" r="20" fill="#1e1a08" stroke="#c8940a" strokeWidth="0.8"/>
        <circle cx="100" cy="173" r="7" fill="#0a0804" stroke="#c8940a" strokeWidth="1"/>
        <line x1="100" y1="161" x2="100" y2="153" stroke="#c8940a" strokeWidth="1.2"/>
        <line x1="111" y1="166" x2="117" y2="160" stroke="#c8940a" strokeWidth="1.2"/>
        <line x1="89" y1="166" x2="83" y2="160" stroke="#c8940a" strokeWidth="1.2"/>
        <circle cx="100" cy="173" r="28" fill="none" stroke="rgba(255,240,100,0.2)" strokeWidth="1.5"/>

        {/* Right reel: gold */}
        <circle cx="280" cy="173" r="28" fill={`url(#${uid}-reel)`} stroke="#c8940a" strokeWidth="1.2"/>
        <circle cx="280" cy="173" r="20" fill="#1e1a08" stroke="#c8940a" strokeWidth="0.8"/>
        <circle cx="280" cy="173" r="7" fill="#0a0804" stroke="#c8940a" strokeWidth="1"/>
        <line x1="280" y1="161" x2="280" y2="153" stroke="#c8940a" strokeWidth="1.2"/>
        <line x1="291" y1="166" x2="297" y2="160" stroke="#c8940a" strokeWidth="1.2"/>
        <line x1="269" y1="166" x2="263" y2="160" stroke="#c8940a" strokeWidth="1.2"/>
        <circle cx="280" cy="173" r="28" fill="none" stroke="rgba(255,240,100,0.2)" strokeWidth="1.5"/>

        {/* Tape between reels */}
        <path d="M128,173 Q190,170 252,173" stroke="#a07808" strokeWidth="2.5" fill="none"/>
      </svg>
    </div>
  );
}
