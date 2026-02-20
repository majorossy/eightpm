'use client';

import { useState, useEffect, useRef } from 'react';

export function usePlayerAnnouncements(
  currentSong: { title: string; artistName: string; id: string } | null,
  isPlaying: boolean
) {
  const [announcement, setAnnouncement] = useState('');
  const prevSongIdRef = useRef<string | null>(null);
  const prevIsPlayingRef = useRef<boolean | null>(null);

  // Announce track changes
  useEffect(() => {
    if (currentSong && currentSong.id !== prevSongIdRef.current) {
      setAnnouncement(`Now playing: ${currentSong.title} by ${currentSong.artistName}`);
      prevSongIdRef.current = currentSong.id;
      const timer = setTimeout(() => setAnnouncement(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentSong]);

  // Announce play/pause state changes (only after initial load)
  useEffect(() => {
    if (currentSong && prevIsPlayingRef.current !== null && isPlaying !== prevIsPlayingRef.current) {
      setAnnouncement(isPlaying ? 'Playing' : 'Paused');
      const timer = setTimeout(() => setAnnouncement(''), 2000);
      return () => clearTimeout(timer);
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying, currentSong]);

  return announcement;
}
