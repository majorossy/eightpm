import { Skeleton } from '@/components/skeletons/Skeleton';

export default function SignUpLoading() {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-card rounded-xl p-6 border border-default">
          {/* Title */}
          <Skeleton className="h-8 w-40 mx-auto mb-2 rounded" />
          <Skeleton className="h-4 w-52 mx-auto mb-6 rounded" />

          {/* Username field */}
          <Skeleton className="h-4 w-20 mb-2 rounded" />
          <Skeleton className="h-12 w-full mb-4 rounded-lg" />

          {/* Display name field */}
          <Skeleton className="h-4 w-28 mb-2 rounded" />
          <Skeleton className="h-12 w-full mb-4 rounded-lg" />

          {/* Password field */}
          <Skeleton className="h-4 w-20 mb-2 rounded" />
          <Skeleton className="h-12 w-full mb-4 rounded-lg" />

          {/* Confirm password field */}
          <Skeleton className="h-4 w-36 mb-2 rounded" />
          <Skeleton className="h-12 w-full mb-6 rounded-lg" />

          {/* Submit button */}
          <Skeleton className="h-12 w-full mb-4 rounded-full" />

          {/* Footer link */}
          <Skeleton className="h-4 w-48 mx-auto rounded" />
        </div>
      </div>
    </div>
  );
}
