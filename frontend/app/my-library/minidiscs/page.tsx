'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMiniDiscs } from '@/context/CollectionContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { useQueue } from '@/context/QueueContext';
import { VALIDATION_LIMITS } from '@/lib/validation';

export default function MiniDiscsPage() {
  const { minidiscs, createMiniDisc, deleteMiniDisc, getMiniDisc } = useMiniDiscs();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { playAlbum } = useQueue();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Library', href: '/my-library', type: 'library' },
      { label: 'MiniDiscs', type: 'library' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handlePlayDisc = (id: string) => {
    const disc = getMiniDisc(id);
    if (!disc || disc.songs.length === 0) return;

    const albumData = {
      id: disc.id,
      identifier: disc.id,
      name: disc.name,
      slug: disc.id,
      artistId: disc.songs[0]?.artistId || '',
      artistName: disc.songs[0]?.artistName || 'Various Artists',
      artistSlug: disc.songs[0]?.artistSlug || '',
      tracks: [{
        id: 'minidisc-track',
        title: disc.name,
        slug: disc.id,
        albumIdentifier: disc.id,
        albumName: disc.name,
        artistId: disc.songs[0]?.artistId || '',
        artistName: disc.songs[0]?.artistName || 'Various Artists',
        artistSlug: disc.songs[0]?.artistSlug || '',
        songs: disc.songs,
        totalDuration: disc.songs.reduce((sum, s) => sum + s.duration, 0),
        songCount: disc.songs.length,
      }],
      totalTracks: 1,
      totalSongs: disc.songs.length,
      totalDuration: disc.songs.reduce((sum, s) => sum + s.duration, 0),
      coverArt: disc.coverArt,
    };
    playAlbum(albumData, 0);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    createMiniDisc(newName.trim(), newDescription.trim() || undefined);
    setNewName('');
    setNewDescription('');
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px] safe-top">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-8">
        {/* Header */}
        <div className="pt-6 pb-4 md:pt-8 md:pb-6 px-2 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">MiniDiscs</h1>
            <p className="text-secondary text-sm">
              {minidiscs.length > 0
                ? `${minidiscs.length} custom ${minidiscs.length === 1 ? 'collection' : 'collections'}`
                : 'Custom song collections across shows and artists'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0"
            style={{
              border: '1.5px solid color-mix(in srgb, var(--text-secondary) 30%, transparent)',
              color: 'var(--text-primary)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="mb-6 px-2">
            <form onSubmit={handleCreate} className="bg-surface-elevated rounded-lg p-5 max-w-md">
              <h3 className="text-white font-bold mb-3">New MiniDisc</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_NAME_MAX))}
                placeholder="Name"
                maxLength={VALIDATION_LIMITS.MINIDISC_NAME_MAX}
                autoFocus
                className="w-full bg-surface-base text-white placeholder-tertiary rounded px-4 py-2.5 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX))}
                placeholder="Description (optional)"
                maxLength={VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX}
                rows={2}
                className="w-full bg-surface-base text-white placeholder-tertiary rounded px-4 py-2.5 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setNewName(''); setNewDescription(''); }}
                  className="flex-1 px-4 py-2 rounded-full text-sm border border-white/20 text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="flex-1 px-4 py-2 rounded-full text-sm bg-accent text-black font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grid */}
        {minidiscs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg className="w-16 h-16 text-border mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
            </svg>
            <h3 className="text-white font-bold text-lg mb-2">No MiniDiscs yet</h3>
            <p className="text-secondary text-sm text-center max-w-sm">
              Create your first MiniDisc to collect songs across different shows and artists.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {minidiscs.map((disc) => (
              <Link
                key={disc.id}
                href={`/my-library/minidiscs/${disc.id}`}
                className="flex flex-col gap-3 p-3 rounded-lg hover:bg-surface-elevated transition-colors group"
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden relative"
                  style={{
                    background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #222 100%)',
                    border: '2px solid #3a3a3a',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Shell texture lines */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 4px)',
                  }} />

                  {/* Sliding shutter groove */}
                  <div className="absolute top-0 left-[15%] right-[55%] h-[6px] rounded-b-sm"
                    style={{ background: 'linear-gradient(180deg, #111, #252525)', borderBottom: '1px solid #3a3a3a' }}
                  />

                  {/* Disc window */}
                  <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[65%] aspect-square rounded-full overflow-hidden"
                    style={{
                      background: 'radial-gradient(circle at 35% 35%, #444 0%, #1a1a1a 60%, #111 100%)',
                      border: '2px solid #333',
                      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
                    }}
                  >
                    {/* Disc surface — holographic shimmer */}
                    <div className="absolute inset-[8%] rounded-full overflow-hidden"
                      style={{
                        background: 'conic-gradient(from 0deg, rgba(90,184,160,0.15), rgba(200,180,104,0.12), rgba(144,136,200,0.15), rgba(199,90,90,0.1), rgba(90,184,160,0.15))',
                      }}
                    >
                      {/* Track grooves */}
                      <div className="absolute inset-0 rounded-full" style={{
                        background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px)',
                      }} />
                      {/* Logo in center */}
                      <div className="absolute inset-[25%] rounded-full overflow-hidden">
                        <Image src="/favicon.svg" alt="" fill sizes="100px" className="object-cover" />
                      </div>
                    </div>
                    {/* Center spindle hole */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10%] aspect-square rounded-full"
                      style={{ background: '#111', border: '1px solid #333' }}
                    />
                  </div>

                  {/* Corner notch (bottom-right) */}
                  <div className="absolute bottom-2 right-2 w-3 h-3 rounded-tl-sm"
                    style={{ background: 'linear-gradient(135deg, #333, #222)', border: '1px solid #3a3a3a' }}
                  />
                  {/* Card stock label — taped on */}
                  <div className="absolute bottom-3 left-3 right-3">
                    {/* Tape strip */}
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3 rounded-[1px] z-10"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,248,220,0.88) 0%, rgba(255,240,195,0.8) 100%)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                    {/* Card stock */}
                    <div
                      className="rounded px-3 py-2.5 text-center"
                      style={{
                        background: 'linear-gradient(180deg, #faf4e8 0%, #f0e6d4 100%)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.6)',
                        border: '1px solid rgba(200,180,150,0.4)',
                      }}
                    >
                      <p className="font-bold text-sm line-clamp-2 leading-tight" style={{ color: '#1a0f08', fontFamily: 'Georgia, serif' }}>{disc.name}</p>
                      <p className="text-[10px] mt-1" style={{ color: '#6b5a48' }}>{disc.songs.length} track{disc.songs.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
