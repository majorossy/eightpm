'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMagentoAuth } from '@/context/MagentoAuthContext';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useMagentoAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/account');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px]">
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Link href="/account" className="text-accent hover:underline mb-4 inline-block">
          ← Back to Account
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">Order History</h1>

        <div className="bg-surface-elevated rounded-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-lg font-bold text-white mb-2">No orders yet</h2>
          <p className="text-secondary">Your order history will appear here.</p>
        </div>
      </div>
    </div>
  );
}
