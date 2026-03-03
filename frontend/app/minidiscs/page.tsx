'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMiniDiscs } from '@/context/CollectionContext';
import { useQueue } from '@/context/QueueContext';
import { VALIDATION_LIMITS } from '@/lib/validation';

export default function MiniDiscsPage() {
  const { minidiscs, createMiniDisc, deleteMiniDisc, getMiniDisc } = useMiniDiscs();
  const { playAlbum } = useQueue();
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
      {/* Header */}
      <div className="p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Your MiniDiscs</h1>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3 rounded-full bg-accent text-black font-medium hover:bg-accent-hover transition-colors"
        >
          Create MiniDisc
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="px-6 md:px-8 mb-8">
          <form onSubmit={handleCreate} className="bg-surface-elevated rounded-lg p-6 max-w-md">
            <h3 className="text-white font-bold text-lg mb-4">Create new MiniDisc</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_NAME_MAX))}
              placeholder="MiniDisc name"
              maxLength={VALIDATION_LIMITS.MINIDISC_NAME_MAX}
              autoFocus
              className="w-full bg-surface-base text-white placeholder-tertiary rounded px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX))}
              placeholder="Description (optional)"
              maxLength={VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX}
              rows={3}
              className="w-full bg-surface-base text-white placeholder-tertiary rounded px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setNewName(''); setNewDescription(''); }}
                className="flex-1 px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newName.trim()}
                className="flex-1 px-4 py-2 rounded-full bg-accent text-black font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <p className="text-secondary text-sm text-center mb-4">
            Create your first MiniDisc to collect songs across different shows and artists
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 rounded-full bg-accent text-black font-medium hover:bg-accent-hover transition-colors"
          >
            Create MiniDisc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-6 md:px-8">
          {minidiscs.map((disc) => (
            <Link
              key={disc.id}
              href={`/minidiscs/${disc.id}`}
              className="flex flex-col gap-3 p-4 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="w-full aspect-square rounded bg-surface-elevated overflow-hidden relative">
                {disc.coverArt ? (
                  <Image src={disc.coverArt} alt={disc.name || 'MiniDisc'} fill sizes="200px" quality={80} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-border" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-medium truncate">{disc.name}</p>
                <p className="text-secondary text-sm">{disc.songs.length} songs</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
