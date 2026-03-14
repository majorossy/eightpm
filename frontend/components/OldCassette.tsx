'use client';

import { useId } from 'react';

interface OldCassetteProps {
  name: string;
  albumName: string;
  artistName: string;
  showVenue?: string;
  showDate?: string;
  selected?: boolean;
  pickCount?: number;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}

function formatDate(d?: string): string {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
}

export default function OldCassette({ name, albumName, artistName, showVenue, showDate, selected, pickCount }: OldCassetteProps) {
  const uid = useId().replace(/:/g, '');
  const date = formatDate(showDate);
  const picks = pickCount != null && pickCount > 0 ? `${pickCount} pick${pickCount !== 1 ? 's' : ''}` : '';

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
          <pattern id={`${uid}-hatch`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5"/>
          </pattern>
          <pattern id={`${uid}-scratches`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <line x1="0" y1="15" x2="60" y2="18" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            <line x1="10" y1="40" x2="50" y2="38" stroke="rgba(255,255,255,0.03)" strokeWidth="0.7"/>
            <line x1="25" y1="5" x2="28" y2="55" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5"/>
          </pattern>
          <clipPath id={`${uid}-lclip`}>
            <path d="M0,0 H265 Q270,10 268,25 Q272,40 266,55 Q271,70 267,90 H0 Z"/>
          </clipPath>
        </defs>

        {/* Shell: scuffed dingy tan-brown */}
        <path d="M10,8 Q12,4 18,4 H304 Q310,4 312,8 L314,198 Q314,204 308,206 H12 Q6,206 4,200 Z" fill="#6b5535" stroke="#3d2c14" strokeWidth="1.5"/>
        <path d="M10,8 Q12,4 18,4 H304 Q310,4 312,8 L314,198 Q314,204 308,206 H12 Q6,206 4,200 Z" fill={`url(#${uid}-scratches)`}/>
        {/* worn edges */}
        <rect x="4" y="4" width="312" height="202" rx="10" fill="none" stroke="#2a1c0a" strokeWidth="6" opacity="0.4"/>
        {/* crack */}
        <path d="M285,190 L300,200 M292,185 L308,196" stroke="rgba(0,0,0,0.6)" strokeWidth="1" fill="none"/>
        <path d="M285,190 L300,200 M292,185 L308,196" stroke="rgba(255,220,120,0.08)" strokeWidth="0.5" fill="none"/>

        {/* Corner screws - mismatched, worn */}
        <circle cx="20" cy="18" r="5.5" fill="#4a3318" stroke="#2a1c0a" strokeWidth="1"/>
        <line x1="17" y1="18" x2="23" y2="18" stroke="#1a0e04" strokeWidth="1.2"/>
        <circle cx="300" cy="18" r="5.5" fill="#4a3318" stroke="#2a1c0a" strokeWidth="1"/>
        <line x1="297" y1="15" x2="303" y2="21" stroke="#1a0e04" strokeWidth="1.2"/>
        <circle cx="20" cy="192" r="5.5" fill="#4a3318" stroke="#2a1c0a" strokeWidth="1"/>
        <line x1="17" y1="192" x2="23" y2="192" stroke="#1a0e04" strokeWidth="1.2"/>
        <circle cx="300" cy="192" r="5.5" fill="#5a3a1a" stroke="#3a2810" strokeWidth="1"/>
        <line x1="297" y1="189" x2="303" y2="195" stroke="#1a0e04" strokeWidth="1.2"/>

        {/* Label: yellowed, peeling corner */}
        <g transform="translate(20,14) rotate(-1.5,138,48)">
          <rect x="2" y="2" width="276" height="92" rx="2" fill="rgba(0,0,0,0.3)"/>
          <rect x="0" y="0" width="276" height="90" rx="2" fill="#dfd08a" clipPath={`url(#${uid}-lclip)`}/>
          {/* paper lines */}
          <line x1="0" y1="26" x2="276" y2="26" stroke="rgba(150,120,40,0.15)" strokeWidth="0.5"/>
          <line x1="0" y1="40" x2="276" y2="40" stroke="rgba(150,120,40,0.1)" strokeWidth="0.5"/>
          <line x1="0" y1="54" x2="276" y2="54" stroke="rgba(150,120,40,0.1)" strokeWidth="0.5"/>
          <line x1="0" y1="68" x2="276" y2="68" stroke="rgba(150,120,40,0.1)" strokeWidth="0.5"/>
          {/* water stain ring */}
          <ellipse cx="230" cy="58" rx="28" ry="22" fill="none" stroke="rgba(120,80,10,0.12)" strokeWidth="4"/>
          {/* fade texture */}
          <rect x="0" y="0" width="276" height="90" rx="2" fill={`url(#${uid}-hatch)`} clipPath={`url(#${uid}-lclip)`} opacity="0.6"/>
          {/* faded patch */}
          <ellipse cx="80" cy="30" rx="50" ry="20" fill="rgba(255,255,240,0.25)"/>

          {/* Handwritten text - dynamic */}
          <text x="8" y="22" fontFamily="var(--font-caveat), cursive" fontSize="22" fontWeight="700" fill="#1a0e04" transform="rotate(-0.5,8,22)">
            {truncate(name, 22)}
          </text>
          <text x="9" y="40" fontFamily="var(--font-caveat), cursive" fontSize="13" fill="#3a2810">
            {truncate(showVenue || albumName, 28)}
          </text>
          <text x="9" y="56" fontFamily="var(--font-caveat), cursive" fontSize="13" fill="#3a2810" fontStyle="italic">
            {truncate(artistName, 22)}
          </text>
          {date && (
            <>
              <text x="8" y="74" fontFamily="var(--font-caveat), cursive" fontSize="12" fill="#5a3a10" transform="rotate(0.8,8,74)">
                {date}
              </text>
              <line x1="8" y1="76" x2={8 + date.length * 5.5} y2="75" stroke="#5a3a10" strokeWidth="0.8" opacity="0.5"/>
            </>
          )}
          <text x="8" y="86" fontFamily="var(--font-caveat), cursive" fontSize="10" fill="#7a5020">aud tape</text>

          {/* Picks annotation */}
          {picks && (
            <text x="175" y="50" fontFamily="var(--font-caveat), cursive" fontSize="10" fill="#5a3a10" transform="rotate(1.5,175,50)">
              {picks}
            </text>
          )}

          {/* Peeling corner bottom-right */}
          <path d="M210,75 Q240,72 265,68 L276,90 Q255,95 220,92 Z" fill="#c8b870" stroke="rgba(100,70,0,0.3)" strokeWidth="0.5"/>
          <path d="M215,80 Q245,78 268,74" stroke="rgba(0,0,0,0.2)" strokeWidth="3" fill="none"/>
          <path d="M220,82 Q248,80 270,76 L276,90 Q252,94 222,91 Z" fill="#f0e8b8" opacity="0.7"/>
          <path d="M214,84 Q244,82 270,78 L272,83 Q244,88 216,90 Z" fill="rgba(0,0,0,0.18)"/>
        </g>

        {/* Scotch tape strip */}
        <rect x="20" y="11" width="55" height="10" rx="1" fill="rgba(200,190,140,0.22)" stroke="rgba(180,170,120,0.18)" strokeWidth="0.5" transform="rotate(-1,48,16)"/>

        {/* Reel window */}
        <rect x="14" y="118" width="292" height="74" rx="6" fill="#1a0e04" stroke="#0a0600" strokeWidth="1"/>

        {/* Left reel - BIG (mostly wound) */}
        <circle cx="80" cy="155" r="28" fill="#2a1808" stroke="#1a0e04" strokeWidth="1.5"/>
        <circle cx="80" cy="155" r="20" fill="#3a2010" stroke="#1a0e04" strokeWidth="1"/>
        <circle cx="80" cy="155" r="6" fill="#1a0e04" stroke="#0a0600" strokeWidth="1"/>
        <line x1="80" y1="143" x2="80" y2="135" stroke="#1a0e04" strokeWidth="1.5"/>
        <line x1="91" y1="148" x2="97" y2="142" stroke="#1a0e04" strokeWidth="1.5"/>
        <line x1="69" y1="148" x2="63" y2="142" stroke="#1a0e04" strokeWidth="1.5"/>
        <path d="M108,155 Q130,155 140,155" stroke="#5a3a10" strokeWidth="2.5" fill="none"/>

        {/* Right reel - SMALL (mostly used up) */}
        <circle cx="240" cy="155" r="18" fill="#2a1808" stroke="#1a0e04" strokeWidth="1.5"/>
        <circle cx="240" cy="155" r="11" fill="#3a2010" stroke="#1a0e04" strokeWidth="1"/>
        <circle cx="240" cy="155" r="5" fill="#1a0e04" stroke="#0a0600" strokeWidth="1"/>
        <line x1="240" y1="149" x2="240" y2="144" stroke="#1a0e04" strokeWidth="1.5"/>
        <line x1="246" y1="151" x2="250" y2="147" stroke="#1a0e04" strokeWidth="1.5"/>
        <line x1="234" y1="151" x2="230" y2="147" stroke="#1a0e04" strokeWidth="1.5"/>
        <path d="M140,155 Q175,155 222,155" stroke="#5a3a10" strokeWidth="2.5" fill="none"/>

        {/* Loose tape loop */}
        <path d="M140,155 Q141,160 143,162 Q145,163 147,160 Q148,157 140,155" fill="none" stroke="#5a3a10" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}
