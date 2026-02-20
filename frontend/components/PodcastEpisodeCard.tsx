'use client';

// PodcastEpisodeCard - displays a podcast episode in a list

import { useState } from 'react';
import Image from 'next/image';
import { PodcastEpisode } from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface PodcastEpisodeCardProps {
  episode: PodcastEpisode;
  podcastName: string;
  podcastImage?: string;
}

export default function PodcastEpisodeCard({ episode, podcastName, podcastImage }: PodcastEpisodeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: '100px',
    freezeOnceVisible: true,
  });
  const { playSong, currentSong } = usePlayer();

  const isPlaying = currentSong?.id === episode.id;
  const hasValidImage = (episode.albumArt || podcastImage) && !(episode.albumArt || podcastImage)?.includes('default');

  const handlePlay = () => {
    playSong(episode);
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format publish date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-all duration-300">
      {/* Episode artwork */}
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden"
      >
        {hasValidImage ? (
          <>
            <div
              className={`absolute inset-0 bg-[var(--bg-elevated)] transition-opacity duration-500 ${
                imageLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            />
            {isIntersecting && (
              <Image
                src={(episode.albumArt || podcastImage) as string}
                alt={episode.title}
                fill
                sizes="64px"
                quality={70}
                onLoad={() => setImageLoaded(true)}
                className={`object-cover transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--text-subdued)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
        )}
      </div>

      {/* Episode info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-[var(--text)] truncate mb-1">
          {episode.title}
        </h4>
        <div className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
          {episode.publishDate && (
            <>
              <span>{formatDate(episode.publishDate)}</span>
              <span>•</span>
            </>
          )}
          <span>{formatDuration(episode.duration)}</span>
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={handlePlay}
        className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${
          isPlaying
            ? 'bg-[var(--neon-pink)] text-[var(--bg)]'
            : 'bg-[var(--bg-elevated)] text-[var(--text)] opacity-0 group-hover:opacity-100'
        } hover:scale-105`}
        aria-label={isPlaying ? 'Playing' : 'Play episode'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
