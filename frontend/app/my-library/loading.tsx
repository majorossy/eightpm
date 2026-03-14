import { Skeleton } from '@/components/skeletons/Skeleton';

export default function LibraryLoading() {
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
            {/* Main column — 3 sections */}
            <div className="flex flex-col gap-10">
              {Array.from({ length: 3 }).map((_, si) => (
                <div key={si}>
                  <Skeleton className="h-6 w-32 mb-4 rounded" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <div className="aspect-square skeleton rounded-lg" />
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:flex flex-col gap-6">
              <div className="bg-surface-card rounded-lg p-4">
                <Skeleton className="h-5 w-20 mb-3 rounded" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-1 rounded" />
                      <Skeleton className="h-3 w-12 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-surface-card rounded-lg p-4">
                <Skeleton className="h-5 w-28 mb-3 rounded" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-10 h-10 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
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
