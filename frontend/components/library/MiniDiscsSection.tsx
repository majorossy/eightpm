'use client';

import Link from 'next/link';
import { useMiniDiscs } from '@/context/CollectionContext';
import SectionHeader from './SectionHeader';

const discOpacities = [0.55, 0.65, 0.45, 0.75, 0.5];

function MiniDiscSVG({ opacity }: { opacity: number }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect x="1" y="2" width="42" height="40" rx="4.5" fill="#0a0a18" stroke="var(--quaternary)" strokeWidth="0.7" strokeOpacity="0.5"/>
      <circle cx="27" cy="22" r="12" fill="#06060f" stroke="var(--quaternary)" strokeOpacity="0.35" strokeWidth="0.6"/>
      <circle cx="27" cy="22" r="5.5" fill="#0a0a1a" stroke="var(--quaternary)" strokeOpacity="0.25" strokeWidth="0.5"/>
      <circle cx="27" cy="22" r="2.2" fill="var(--quaternary)" fillOpacity={opacity}/>
      <rect x="1" y="2" width="15" height="40" rx="3.5" fill="#0f0f28" stroke="var(--quaternary)" strokeWidth="0.6" strokeOpacity="0.3"/>
      <text fontFamily="monospace" fontSize="3.5" fill="var(--quaternary)" fillOpacity="0.65" x="3" y="21" letterSpacing="0.2">8PM</text>
    </svg>
  );
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MiniDiscsSection() {
  const { minidiscs } = useMiniDiscs();

  const displayed = minidiscs.slice(0, 5);

  return (
    <section>
      <SectionHeader
        dotColor="var(--quaternary)"
        name="MINIDISCS"
        count={minidiscs.length}
        seeAllHref={minidiscs.length > 0 ? '/my-library/minidiscs' : undefined}
      />
      {minidiscs.length === 0 ? (
        <p className="text-[10px] text-tertiary tracking-[0.04em]">Create a minidisc to collect songs across shows.</p>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {displayed.map((minidisc, i) => (
          <Link
            key={minidisc.id}
            href={`/my-library/minidiscs/${minidisc.id}`}
            className="group flex flex-col items-center justify-center rounded-[6px] transition-[border-color,transform] duration-150"
            style={{
              background: '#0a0a18',
              border: '1px solid color-mix(in srgb, var(--quaternary) 12%, transparent)',
              aspectRatio: '0.85',
              padding: '6px 4px 8px',
              gap: '5px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--quaternary) 35%, transparent)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--quaternary) 12%, transparent)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <MiniDiscSVG opacity={discOpacities[i % discOpacities.length]} />
            <span className="text-[6px] font-bold tracking-[0.05em] uppercase text-primary text-center max-w-[72px] truncate">
              {minidisc.name}
            </span>
            <span className="text-[6px] text-tertiary text-center mt-[1px]">
              {formatShortDate(minidisc.createdAt)}
            </span>
          </Link>
        ))}
      </div>
      )}
    </section>
  );
}
