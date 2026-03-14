'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { emailToUsername } from '@/lib/magentoAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { customer, isAuthenticated, isLoading } = useMagentoAuth();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Account', href: '/account' },
      { label: 'Profile' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/account');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !customer) {
    return (
      <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px]">
        <div className="p-6 md:p-8 max-w-2xl mx-auto">
          {/* Back link */}
          <div className="skeleton h-4 w-32 rounded mb-4" />
          {/* Title */}
          <div className="skeleton h-8 w-28 rounded mb-8" />

          {/* Profile card */}
          <div className="bg-surface-elevated rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="skeleton w-16 h-16 rounded-full" />
              <div>
                <div className="skeleton h-6 w-40 rounded mb-2" />
                <div className="skeleton h-4 w-28 rounded" />
              </div>
            </div>

            {/* Email field */}
            <div>
              <div className="skeleton h-3 w-16 rounded mb-1" />
              <div className="skeleton h-5 w-52 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = customer.lastname === '.'
    ? customer.firstname
    : `${customer.firstname} ${customer.lastname}`.trim();

  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px]">
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <Link href="/account" className="text-accent hover:underline mb-4 inline-block">
          ← Back to Account
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

        <div className="bg-surface-elevated rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-black text-2xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <p className="text-secondary">@{emailToUsername(customer.email)}</p>
            </div>
          </div>

          <div>
            <span className="block text-secondary text-sm mb-1">Email</span>
            <span className="text-white">{customer.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
