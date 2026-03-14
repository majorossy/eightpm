'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCassettes } from '@/context/CollectionContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';

function MiniCassette({ name, albumName, artistName, showDate, coverArt }: {
  name: string;
  albumName: string;
  artistName: string;
  showDate?: string;
  coverArt?: string;
}) {
  return (
    <div
      className="relative w-full rounded-lg overflow-hidden"
      style={{
        aspectRatio: '4 / 2.6',
        background: 'var(--cassette-body)',
        border: '2px solid var(--cassette-border)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* Corner screws */}
      {[{ top: 5, left: 5 }, { top: 5, right: 5 }, { bottom: 5, left: 5 }, { bottom: 5, right: 5 }].map((pos, i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{ ...pos, background: 'var(--cassette-screw)', border: '1px solid var(--cassette-border)' }}
        />
      ))}

      {/* Label area */}
      <div className="absolute top-3.5 left-3.5 right-3.5 bottom-[38%] rounded-sm overflow-hidden"
        style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}
      >
        {/* Header band */}
        <div
          className="h-4 flex items-center justify-between px-2 text-[7px] font-bold text-white tracking-wider"
          style={{ background: 'var(--cassette-header)' }}
        >
          <span>LIVE RECORDING</span>
          <span className="opacity-70 font-normal">Type II</span>
        </div>

        {/* Label content */}
        <div
          className="relative flex-1 h-[calc(100%-16px)] px-2.5 py-1.5 flex flex-col justify-between"
          style={{ background: 'linear-gradient(180deg, #faf4e8 0%, #f5ebda 50%, #efe1cc 100%)' }}
        >
          {/* Ruled lines */}
          <div className="absolute top-[18px] left-2 right-2 h-px" style={{ background: 'var(--cassette-label-ruled)' }} />
          <div className="absolute top-[28px] left-2 right-2 h-px" style={{ background: 'var(--cassette-label-ruled)', opacity: 0.5 }} />

          <div className="flex items-start gap-1.5 min-w-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold line-clamp-2" style={{ color: '#1a0f08', fontFamily: 'Georgia, serif' }}>
                {name}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--cassette-label-text)' }}>
                {albumName}
              </p>
              <p className="text-[9px] italic truncate" style={{ color: 'var(--cassette-label-muted)' }}>
                {artistName}
              </p>
            </div>
            {/* Polaroid cover art */}
            {coverArt && (
              <div className="relative w-20 h-20 flex-shrink-0" style={{ transform: 'rotate(5deg)', marginTop: '-10px', marginRight: '-6px' }}>
                <Image
                  src={coverArt}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover rounded-[1px]"
                  style={{ border: '2px solid white', boxShadow: '0 3px 10px rgba(0,0,0,0.35)' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tape window */}
      <div
        className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-sm flex items-center justify-between px-2.5"
        style={{
          width: '65%',
          height: '26%',
          background: 'var(--cassette-window)',
          border: '1.5px solid var(--cassette-border)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
        }}
      >
        {/* Left reel */}
        <div className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'var(--cassette-reel)', border: '1.5px solid var(--cassette-border)' }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--cassette-window)', border: '1px solid var(--cassette-border)' }} />
        </div>
        {/* Tape path */}
        <div className="flex-1 mx-1.5 h-1 rounded-sm" style={{ background: 'var(--cassette-tape)' }} />
        {/* Right reel */}
        <div className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'var(--cassette-reel)', border: '1.5px solid var(--cassette-border)' }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--cassette-window)', border: '1px solid var(--cassette-border)' }} />
        </div>
      </div>
    </div>
  );
}

export default function CassettesPage() {
  const { cassettes } = useCassettes();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Library', href: '/my-library', type: 'library' },
      { label: 'Cassettes', type: 'library' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const overrideCount = (c: { versionOverrides: Record<string, string> }) =>
    Object.keys(c.versionOverrides).length;

  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px] safe-top">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-8">
        {/* Header */}
        <div className="pt-6 pb-4 md:pt-8 md:pb-6 px-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Cassettes</h1>
          <p className="text-secondary text-sm">
            {cassettes.length > 0
              ? `${cassettes.length} saved version ${cassettes.length === 1 ? 'selection' : 'selections'}`
              : 'Saved version selections for shows'}
          </p>
        </div>

        {/* Grid */}
        {cassettes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg className="w-16 h-16 text-border mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <circle cx="8" cy="12" r="2" />
              <circle cx="16" cy="12" r="2" />
              <path d="M8 14h8" />
              <path d="M6 19h12" />
            </svg>
            <h3 className="text-white font-bold text-lg mb-2">No Cassettes yet</h3>
            <p className="text-secondary text-sm text-center max-w-sm">
              When you pick custom recording versions on an album page, save your selections as a Cassette to replay them later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {cassettes.map((cassette) => (
              <Link
                key={cassette.id}
                href={`/artists/${cassette.artistSlug}/album/${cassette.albumIdentifier}?cassette=${cassette.id}`}
                className="flex flex-col gap-2 p-3 rounded-lg hover:bg-surface-elevated transition-colors group"
              >
                <MiniCassette
                  name={cassette.name}
                  albumName={cassette.albumName}
                  artistName={cassette.artistName}
                  showDate={cassette.showDate}
                  coverArt={cassette.coverArt}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
