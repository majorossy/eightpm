'use client';

import { useMemo } from 'react';
import SectionHeader from './SectionHeader';
import AlbumResult from '@/components/AlbumResult';
import { useWishlist } from '@/context/WishlistContext';
import { useRecentlyPlayed } from '@/context/RecentlyPlayedContext';
import { deriveAlbums } from '@/lib/libraryUtils';

export default function AlbumsSection() {
  const { wishlist, followedAlbums } = useWishlist();
  const { recentlyPlayed } = useRecentlyPlayed();

  const albums = useMemo(
    () => deriveAlbums(wishlist.items, recentlyPlayed, followedAlbums),
    [wishlist.items, recentlyPlayed, followedAlbums],
  );

  const visible = albums.slice(0, 5);

  return (
    <section>
      <SectionHeader dotColor="#5a8eb8" name="ALBUMS" count={albums.length} />
      {albums.length === 0 ? (
        <p className="text-[10px] text-tertiary tracking-[0.04em]">Follow albums or like versions to see them here.</p>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {visible.map((album) => {
          const year = album.showDate ? new Date(album.showDate + 'T00:00:00').getFullYear() : null;
          const href = album.albumIdentifier
            ? `/artists/${album.artistSlug}/album/${album.albumIdentifier}`
            : `/artists/${album.artistSlug}`;

          return (
            <AlbumResult
              key={`${album.artistSlug}::${album.albumName}`}
              name={album.albumName}
              href={href}
              image={album.art}
              subtitle={`${album.artistName}${year ? ` \u00B7 ${year}` : ''}`}
            />
          );
        })}
      </div>
      )}
    </section>
  );
}
