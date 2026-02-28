'use client';

// 1. Empty Vinyl Sleeve - record case with no record inside
export function EmptyVinylSleeve({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      {/* Sleeve outer */}
      <rect x="15" y="20" width="95" height="100" rx="3" fill="#3a3632" stroke="#4a4642" strokeWidth="2" />

      {/* Sleeve opening (darker inside) */}
      <path d="M105 25 L105 115 L100 115 L100 30 Z" fill="#252220" />

      {/* Sleeve design/label area */}
      <rect x="25" y="35" width="70" height="70" rx="2" fill="#2d2a26" />
      <circle cx="60" cy="70" r="25" fill="none" stroke="#4a4642" strokeWidth="1" strokeDasharray="4 3" />
      <circle cx="60" cy="70" r="8" fill="#4a4642" opacity="0.5" />

      {/* Empty indication - no record peeking out */}
      <text x="60" y="120" textAnchor="middle" fill="#6a5a4a" fontSize="8" fontFamily="system-ui">EMPTY</text>

      {/* Question mark */}
      <text x="60" y="75" textAnchor="middle" fill="#5a5550" fontSize="20" fontFamily="system-ui">?</text>
    </svg>
  );
}

// 2. Broken Cassette Tape - tape spooled out
export function BrokenCassette({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      {/* Cassette body */}
      <rect x="20" y="40" width="100" height="60" rx="4" fill="#3a3632" stroke="#4a4642" strokeWidth="2" />

      {/* Tape window */}
      <rect x="35" y="50" width="70" height="30" rx="2" fill="#1c1a17" />

      {/* Left reel */}
      <circle cx="55" cy="65" r="10" fill="#2d2a26" stroke="#4a4642" strokeWidth="1" />
      <circle cx="55" cy="65" r="4" fill="#4a4642" />

      {/* Right reel (less tape) */}
      <circle cx="85" cy="65" r="10" fill="#2d2a26" stroke="#4a4642" strokeWidth="1" />
      <circle cx="85" cy="65" r="7" fill="#3a3632" />
      <circle cx="85" cy="65" r="4" fill="#4a4642" />

      {/* Spooled out tape - tangled mess */}
      <path d="M70 80 Q60 95 45 100 Q30 105 35 115 Q40 125 55 120 Q70 115 75 105"
            stroke="#1a1816" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M70 80 Q80 90 90 95 Q105 100 100 110 Q95 120 80 118"
            stroke="#1a1816" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M55 120 Q65 125 75 118"
            stroke="#1a1816" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Label */}
      <rect x="45" y="85" width="50" height="8" rx="1" fill="#4a4642" />
    </svg>
  );
}

// 3. Empty Turntable - platter with no record
export function EmptyTurntable({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      {/* Base */}
      <rect x="15" y="25" width="110" height="90" rx="6" fill="#2d2a26" stroke="#3a3632" strokeWidth="2" />

      {/* Platter */}
      <circle cx="60" cy="70" r="35" fill="#1c1a17" stroke="#3a3632" strokeWidth="2" />

      {/* Platter mat texture */}
      <circle cx="60" cy="70" r="30" fill="none" stroke="#252220" strokeWidth="1" />
      <circle cx="60" cy="70" r="22" fill="none" stroke="#252220" strokeWidth="1" />
      <circle cx="60" cy="70" r="14" fill="none" stroke="#252220" strokeWidth="1" />

      {/* Spindle */}
      <circle cx="60" cy="70" r="4" fill="#4a4642" />

      {/* Tonearm base */}
      <circle cx="110" cy="40" r="8" fill="#3a3632" />

      {/* Tonearm (resting position) */}
      <path d="M110 40 L105 45 L85 95" stroke="#4a4642" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="85" cy="97" rx="4" ry="2" fill="#5a5550" />

      {/* "No record" indicator */}
      <text x="60" y="73" textAnchor="middle" fill="#4a4642" fontSize="12" fontFamily="system-ui">?</text>

      {/* Power light (off) */}
      <circle cx="115" cy="105" r="3" fill="#3a3632" />
    </svg>
  );
}

// 4. Radio with Static/No Signal
export function StaticRadio({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      {/* Radio body */}
      <rect x="20" y="35" width="100" height="70" rx="8" fill="#3a3632" stroke="#4a4642" strokeWidth="2" />

      {/* Speaker grille */}
      <circle cx="55" cy="70" r="22" fill="#2d2a26" />
      <g stroke="#3a3632" strokeWidth="1.5">
        <circle cx="55" cy="70" r="18" fill="none" />
        <circle cx="55" cy="70" r="14" fill="none" />
        <circle cx="55" cy="70" r="10" fill="none" />
        <circle cx="55" cy="70" r="6" fill="none" />
      </g>

      {/* Tuner dial */}
      <rect x="85" y="50" width="25" height="15" rx="2" fill="#1c1a17" />
      <line x1="90" y1="57" x2="105" y2="57" stroke="#4a4642" strokeWidth="1" />
      <line x1="97" y1="53" x2="97" y2="62" stroke="#d4a060" strokeWidth="2" />

      {/* Knobs */}
      <circle cx="90" cy="80" r="6" fill="#2d2a26" stroke="#4a4642" strokeWidth="1" />
      <circle cx="105" cy="80" r="6" fill="#2d2a26" stroke="#4a4642" strokeWidth="1" />

      {/* Antenna */}
      <line x1="100" y1="35" x2="115" y2="15" stroke="#4a4642" strokeWidth="2" strokeLinecap="round" />

      {/* Static waves (no signal) */}
      <g stroke="#5a5550" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <path d="M15 25 Q20 20 15 15" fill="none" />
        <path d="M10 30 Q18 22 10 14" fill="none" />
        <path d="M125 25 Q120 20 125 15" fill="none" />
        <path d="M130 30 Q122 22 130 14" fill="none" />
      </g>

      {/* X over speaker */}
      <g stroke="#6a5a4a" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <line x1="42" y1="57" x2="68" y2="83" />
        <line x1="68" y1="57" x2="42" y2="83" />
      </g>
    </svg>
  );
}

// 5. Empty Concert Stage
export function EmptyStage({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      {/* Stage floor */}
      <path d="M10 100 L70 120 L130 100 L130 110 L70 130 L10 110 Z" fill="#2d2a26" />
      <path d="M10 100 L70 120 L130 100" fill="none" stroke="#3a3632" strokeWidth="1" />

      {/* Back curtain */}
      <rect x="20" y="25" width="100" height="75" fill="#252220" />
      <path d="M20 25 Q35 30 35 100 M55 25 Q55 35 50 100 M75 25 Q70 30 75 100 M95 25 Q100 35 95 100 M120 25 Q105 30 105 100"
            stroke="#2d2a26" strokeWidth="2" fill="none" />

      {/* Spotlights */}
      <ellipse cx="45" cy="95" rx="15" ry="5" fill="#3a3632" opacity="0.3" />
      <ellipse cx="95" cy="95" rx="15" ry="5" fill="#3a3632" opacity="0.3" />

      {/* Light beams (dim) */}
      <path d="M30 10 L45 95 L20 95 Z" fill="#4a4642" opacity="0.1" />
      <path d="M110 10 L95 95 L120 95 Z" fill="#4a4642" opacity="0.1" />

      {/* Spotlights at top */}
      <ellipse cx="30" cy="10" rx="8" ry="4" fill="#3a3632" />
      <ellipse cx="110" cy="10" rx="8" ry="4" fill="#3a3632" />

      {/* Mic stand (alone on stage) */}
      <line x1="70" y1="70" x2="70" y2="100" stroke="#4a4642" strokeWidth="2" />
      <circle cx="70" cy="68" r="5" fill="#3a3632" stroke="#4a4642" strokeWidth="1" />
      <path d="M60 100 L80 100" stroke="#4a4642" strokeWidth="2" />
    </svg>
  );
}

// 6. Empty Reel-to-Reel
export function EmptyReelToReel({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      {/* Machine body */}
      <rect x="15" y="20" width="110" height="100" rx="6" fill="#2d2a26" stroke="#3a3632" strokeWidth="2" />

      {/* Left reel (empty) */}
      <circle cx="45" cy="55" r="25" fill="#1c1a17" stroke="#3a3632" strokeWidth="2" />
      <circle cx="45" cy="55" r="20" fill="none" stroke="#252220" strokeWidth="1" strokeDasharray="4 2" />
      <circle cx="45" cy="55" r="8" fill="#3a3632" />
      <circle cx="45" cy="55" r="3" fill="#4a4642" />

      {/* Right reel (empty) */}
      <circle cx="95" cy="55" r="25" fill="#1c1a17" stroke="#3a3632" strokeWidth="2" />
      <circle cx="95" cy="55" r="20" fill="none" stroke="#252220" strokeWidth="1" strokeDasharray="4 2" />
      <circle cx="95" cy="55" r="8" fill="#3a3632" />
      <circle cx="95" cy="55" r="3" fill="#4a4642" />

      {/* Tape path (no tape) */}
      <path d="M45 80 L55 95 L85 95 L95 80" stroke="#3a3632" strokeWidth="1" strokeDasharray="3 3" fill="none" />

      {/* Controls */}
      <rect x="35" y="100" width="70" height="12" rx="2" fill="#252220" />
      <circle cx="50" cy="106" r="4" fill="#3a3632" />
      <circle cx="70" cy="106" r="4" fill="#3a3632" />
      <circle cx="90" cy="106" r="4" fill="#3a3632" />

      {/* VU meters (flat/no signal) */}
      <rect x="55" y="25" width="12" height="20" rx="1" fill="#1c1a17" />
      <rect x="73" y="25" width="12" height="20" rx="1" fill="#1c1a17" />
      <line x1="57" y1="42" x2="65" y2="42" stroke="#4a4642" strokeWidth="2" />
      <line x1="75" y1="42" x2="83" y2="42" stroke="#4a4642" strokeWidth="2" />
    </svg>
  );
}

// 7. Music Note with Question Mark
export function MusicNoteQuestion({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      {/* Music note */}
      <path d="M55 95 L55 40 L95 30 L95 85" stroke="#4a4642" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Note heads */}
      <ellipse cx="45" cy="100" rx="15" ry="10" fill="#3a3632" stroke="#4a4642" strokeWidth="2" transform="rotate(-20 45 100)" />
      <ellipse cx="85" cy="90" rx="15" ry="10" fill="#3a3632" stroke="#4a4642" strokeWidth="2" transform="rotate(-20 85 90)" />

      {/* Question mark (large, overlaid) */}
      <text x="70" y="85" textAnchor="middle" fill="#d4a060" fontSize="50" fontFamily="Georgia, serif" opacity="0.7">?</text>

      {/* Subtle circle around */}
      <circle cx="70" cy="70" r="55" fill="none" stroke="#3a3632" strokeWidth="1" strokeDasharray="8 4" />
    </svg>
  );
}

// 8. Magnifying Glass over Silence
export function SearchSilence({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      {/* Sound wave (flatlined/silent) */}
      <g stroke="#3a3632" strokeWidth="2">
        <line x1="20" y1="60" x2="45" y2="60" />
        <line x1="95" y1="60" x2="120" y2="60" />
      </g>

      {/* Magnifying glass */}
      <circle cx="70" cy="55" r="30" fill="#1c1a17" stroke="#4a4642" strokeWidth="3" />
      <line x1="92" y1="77" x2="115" y2="100" stroke="#4a4642" strokeWidth="6" strokeLinecap="round" />

      {/* Inside magnifying glass - silence indicator */}
      <g stroke="#3a3632" strokeWidth="1.5">
        <line x1="50" y1="55" x2="90" y2="55" />
      </g>

      {/* Small "mute" icon inside */}
      <path d="M62 48 L68 48 L75 42 L75 68 L68 62 L62 62 Z" fill="#4a4642" />
      <g stroke="#5a5550" strokeWidth="2" strokeLinecap="round">
        <line x1="78" y1="50" x2="85" y2="60" />
        <line x1="85" y1="50" x2="78" y2="60" />
      </g>

      {/* Subtle glow */}
      <circle cx="70" cy="55" r="32" fill="none" stroke="#d4a060" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

// Preview component to show all options
export function NoResultsIconPreview() {
  const icons = [
    { name: 'Empty Vinyl Sleeve', component: EmptyVinylSleeve },
    { name: 'Broken Cassette', component: BrokenCassette },
    { name: 'Empty Turntable', component: EmptyTurntable },
    { name: 'Static Radio', component: StaticRadio },
    { name: 'Empty Stage', component: EmptyStage },
    { name: 'Empty Reel-to-Reel', component: EmptyReelToReel },
    { name: 'Music Note Question', component: MusicNoteQuestion },
    { name: 'Search Silence', component: SearchSilence },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8">
      {icons.map(({ name, component: Icon }) => (
        <div key={name} className="flex flex-col items-center gap-4 p-6 bg-surface-card rounded-lg">
          <Icon size={120} />
          <span className="text-secondary text-sm text-center">{name}</span>
        </div>
      ))}
    </div>
  );
}
