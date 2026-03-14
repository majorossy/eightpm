import { Skeleton } from '@/components/skeletons/Skeleton';

function SkeletonTrackRow({ index }: { index: number }) {
  const widths = ['w-40', 'w-48', 'w-36', 'w-52', 'w-44', 'w-32', 'w-48', 'w-40'];
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
        border: '1px solid color-mix(in srgb, var(--text-primary) 8%, transparent)',
        borderRadius: 8,
        padding: '14px 20px',
      }}
    >
      <div className="flex items-baseline gap-1.5 mb-2">
        {/* Drag dots placeholder */}
        <Skeleton className="w-3 h-4 rounded mr-1" />
        {/* Track number */}
        <Skeleton className="w-4 h-3 rounded" />
        {/* Title */}
        <Skeleton className={`h-4 ${widths[index % widths.length]} rounded`} />
        {/* Duration */}
        <Skeleton className="h-3 w-10 rounded ml-auto" />
      </div>
      {/* Recording row placeholder */}
      <div className="flex items-center gap-2 mt-2">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-3 w-20 rounded hidden sm:block" />
      </div>
    </div>
  );
}

export default function MiniDiscDetailLoading() {
  return (
    <div className="min-h-screen pb-[140px] md:pb-[90px] safe-top bg-surface-base">
      <div className="w-full max-w-[900px] mx-auto px-4 md:px-8 pt-6">

        {/* Disc selector pills */}
        <div className="mb-4">
          <div className="flex gap-2.5 overflow-hidden pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-full flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Header card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid color-mix(in srgb, white 7%, transparent)',
          }}
        >
          {/* Banner */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{
              background: 'linear-gradient(90deg, var(--surface-sunken) 0%, var(--surface-card) 40%)',
              borderBottom: '1px solid color-mix(in srgb, var(--tertiary) 15%, transparent)',
            }}
          >
            <div className="flex items-center gap-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            <Skeleton className="h-4 w-14 rounded" />
          </div>

          {/* Title + MD art */}
          <div className="flex items-start justify-between p-6 gap-5">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-8 w-56 mb-2 rounded" />
              <Skeleton className="h-3 w-40 mb-3 rounded" />
              <div className="flex items-center gap-3 mt-3">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
            {/* MD art placeholder */}
            <div
              className="flex-shrink-0 rounded-lg skeleton"
              style={{ width: 108, height: 116 }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 px-6 pb-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-[34px] h-[34px] rounded-[7px]" />
            ))}
          </div>

          {/* Track dots */}
          <div
            className="flex items-center justify-center gap-3 py-2.5 px-6"
            style={{ borderTop: '1px solid color-mix(in srgb, white 4%, transparent)' }}
          >
            <Skeleton className="h-2 w-8 rounded" />
            <div className="flex gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ width: 22, height: 4, borderRadius: 2 }}
                />
              ))}
            </div>
            <Skeleton className="h-2 w-10 rounded" />
          </div>
        </div>

        {/* Track rows */}
        <div className="flex flex-col gap-2.5 mt-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonTrackRow key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
