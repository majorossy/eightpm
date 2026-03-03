// VersionsPill — "N versions" count pill/button (replaces 5+ inline copies)

import VersionsIcon from './VersionsIcon';

interface VersionsPillProps {
  count: number;
  variant?: 'pill' | 'button';
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function VersionsPill({ count, variant = 'pill', onClick, className = '' }: VersionsPillProps) {
  if (count <= 1) return null;

  const baseClasses = `flex items-center gap-[3px] px-1.5 py-[2px] rounded-[3px] font-jb-mono text-[8.5px] font-semibold ${className}`;

  const style = {
    background: 'color-mix(in srgb, var(--quaternary) 15%, transparent)',
    border: '1px solid color-mix(in srgb, var(--quaternary) 30%, transparent)',
    color: 'var(--quaternary)',
  };

  if (variant === 'button' && onClick) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(e); }}
        className={`${baseClasses} transition-all cursor-pointer`}
        style={style}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--quaternary)';
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'color-mix(in srgb, var(--quaternary) 15%, transparent)';
          e.currentTarget.style.color = 'var(--quaternary)';
        }}
        aria-label={`${count} version${count !== 1 ? 's' : ''} available`}
      >
        <VersionsIcon className="w-2.5 h-2.5" />
        <span>{count} ver</span>
      </button>
    );
  }

  return (
    <span className={baseClasses} style={style}>
      <VersionsIcon className="w-2.5 h-2.5" />
      <span>{count} ver</span>
    </span>
  );
}
