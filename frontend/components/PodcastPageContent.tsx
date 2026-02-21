'use client';

import { Podcast, PodcastEpisode } from '@/lib/api';
import PodcastEpisodeCard from '@/components/PodcastEpisodeCard';

interface PodcastPageContentProps {
  podcast: Podcast;
  episodes: PodcastEpisode[];
}

export default function PodcastPageContent({ podcast, episodes }: PodcastPageContentProps) {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Podcast header */}
      <div className="flex gap-6 mb-8">
        {podcast.image && (
          <img
            src={podcast.image}
            alt={podcast.name}
            className="w-40 h-40 rounded-lg object-cover flex-shrink-0 shadow-lg"
          />
        )}
        <div className="flex flex-col justify-end">
          <p className="text-xs uppercase tracking-widest text-[var(--text-dim)] mb-1">Podcast</p>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">{podcast.name}</h1>
          {podcast.description && (
            <p className="text-sm text-[var(--text-dim)] line-clamp-3">{podcast.description}</p>
          )}
          <p className="text-sm text-[var(--text-subdued)] mt-2">
            {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Episodes list */}
      <div className="flex flex-col gap-1">
        {episodes.map((episode) => (
          <PodcastEpisodeCard
            key={episode.id}
            episode={episode}
            podcastName={podcast.name}
            podcastImage={podcast.image}
          />
        ))}
      </div>

      {episodes.length === 0 && (
        <p className="text-center text-[var(--text-dim)] py-10">No episodes found.</p>
      )}
    </div>
  );
}
