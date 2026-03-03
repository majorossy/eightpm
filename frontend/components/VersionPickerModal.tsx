'use client';

// VersionPickerModal - Browse and swap between different live recordings of a song.
// Shows all available versions with sorting, filtering, star ratings, and one-click swapping.

import { useState, useMemo, useCallback, useRef, Fragment } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { RecordingRow } from '@/components/version-row';
import type { Song } from '@/lib/types';
import { useGrabToSeek } from '@/hooks/useGrabToSeek';

// ─── Types ───────────────────────────────────────────────────────────

interface VersionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  artistName: string;
  currentSongId: string;
  versions: Song[];
  coverArt?: string;
  trackNumber?: number | null;
  onSwapVersion: (song: Song) => void;
  onPlayVersion?: (song: Song) => void;
  onQueueVersion?: (song: Song) => void;
}

type SortKey = 'date' | 'rating' | 'length';
type SortDir = 'asc' | 'desc';

// ─── Component ───────────────────────────────────────────────────────

export default function VersionPickerModal({
  isOpen,
  onClose,
  trackTitle,
  artistName,
  currentSongId,
  versions,
  coverArt,
  trackNumber,
  onSwapVersion,
  onPlayVersion: _onPlayVersion,
  onQueueVersion: _onQueueVersion,
}: VersionPickerModalProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter, setFilter] = useState('');

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir(key === 'rating' ? 'desc' : 'desc');
    }
  }, [sortKey]);

  // Filter + sort versions
  const sortedVersions = useMemo(() => {
    const q = filter.toLowerCase().trim();

    let filtered = versions;
    if (q) {
      filtered = versions.filter(v => {
        const searchable = [
          v.showVenue, v.showLocation, v.showDate,
          v.source, v.lineage, v.albumName, v.notes,
        ].filter(Boolean).join(' ').toLowerCase();
        return searchable.includes(q);
      });
    }

    return [...filtered].sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      switch (sortKey) {
        case 'date': {
          const da = a.showDate || '';
          const db = b.showDate || '';
          return da < db ? dir : da > db ? -dir : 0;
        }
        case 'rating': {
          const ra = a.avgRating ?? 0;
          const rb = b.avgRating ?? 0;
          return (ra - rb) * -dir;
        }
        case 'length': {
          return ((a.duration || 0) - (b.duration || 0)) * -dir;
        }
        default:
          return 0;
      }
    });
  }, [versions, filter, sortKey, sortDir]);

  // Grab-to-seek: rubber-band scroll to current version's natural position
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const currentIndex = sortedVersions.findIndex(s => s.id === currentSongId);
  const grabToSeek = useGrabToSeek({ scrollContainerRef, sentinelRef, enabled: currentIndex >= 0 });

  const handleSwap = useCallback((song: Song) => {
    onSwapVersion(song);
    onClose();
  }, [onSwapVersion, onClose]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className="fixed inset-0 z-[100]"
          style={{
            background: 'color-mix(in srgb, var(--primary) 85%, transparent)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Content */}
        <Dialog.Content
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.stopPropagation();
              onClose();
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-[580px] h-[85vh] md:h-[80vh] flex flex-col rounded-t-2xl md:rounded-2xl overflow-hidden animate-slide-up md:animate-none"
            style={{
              background: 'linear-gradient(180deg, var(--player-surface-deep) 0%, var(--surface-card) 100%)',
              border: '1px solid color-mix(in srgb, var(--quaternary) 40%, transparent)',
              boxShadow: '0 24px 80px color-mix(in srgb, black 60%, transparent)',
            }}
          >
            {/* Top glow line */}
            <div
              className="h-px flex-shrink-0"
              style={{ background: 'linear-gradient(90deg, transparent, var(--quaternary), var(--tertiary), transparent)' }}
            />

            {/* Header */}
            <div className="flex items-start gap-3.5 px-5 pt-4 pb-3 flex-shrink-0">
              <div
                className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--surface-elevated), var(--surface-card))',
                  boxShadow: '0 2px 10px color-mix(in srgb, black 30%, transparent)',
                }}
              >
                {coverArt ? (
                  <Image src={coverArt} alt="" width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-5 h-5" style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-[20px] font-bold text-primary truncate leading-tight">
                  {trackTitle}
                </Dialog.Title>
                <p className="text-[14px] truncate mt-0.5" style={{ color: 'var(--tertiary)' }}>
                  {artistName}
                </p>
                <p className="font-jb-mono text-[11px] mt-1" style={{ color: filter ? 'var(--tertiary)' : 'var(--text-tertiary)' }}>
                  {filter
                    ? `${sortedVersions.length} of ${versions.length} versions`
                    : `${versions.length} version${versions.length !== 1 ? 's' : ''} on archive.org`}
                </p>
              </div>

              <Dialog.Close asChild>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    border: '1.5px solid color-mix(in srgb, var(--primary) 23%, transparent)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--primary-muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--primary) 23%, transparent)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  aria-label="Close version picker"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>

            {/* Controls row: search + sort */}
            <div className="flex items-center gap-2 px-5 pb-3 flex-shrink-0">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: filter ? 'var(--tertiary)' : 'var(--text-tertiary)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter by venue, year, source..."
                  className="w-full pl-8 pr-8 py-1.5 rounded-md text-[12px] text-primary placeholder:text-tertiary outline-none ring-0 focus:outline-none focus:ring-0 transition-colors font-jb-mono"
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid color-mix(in srgb, var(--border-default) 40%, transparent)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--quaternary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-default) 40%, transparent)';
                  }}
                />
                {filter && (
                  <button
                    onClick={() => setFilter('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: 'var(--text-tertiary)', color: 'var(--surface-card)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--tertiary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--text-tertiary)'; }}
                    aria-label="Clear filter"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {(['date', 'rating', 'length'] as SortKey[]).map((key) => {
                const isActive = sortKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSort(key)}
                    className="font-jb-mono text-[10px] font-semibold px-2.5 py-1.5 rounded-md transition-all uppercase tracking-wider whitespace-nowrap"
                    style={{
                      background: isActive
                        ? 'color-mix(in srgb, var(--quaternary) 20%, transparent)'
                        : 'transparent',
                      color: isActive ? 'var(--quaternary)' : 'var(--text-tertiary)',
                      border: isActive
                        ? '1px solid color-mix(in srgb, var(--quaternary) 30%, transparent)'
                        : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'color-mix(in srgb, var(--border-default) 15%, transparent)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {key}
                    {isActive && (sortDir === 'desc'
                      ? <svg className="inline-block w-2.5 h-2.5 ml-0.5" viewBox="0 0 10 10" fill="currentColor"><path d="M1 3l4 5 4-5z" /></svg>
                      : <svg className="inline-block w-2.5 h-2.5 ml-0.5" viewBox="0 0 10 10" fill="currentColor"><path d="M1 7l4-5 4 5z" /></svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div
              className="mx-5 flex-shrink-0"
              style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-subtle-player), transparent)' }}
            />

            {/* Version list */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 px-3 py-2 queue-sidebar-scroll">
              {sortedVersions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
                    No versions match &quot;{filter}&quot;
                  </p>
                </div>
              ) : (
                sortedVersions.map((song) => {
                  const isCurrentVersion = song.id === currentSongId;
                  return (
                    <Fragment key={song.id}>
                      {isCurrentVersion && <div ref={sentinelRef} className="h-0" />}
                      <VersionRow
                        song={song}
                        isCurrent={isCurrentVersion}
                        onSwap={handleSwap}
                        trackNumber={trackNumber}
                        grabHandlers={isCurrentVersion ? grabToSeek.pointerHandlers : undefined}
                        isDragging={isCurrentVersion && grabToSeek.isDragging}
                        stickyDisabled={isCurrentVersion && grabToSeek.stickyDisabled}
                        cardTranslateY={isCurrentVersion ? grabToSeek.cardTranslateY : 0}
                        seekLanded={isCurrentVersion && grabToSeek.seekLanded}
                      />
                    </Fragment>
                  );
                })
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Version Row ─────────────────────────────────────────────────────

function VersionRow({
  song,
  isCurrent,
  onSwap,
  trackNumber,
  grabHandlers,
  isDragging,
  stickyDisabled,
  cardTranslateY = 0,
  seekLanded,
}: {
  song: Song;
  isCurrent: boolean;
  onSwap: (song: Song) => void;
  trackNumber?: number | null;
  grabHandlers?: Record<string, (e: React.PointerEvent) => void>;
  isDragging?: boolean;
  stickyDisabled?: boolean;
  cardTranslateY?: number;
  seekLanded?: boolean;
}) {
  return (
    <div
      className={`group/vrow mx-0.5 mb-2 rounded-lg transition-all overflow-hidden${seekLanded ? ' seek-landed' : ''}`}
      style={{
        background: isCurrent
          ? 'color-mix(in srgb, var(--quaternary) 10%, var(--surface-card))'
          : 'color-mix(in srgb, var(--text) 2%, transparent)',
        border: isCurrent
          ? '1px solid var(--quaternary)'
          : '1px solid color-mix(in srgb, var(--text) 6%, transparent)',
        ...(isCurrent && !stickyDisabled ? {
          position: 'sticky' as const,
          top: 0,
          bottom: 0,
          zIndex: 10,
          boxShadow: isDragging
            ? '0 8px 24px color-mix(in srgb, black 40%, transparent)'
            : '0 4px 12px color-mix(in srgb, black 25%, transparent)',
        } : {}),
        ...(isDragging ? {
          transform: `translateY(${cardTranslateY}px)`,
          cursor: 'grabbing',
        } : {}),
        ...(isCurrent && !isDragging && !stickyDisabled ? {
          cursor: 'grab',
        } : {}),
      }}
      {...(grabHandlers || {})}
    >
      {/* Drag handle pill — visible affordance on sticky current card */}
      {isCurrent && !stickyDisabled && (
        <div className="flex justify-center pt-1.5 pb-0">
          <div
            className="w-8 h-[3px] rounded-full transition-colors"
            style={{
              background: isDragging
                ? 'color-mix(in srgb, var(--quaternary) 60%, transparent)'
                : 'color-mix(in srgb, var(--text-tertiary) 30%, transparent)',
            }}
          />
        </div>
      )}

      {/* Recording data */}
      <div className="px-4 pt-3 pb-3">
        <RecordingRow
          song={song}
          trackNumber={trackNumber}
          taperLinkToArchive
          iconScale={1.2}
          actionsAlign="start"
          swapLabel="swap in"
          actions={isCurrent ? ['play', 'play-next', 'queue', 'playlist', 'favorite'] : ['swap', 'play', 'play-next', 'queue', 'playlist', 'favorite']}
          onSwap={!isCurrent ? (e) => { e.stopPropagation(); onSwap(song); } : undefined}
        />
      </div>
    </div>
  );
}

