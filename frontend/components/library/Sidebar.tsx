'use client';

import Link from 'next/link';
import { formatRelativeTime, paletteColors, RecentItem } from '@/lib/libraryUtils';

interface SidebarProps {
  cassettesCount: number;
  minidiscsCount: number;
  versionsCount: number;
  artistsCount: number;
  recentlyPlayed: RecentItem[];
}

const stats = [
  { key: 'cassettes', label: 'Cassettes', color: 'var(--secondary)', href: '/my-library/cassettes' },
  { key: 'minidiscs', label: 'MiniDiscs', color: 'var(--quaternary)', href: '/my-library/minidiscs' },
  { key: 'versions', label: 'Versions', color: 'var(--tertiary)', href: undefined },
  { key: 'artists', label: 'Artists', color: 'var(--quinary)', href: undefined },
] as const;

export default function Sidebar({
  cassettesCount,
  minidiscsCount,
  versionsCount,
  artistsCount,
  recentlyPlayed,
}: SidebarProps) {
  const counts: Record<string, number> = {
    cassettes: cassettesCount,
    minidiscs: minidiscsCount,
    versions: versionsCount,
    artists: artistsCount,
  };

  const recentItems = recentlyPlayed.slice(0, 5);

  return (
    <aside className="sticky top-[72px] hidden lg:flex flex-col gap-5">
      {/* Block 1 — COLLECTION */}
      <div
        className="rounded-lg p-4"
        style={{
          background: 'var(--surface-sunken)',
          border: '1px solid var(--border-subtle-token)',
        }}
      >
        <div className="text-[9px] tracking-[0.12em] uppercase text-tertiary mb-3">
          Collection
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => {
            const content = (
              <>
                <div
                  className="text-[20px] font-bold leading-none mb-[3px]"
                  style={{ color: stat.color }}
                >
                  {counts[stat.key]}
                </div>
                <div className="text-[8px] tracking-[0.09em] uppercase text-tertiary">
                  {stat.label}
                </div>
              </>
            );
            const cellStyle = {
              background: 'color-mix(in srgb, var(--text-primary) 4%, transparent)',
              border: '1px solid var(--border-subtle-token)',
            };
            return stat.href ? (
              <Link
                key={stat.key}
                href={stat.href}
                className="rounded-[5px] p-[10px] pb-[8px] transition-[border-color] duration-150 hover:border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)]"
                style={cellStyle}
              >
                {content}
              </Link>
            ) : (
              <div
                key={stat.key}
                className="rounded-[5px] p-[10px] pb-[8px]"
                style={cellStyle}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>

      {/* Block 2 — RECENT PLAYS */}
      <div
        className="rounded-lg p-4"
        style={{
          background: 'var(--surface-sunken)',
          border: '1px solid var(--border-subtle-token)',
        }}
      >
        <div className="text-[9px] tracking-[0.12em] uppercase text-tertiary mb-3">
          Recent Plays
        </div>
        <div>
          {recentItems.map((item, i) => {
            const colorVar = paletteColors[i % paletteColors.length];
            const dateText = item.song.showDate || item.playedAt.slice(0, 10);
            return (
              <div
                key={item.songId + item.playedAt}
                className="flex items-center gap-2 py-[7px]"
                style={{
                  borderBottom:
                    i < recentItems.length - 1
                      ? '1px solid var(--border-subtle-token)'
                      : 'none',
                  transition: 'opacity 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <span
                  className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: `var(${colorVar})` }}
                />
                <span className="flex-1 min-w-0 truncate text-[9px] text-secondary">
                  {item.song.artistName} &middot; {dateText}
                </span>
                <span className="flex-shrink-0 text-[8px] text-tertiary">
                  {formatRelativeTime(item.playedAt)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
