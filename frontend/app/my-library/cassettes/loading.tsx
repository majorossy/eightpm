import { Skeleton, SkeletonMiniCassette } from '@/components/skeletons/Skeleton';

export default function CassettesLoading() {
  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px] safe-top">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-8">
        {/* Header */}
        <div className="pt-6 pb-4 md:pt-8 md:pb-6 px-2">
          <Skeleton className="h-9 w-48 mb-2 rounded" />
          <Skeleton className="h-4 w-56 rounded" />
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3 px-2 pb-4">
          <Skeleton className="h-10 flex-1 max-w-xs rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>

        {/* Cassette grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3">
              <SkeletonMiniCassette />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
