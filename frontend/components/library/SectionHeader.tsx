import Link from 'next/link';

interface SectionHeaderProps {
  dotColor: string;
  name: string;
  count: number;
  seeAllHref?: string;
  seeAllLabel?: string;
}

export default function SectionHeader({ dotColor, name, count, seeAllHref, seeAllLabel }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center gap-2 pb-[10px] mb-[14px]"
      style={{ borderBottom: '1px solid var(--border-subtle-token)' }}
    >
      <div
        className="w-[6px] h-[6px] rounded-full flex-shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <span className="text-[10px] tracking-[0.12em] uppercase text-tertiary">
        {name}
      </span>
      <span
        className="text-[9px] tracking-[0.04em] text-tertiary rounded-[3px] px-[6px] py-[1px]"
        style={{ background: 'color-mix(in srgb, var(--text-primary) 5%, transparent)' }}
      >
        {count}
      </span>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="ml-auto text-[9px] tracking-[0.08em] uppercase text-tertiary hover:text-[var(--quinary)] transition-colors"
        >
          {seeAllLabel || `See all ${count} →`}
        </Link>
      )}
    </div>
  );
}
