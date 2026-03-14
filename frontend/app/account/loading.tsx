import { Skeleton } from '@/components/skeletons/Skeleton';

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px]">
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Title */}
        <Skeleton className="h-9 w-36 rounded mb-8" />

        {/* User info card */}
        <div className="bg-surface-elevated rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div>
              <Skeleton className="h-6 w-40 rounded mb-2" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>
        </div>

        {/* Quick links grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-elevated rounded-lg p-6">
              <Skeleton className="h-5 w-24 rounded mb-2" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
          ))}
        </div>

        {/* Sign out button */}
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
