'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { emailToUsername } from '@/lib/magentoAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { customer, isAuthenticated, isLoading, refreshCustomer } = useMagentoAuth();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  useEffect(() => {
    if (customer) {
      setDisplayName(customer.firstname);
    }
  }, [customer]);

  if (isLoading || !customer) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px]">
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Edit Profile</h1>

        <form onSubmit={(e) => { e.preventDefault(); setMessage({ type: 'success', text: 'Profile update coming soon!' }); }} className="space-y-6">
          <div>
            <label className="block text-white mb-2">Username</label>
            <input
              type="text"
              value={`@${emailToUsername(customer.email)}`}
              disabled
              className="w-full bg-surface-base text-secondary rounded px-4 py-3 border border-default"
            />
          </div>
          <div>
            <label className="block text-white mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-surface-elevated text-white rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-6 rounded-full bg-accent text-black font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
