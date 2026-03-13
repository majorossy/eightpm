'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useMiniDiscs } from '@/context/CollectionContext';
import { useQueue } from '@/context/QueueContext';
import { useBackToClose } from '@/hooks/useBackToClose';
import { formatDuration } from '@/lib/api';
import { VALIDATION_LIMITS } from '@/lib/validation';
import { RecordingRow } from '@/components/version-row';

export default function MiniDiscDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getMiniDisc, deleteMiniDisc, removeFromMiniDisc, updateMiniDisc } = useMiniDiscs();
  const { playAlbum, addToQueue, trackToItem } = useQueue();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleCloseDeleteConfirm = useCallback(() => setShowDeleteConfirm(false), []);
  useBackToClose(showDeleteConfirm, handleCloseDeleteConfirm);

  const disc = getMiniDisc(id);

  if (!disc) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, var(--player-surface-deep) 0%, var(--player-surface-queue) 100%)' }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">MiniDisc not found</h1>
          <Link href="/minidiscs" className="text-accent hover:underline">
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
    router.push('/minidiscs');
  };

  const totalDuration = disc.songs.reduce((sum, song) => sum + song.duration, 0);

  return (
    <div className="min-h-screen pb-[140px] md:pb-[90px] safe-top bg-surface-base">
    <div
      className="w-full max-w-[580px] mx-auto min-h-screen"
      style={{ background: 'linear-gradient(180deg, var(--player-surface-deep) 0%, var(--player-surface-queue) 100%)' }}
    >
      {/* Top glow line */}
      <div
        className="h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, var(--quinary-muted), var(--tertiary-muted), transparent)' }}
      />

      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        {/* Back link */}
        <Link href="/minidiscs" className="inline-flex items-center gap-1.5 mb-4 text-sm transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          MiniDiscs
        </Link>

        {/* Title */}
        <div className="font-jb-mono text-[9.5px] font-semibold tracking-[0.14em] uppercase mb-2" style={{ color: 'var(--quinary)' }}>
          MiniDisc
        </div>

        {isEditing ? (
          <div className="mb-4">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_NAME_MAX))}
              maxLength={VALIDATION_LIMITS.MINIDISC_NAME_MAX}
              className="w-full bg-transparent text-white text-2xl font-bold mb-2 border-b focus:outline-none"
              style={{ borderColor: 'var(--border-subtle-player)' }}
              autoFocus
            />
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX))}
              maxLength={VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX}
              placeholder="Add description..."
              className="w-full bg-transparent text-sm mb-3 border-b focus:outline-none"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle-player)' }}
            />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'var(--quinary)', color: 'black' }}
              >Save</button>
              <button onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 rounded-full text-xs font-medium"
                style={{ border: '1px solid var(--border-subtle-player)', color: 'var(--text-secondary)' }}
              >Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-1">{disc.name}</h1>
            {disc.description && (
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{disc.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs font-jb-mono" style={{ color: 'var(--text-tertiary)' }}>
              <span>{disc.songs.length} {disc.songs.length === 1 ? 'song' : 'songs'}</span>
              {totalDuration > 0 && (
                <>
                  <span style={{ color: 'var(--quinary-muted)' }}>·</span>
                  <span>{formatDuration(totalDuration)}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Actions row */}
      {!isEditing && (
        <div className="flex items-center gap-3 px-5 pb-4">
          <button
            onClick={handlePlayAll}
            disabled={disc.songs.length === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition-all disabled:opacity-30 btn-touch"
            style={{ background: 'var(--quinary)', color: 'black' }}
            aria-label="Play all"
          >
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
          <button onClick={handleEdit}
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all"
            style={{ border: '1.5px solid color-mix(in srgb, var(--primary) 23%, transparent)', color: 'var(--text-secondary)' }}
            aria-label="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all"
            style={{ border: '1.5px solid color-mix(in srgb, var(--primary) 23%, transparent)', color: 'var(--text-secondary)' }}
            aria-label="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Divider */}
      <div
        className="mx-[18px] mb-2"
        style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-subtle-player), transparent)' }}
      />

      {/* Track list */}
      {disc.songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-secondary)' }}>
          <svg className="w-12 h-12 mb-4" style={{ color: 'var(--border-default)' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
          </svg>
          <p className="font-semibold">No songs yet</p>
          <p className="text-sm mt-1">Add songs from the &quot;Add to MiniDisc&quot; menu</p>
        </div>
      ) : (
        <ul className="px-1.5">
          {disc.songs.map((song, index) => (
            <li key={`${song.id}-${index}`}>
              <div
                className="group/row flex gap-0 py-2 px-2 mx-1.5 mb-0.5 rounded-[10px] cursor-pointer transition-all relative"
                style={{
                  border: '1px solid color-mix(in srgb, var(--border-subtle-player) 50%, transparent)',
                  background: 'var(--player-surface-queue)',
                }}
                onClick={() => addToQueue(trackToItem(song))}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--player-surface-chip)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--player-surface-queue)'; }}
              >
                <div className="flex gap-0 w-full">
                  {/* Track number */}
                  <div className="flex-shrink-0 px-1.5 pt-0.5 self-start">
                    <span className="font-jb-mono text-[11px] tabular-nums" style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>
                      {index + 1}
                    </span>
                  </div>

                  {/* RecordingRow content */}
                  <div className="flex-1 min-w-0 flex items-start gap-1">
                    <div className="flex-1 min-w-0">
                      <RecordingRow
                        song={song}
                        trackNumber={null}
                      />
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromMiniDisc(disc.id, song.id);
                      }}
                      className="w-5 h-5 rounded-md border-0 bg-transparent flex items-center justify-center flex-shrink-0 mt-0.5 opacity-40 hover:!opacity-100 transition-all"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--secondary-muted)';
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
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Delete confirmation */}
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
    </div>
  );
}
