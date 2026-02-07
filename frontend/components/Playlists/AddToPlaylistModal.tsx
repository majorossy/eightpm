'use client';

import { useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { usePlaylists } from '@/context/PlaylistContext';
import { Song } from '@/lib/types';
import { VALIDATION_LIMITS } from '@/lib/validation';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

export function AddToPlaylistModal({ isOpen, onClose, song }: AddToPlaylistModalProps) {
  const { playlists, createPlaylist, addToPlaylist } = usePlaylists();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  if (!song) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    addToPlaylist(playlistId, song);
    onClose();
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const playlist = createPlaylist(newPlaylistName.trim());
    addToPlaylist(playlist.id, song);
    setNewPlaylistName('');
    setShowCreateForm(false);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[9998] animate-fade-in" />

        <Dialog.Content className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#2d2a26] rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden pointer-events-auto animate-scale-in flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Dialog.Title className="text-white font-bold text-lg">Add to Playlist</Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="p-2 -mr-2 text-[#8a8478] hover:text-white transition-colors rounded-full hover:bg-white/10"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Dialog.Close>
              </div>
              <p className="text-[#8a8478] text-sm truncate">{song.title} • {song.artistName}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {showCreateForm ? (
                <form onSubmit={handleCreateAndAdd} className="p-4">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value.slice(0, VALIDATION_LIMITS.PLAYLIST_NAME_MAX))}
                    placeholder="Playlist name"
                    maxLength={VALIDATION_LIMITS.PLAYLIST_NAME_MAX}
                    autoFocus
                    className="w-full bg-[#1c1a17] text-white placeholder-[#8a8478] rounded px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-[#d4a060]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewPlaylistName('');
                      }}
                      className="flex-1 px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newPlaylistName.trim()}
                      className="flex-1 px-4 py-2 rounded-full bg-[#d4a060] text-black font-medium hover:bg-[#c08a40] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Create new playlist button */}
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded bg-[#1c1a17] flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#8a8478]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-white font-medium">Create new playlist</span>
                  </button>

                  {/* Divider */}
                  {playlists.length > 0 && (
                    <div className="h-px bg-white/10 mx-4" />
                  )}

                  {/* Playlist list */}
                  <div>
                    {playlists.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-[#8a8478] text-sm">No playlists yet</p>
                      </div>
                    ) : (
                      playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          onClick={() => handleAddToPlaylist(playlist.id)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-white/10 transition-colors text-left"
                        >
                          {/* Cover art */}
                          <div className="w-10 h-10 rounded bg-[#2d2a26] flex-shrink-0 overflow-hidden relative">
                            {playlist.coverArt ? (
                              <Image src={playlist.coverArt} alt={playlist.name || 'Playlist'} fill sizes="40px" quality={75} className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-[#3a3632]" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{playlist.name}</p>
                            <p className="text-[#8a8478] text-sm">{playlist.songs.length} songs</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
