// DownloadCount — archive building icon + download arrow + count (replaces 6 inline copies)

interface DownloadCountProps {
  downloads?: number;
  format?: 'full' | 'compact';
  iconSize?: number;
  className?: string;
  identifier?: string;
}

function ArchiveIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <path d="M12 2L2 7v1h20V7L12 2z" style={{ fill: 'color-mix(in srgb, var(--quinary) 55%, transparent)' }} />
      <rect x="4.5" y="9" width="2" height="6.5" rx="0.4" style={{ fill: 'color-mix(in srgb, var(--quinary) 35%, transparent)' }} />
      <rect x="9" y="9" width="2" height="6.5" rx="0.4" style={{ fill: 'color-mix(in srgb, var(--quinary) 35%, transparent)' }} />
      <rect x="13" y="9" width="2" height="6.5" rx="0.4" style={{ fill: 'color-mix(in srgb, var(--quinary) 35%, transparent)' }} />
      <rect x="17.5" y="9" width="2" height="6.5" rx="0.4" style={{ fill: 'color-mix(in srgb, var(--quinary) 35%, transparent)' }} />
      <rect x="2" y="17" width="20" height="2" rx="0.5" style={{ fill: 'color-mix(in srgb, var(--quinary) 45%, transparent)' }} />
    </svg>
  );
}

function DownloadArrow({ size = 7 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 12 / 7)} viewBox="0 0 10 16" fill="none" className="flex-shrink-0">
      <path d="M5 1v11M5 12l-3.5-3.5M5 12l3.5-3.5" style={{ stroke: 'var(--text-tertiary)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatCount(count: number, format: 'full' | 'compact'): string {
  if (format === 'compact' && count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toLocaleString();
}

export default function DownloadCount({ downloads, format = 'full', iconSize = 12, className = '', identifier }: DownloadCountProps) {
  if (downloads == null || downloads <= 0) return null;

  const content = (
    <span className={`font-jb-mono text-[11px] flex items-center gap-0.5 ${className}`} style={{ color: 'var(--text-tertiary)' }}>
      <ArchiveIcon size={iconSize} />
      <DownloadArrow size={Math.round(iconSize * 7 / 12)} />
      {formatCount(downloads, format)}
    </span>
  );

  if (identifier) {
    return (
      <a href={`https://archive.org/details/${identifier}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
        {content}
      </a>
    );
  }

  return content;
}
