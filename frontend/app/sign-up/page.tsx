'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import SignInForm from '@/components/SignInForm';

function SignUpPageInner() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useMagentoAuth();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Sign Up' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/my-library');
    }
  }, [isLoading, isAuthenticated, router]);

  if (!isLoading && isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <SignInForm
          initialMode="signup"
          onSuccess={() => router.push('/account')}
        />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpPageInner />
    </Suspense>
  );
}
