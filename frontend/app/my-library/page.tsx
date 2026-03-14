'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useRecentlyPlayed } from '@/context/RecentlyPlayedContext';
import { useCassettes, useMiniDiscs } from '@/context/CollectionContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import SignInForm from '@/components/SignInForm';
import {
  aggregateVersions,
  deriveArtists,
  getLastUpdatedText,
} from '@/lib/libraryUtils';

import CassettesSection from '@/components/library/CassettesSection';
import MiniDiscsSection from '@/components/library/MiniDiscsSection';
import VersionsSection from '@/components/library/VersionsSection';
import ArtistsSection from '@/components/library/ArtistsSection';
import AlbumsSection from '@/components/library/AlbumsSection';
import RecentSection from '@/components/library/RecentSection';
import Sidebar from '@/components/library/Sidebar';

function LibraryPageInner() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useMagentoAuth();
  const { wishlist, followedArtists } = useWishlist();
  const { recentlyPlayed } = useRecentlyPlayed();
  const { cassettes } = useCassettes();
  const { minidiscs } = useMiniDiscs();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: 'My Library', type: 'library' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const versions = useMemo(
    () => aggregateVersions(wishlist.items),
    [wishlist.items],
  );

  const artists = useMemo(
    () => deriveArtists(wishlist.items, recentlyPlayed, followedArtists),
    [wishlist.items, recentlyPlayed, followedArtists],
  );

  const lastUpdated = useMemo(
    () => getLastUpdatedText(cassettes, minidiscs, wishlist.items, recentlyPlayed),
    [cassettes, minidiscs, wishlist.items, recentlyPlayed],
  );

  // Auth gate
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-6">
          <svg className="w-16 h-16 text-border mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
          </svg>
          <h1 className="text-2xl font-bold text-white mb-2">Your Library</h1>
          <p className="text-secondary">Sign in to access your liked versions, followed artists, cassettes, and minidiscs.</p>
        </div>
        <SignInForm onSuccess={() => router.refresh()} />
      </div>
    );
  }

  const totalRecordings = wishlist.itemCount;
  const totalArtists = artists.length;

  return (
    <div className="pb-8 max-w-[1400px] mx-auto">
      {/* Title area above the frame */}
      <div className="px-2 sm:px-4 md:px-8 pt-6 md:pt-8 pb-6">
        <h1 className="font-dm-serif text-[32px] sm:text-[36px] lg:text-[40px] leading-none text-primary mb-[6px]">
          Your Library
        </h1>
        <p className="text-[10px] tracking-[0.08em] uppercase text-tertiary">
          {totalRecordings} recordings &middot; {totalArtists} artists &middot; last updated {lastUpdated}
        </p>
      </div>

      {/* Decorative frame — matches home page artists/albums/tracks */}
      <div className="px-2 sm:px-4 md:px-8">
        <div
          className="relative rounded-xl p-4 md:p-8"
          style={{
            border: '1px solid color-mix(in srgb, black 30%, transparent)',
            background: 'linear-gradient(180deg, color-mix(in srgb, black 12%, transparent) 0%, color-mix(in srgb, black 4.5%, transparent) 40%, transparent 100%)',
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 rounded-tl-xl" style={{ borderColor: 'color-mix(in srgb, black 52%, transparent)' }} />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 rounded-tr-xl" style={{ borderColor: 'color-mix(in srgb, black 52%, transparent)' }} />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 rounded-bl-xl" style={{ borderColor: 'color-mix(in srgb, black 52%, transparent)' }} />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 rounded-br-xl" style={{ borderColor: 'color-mix(in srgb, black 52%, transparent)' }} />

          {/* Two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12 items-start">
            {/* Main column */}
            <div className="flex flex-col gap-10">
              <CassettesSection />
              <MiniDiscsSection />
              <VersionsSection />
              <ArtistsSection />
              <AlbumsSection />
              <RecentSection />
            </div>

            {/* Sidebar */}
            <Sidebar
              cassettesCount={cassettes.length}
              minidiscsCount={minidiscs.length}
              versionsCount={versions.length}
              artistsCount={totalArtists}
              recentlyPlayed={recentlyPlayed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return <LibraryPageInner />;
}
