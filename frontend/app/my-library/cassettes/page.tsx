'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCassettes } from '@/context/CollectionContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import MiniCassette from '@/components/MiniCassette';

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
