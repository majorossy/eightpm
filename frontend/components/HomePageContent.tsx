'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Artist, Song } from '@/lib/api';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import ArtistResult from '@/components/ArtistResult';
import SongCard from '@/components/SongCard';

interface HomePageContentProps {
  artists: Artist[];
  songs: Song[];
}

export default function HomePageContent({ artists, songs }: HomePageContentProps) {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="pb-8">
      {/* Hero section with gradient */}
      <section className="relative mb-6 md:mb-8 pt-6 md:pt-8 pb-8 md:pb-12 bg-gradient-to-b from-[var(--secondary)]/30 via-[var(--bg)] to-[var(--bg)]">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-2">
            {getGreeting()}
          </h1>
          <p className="text-sm md:text-base text-[var(--text-dim)]">
            Stream live recordings from the Archive.org collection
          </p>
        </div>
      </section>

      {/* Featured Artists */}
      <section className="mb-8 md:mb-10 max-w-[1000px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text)]">Featured Artists</h2>
          <Link href="/artists" className="text-xs md:text-sm font-bold text-[var(--text-dim)] hover:underline uppercase tracking-wider">
            Show all
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {artists.slice(0, 6).map((artist) => (
            <ArtistResult
              key={artist.id}
              name={artist.name}
              slug={artist.slug}
              image={artist.image}
              subtitle={artist.songCount ? `${artist.songCount.toLocaleString()} recordings` : 'Artist'}
            />
          ))}
        </div>
      </section>

      {/* Latest Recordings */}
      <section className="mb-8 md:mb-10 max-w-[1000px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text)]">Latest Recordings</h2>
        </div>
        <div className="bg-[var(--bg-card)] rounded-lg p-3 md:p-4">
          {songs.map((song, index) => (
            <SongCard key={song.id} song={song} index={index + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}
