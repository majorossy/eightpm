'use client';

import {
  SkeletonHomePage,
  SkeletonArtistPage,
  SkeletonAlbumPage,
  SkeletonSearchPage,
  SkeletonInfoPage,
} from '@/components/skeletons/Skeleton';
import CassettesLoading from '@/app/my-library/cassettes/loading';
import MiniDiscsLoading from '@/app/my-library/minidiscs/loading';
import MiniDiscDetailLoading from '@/app/my-library/minidiscs/[id]/loading';
import SignInLoading from '@/app/sign-in/loading';
import SignUpLoading from '@/app/sign-up/loading';
import AccountLoading from '@/app/account/loading';
import ProfileLoading from '@/app/account/profile/loading';

function SkeletonMyLibrary() {
  return (
    <div className="pb-8 max-w-[1400px] mx-auto">
      {/* Title area */}
      <div className="px-2 sm:px-4 md:px-8 pt-6 md:pt-8 pb-6">
        <div className="h-10 w-48 skeleton mb-2 rounded" />
        <div className="h-3 w-64 skeleton rounded" />
      </div>
      {/* Decorative frame */}
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

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12 items-start">
            {/* Main column — 6 sections */}
            <div className="flex flex-col gap-10">
              {[32, 28, 36, 24, 32, 28].map((w, si) => (
                <div key={si}>
                  <div className={`h-6 w-${w} skeleton mb-4 rounded`} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <div className="aspect-square skeleton rounded-lg" />
                        <div className="h-4 w-3/4 skeleton rounded" />
                        <div className="h-3 w-1/2 skeleton rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Sidebar */}
            <div className="hidden lg:flex flex-col gap-6">
              <div className="bg-surface-card rounded-lg p-4">
                <div className="h-5 w-20 skeleton mb-3 rounded" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 skeleton rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 w-20 skeleton mb-1 rounded" />
                      <div className="h-3 w-12 skeleton rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-surface-card rounded-lg p-4">
                <div className="h-5 w-28 skeleton mb-3 rounded" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 skeleton rounded" />
                    <div className="flex-1">
                      <div className="h-4 w-24 skeleton mb-1 rounded" />
                      <div className="h-3 w-16 skeleton rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const sections = [
  { name: 'Home', id: 'home', component: <SkeletonHomePage /> },
  { name: 'Artist', id: 'artist', component: <SkeletonArtistPage /> },
  { name: 'Album', id: 'album', component: <SkeletonAlbumPage /> },
  { name: 'Find / Search', id: 'find', component: <SkeletonSearchPage /> },
  { name: 'My Library', id: 'my-library', component: <SkeletonMyLibrary /> },
  { name: 'Cassettes List', id: 'cassettes', component: <CassettesLoading /> },
  { name: 'MiniDiscs List', id: 'minidiscs', component: <MiniDiscsLoading /> },
  { name: 'MiniDisc Detail', id: 'minidisc-detail', component: <MiniDiscDetailLoading /> },
  { name: 'Account', id: 'account', component: <AccountLoading /> },
  { name: 'Profile', id: 'profile', component: <ProfileLoading /> },
  { name: 'Sign In', id: 'sign-in', component: <SignInLoading /> },
  { name: 'Sign Up', id: 'sign-up', component: <SignUpLoading /> },
  { name: 'Info Page (5 cards)', id: 'info', component: <SkeletonInfoPage cardCount={5} /> },
];

export default function DebugSkeletonsPage() {
  return (
    <div className="min-h-screen bg-surface-base pb-32">
      {/* Nav */}
      <div className="sticky top-0 z-50 bg-surface-card border-b border-default px-4 py-3">
        <h1 className="text-lg font-bold text-primary mb-2">Skeleton Debug</h1>
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-xs px-3 py-1.5 rounded-full bg-surface-elevated text-secondary hover:text-primary transition-colors"
            >
              {s.name}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map((s) => (
        <div key={s.id} id={s.id} className="border-b-4 border-default">
          <div className="bg-surface-sunken px-6 py-3">
            <h2 className="text-base font-bold text-primary tracking-wide uppercase">
              {s.name}
            </h2>
          </div>
          <div className="overflow-hidden">{s.component}</div>
        </div>
      ))}
    </div>
  );
}
