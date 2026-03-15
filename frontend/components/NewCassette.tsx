'use client';

import { useId } from 'react';

interface NewCassetteProps {
  name: string;
  albumName: string;
  artistName: string;
  selected?: boolean;
  pickCount?: number;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}

export default function NewCassette({ name, albumName, artistName, selected, pickCount }: NewCassetteProps) {
  const uid = useId().replace(/:/g, '');
  const picksLabel = pickCount != null && pickCount > 0 ? `${pickCount} pick${pickCount !== 1 ? 's' : ''}` : 'Type II';

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden transition-shadow"
      style={{
        aspectRatio: '320 / 210',
        boxShadow: selected
          ? '0 4px 16px rgba(0,0,0,0.3), 0 0 12px color-mix(in srgb, var(--secondary) 40%, transparent)'
          : '0 4px 16px rgba(0,0,0,0.3)',
        border: selected ? '2px solid var(--secondary)' : '2px solid transparent',
        borderRadius: 10,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 320 210" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-shell`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8eef2"/>
            <stop offset="100%" stopColor="#c8d4da"/>
          </linearGradient>
          <linearGradient id={`${uid}-holo`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a8d8ea" stopOpacity="0.7"/>
            <stop offset="25%" stopColor="#c8b4e8" stopOpacity="0.7"/>
            <stop offset="50%" stopColor="#a8e8d0" stopOpacity="0.7"/>
            <stop offset="75%" stopColor="#f0d890" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#a8d8ea" stopOpacity="0.7"/>
          </linearGradient>
          <linearGradient id={`${uid}-reel`} x1="20%" y1="20%" x2="80%" y2="80%">
            <stop offset="0%" stopColor="#e0f4ff"/>
            <stop offset="60%" stopColor="#8ab8d0"/>
            <stop offset="100%" stopColor="#4a8aaa"/>
          </linearGradient>
          <pattern id={`${uid}-wrap`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
          </pattern>
          <linearGradient id={`${uid}-sheen`} x1="0%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)"/>
            <stop offset="50%" stopColor="rgba(255,255,255,0.04)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.10)"/>
          </linearGradient>
        </defs>

        {/* Shell: white/light grey, pristine */}
        <rect x="4" y="4" width="312" height="202" rx="10" fill={`url(#${uid}-shell)`} stroke="#a8bac4" strokeWidth="1"/>
        <rect x="4" y="4" width="312" height="20" rx="10" fill="rgba(255,255,255,0.5)"/>
        <rect x="4" y="14" width="312" height="6" fill="rgba(255,255,255,0.5)"/>

        {/* Corner screws - perfect, chrome */}
        {[[20,18],[300,18],[20,192],[300,192]].map(([cx,cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="5.5" fill="#d0dce4" stroke="#a8bac4" strokeWidth="1"/>
            <line x1={cx-3} y1={cy} x2={cx+3} y2={cy} stroke="#7a9aaa" strokeWidth="1.2"/>
            <line x1={cx} y1={cy-3} x2={cx} y2={cy+3} stroke="#7a9aaa" strokeWidth="1.2"/>
          </g>
        ))}

        {/* Label: printed directly on shell */}
        <rect x="20" y="14" width="280" height="96" rx="4" fill="#0a1a2a"/>
        <rect x="20" y="14" width="280" height="18" rx="4" fill="#0d3a52"/>
        <rect x="20" y="24" width="280" height="8" fill="#0d3a52"/>
        {/* Holographic strip */}
        <rect x="20" y="26" width="280" height="6" fill={`url(#${uid}-holo)`}/>

        {/* Header text */}
        <text x="28" y="24" fontFamily="var(--font-space-mono), monospace" fontSize="10" fontWeight="700" fill="#5ad0f8" letterSpacing="0.14em">AUTO MIX</text>
        <text x="258" y="24" fontFamily="var(--font-space-mono), monospace" fontSize="10" fill="#3a8aaa" textAnchor="end">{picksLabel}</text>

        {/* Track name */}
        <text x="28" y="56" fontFamily="var(--font-dm-serif), serif" fontSize="29" fill="#f0f8ff" letterSpacing="0.01em">
          {truncate(name, 18)}
        </text>
        <line x1="28" y1="62" x2="220" y2="62" stroke="#1a4a6a" strokeWidth="0.5"/>
        <text x="28" y="75" fontFamily="var(--font-space-mono), monospace" fontSize="14" fill="#5a9ab8" letterSpacing="0.04em">
          {truncate(albumName, 26)}
        </text>
        <text x="28" y="91" fontFamily="var(--font-dm-serif), serif" fontStyle="italic" fontSize="16" fill="#4a8aaa">
          {truncate(artistName, 20)}
        </text>
        {/* Barcode */}
        <g transform="translate(232,46)">
          <rect x="0" y="0" width="1.5" height="32" fill="#1a5a7a"/>
          <rect x="3" y="0" width="3" height="32" fill="#1a5a7a"/>
          <rect x="8" y="0" width="1.5" height="32" fill="#1a5a7a"/>
          <rect x="11" y="0" width="2.5" height="32" fill="#1a5a7a"/>
          <rect x="15" y="0" width="1" height="32" fill="#1a5a7a"/>
          <rect x="18" y="0" width="3" height="32" fill="#1a5a7a"/>
          <rect x="23" y="0" width="1.5" height="32" fill="#1a5a7a"/>
          <rect x="26" y="0" width="2" height="32" fill="#1a5a7a"/>
          <rect x="30" y="0" width="1" height="32" fill="#1a5a7a"/>
          <text x="15" y="42" fontFamily="var(--font-space-mono), monospace" fontSize="8" fill="#1a5a7a" textAnchor="middle">8PM.ME</text>
        </g>

        {/* Reel window */}
        <rect x="14" y="122" width="292" height="74" rx="6" fill="#d0dce4" stroke="#a8bac4" strokeWidth="0.5"/>
        <rect x="18" y="126" width="284" height="66" rx="4" fill="#b8c8d0"/>

        {/* Both reels - IDENTICAL (factory sealed) */}
        {[90, 230].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="159" r="26" fill={`url(#${uid}-reel)`} stroke="#8ab8cc" strokeWidth="1.5"/>
            <circle cx={cx} cy="159" r="18" fill="#c8dce8" stroke="#9ab8c8" strokeWidth="1"/>
            <circle cx={cx} cy="159" r="6" fill="#8ab0c4" stroke="#6a9ab4" strokeWidth="1"/>
            <line x1={cx} y1="148" x2={cx} y2="141" stroke="#6a9ab4" strokeWidth="1.2"/>
            <line x1={cx+9} y1="153" x2={cx+14} y2="148" stroke="#6a9ab4" strokeWidth="1.2"/>
            <line x1={cx-9} y1="153" x2={cx-14} y2="148" stroke="#6a9ab4" strokeWidth="1.2"/>
          </g>
        ))}
        <path d="M116,159 Q160,162 204,159" stroke="#8aaaba" strokeWidth="2" fill="none"/>

        {/* Shrink wrap overlay */}
        <rect x="4" y="4" width="312" height="202" rx="10" fill={`url(#${uid}-wrap)`} opacity="0.8"/>
        <rect x="4" y="4" width="312" height="202" rx="10" fill={`url(#${uid}-sheen)`}/>
        <line x1="4" y1="100" x2="316" y2="98" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="4" y1="106" x2="316" y2="104" stroke="rgba(200,220,240,0.15)" strokeWidth="0.5" strokeDasharray="2,6"/>
        {/* wrap corner tucks */}
        <path d="M4,4 Q8,8 12,4" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" fill="none"/>
        <path d="M316,4 Q312,8 308,4" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" fill="none"/>
        <path d="M4,206 Q8,202 12,206" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" fill="none"/>
        <path d="M316,206 Q312,202 308,206" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" fill="none"/>
      </svg>
    </div>
  );
}
