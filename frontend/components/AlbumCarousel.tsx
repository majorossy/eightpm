'use client';

// AlbumCarousel - responsive grid layout of album cards

import Image from 'next/image';
import Link from 'next/link';
import { Album } from '@/lib/api';

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
      <div className="group p-3 md:p-4 bg-[#252220] rounded-lg hover:bg-[#2d2a26] transition-all duration-300 cursor-pointer">
        {/* Album artwork with play button overlay */}
        <div className="relative aspect-square mb-3 md:mb-4 rounded-md overflow-hidden shadow-lg">
          {album.coverArt ? (
            <Image
              src={album.coverArt}
              alt={album.name || 'Album cover'}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
              quality={80}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#2d2a26] flex items-center justify-center">
              <svg className="w-10 md:w-12 h-10 md:h-12 text-[#3a3632]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </div>
          )}
        </div>

        {/* Album info */}
        <h4 className="font-semibold text-white text-xs md:text-sm truncate">
          {album.name}
        </h4>
        <p className="text-[10px] md:text-xs text-[#8a8478] mt-1 truncate">
          {album.totalTracks} {album.totalTracks === 1 ? 'track' : 'tracks'}
        </p>
      </div>
    </Link>
  );
}

export default function AlbumCarousel({ albums, artistSlug }: AlbumCarouselProps) {
  if (albums.length === 0) {
    return (
      <p className="text-sm text-[#8a8478]">No albums available</p>
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
