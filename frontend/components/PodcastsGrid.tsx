'use client';

import { Podcast } from '@/lib/api';
import PodcastCard from '@/components/PodcastCard';

interface PodcastsGridProps {
  podcasts: Podcast[];
}

export default function PodcastsGrid({ podcasts }: PodcastsGridProps) {
  if (podcasts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-dim)]">
        <p className="text-lg">No podcasts found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Podcasts</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {podcasts.map((podcast) => (
          <PodcastCard key={podcast.id} podcast={podcast} />
        ))}
      </div>
    </div>
  );
}
