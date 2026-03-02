'use client';

// VersionPickerModal - Browse and swap between different live recordings of a song.
// Shows all available versions with sorting, filtering, star ratings, and one-click swapping.

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { formatDuration } from '@/lib/api';
import RecordingMediumIcon from '@/components/RecordingMediumIcon';
import type { Song } from '@/lib/types';

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
  onPlayVersion?: (song: Song) => void;
  onQueueVersion?: (song: Song) => void;
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

// ─── Recording Type Badge ─────────────────────────────────────────────

const REC_TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  SBD:     { bg: 'rgba(200,168,72,0.15)',  color: '#c8a848' },
  AUD:     { bg: 'rgba(196,112,110,0.15)', color: '#c4706e' },
  MX:      { bg: 'rgba(180,140,200,0.15)', color: '#b48cc8' },
  FM:      { bg: 'rgba(106,154,74,0.15)',  color: '#6a9a4a' },
  WEBCAST: { bg: 'rgba(106,154,74,0.15)',  color: '#6a9a4a' },
};

function RecTypeBadge({ type }: { type?: string }) {
  const label = type || 'AUD';
  const style = REC_TYPE_STYLES[label] || REC_TYPE_STYLES.AUD;
  return (
    <span
      className="font-jb-mono text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] tracking-wide"
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
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
  onPlayVersion,
  onQueueVersion,
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
            // Clicking the backdrop (outside the modal panel) closes the dialog.
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
                    onSwap={handleSwap}
                    onPlay={onPlayVersion}
                    onQueue={onQueueVersion}
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
  onSwap,
  onPlay,
  onQueue,
}: {
  song: Song;
  isCurrent: boolean;
  onSwap: (song: Song) => void;
  onPlay?: (song: Song) => void;
  onQueue?: (song: Song) => void;
}) {
  const recordingType = song.recordingType;
  const venue = song.showVenue || '';
  const location = song.showLocation || '';

  return (
    <div
      className="group/vrow mx-0.5 mb-2 rounded-lg transition-all overflow-hidden"
      style={{
        background: isCurrent
          ? 'color-mix(in srgb, var(--quinary) 10%, transparent)'
          : 'color-mix(in srgb, var(--text) 2%, transparent)',
        border: isCurrent
          ? '1px solid color-mix(in srgb, var(--quinary) 25%, transparent)'
          : '1px solid color-mix(in srgb, var(--text) 6%, transparent)',
      }}
    >
      {/* Top section: icon + info + duration */}
      <div className="flex items-start gap-3.5 px-4 pt-3.5 pb-3">
        {/* Format icon */}
        <div
          className="w-[52px] h-[52px] rounded-lg flex-shrink-0 flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(175deg, #2a2622 0%, #1e1a16 50%, #14120c 100%)',
            border: '1px solid rgba(200,180,140,0.08)',
          }}
        >
          <RecordingMediumIcon medium={song.recordingMedium} lineage={song.lineage} source={song.source} size={0.85} />
        </div>

        {/* Info column */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Row 1: Date · Venue */}
          <div className="flex items-baseline gap-2">
            <span className="font-jb-mono text-[13px] font-semibold text-primary leading-tight tracking-wide">
              {song.showDate ? song.showDate.replace(/-/g, '/') : 'Unknown date'}
            </span>
            <span className="text-[13px] font-medium truncate" style={{ color: 'var(--tertiary)' }}>
              {venue || song.albumName || 'Unknown venue'}
            </span>
          </div>
          {/* Location */}
          {location && (
            <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {location}
            </span>
          )}

          {/* Row 2: Taper */}
          {song.taper && (
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <circle cx="10" cy="5" r="3" fill="#b8d0dc"/>
                <path d="M10 8c-3.5 0-6 2-6 5v2h12v-2c0-3-2.5-5-6-5z" fill="#3a5060"/>
                <line x1="17" y1="3" x2="17" y2="19" stroke="#90b4c4" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="15" y="0.5" width="4" height="4.5" rx="1.5" fill="#b8d0dc"/>
                <path d="M13 11l4-3.5" stroke="#5a7888" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <a
                href={`https://archive.org/search?query=taper:${encodeURIComponent('"' + song.taper + '"')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-jb-mono text-[11px] font-medium hover:underline transition-colors truncate"
                style={{ color: 'var(--text-tertiary)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {song.taper}
              </a>
            </div>
          )}

          {/* Row 3: Source badge · Stars · Downloads */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <RecTypeBadge type={recordingType} />
            <StarRating rating={song.avgRating} count={song.numReviews} />
            {song.downloads != null && song.downloads > 0 && (
              <span className="font-jb-mono text-[11px] flex items-center gap-0.5" style={{ color: 'var(--text-tertiary)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <path d="M12 2L2 7v1h20V7L12 2z" fill="rgba(200,180,140,0.55)"/>
                  <rect x="4.5" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                  <rect x="9" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                  <rect x="13" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                  <rect x="17.5" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                  <rect x="2" y="17" width="20" height="2" rx="0.5" fill="rgba(200,180,140,0.45)"/>
                </svg>
                <svg width="7" height="12" viewBox="0 0 10 16" fill="none" className="flex-shrink-0">
                  <path d="M5 1v11M5 12l-3.5-3.5M5 12l3.5-3.5" stroke="#8fa8b3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {song.downloads.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Duration (top-right) */}
        {song.duration > 0 && (
          <span className="font-jb-mono text-[12px] font-medium flex-shrink-0 pt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {formatDuration(song.duration)}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4" style={{ height: '1px', background: 'color-mix(in srgb, var(--text) 8%, transparent)' }} />

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: action buttons */}
        <div className="flex items-center gap-2">
          {/* Play */}
          {onPlay && (
            <button
              onClick={(e) => { e.stopPropagation(); onPlay(song); }}
              className="font-jb-mono text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5"
              style={{
                color: 'var(--tertiary)',
                border: '1px solid color-mix(in srgb, var(--tertiary) 30%, transparent)',
              }}
            >
              <span className="text-[10px]">▶</span> Play
            </button>
          )}
          {/* + Queue */}
          {onQueue && (
            <button
              onClick={(e) => { e.stopPropagation(); onQueue(song); }}
              className="font-jb-mono text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all flex items-center gap-1"
              style={{
                color: 'var(--text-tertiary)',
                border: '1px solid color-mix(in srgb, var(--text) 10%, transparent)',
              }}
            >
              + Queue
            </button>
          )}
          {/* ✦ Swap */}
          <button
            onClick={(e) => { e.stopPropagation(); onSwap(song); }}
            className="font-jb-mono text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all flex items-center gap-1"
            style={{
              color: isCurrent ? 'var(--quinary)' : 'var(--text-tertiary)',
              border: isCurrent
                ? '1px solid color-mix(in srgb, var(--quinary) 30%, transparent)'
                : '1px solid color-mix(in srgb, var(--text) 10%, transparent)',
            }}
          >
            ✦ Swap
          </button>
        </div>

        {/* Right: star + menu icons */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => e.stopPropagation()}
            className="transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="Favorite"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="More options"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <polyline points="17 9 20 12 17 15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Export icon for use in other components ──────────────────────────

export { VersionsIcon, StarRating, RecTypeBadge };
