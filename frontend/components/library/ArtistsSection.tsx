'use client';

import { useMemo } from 'react';
import SectionHeader from './SectionHeader';
import ArtistResult from '@/components/ArtistResult';
import { useWishlist } from '@/context/WishlistContext';
import { useRecentlyPlayed } from '@/context/RecentlyPlayedContext';
import { deriveArtists } from '@/lib/libraryUtils';

export default function ArtistsSection() {
  const { wishlist, followedArtists } = useWishlist();
  const { recentlyPlayed } = useRecentlyPlayed();

  const artists = useMemo(
    () => deriveArtists(wishlist.items, recentlyPlayed, followedArtists),
    [wishlist.items, recentlyPlayed, followedArtists],
  );

  const visible = artists.slice(0, 5);

  return (
    <section>
      <SectionHeader dotColor="var(--quinary)" name="ARTISTS" count={artists.length} />
      {artists.length === 0 ? (
        <p className="text-[10px] text-tertiary tracking-[0.04em]">Follow artists or like versions to see them here.</p>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {visible.map((artist) => (
          <ArtistResult
            key={artist.slug}
            name={artist.name}
            slug={artist.slug}
            image={artist.art}
            subtitle={artist.likedCount > 0 ? `${artist.likedCount} versions` : 'Following'}
          />
        ))}
      </div>
      )}
    </section>
  );
}
