'use client';

// VersionPickerModal - Browse and swap between different live recordings of a song.
// Shows all available versions with sorting, filtering, star ratings, and one-click swapping.

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { formatDuration } from '@/lib/api';
import { getRecordingBadge } from '@/lib/lineageUtils';
import { getQualityLabel, getEffectiveQuality } from '@/lib/qualityUtils';
import type { Song, AudioQuality } from '@/lib/types';

// ─── Types ───────────────────────────────────────────────────────────

interface VersionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  artistName: string;
  currentSongId: string;
  versions: Song[];
  coverArt?: string;
  onSwapVersion: (song: Song) => void;
  preferredQuality?: AudioQuality;
}

type SortKey = 'date' | 'rating' | 'length';
type SortDir = 'asc' | 'desc';

// ─── Star Rating (self-contained) ────────────────────────────────────

function StarRating({ rating, count }: { rating?: number; count?: number }) {
  if (!rating) return null;

  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5" title={`${rating.toFixed(1)}/5${count ? ` (${count})` : ''}`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`f${i}`} className="w-2.5 h-2.5" style={{ color: 'var(--quinary)' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {hasHalf && (
        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="vpm-half">
              <stop offset="50%" stopColor="var(--quinary)" />
              <stop offset="50%" stopColor="var(--tertiary)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#vpm-half)" />
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`e${i}`} className="w-2.5 h-2.5" style={{ color: 'var(--tertiary)', opacity: 0.3 }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {count != null && count > 0 && (
        <span className="font-jb-mono text-[9px] ml-0.5" style={{ color: 'var(--text-tertiary)' }}>
          ({count})
        </span>
      )}
    </div>
  );
}

// ─── Stacked Rectangles Icon ─────────────────────────────────────────

function VersionsIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="1" width="10" height="8" rx="1.5" />
      <path d="M5 11h6" />
      <path d="M6 13h4" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export default function VersionPickerModal({
  isOpen,
  onClose,
  trackTitle,
  artistName,
  currentSongId,
  versions,
  coverArt,
  onSwapVersion,
  preferredQuality = 'medium',
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

        {/* Content — centered on desktop, bottom-sheet on mobile */}
        <Dialog.Content
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onClick={(e) => {
            // Stop backdrop clicks from bubbling through Portal to parent track row.
            if (e.target === e.currentTarget) e.stopPropagation();
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-[580px] h-[85vh] md:h-[80vh] flex flex-col rounded-t-2xl md:rounded-2xl overflow-hidden animate-slide-up md:animate-none"
            style={{
              background: 'linear-gradient(180deg, var(--player-surface-deep) 0%, var(--surface-card) 100%)',
              border: '1px solid color-mix(in srgb, var(--border-default) 30%, transparent)',
              boxShadow: '0 24px 80px color-mix(in srgb, black 60%, transparent)',
            }}
          >
            {/* Top glow line */}
            <div
              className="h-px flex-shrink-0"
              style={{ background: 'linear-gradient(90deg, transparent, var(--quinary), var(--tertiary), transparent)' }}
            />

            {/* Header */}
            <div className="flex items-start gap-3.5 px-5 pt-4 pb-3 flex-shrink-0">
              {/* Song art */}
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

              {/* Title + meta */}
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

              {/* Close button */}
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
              {/* Search */}
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
                    e.currentTarget.style.borderColor = 'var(--tertiary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-default) 40%, transparent)';
                  }}
                />
                {/* Clear button */}
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

              {/* Sort buttons */}
              {(['date', 'rating', 'length'] as SortKey[]).map((key) => {
                const isActive = sortKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSort(key)}
                    className="font-jb-mono text-[10px] font-semibold px-2.5 py-1.5 rounded-md transition-all uppercase tracking-wider whitespace-nowrap"
                    style={{
                      background: isActive
                        ? 'color-mix(in srgb, var(--quinary) 20%, transparent)'
                        : 'transparent',
                      color: isActive ? 'var(--quinary)' : 'var(--text-tertiary)',
                      border: isActive
                        ? '1px solid color-mix(in srgb, var(--quinary) 30%, transparent)'
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
            <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2 queue-sidebar-scroll">
              {sortedVersions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
                    No versions match &quot;{filter}&quot;
                  </p>
                </div>
              ) : (
                sortedVersions.map((song) => (
                  <VersionRow
                    key={song.id}
                    song={song}
                    isCurrent={song.id === currentSongId}
                    preferredQuality={preferredQuality}
                    onSwap={handleSwap}
                  />
                ))
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
  preferredQuality,
  onSwap,
}: {
  song: Song;
  isCurrent: boolean;
  preferredQuality: AudioQuality;
  onSwap: (song: Song) => void;
}) {
  const badge = getRecordingBadge(song.lineage, song.recordingType);
  const effectiveQuality = getEffectiveQuality(song, preferredQuality);
  const qualityLabel = getQualityLabel(effectiveQuality, song);

  const venue = song.showVenue || '';
  const location = song.showLocation || '';
  const venueDisplay = [venue, location].filter(Boolean).join(', ');
  const year = song.showDate?.split('-')[0] || '';

  return (
    <div
      className="group/vrow flex items-center gap-2.5 px-2.5 py-2.5 mx-0.5 mb-1 rounded-lg transition-all relative cursor-pointer"
      style={{
        background: isCurrent
          ? 'color-mix(in srgb, var(--quinary) 10%, transparent)'
          : 'transparent',
        border: isCurrent
          ? '1px solid color-mix(in srgb, var(--quinary) 25%, transparent)'
          : '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!isCurrent) {
          e.currentTarget.style.background = 'var(--player-surface-chip)';
          e.currentTarget.style.borderColor = 'var(--border-subtle-player)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isCurrent) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
      onClick={() => !isCurrent && onSwap(song)}
    >
      {/* Left teal accent bar on hover (non-current only) */}
      {!isCurrent && (
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-sm transition-opacity opacity-0 group-hover/vrow:opacity-100"
          style={{ background: 'var(--tertiary)' }}
        />
      )}

      {/* Current indicator bar */}
      {isCurrent && (
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-sm"
          style={{ background: 'var(--quinary)' }}
        />
      )}

      {/* Venue + date column */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-primary truncate leading-tight">
          {venueDisplay || song.albumName || 'Unknown venue'}
        </p>
        <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
          {song.albumName && venueDisplay ? song.albumName : ''}
        </p>

        {/* Meta row: date + duration + badges */}
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {year && (
            <span className="font-jb-mono text-[10px] font-medium" style={{ color: 'var(--tertiary)' }}>
              {song.showDate || year}
            </span>
          )}
          {song.duration > 0 && (
            <span className="font-jb-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {formatDuration(song.duration)}
            </span>
          )}
          {/* Quality badge */}
          <span
            className="font-jb-mono text-[8px] font-semibold px-[4px] py-px rounded-[2px]"
            style={{
              background: 'color-mix(in srgb, var(--tertiary) 15%, transparent)',
              color: 'var(--tertiary)',
              border: '1px solid color-mix(in srgb, var(--tertiary) 12%, transparent)',
            }}
          >
            {qualityLabel}
          </span>
          {/* Recording type badge (SBD, MX, etc.) */}
          {badge && badge.show && (
            <span
              className="font-jb-mono text-[8px] font-bold px-[4px] py-px rounded-[2px] uppercase"
              style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
            >
              {badge.text}
            </span>
          )}
          {/* Download count */}
          {song.downloads != null && song.downloads > 0 && (
            <span className="font-jb-mono text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
              {song.downloads.toLocaleString()} dl
            </span>
          )}
        </div>

        {/* Star rating */}
        <div className="mt-0.5">
          <StarRating rating={song.avgRating} count={song.numReviews} />
        </div>
      </div>

      {/* Right side: IN QUEUE badge or Swap button */}
      <div className="flex-shrink-0 ml-1">
        {isCurrent ? (
          <span
            className="font-jb-mono text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider"
            style={{
              background: 'color-mix(in srgb, var(--quinary) 20%, transparent)',
              color: 'var(--quinary)',
              border: '1px solid color-mix(in srgb, var(--quinary) 30%, transparent)',
            }}
          >
            In Queue
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwap(song);
            }}
            className="font-jb-mono text-[10px] font-semibold px-2.5 py-1.5 rounded-md transition-all opacity-0 group-hover/vrow:opacity-100"
            style={{
              background: 'color-mix(in srgb, var(--tertiary) 15%, transparent)',
              color: 'var(--tertiary)',
              border: '1px solid color-mix(in srgb, var(--tertiary) 25%, transparent)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--tertiary)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'color-mix(in srgb, var(--tertiary) 15%, transparent)';
              e.currentTarget.style.color = 'var(--tertiary)';
            }}
          >
            Swap In
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Export icon for use in other components ──────────────────────────

export { VersionsIcon };
