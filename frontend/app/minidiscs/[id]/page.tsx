'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useMiniDiscs } from '@/context/CollectionContext';
import { useQueue } from '@/context/QueueContext';
import { formatDuration } from '@/lib/api';
import { VALIDATION_LIMITS } from '@/lib/validation';

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

  const disc = getMiniDisc(id);

  if (!disc) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
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
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px] safe-top">
      {/* Header */}
      <div className="bg-gradient-to-b from-border to-surface-base p-6 md:p-8 pb-8">
        <div className="flex items-end gap-6">
          <div className="w-32 h-32 md:w-56 md:h-56 rounded-lg bg-surface-elevated flex-shrink-0 overflow-hidden shadow-2xl relative">
            {disc.coverArt ? (
              <Image src={disc.coverArt} alt={disc.name || 'MiniDisc'} fill sizes="(max-width: 768px) 128px, 224px" quality={85} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 md:w-24 h-16 md:h-24 text-border" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-secondary text-sm uppercase font-medium mb-2">MiniDisc</p>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_NAME_MAX))}
                maxLength={VALIDATION_LIMITS.MINIDISC_NAME_MAX}
                className="w-full bg-transparent text-white text-3xl md:text-5xl font-bold mb-4 border-b border-white/20 focus:outline-none focus:border-white"
                autoFocus
              />
            ) : (
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 truncate">{disc.name}</h1>
            )}

            {isEditing ? (
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX))}
                maxLength={VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX}
                placeholder="Add description..."
                className="w-full bg-transparent text-secondary mb-4 border-b border-white/20 focus:outline-none focus:border-white"
              />
            ) : disc.description ? (
              <p className="text-secondary mb-4">{disc.description}</p>
            ) : null}

            <div className="flex items-center gap-2 text-sm text-white">
              <span>{disc.songs.length} songs</span>
              {totalDuration > 0 && (
                <>
                  <span>•</span>
                  <span>{formatDuration(totalDuration)}</span>
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
              disabled={disc.songs.length === 0}
              className="w-14 h-14 rounded-full bg-accent text-black flex items-center justify-center hover:bg-accent-hover hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg btn-touch"
              aria-label="Play all"
            >
              <svg className="w-7 h-7 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <button onClick={handleEdit} className="p-3 text-secondary hover:text-white transition-colors btn-touch" aria-label="Edit MiniDisc">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="p-3 text-secondary hover:text-red-500 transition-colors btn-touch" aria-label="Delete MiniDisc">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Songs list */}
      {disc.songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <svg className="w-16 h-16 text-border mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="text-white font-bold text-lg mb-2">No songs yet</h3>
          <p className="text-secondary text-sm text-center">
            Add songs to this MiniDisc from the &quot;Add to MiniDisc&quot; menu
          </p>
        </div>
      ) : (
        <div className="space-y-1 px-4 md:px-8">
          {disc.songs.map((song, index) => (
            <div
              key={`${song.id}-${index}`}
              className="flex items-center gap-3 p-3 rounded hover:bg-white/10 transition-colors group"
            >
              <button
                onClick={() => addToQueue(trackToItem(song))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-black opacity-0 md:group-hover:opacity-100 hover:scale-105 transition-all btn-touch"
                aria-label={`Play ${song.title}`}
              >
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{song.title}</p>
                <Link href={`/artists/${song.artistSlug}`} className="text-secondary text-sm hover:text-white hover:underline truncate block">
                  {song.artistName}
                </Link>
              </div>
              <div className="text-secondary text-sm font-mono hidden md:block">{formatDuration(song.duration)}</div>
              <button
                onClick={() => removeFromMiniDisc(disc.id, song.id)}
                className="p-2 text-secondary hover:text-white transition-colors btn-touch"
                aria-label="Remove from MiniDisc"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
              <h3 className="text-white font-bold text-lg mb-2">Delete MiniDisc?</h3>
              <p className="text-secondary text-sm mb-6">
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
