'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCassettes } from '@/context/CollectionContext';

export default function CassettesPage() {
  const { cassettes } = useCassettes();

  const overrideCount = (c: { versionOverrides: Record<string, string> }) =>
    Object.keys(c.versionOverrides).length;

  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px] safe-top">
      {/* Header */}
      <div className="p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Your Cassettes</h1>
        <p className="text-secondary text-sm">Saved version selections for shows</p>
      </div>

      {/* Grid */}
      {cassettes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          {/* Cassette tape icon */}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-6 md:px-8">
          {cassettes.map((cassette) => (
            <Link
              key={cassette.id}
              href={`/cassettes/${cassette.id}`}
              className="flex flex-col gap-3 p-4 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="w-full aspect-square rounded bg-surface-elevated overflow-hidden relative">
                {cassette.coverArt ? (
                  <Image src={cassette.coverArt} alt={cassette.name || 'Cassette'} fill sizes="200px" quality={80} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <circle cx="8" cy="12" r="2" />
                      <circle cx="16" cy="12" r="2" />
                      <path d="M8 14h8" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-medium truncate">{cassette.name}</p>
                <p className="text-secondary text-sm truncate">{cassette.artistName}</p>
                {overrideCount(cassette) > 0 && (
                  <p className="text-tertiary text-xs">{overrideCount(cassette)} custom version{overrideCount(cassette) !== 1 ? 's' : ''}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
