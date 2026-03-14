import { Skeleton } from '@/components/skeletons/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px]">
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        {/* Back link */}
        <Skeleton className="h-4 w-32 rounded mb-4" />
        {/* Title */}
        <Skeleton className="h-8 w-28 rounded mb-8" />

        {/* Profile card */}
        <div className="bg-surface-elevated rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div>
              <Skeleton className="h-6 w-40 rounded mb-2" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>

          {/* Email field */}
          <div>
            <Skeleton className="h-3 w-16 rounded mb-1" />
            <Skeleton className="h-5 w-52 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
