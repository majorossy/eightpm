'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUnifiedAuth } from '@/context/UnifiedAuthContext';
import { useMagentoAuth } from '@/context/MagentoAuthContext';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOutAll } = useUnifiedAuth();
  const { customer } = useMagentoAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px]">
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Account</h1>

        {/* User info card */}
        <div className="bg-surface-elevated rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-black text-2xl font-bold">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
              <p className="text-secondary">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2 text-sm">
            {user.hasSupabaseAuth && (
              <span className="px-3 py-1 rounded-full bg-surface-base text-accent">Supabase</span>
            )}
            {user.hasMagentoAuth && (
              <span className="px-3 py-1 rounded-full bg-surface-base text-accent">Magento</span>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {customer && (
            <>
              <Link
                href="/account/profile"
                className="bg-surface-elevated rounded-lg p-6 hover:bg-border transition-colors"
              >
                <h3 className="text-lg font-bold text-white mb-2">Profile</h3>
                <p className="text-secondary text-sm">Edit your name and contact info</p>
              </Link>
              <Link
                href="/account/orders"
                className="bg-surface-elevated rounded-lg p-6 hover:bg-border transition-colors"
              >
                <h3 className="text-lg font-bold text-white mb-2">Orders</h3>
                <p className="text-secondary text-sm">View your order history</p>
              </Link>
            </>
          )}
          <Link
            href="/playlists"
            className="bg-surface-elevated rounded-lg p-6 hover:bg-border transition-colors"
          >
            <h3 className="text-lg font-bold text-white mb-2">Playlists</h3>
            <p className="text-secondary text-sm">Manage your playlists</p>
          </Link>
          <Link
            href="/wishlist"
            className="bg-surface-elevated rounded-lg p-6 hover:bg-border transition-colors"
          >
            <h3 className="text-lg font-bold text-white mb-2">Wishlist</h3>
            <p className="text-secondary text-sm">Your liked songs</p>
          </Link>
        </div>

        {/* Sign out */}
        <button
          onClick={signOutAll}
          className="w-full py-3 px-6 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
