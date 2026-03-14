'use client';

import { useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { useMiniDiscs } from '@/context/CollectionContext';
import { Song } from '@/lib/types';
import { VALIDATION_LIMITS } from '@/lib/validation';
import { useBackToClose } from '@/hooks/useBackToClose';
import { useToast } from '@/hooks/useToast';

interface AddToMiniDiscModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onAdded?: () => void;
}

export function AddToMiniDiscModal({ isOpen, onClose, song, onAdded }: AddToMiniDiscModalProps) {
  useBackToClose(isOpen, onClose);
  const { minidiscs, createMiniDisc, addToMiniDisc } = useMiniDiscs();
  const toast = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');

  if (!song) return null;

  const handleAdd = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const disc = minidiscs.find(d => d.id === id);
    addToMiniDisc(id, song);
    onClose();
    onAdded?.();
    toast.showSuccess(`Added to MiniDisc ${disc?.name ?? ''}`.trimEnd(), {
      bg: 'color-mix(in srgb, var(--action-frame) 12%, transparent)',
      border: 'color-mix(in srgb, var(--action-frame) 25%, transparent)',
      text: 'var(--cream)',
      icon: 'var(--action-frame)',
    });
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newName.trim()) return;

    const discName = newName.trim();
    const disc = createMiniDisc(discName);
    addToMiniDisc(disc.id, song);
    setNewName('');
    setShowCreateForm(false);
    onClose();
    onAdded?.();
    toast.showSuccess(`Added to MiniDisc ${discName}`, {
      bg: 'color-mix(in srgb, var(--action-frame) 12%, transparent)',
      border: 'color-mix(in srgb, var(--action-frame) 25%, transparent)',
      text: 'var(--cream)',
      icon: 'var(--action-frame)',
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[9998] animate-fade-in" onClick={(e) => e.stopPropagation()} />

        <Dialog.Content className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none" onClick={(e) => e.stopPropagation()}>
          <div className="bg-surface-elevated rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden pointer-events-auto animate-scale-in flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Dialog.Title className="text-white font-bold text-lg">Add to MiniDisc</Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="p-2 -mr-2 text-secondary hover:text-white transition-colors rounded-full hover:bg-white/10"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Dialog.Close>
              </div>
              <p className="text-secondary text-sm truncate">{song.title} • {song.artistName}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {showCreateForm ? (
                <form onSubmit={handleCreateAndAdd} className="p-4">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value.slice(0, VALIDATION_LIMITS.MINIDISC_NAME_MAX))}
                    placeholder="MiniDisc name"
                    maxLength={VALIDATION_LIMITS.MINIDISC_NAME_MAX}
                    autoFocus
                    className="w-full bg-surface-base text-white placeholder-secondary rounded px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewName('');
                      }}
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
              ) : (
                <>
                  {/* Create new */}
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded bg-surface-base flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-white font-medium">Create new MiniDisc</span>
                  </button>

                  {/* Divider */}
                  {minidiscs.length > 0 && (
                    <div className="h-px bg-white/10 mx-4" />
                  )}

                  {/* List */}
                  <div>
                    {minidiscs.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-secondary text-sm">No MiniDiscs yet</p>
                      </div>
                    ) : (
                      minidiscs.map((disc) => (
                        <button
                          key={disc.id}
                          onClick={(e) => handleAdd(disc.id, e)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-white/10 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded bg-surface-elevated flex-shrink-0 overflow-hidden relative">
                            {disc.coverArt ? (
                              <Image src={disc.coverArt} alt={disc.name || 'MiniDisc'} fill sizes="40px" quality={75} className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-border" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{disc.name}</p>
                            <p className="text-secondary text-sm">{disc.songs.length} songs</p>
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
