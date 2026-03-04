// RecTypeBadge — SBD/AUD/MX/FM/WEBCAST recording type badge

const REC_TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  SBD:     { bg: 'color-mix(in srgb, var(--quinary) 15%, transparent)',  color: 'var(--quinary)' },
  AUD:     { bg: 'color-mix(in srgb, var(--secondary) 15%, transparent)', color: 'var(--secondary)' },
  MX:      { bg: 'color-mix(in srgb, var(--quaternary) 15%, transparent)', color: 'var(--quaternary)' },
  FM:      { bg: 'color-mix(in srgb, var(--tertiary) 15%, transparent)',  color: 'var(--tertiary)' },
  WEBCAST: { bg: 'color-mix(in srgb, var(--tertiary) 15%, transparent)',  color: 'var(--tertiary)' },
  WEB:     { bg: 'color-mix(in srgb, var(--tertiary) 15%, transparent)',  color: 'var(--tertiary)' },
};

interface RecTypeBadgeProps {
  type?: string;
  className?: string;
}

export default function RecTypeBadge({ type, className = '' }: RecTypeBadgeProps) {
  const label = type || 'AUD';
  const style = REC_TYPE_STYLES[label] || REC_TYPE_STYLES.AUD;
  return (
    <span
      className={`font-jb-mono text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] tracking-wide ${className}`}
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}
