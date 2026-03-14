import { Skeleton } from '@/components/skeletons/Skeleton';

function SkeletonMiniDiscCard() {
  return (
    <div
      className="w-full aspect-square rounded-lg overflow-hidden relative"
      style={{
        background: 'linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface-card) 50%, var(--surface-elevated) 100%)',
        border: '2px solid var(--surface-elevated)',
      }}
    >
      {/* Disc window */}
      <div
        className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[65%] aspect-square rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, var(--surface-elevated), var(--surface-sunken) 60%)',
          border: '2px solid var(--surface-elevated)',
        }}
      >
        {/* Inner disc shimmer */}
        <div className="absolute inset-[8%] rounded-full skeleton" />
        {/* Center hole */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10%] aspect-square rounded-full"
          style={{ background: 'var(--surface-sunken)', border: '1px solid var(--surface-elevated)' }}
        />
      </div>

      {/* Label card */}
      <div className="absolute bottom-3 left-3 right-3">
        <div
          className="rounded px-3 py-2.5 text-center"
          style={{ background: 'var(--cream)' }}
        >
          <Skeleton className="h-4 w-24 mx-auto mb-1 rounded" />
          <Skeleton className="h-3 w-16 mx-auto rounded" />
        </div>
      </div>
    </div>
  );
}

export default function MiniDiscsLoading() {
  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px] safe-top">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-8">
        {/* Header */}
        <div className="pt-6 pb-4 md:pt-8 md:pb-6 px-2 flex items-end justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-48 mb-2 rounded" />
            <Skeleton className="h-4 w-56 rounded" />
          </div>
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3 px-2 pb-4">
          <Skeleton className="h-10 flex-1 max-w-xs rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>

        {/* MiniDisc grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3">
              <SkeletonMiniDiscCard />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
