'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useCassettes } from '@/context/CollectionContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { useBackToClose } from '@/hooks/useBackToClose';
import MiniCassette from '@/components/MiniCassette';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';

export default function CassettesPage() {
  const { cassettes, deleteCassette, deleteCassettes, syncStatus } = useCassettes();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const closeDeleteConfirm = useCallback(() => setDeleteConfirmId(null), []);
  useBackToClose(!!deleteConfirmId || showBatchDeleteConfirm, deleteConfirmId ? closeDeleteConfirm : () => setShowBatchDeleteConfirm(false));

  useEffect(() => {
    setBreadcrumbs([
      { label: 'My Library', href: '/my-library', type: 'library' },
      { label: 'Cassettes', type: 'library' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'artist'>('newest');

  const filtered = useMemo(() => {
    let items = [...cassettes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.artistName.toLowerCase().includes(q) ||
        c.albumName.toLowerCase().includes(q) ||
        (c.showDate && c.showDate.includes(q))
      );
    }
    switch (sortBy) {
      case 'oldest': items.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      case 'name': items.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'artist': items.sort((a, b) => a.artistName.localeCompare(b.artistName)); break;
      default: items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); break;
    }
    return items;
  }, [cassettes, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px] safe-top">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-8">
        {/* Header */}
        <div className="pt-6 pb-4 md:pt-8 md:pb-6 px-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Cassettes</h1>
          <div className="flex items-center gap-3">
            <p className="text-secondary text-sm">
              {cassettes.length > 0
                ? `${cassettes.length} saved version ${cassettes.length === 1 ? 'selection' : 'selections'}`
                : 'Saved version selections for shows'}
            </p>
            <SyncStatusIndicator syncStatus={syncStatus} />
          </div>
        </div>

        {/* Search & Sort */}
        {cassettes.length > 0 && (
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
                placeholder="Search cassettes..."
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-secondary text-sm">No cassettes match &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {filtered.map((cassette) => {
              const isSelected = selectedIds.has(cassette.id);
              const toggleSelect = () => {
                setSelectedIds(prev => {
                  const next = new Set(prev);
                  if (next.has(cassette.id)) next.delete(cassette.id);
                  else next.add(cassette.id);
                  return next;
                });
              };
              return (
                <div key={cassette.id} className="relative group" onClick={selectMode ? toggleSelect : undefined}>
                  {selectMode ? (
                    <div className={`flex flex-col gap-2 p-3 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-surface-elevated ring-2 ring-accent' : 'hover:bg-surface-elevated'}`}>
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
                      <MiniCassette
                        name={cassette.name}
                        albumName={cassette.albumName}
                        artistName={cassette.artistName}
                        showDate={cassette.showDate}
                        coverArt={cassette.coverArt}
                        tintIndex={cassette.colorIndex}
                      />
                    </div>
                  ) : (
                    <>
                      <Link
                        href={`/artists/${cassette.artistSlug}/album/${cassette.albumIdentifier}?cassette=${cassette.id}`}
                        className="flex flex-col gap-2 p-3 rounded-lg hover:bg-surface-elevated transition-colors"
                      >
                        <MiniCassette
                          name={cassette.name}
                          albumName={cassette.albumName}
                          artistName={cassette.artistName}
                          showDate={cassette.showDate}
                          coverArt={cassette.coverArt}
                          tintIndex={cassette.colorIndex}
                        />
                      </Link>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(cassette.id); }}
                        className="absolute top-1.5 right-1.5 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Delete ${cassette.name}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
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
              else setSelectedIds(new Set(filtered.map(c => c.id)));
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
              <h3 className="text-white font-bold text-lg mb-2">Delete {selectedIds.size} Cassette{selectedIds.size > 1 ? 's' : ''}?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                This action cannot be undone. {selectedIds.size} cassette{selectedIds.size > 1 ? 's' : ''} will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowBatchDeleteConfirm(false)} className="flex-1 px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={() => {
                  deleteCassettes(Array.from(selectedIds));
                  setShowBatchDeleteConfirm(false);
                  setSelectMode(false);
                  setSelectedIds(new Set());
                }} className="flex-1 px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteConfirmId && (() => {
        const c = cassettes.find(c => c.id === deleteConfirmId);
        return (
          <>
            <div className="fixed inset-0 bg-black/80 z-[9998] animate-fade-in" onClick={() => setDeleteConfirmId(null)} />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="rounded-lg p-6 max-w-sm w-full animate-scale-in" style={{ background: 'var(--surface-elevated)' }}>
                <h3 className="text-white font-bold text-lg mb-2">Delete Cassette?</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  This action cannot be undone. &quot;{c?.name}&quot; will be permanently deleted.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors">Cancel</button>
                  <button onClick={() => { deleteCassette(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
