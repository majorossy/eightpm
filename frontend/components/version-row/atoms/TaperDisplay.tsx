// TaperDisplay — taper icon + name (replaces 7 inline copies of the person-with-mic SVG)

interface TaperDisplayProps {
  taper?: string;
  iconSize?: number;
  fontSize?: string;
  linkToArchive?: boolean;
  className?: string;
}

function TaperIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <circle cx="10" cy="5" r="3" style={{ fill: 'var(--tertiary)' }} />
      <path d="M10 8c-3.5 0-6 2-6 5v2h12v-2c0-3-2.5-5-6-5z" style={{ fill: 'color-mix(in srgb, var(--primary) 70%, var(--tertiary))' }} />
      <line x1="17" y1="3" x2="17" y2="19" style={{ stroke: 'var(--tertiary)' }} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="15" y="0.5" width="4" height="4.5" rx="1.5" style={{ fill: 'var(--tertiary)' }} />
      <path d="M13 11l4-3.5" style={{ stroke: 'color-mix(in srgb, var(--tertiary) 60%, transparent)' }} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function TaperDisplay({ taper, iconSize = 16, fontSize = 'text-[11px]', linkToArchive = false, className = '' }: TaperDisplayProps) {
  if (!taper) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <TaperIcon size={iconSize} />
      {linkToArchive ? (
        <a
          href={`https://archive.org/search?query=taper:${encodeURIComponent('"' + taper + '"')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`font-jb-mono ${fontSize} font-medium hover:underline transition-colors truncate`}
          style={{ color: 'var(--text-tertiary)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {taper}
        </a>
      ) : (
        <span className={`font-jb-mono ${fontSize} font-medium truncate`} style={{ color: 'var(--text-tertiary)' }}>
          {taper}
        </span>
      )}
    </div>
  );
}
