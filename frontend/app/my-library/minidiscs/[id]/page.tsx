'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useMiniDiscs } from '@/context/CollectionContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { useQueue } from '@/context/QueueContext';
import { usePlayer } from '@/context/PlayerContext';
import { useBackToClose } from '@/hooks/useBackToClose';
import { formatDuration } from '@/lib/api';
import { VALIDATION_LIMITS } from '@/lib/validation';
import { RecordingRow } from '@/components/version-row';
import type { Song } from '@/lib/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Helper: MD capacity label based on total duration ──────────────────
function getMDCapacity(totalSeconds: number): string {
  const minutes = Math.ceil(totalSeconds / 60);
  if (minutes <= 60) return 'MD 60';
  if (minutes <= 74) return 'MD 74';
  return 'MD 80';
}

// ── Helper: dominant recording type from songs ─────────────────────────
function getDominantRecType(songs: Song[]): string {
  const counts: Record<string, number> = {};
  songs.forEach(s => {
    const type = s.recordingType || 'AUD';
    counts[type] = (counts[type] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'AUD';
}

// ── Header MiniDisc SVG Art ────────────────────────────────────────────
function MiniDiscHeaderArt() {
  return (
    <div className="flex-shrink-0 relative" style={{ width: 108, height: 116 }}>
      <svg viewBox="0 0 108 116" className="w-full h-full" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}>
        <defs>
          <linearGradient id="md-hdr-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2a4a5e" />
            <stop offset="60%" stopColor="#162838" />
            <stop offset="100%" stopColor="#0e1e2e" />
          </linearGradient>
        </defs>
        {/* Shell */}
        <path fill="url(#md-hdr-shell)" stroke="color-mix(in srgb, var(--tertiary) 20%, transparent)" strokeWidth="1"
          d="M8,0 L86,0 L108,22 L108,108 Q108,116 100,116 L8,116 Q0,116 0,108 L0,8 Q0,0 8,0 Z" />
        {/* Corner notch */}
        <path fill="rgba(0,0,0,0.35)" d="M86,0 L108,22 L96,22 L86,10 Z" />
        <path fill="rgba(255,255,255,0.07)" d="M86,0 L96,0 L108,12 L108,22 L86,0Z" />
        {/* Disc window */}
        <circle cx="54" cy="52" r="34" fill="rgba(0,0,0,0.5)" stroke="color-mix(in srgb, var(--tertiary) 18%, transparent)" strokeWidth="1" />
        {/* Shutter area */}
        <rect x="0" y="88" width="108" height="28" fill="rgba(0,0,0,0.3)" />
        <rect x="0" y="88" width="108" height="1" fill="color-mix(in srgb, var(--tertiary) 12%, transparent)" />
        <rect x="8" y="93" width="64" height="14" rx="2" fill="rgba(30,60,80,0.7)" stroke="color-mix(in srgb, var(--tertiary) 10%, transparent)" strokeWidth="0.5" />
        {/* Write tab */}
        <rect x="5" y="4" width="10" height="5" rx="1.5" fill="color-mix(in srgb, var(--tertiary) 35%, transparent)" />
        {/* Top gloss */}
        <ellipse cx="44" cy="10" rx="28" ry="4" fill="rgba(255,255,255,0.06)" transform="rotate(-4,44,10)" />
        {/* ATRAC label */}
        <text x="54" y="104" textAnchor="middle" fill="color-mix(in srgb, var(--tertiary) 50%, transparent)" fontFamily="var(--font-jetbrains-mono), monospace" fontSize="5" letterSpacing="1.5">ATRAC &middot; MD</text>
      </svg>
      {/* Spinning disc inside window */}
      <div className="absolute rounded-full overflow-hidden" style={{ top: 14, left: '50%', transform: 'translateX(-50%)', width: 60, height: 60 }}>
        <div className="w-full h-full rounded-full" style={{
          background: 'conic-gradient(#1a2e40 0deg, #0d1e2e 60deg, #203848 120deg, #142030 180deg, #1c3040 240deg, #0e1e2c 300deg, #1a2e40 360deg)',
          animation: 'mi-spin 8s linear infinite',
        }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full relative" style={{
            width: 16, height: 16,
            background: 'conic-gradient(#888 0deg, #ddd 40deg, #aaa 80deg, #bbb 120deg, #888 160deg, #ccc 200deg, #aaa 240deg, #ddd 280deg, #999 320deg, #bbb 360deg)',
            boxShadow: '0 0 0 2px rgba(0,0,0,0.5)',
          }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: 6, height: 6, background: '#222' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Track Position Dots ────────────────────────────────────────────────
function TrackDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count === 0) return null;
  const capped = Math.min(count, 20);
  return (
    <div className="flex items-center justify-center gap-3 py-2.5 px-6"
      style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="font-jb-mono text-[8px] tracking-[2px] uppercase"
        style={{ color: 'var(--text-tertiary)' }}>TRK</span>
      <div className="flex gap-1.5">
        {Array.from({ length: capped }).map((_, i) => (
          <div key={i} className="relative overflow-hidden" style={{
            width: 22, height: 4, borderRadius: 2,
            background: i < activeIndex
              ? 'color-mix(in srgb, var(--tertiary) 20%, transparent)'
              : i === activeIndex
                ? 'color-mix(in srgb, var(--tertiary) 30%, transparent)'
                : 'rgba(255,255,255,0.1)',
          }}>
            {i === activeIndex && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'var(--tertiary)',
                width: '50%', borderRadius: 2,
                boxShadow: '0 0 4px var(--tertiary)',
              }} />
            )}
          </div>
        ))}
      </div>
      <span className="font-jb-mono text-[8px] tracking-[2px]"
        style={{ color: 'var(--text-tertiary)', opacity: 0.35 }}>
        01&ndash;{String(count).padStart(2, '0')}
      </span>
    </div>
  );
}

// ── Drag Dots Handle ─────────────────────────────────────────────────
function DragDots() {
  return (
    <div className="flex flex-col gap-[2px]">
      {[0, 1, 2].map(row => (
        <span key={row} className="flex gap-[3px]">
          <span className="w-[3.5px] h-[3.5px] rounded-full" style={{ background: 'var(--quinary)' }} />
          <span className="w-[3.5px] h-[3.5px] rounded-full" style={{ background: 'var(--quinary)' }} />
        </span>
      ))}
    </div>
  );
}

// ── Sortable Song Row ────────────────────────────────────────────────
function SortableSongRow({
  song,
  index,
  isCurrentTrack,
  isPlaying,
  onPlay,
  onRemove,
}: {
  song: Song;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onRemove: (songId: string) => void;
}) {
  const sortableId = `${song.id}-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-lg overflow-hidden transition-all"
      data-sortable-id={sortableId}
    >
      <div style={{
        background: isDragging
          ? 'color-mix(in srgb, var(--quinary) 12%, transparent)'
          : isCurrentTrack
            ? 'color-mix(in srgb, var(--secondary) 8%, transparent)'
            : 'color-mix(in srgb, var(--text) 3%, transparent)',
        border: isDragging
          ? '2px dashed color-mix(in srgb, var(--quinary) 70%, transparent)'
          : isCurrentTrack
            ? '1px solid color-mix(in srgb, var(--secondary) 30%, transparent)'
            : '1px solid color-mix(in srgb, var(--text) 8%, transparent)',
        borderRadius: 8,
      }}>
        <div style={{
          borderLeft: isCurrentTrack && !isDragging
            ? '3px solid var(--secondary)'
            : '3px solid transparent',
          padding: '14px 20px',
          visibility: isDragging ? 'hidden' as const : 'visible' as const,
        }}>
          {/* Row 1: drag handle + track # + title + duration + remove */}
          <div className="flex items-baseline gap-1.5 mb-1">
            <button
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className="flex-shrink-0 opacity-25 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing touch-none self-center mr-1"
              aria-label={`Reorder ${song.title}`}
              onClick={(e) => e.stopPropagation()}
              style={{ marginBottom: -2 }}
            >
              <DragDots />
            </button>
            <span className="font-jb-mono text-[11px] font-medium flex-shrink-0"
              style={{ color: 'var(--text-tertiary)' }}>
              {index + 1}
            </span>
            <span className="text-[13.5px] font-serif font-semibold text-primary truncate"
              style={{ lineHeight: '1.3' }}>
              {song.trackTitle || song.title}
            </span>
            <div className="flex items-center gap-2.5 flex-shrink-0 ml-auto">
              {song.duration > 0 && (
                <span className="font-jb-mono text-[11px] font-medium"
                  style={{ color: 'var(--text-tertiary)' }}>
                  {formatDuration(song.duration)}
                </span>
              )}
              <button
                onClick={() => onRemove(song.id)}
                className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--secondary) 20%, transparent)';
                  e.currentTarget.style.color = 'var(--secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
                aria-label={`Remove ${song.title}`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Row 2+: RecordingRow */}
          <div className="mt-2">
            <RecordingRow
              song={song}
              showTitle={false}
              iconScale={1.2}
              actionsAlign="start"
              actions={['swap', 'play', 'play-next', 'queue', 'playlist', 'favorite']}
              onPlay={onPlay}
              isCurrentlyPlaying={isCurrentTrack && isPlaying}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Drag Overlay Row ─────────────────────────────────────────────────
function DragOverlayRow({ song, index }: { song: Song; index: number }) {
  return (
    <div
      className="rounded-lg overflow-hidden scale-[1.03]"
      style={{
        background: 'color-mix(in srgb, var(--quinary) 12%, var(--surface-card))',
        border: '1px solid var(--quinary-muted)',
        boxShadow: '0 12px 40px color-mix(in srgb, black 55%, transparent), 0 0 0 1px color-mix(in srgb, var(--quinary) 20%, transparent)',
        padding: '14px 20px',
      }}
    >
      <div className="flex items-baseline gap-1.5 mb-1">
        <div className="flex-shrink-0 opacity-60 self-center mr-1" style={{ marginBottom: -2 }}>
          <DragDots />
        </div>
        <span className="font-jb-mono text-[11px] font-medium flex-shrink-0"
          style={{ color: 'var(--text-tertiary)' }}>
          {index + 1}
        </span>
        <span className="text-[13.5px] font-serif font-semibold text-primary truncate"
          style={{ lineHeight: '1.3' }}>
          {song.trackTitle || song.title}
        </span>
        {song.duration > 0 && (
          <span className="font-jb-mono text-[11px] font-medium flex-shrink-0 ml-auto"
            style={{ color: 'var(--text-tertiary)' }}>
            {formatDuration(song.duration)}
          </span>
        )}
      </div>
      <div className="mt-2">
        <RecordingRow song={song} showTitle={false} iconScale={1.2} />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function MiniDiscDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { minidiscs, getMiniDisc, deleteMiniDisc, removeFromMiniDisc, updateMiniDisc, reorderMiniDisc } = useMiniDiscs();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { playAlbum } = useQueue();
  const { currentSong, isPlaying, togglePlay, playSong } = usePlayer();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dragState, setDragState] = useState<{ song: Song; index: number } | null>(null);
  const handleCloseDeleteConfirm = useCallback(() => setShowDeleteConfirm(false), []);
  useBackToClose(showDeleteConfirm, handleCloseDeleteConfirm);

  const disc = getMiniDisc(id);

  // ── DnD sensors & handlers ──
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const sortableIds = useMemo(
    () => disc?.songs.map((s, i) => `${s.id}-${i}`) ?? [],
    [disc?.songs],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (!disc) return;
    const activeId = String(event.active.id);
    const index = sortableIds.indexOf(activeId);
    if (index !== -1) {
      setDragState({ song: disc.songs[index], index });
    }
  }, [disc, sortableIds]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDragState(null);
    if (!disc) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = sortableIds.indexOf(String(active.id));
    const toIndex = sortableIds.indexOf(String(over.id));
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      reorderMiniDisc(disc.id, fromIndex, toIndex);
    }
  }, [disc, sortableIds, reorderMiniDisc]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Library', href: '/my-library', type: 'library' },
      { label: 'MiniDiscs', href: '/my-library/minidiscs', type: 'library' },
      { label: disc?.name || 'MiniDisc', type: 'library' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, disc?.name]);

  if (!disc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">MiniDisc not found</h1>
          <Link href="/my-library/minidiscs" className="text-accent hover:underline">
            Back to MiniDiscs
          </Link>
        </div>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (disc.songs.length > 0) {
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
    }
  };

  const handleEdit = () => {
    setEditName(disc.name);
    setEditDescription(disc.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editName.trim()) {
      updateMiniDisc(disc.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    deleteMiniDisc(disc.id);
    router.push('/my-library/minidiscs');
  };

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id && isPlaying) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  const totalDuration = disc.songs.reduce((sum, song) => sum + song.duration, 0);
  const mdCapacity = getMDCapacity(totalDuration);
  const dominantType = getDominantRecType(disc.songs);

  // Subtitle: artist - venue (or "Various Artists")
  const artists = [...new Set(disc.songs.map(s => s.artistName))];
  const subtitle = disc.songs.length === 0
    ? ''
    : artists.length === 1
      ? disc.songs[0].showVenue
        ? `${disc.songs[0].artistName} \u2014 ${disc.songs[0].showVenue}`
        : disc.songs[0].artistName
      : 'Various Artists';

  // Currently playing song index for track dots
  const activeIndex = currentSong
    ? disc.songs.findIndex(s => s.id === currentSong.id)
    : 0;

  return (
    <div className="min-h-screen pb-[140px] md:pb-[90px] safe-top bg-surface-base">
      <div className="w-full max-w-[900px] mx-auto px-4 md:px-8 pt-6">

        {/* MiniDisc selector (horizontal scroll when multiple) */}
        {minidiscs.length > 1 && (
          <div className="mb-4">
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              {minidiscs.map((d) => (
                <Link
                  key={d.id}
                  href={`/my-library/minidiscs/${d.id}`}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                  style={{
                    background: d.id === id
                      ? 'var(--quinary)'
                      : 'color-mix(in srgb, var(--primary) 30%, transparent)',
                    color: d.id === id ? 'black' : 'var(--text-secondary)',
                    border: d.id === id
                      ? '1px solid var(--quinary)'
                      : '1px solid color-mix(in srgb, var(--border-subtle-player) 50%, transparent)',
                  }}
                >
                  {d.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ALBUM HEADER CARD ═══ */}
        <div className="rounded-xl overflow-hidden relative" style={{
          background: 'var(--surface-card)',
          border: '1px solid color-mix(in srgb, white 7%, transparent)',
        }}>

          {/* Banner: LIVE RECORDING + MD type */}
          <div className="flex items-center justify-between px-4 py-2" style={{
            background: 'linear-gradient(90deg, var(--surface-sunken) 0%, var(--surface-card) 40%, var(--surface-card) 100%)',
            borderBottom: '1px solid color-mix(in srgb, var(--tertiary) 15%, transparent)',
          }}>
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{
                width: 7, height: 7,
                background: 'var(--secondary)',
                boxShadow: '0 0 6px var(--secondary)',
                animation: 'mi-pulse 1.8s ease-in-out infinite',
              }} />
              <span className="font-jb-mono text-[10px] font-bold tracking-[2.5px]"
                style={{ color: 'var(--tertiary)' }}>
                LIVE RECORDING
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-jb-mono text-[8.5px] tracking-[1.5px] px-2 py-0.5 rounded" style={{
                background: 'color-mix(in srgb, var(--tertiary) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--tertiary) 25%, transparent)',
                color: 'var(--tertiary)',
              }}>
                {mdCapacity}
              </span>
              <span className="font-jb-mono text-[9px] tracking-[1.5px] hidden sm:inline"
                style={{ color: 'var(--text-tertiary)' }}>
                ATRAC3 &middot; {dominantType} MASTER
              </span>
            </div>
          </div>

          {/* Album body: title + MD art */}
          <div className="flex items-start justify-between p-6 gap-5">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_NAME_MAX))}
                    maxLength={VALIDATION_LIMITS.MINIDISC_NAME_MAX}
                    className="w-full bg-transparent text-[30px] font-bold mb-2 border-b focus:outline-none"
                    style={{ fontFamily: 'Georgia, serif', color: 'var(--text-primary)', borderColor: 'var(--border-subtle-player)' }}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX))}
                    maxLength={VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX}
                    placeholder="Add description..."
                    className="w-full bg-transparent text-sm mb-4 border-b focus:outline-none"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle-player)' }}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit}
                      className="px-4 py-1.5 rounded-full text-xs font-medium"
                      style={{ background: 'var(--tertiary)', color: 'black' }}>
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)}
                      className="px-4 py-1.5 rounded-full text-xs font-medium"
                      style={{ border: '1px solid var(--border-subtle-player)', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-[30px] font-bold leading-tight mb-1.5"
                    style={{ fontFamily: 'Georgia, serif', color: 'var(--text-primary)' }}>
                    {disc.name}
                  </h1>
                  <p className="font-jb-mono text-xs italic tracking-wide"
                    style={{ color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>
                    {subtitle}
                  </p>
                  {disc.description && (
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                      {disc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="font-jb-mono text-[10px] tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                      {disc.songs.length} {disc.songs.length === 1 ? 'track' : 'tracks'}
                    </span>
                    {totalDuration > 0 && (
                      <>
                        <span style={{ color: 'var(--text-tertiary)', opacity: 0.3 }}>&middot;</span>
                        <span className="font-jb-mono text-[10px] tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                          {formatDuration(totalDuration)}
                        </span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* MiniDisc art */}
            {!isEditing && <MiniDiscHeaderArt />}
          </div>

          {/* Actions row (play, edit, delete) */}
          {!isEditing && (
            <div className="flex items-center gap-2.5 px-6 pb-3">
              <button
                onClick={handlePlayAll}
                disabled={disc.songs.length === 0}
                className="w-[34px] h-[34px] rounded-[7px] flex items-center justify-center hover:scale-105 transition-all disabled:opacity-30"
                style={{
                  background: 'color-mix(in srgb, var(--secondary) 18%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--secondary) 35%, transparent)',
                  color: 'var(--secondary)',
                }}
                aria-label="Play all"
              >
                <svg className="w-[14px] h-[14px] ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </button>
              <button onClick={handleEdit}
                className="w-[34px] h-[34px] rounded-[7px] flex items-center justify-center transition-all"
                style={{
                  border: '1px solid color-mix(in srgb, white 7%, transparent)',
                  background: 'color-mix(in srgb, white 4%, transparent)',
                  color: 'var(--text-tertiary)',
                }}
                aria-label="Edit"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="w-[34px] h-[34px] rounded-[7px] flex items-center justify-center transition-all"
                style={{
                  border: '1px solid color-mix(in srgb, white 7%, transparent)',
                  background: 'color-mix(in srgb, white 4%, transparent)',
                  color: 'var(--text-tertiary)',
                }}
                aria-label="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}

          {/* Track position dots */}
          <TrackDots count={disc.songs.length} activeIndex={Math.max(activeIndex, 0)} />
        </div>

        {/* ═══ TRACK ROWS ═══ */}
        <div className="flex flex-col gap-2.5 mt-2.5">
          {disc.songs.length === 0 ? (
            <div className="rounded-xl flex flex-col items-center justify-center py-16" style={{
              background: 'var(--surface-sunken)',
              border: '1px solid color-mix(in srgb, white 7%, transparent)',
            }}>
              <svg className="w-12 h-12 mb-4" style={{ color: 'var(--border-default)' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
              </svg>
              <p className="font-semibold text-white">No songs yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Add songs from the &quot;Add to MiniDisc&quot; menu
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {disc.songs.map((song, index) => (
                  <SortableSongRow
                    key={`${song.id}-${index}`}
                    song={song}
                    index={index}
                    isCurrentTrack={currentSong?.id === song.id}
                    isPlaying={isPlaying}
                    onPlay={handlePlaySong}
                    onRemove={(songId) => removeFromMiniDisc(disc.id, songId)}
                  />
                ))}
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {dragState && (
                  <DragOverlayRow song={dragState.song} index={dragState.index} />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[9998] animate-fade-in" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="rounded-lg p-6 max-w-sm w-full animate-scale-in" style={{ background: 'var(--surface-elevated)' }}>
              <h3 className="text-white font-bold text-lg mb-2">Delete MiniDisc?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                This action cannot be undone. &quot;{disc.name}&quot; will be permanently deleted.
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
