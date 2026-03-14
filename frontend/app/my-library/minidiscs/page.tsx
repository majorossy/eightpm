'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMiniDiscs } from '@/context/CollectionContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { useQueue } from '@/context/QueueContext';
import { useBackToClose } from '@/hooks/useBackToClose';
import { VALIDATION_LIMITS } from '@/lib/validation';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';

export default function MiniDiscsPage() {
  const { minidiscs, createMiniDisc, deleteMiniDisc, deleteMiniDiscs, getMiniDisc, syncStatus } = useMiniDiscs();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { playAlbum } = useQueue();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'My Library', href: '/my-library', type: 'library' },
      { label: 'MiniDiscs', type: 'library' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'artist'>('newest');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const closeBatchConfirm = useCallback(() => setShowBatchDeleteConfirm(false), []);
  useBackToClose(showBatchDeleteConfirm, closeBatchConfirm);

  const filtered = useMemo(() => {
    let items = [...minidiscs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        d.songs.some(s =>
          s.artistName?.toLowerCase().includes(q) ||
          s.title?.toLowerCase().includes(q)
        )
      );
    }
    switch (sortBy) {
      case 'oldest': items.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      case 'name': items.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'artist': {
        const getArtist = (d: typeof items[0]) => d.songs[0]?.artistName || '';
        items.sort((a, b) => getArtist(a).localeCompare(getArtist(b)));
        break;
      }
      default: items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); break;
    }
    return items;
  }, [minidiscs, searchQuery, sortBy]);

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
            <div className="flex items-center gap-3">
              <p className="text-secondary text-sm">
                {minidiscs.length > 0
                  ? `${minidiscs.length} custom ${minidiscs.length === 1 ? 'collection' : 'collections'}`
                  : 'Custom song collections across shows and artists'}
              </p>
              <SyncStatusIndicator syncStatus={syncStatus} />
            </div>
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

        {/* Search & Sort */}
        {minidiscs.length > 0 && (
          <div className="flex items-center gap-3 px-2 pb-4">
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search minidiscs..."
                className="w-full bg-surface-elevated text-white placeholder-tertiary rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface-elevated text-sm rounded-full px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              style={{ color: 'var(--text-secondary)', border: '1px solid color-mix(in srgb, white 8%, transparent)' }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name A-Z</option>
              <option value="artist">Artist A-Z</option>
            </select>
            <button
              onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
              className="px-3 py-2 rounded-full text-sm font-medium transition-colors shrink-0"
              style={{
                border: `1.5px solid ${selectMode ? 'var(--secondary)' : 'color-mix(in srgb, var(--text-secondary) 30%, transparent)'}`,
                color: selectMode ? 'var(--secondary)' : 'var(--text-secondary)',
              }}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </button>
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-secondary text-sm">No minidiscs match &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {filtered.map((disc) => {
              const isSelected = selectedIds.has(disc.id);
              const toggleSelect = () => {
                setSelectedIds(prev => {
                  const next = new Set(prev);
                  if (next.has(disc.id)) next.delete(disc.id);
                  else next.add(disc.id);
                  return next;
                });
              };
              const discCard = (
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
              );
              return selectMode ? (
                <div
                  key={disc.id}
                  onClick={toggleSelect}
                  className={`relative flex flex-col gap-3 p-3 rounded-lg transition-colors group cursor-pointer ${isSelected ? 'bg-surface-elevated ring-2 ring-accent' : 'hover:bg-surface-elevated'}`}
                >
                  <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: isSelected ? 'var(--secondary)' : 'color-mix(in srgb, white 30%, transparent)',
                      background: isSelected ? 'var(--secondary)' : 'color-mix(in srgb, black 50%, transparent)',
                    }}
                  >
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {discCard}
                </div>
              ) : (
                <Link
                  key={disc.id}
                  href={`/my-library/minidiscs/${disc.id}`}
                  className="flex flex-col gap-3 p-3 rounded-lg hover:bg-surface-elevated transition-colors group"
                >
                  {discCard}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating action bar for select mode */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-[80px] md:bottom-[24px] left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-full shadow-lg animate-scale-in"
          style={{ background: 'var(--surface-elevated)', border: '1px solid color-mix(in srgb, white 12%, transparent)' }}
        >
          <span className="text-white text-sm font-medium">{selectedIds.size} selected</span>
          <button
            onClick={() => {
              if (selectedIds.size === filtered.length) setSelectedIds(new Set());
              else setSelectedIds(new Set(filtered.map(d => d.id)));
            }}
            className="text-sm px-3 py-1 rounded-full transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid color-mix(in srgb, white 15%, transparent)' }}
          >
            {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="text-sm px-4 py-1.5 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Batch delete confirmation */}
      {showBatchDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[9998] animate-fade-in" onClick={() => setShowBatchDeleteConfirm(false)} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="rounded-lg p-6 max-w-sm w-full animate-scale-in" style={{ background: 'var(--surface-elevated)' }}>
              <h3 className="text-white font-bold text-lg mb-2">Delete {selectedIds.size} MiniDisc{selectedIds.size > 1 ? 's' : ''}?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                This action cannot be undone. {selectedIds.size} MiniDisc{selectedIds.size > 1 ? 's' : ''} will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowBatchDeleteConfirm(false)} className="flex-1 px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={() => {
                  deleteMiniDiscs(Array.from(selectedIds));
                  setShowBatchDeleteConfirm(false);
                  setSelectMode(false);
                  setSelectedIds(new Set());
                }} className="flex-1 px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
