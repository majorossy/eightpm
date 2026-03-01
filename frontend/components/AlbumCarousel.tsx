'use client';

// AlbumCarousel - responsive grid layout of album cards

import Link from 'next/link';
import { Album } from '@/lib/api';
import JewelCase from '@/components/JewelCase';

interface AlbumCarouselProps {
  albums: Album[];
  artistSlug: string;
}

interface AlbumCarouselCardProps {
  album: Album;
}

function AlbumCarouselCard({ album }: AlbumCarouselCardProps) {
  return (
    <Link href={`/artists/${album.artistSlug}/album/${album.slug}`}>
      <div className="group p-3 md:p-4 bg-surface-card rounded-lg hover:bg-surface-elevated transition-all duration-300 cursor-pointer">
        {/* Album artwork — Jewel Case */}
        <div className="relative aspect-square mb-3 md:mb-4">
          <JewelCase coverArt={album.coverArt} fill trackCount={album.totalTracks} />
        </div>

        {/* Album info */}
        <h4 className="font-semibold text-white text-xs md:text-sm truncate">
          {album.name}
        </h4>
        <p className="text-[10px] md:text-xs text-secondary mt-1 truncate">
          {album.totalTracks} {album.totalTracks === 1 ? 'track' : 'tracks'}
        </p>
      </div>
    </Link>
  );
}

export default function AlbumCarousel({ albums, artistSlug }: AlbumCarouselProps) {
  if (albums.length === 0) {
    return (
      <p className="text-sm text-secondary">No albums available</p>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
        {albums.map((album) => (
          <AlbumCarouselCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}
