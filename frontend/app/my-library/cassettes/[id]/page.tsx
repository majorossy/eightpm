'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useCassettes } from '@/context/CollectionContext';
import { useQueue } from '@/context/QueueContext';
import { useCassetteResolution } from '@/hooks/useCassetteResolution';
import { useBackToClose } from '@/hooks/useBackToClose';
import { formatDuration } from '@/lib/api';
import { VALIDATION_LIMITS } from '@/lib/validation';
import MiniCassette, { CASSETTE_PRESETS, getSwatchColor, resolveCassetteTint } from '@/components/MiniCassette';
import { getCassetteColorMode } from '@/lib/cassetteColors';
import { CASSETTE_BRANDS, getCassetteBrand } from '@/lib/cassetteBrands';

export default function CassetteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getCassette, deleteCassette, updateCassette } = useCassettes();
  const { playAlbum } = useQueue();

  const cassette = getCassette(id);
  const { resolvedTracks, album, isLoading, error } = useCassetteResolution(cassette);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleCloseDeleteConfirm = useCallback(() => setShowDeleteConfirm(false), []);
  useBackToClose(showDeleteConfirm, handleCloseDeleteConfirm);

  if (!cassette) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Cassette not found</h1>
          <Link href="/my-library/cassettes" className="text-accent hover:underline">Back to Cassettes</Link>
        </div>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (!album) return;
    const overridesMap = new Map(Object.entries(cassette.versionOverrides));
    playAlbum(album, 0, overridesMap);
  };

  const handleEdit = () => {
    setEditName(cassette.name);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editName.trim()) {
      updateCassette(cassette.id, { name: editName.trim() });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    deleteCassette(cassette.id);
    router.push('/my-library/cassettes');
  };

  const totalDuration = resolvedTracks.reduce((sum, rt) => sum + rt.selectedSong.duration, 0);
  const overrideCount = Object.keys(cassette.versionOverrides).length;

  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px] safe-top">
      {/* Header */}
      <div className="bg-gradient-to-b from-border to-surface-base p-6 md:p-8 pb-8">
        <div className="flex items-end gap-6">
          <div className="w-40 md:w-56 flex-shrink-0">
            <MiniCassette
              name={cassette.name}
              albumName={cassette.albumName}
              artistName={cassette.artistName}
              showDate={cassette.showDate}
              coverArt={cassette.coverArt}
              tintStyle={resolveCassetteTint(cassette)}
              headerLabel={cassette.colorBrand ? getCassetteBrand(cassette.colorBrand)?.headerLabel : undefined}
              pickCount={Object.keys(cassette.versionOverrides).length}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-secondary text-sm uppercase font-medium mb-2">Cassette</p>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value.slice(0, VALIDATION_LIMITS.CASSETTE_NAME_MAX))}
                maxLength={VALIDATION_LIMITS.CASSETTE_NAME_MAX}
                className="w-full bg-transparent text-white text-3xl md:text-5xl font-bold mb-4 border-b border-white/20 focus:outline-none focus:border-white"
                autoFocus
              />
            ) : (
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 truncate">{cassette.name}</h1>
            )}

            <div className="flex items-center gap-2 text-sm text-secondary mb-1">
              <Link href={`/artists/${cassette.artistSlug}`} className="hover:text-white hover:underline">
                {cassette.artistName}
              </Link>
              {cassette.showVenue && (
                <>
                  <span>•</span>
                  <span>{cassette.showVenue}</span>
                </>
              )}
              {cassette.showDate && (
                <>
                  <span>•</span>
                  <span>{cassette.showDate}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-white">
              <span>{resolvedTracks.length} tracks</span>
              {totalDuration > 0 && (
                <>
                  <span>•</span>
                  <span>{formatDuration(totalDuration)}</span>
                </>
              )}
              {overrideCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-accent">{overrideCount} custom version{overrideCount !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-6 md:px-8 py-6">
        {isEditing ? (
          <>
            <button onClick={handleSaveEdit} className="px-6 py-3 rounded-full bg-accent text-black font-medium hover:bg-accent-hover transition-colors">Save</button>
            <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors">Cancel</button>
          </>
        ) : (
          <>
            <button
              onClick={handlePlayAll}
              disabled={resolvedTracks.length === 0 || isLoading}
              className="w-14 h-14 rounded-full bg-accent text-black flex items-center justify-center hover:bg-accent-hover hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg btn-touch"
              aria-label="Play all"
            >
              <svg className="w-7 h-7 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <Link
              href={`/artists/${cassette.artistSlug}/album/${cassette.albumIdentifier}`}
              className="p-3 text-secondary hover:text-white transition-colors btn-touch"
              aria-label="View album"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <button onClick={handleEdit} className="p-3 text-secondary hover:text-white transition-colors btn-touch" aria-label="Edit Cassette">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="p-3 text-secondary hover:text-red-500 transition-colors btn-touch" aria-label="Delete Cassette">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Color picker section */}
            {(() => {
              const colorMode = getCassetteColorMode(cassette);
              return (
                <div className="flex items-center gap-3 ml-2 pl-2 border-l" style={{ borderColor: 'color-mix(in srgb, white 12%, transparent)' }}>
                  {/* Preset swatches */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Presets</span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {CASSETTE_PRESETS.map((preset, i) => {
                        const isActive = colorMode === 'preset' && (cassette.colorIndex ?? 0) === i;
                        const color = getSwatchColor(i);
                        return (
                          <button
                            key={i}
                            onClick={() => updateCassette(cassette.id, { colorIndex: i, colorHex: '', colorBrand: '' })}
                            title={preset.name}
                            className="w-6 h-6 rounded-full transition-all hover:scale-110"
                            style={{
                              background: color,
                              boxShadow: isActive ? `0 0 0 2px var(--surface-base), 0 0 0 4px ${color}` : 'none',
                              opacity: colorMode !== 'preset' ? 0.4 : isActive ? 1 : 0.6,
                            }}
                            aria-label={`${preset.name}${isActive ? ' (selected)' : ''}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom color */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Custom</span>
                    <div className="flex items-center gap-1.5">
                      <label className="relative w-7 h-7 rounded-full overflow-hidden cursor-pointer transition-all hover:scale-110" style={{
                        boxShadow: colorMode === 'hex' ? `0 0 0 2px var(--surface-base), 0 0 0 4px ${cassette.colorHex}` : 'none',
                      }}>
                        <input
                          type="color"
                          value={cassette.colorHex || '#e84393'}
                          onChange={(e) => {
                            const hex = e.target.value;
                            if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
                              updateCassette(cassette.id, { colorHex: hex, colorBrand: '' });
                            }
                          }}
                          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                        />
                        <div className="w-full h-full rounded-full" style={{
                          background: colorMode === 'hex' ? cassette.colorHex : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                          opacity: colorMode === 'hex' ? 1 : 0.5,
                        }} />
                      </label>
                      {colorMode === 'hex' && (
                        <>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{cassette.colorHex}</span>
                          <button
                            onClick={() => updateCassette(cassette.id, { colorHex: '' })}
                            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                            style={{ color: 'var(--text-tertiary)' }}
                            aria-label="Clear custom color"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Brand presets */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Brands</span>
                    <div className="flex items-center gap-2">
                      {CASSETTE_BRANDS.map((brand) => {
                        const isActive = colorMode === 'brand' && cassette.colorBrand === brand.key;
                        return (
                          <button
                            key={brand.key}
                            onClick={() => updateCassette(cassette.id, { colorBrand: brand.key, colorHex: '' })}
                            title={brand.name}
                            className="flex flex-col items-center gap-0.5 transition-all hover:scale-110"
                          >
                            <div
                              className="w-10 h-[26px] rounded-[3px] overflow-hidden"
                              style={{
                                boxShadow: isActive ? `0 0 0 2px var(--surface-base), 0 0 0 3px ${brand.accent}` : '0 1px 3px rgba(0,0,0,0.4)',
                                opacity: colorMode === 'brand' && !isActive ? 0.4 : colorMode !== 'brand' ? 0.55 : 1,
                              }}
                            >
                              <div className="h-[8px]" style={{ background: brand.tint['--cassette-header'] }} />
                              <div className="h-[18px]" style={{ background: brand.tint['--cassette-body'] }} />
                            </div>
                            <span className="text-[8px] font-medium leading-none" style={{ color: isActive ? brand.accent : 'var(--text-tertiary)' }}>{brand.name.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Track list */}
      {isLoading ? (
        <div className="space-y-1 px-4 md:px-8 py-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-8 h-4 skeleton" />
              <div className="flex-1 min-w-0">
                <div className="h-4 skeleton mb-1.5" style={{ width: `${50 + (i % 3) * 15}%` }} />
                <div className="h-3 skeleton" style={{ width: `${30 + (i % 4) * 10}%` }} />
              </div>
              <div className="h-4 w-12 skeleton hidden md:block" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-secondary text-sm">{error}</p>
        </div>
      ) : (
        <div className="space-y-1 px-4 md:px-8">
          {resolvedTracks.map((rt, index) => (
            <div
              key={rt.track.id}
              className="flex items-center gap-3 p-3 rounded hover:bg-white/10 transition-colors group"
            >
              {/* Track number */}
              <span className="w-8 text-right text-sm font-mono text-secondary">{index + 1}</span>

              {/* Song info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium truncate">{rt.track.title}</p>
                  {rt.isOverridden && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-accent/20 text-accent flex-shrink-0">
                      CUSTOM
                    </span>
                  )}
                </div>
                <p className="text-secondary text-sm truncate">
                  {rt.selectedSong.showVenue || rt.selectedSong.artistName}
                  {rt.selectedSong.showDate ? ` • ${rt.selectedSong.showDate}` : ''}
                </p>
              </div>

              {/* Duration */}
              <div className="text-secondary text-sm font-mono hidden md:block">
                {formatDuration(rt.selectedSong.duration)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[9998] animate-fade-in" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-surface-elevated rounded-lg p-6 max-w-sm w-full animate-scale-in">
              <h3 className="text-white font-bold text-lg mb-2">Delete Cassette?</h3>
              <p className="text-secondary text-sm mb-6">
                This action cannot be undone. &quot;{cassette.name}&quot; will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
