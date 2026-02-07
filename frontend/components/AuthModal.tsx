'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '@/context/AuthContext';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { VALIDATION_LIMITS } from '@/lib/validation';

// Auth-specific limits
const AUTH_LIMITS = {
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 128,
  FIRSTNAME_MAX: 50,
  LASTNAME_MAX: 50,
} as const;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  // Tab state: 'magic' for Supabase magic link, 'password' for Magento email/password
  const [activeTab, setActiveTab] = useState<'magic' | 'password'>('magic');

  // Magic link state (Supabase)
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password tab state (Magento)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [isRegistering, setIsRegistering] = useState(initialMode === 'signup');

  const { signInWithMagicLink, isConfigured } = useAuth();
  const magentoAuth = useMagentoAuth();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('magic');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstname('');
      setLastname('');
      setError(null);
      setSuccess(null);
      setIsRegistering(initialMode === 'signup');
    }
  }, [isOpen, initialMode]);

  // Handle magic link submission (Supabase)
  const handleMagicLinkSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isConfigured) {
      setError('Authentication is not configured. Please set up Supabase credentials.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signInWithMagicLink(email);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Check your email for the magic link!');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, signInWithMagicLink, isConfigured]);

  // Handle Magento password submission
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isRegistering) {
      // Validation for registration
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (!firstname.trim() || !lastname.trim()) {
        setError('First name and last name are required');
        return;
      }

      setIsSubmitting(true);
      const success = await magentoAuth.signUp({
        email,
        password,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
      });

      setIsSubmitting(false);
      if (success) {
        onClose();
      } else if (magentoAuth.error) {
        setError(magentoAuth.error);
      }
    } else {
      // Login
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      setIsSubmitting(true);
      const success = await magentoAuth.signIn(email, password);

      setIsSubmitting(false);
      if (success) {
        onClose();
      } else if (magentoAuth.error) {
        setError(magentoAuth.error);
      }
    }
  }, [email, password, confirmPassword, firstname, lastname, isRegistering, magentoAuth, onClose]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />

        <Dialog.Content className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="relative bg-[#1c1a17] border border-[#3a3632] rounded-lg w-full max-w-md mx-4 p-6 shadow-xl">
            {/* Close button */}
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 text-[#8a8478] hover:text-[#e8e0d4] transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>

            {/* Header */}
            <div className="text-center mb-4">
              <span className="text-3xl">⚡</span>
              <Dialog.Title className="text-xl font-serif text-[#e8e0d4] mt-2">
                {activeTab === 'magic' ? 'Quick Sign In' : (isRegistering ? 'Create Account' : 'Sign In')}
              </Dialog.Title>
              <Dialog.Description className="text-[#8a8478] text-sm mt-1">
                {activeTab === 'magic'
                  ? 'Sign in without a password'
                  : (isRegistering
                      ? 'Join to save your playlists and favorites'
                      : 'Sign in to sync your library across devices')}
              </Dialog.Description>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('magic')}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'magic'
                    ? 'bg-[#d4a060] text-black'
                    : 'bg-[#2d2a26] text-white hover:bg-[#3a3632]'
                }`}
              >
                Quick Sign In
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'password'
                    ? 'bg-[#d4a060] text-black'
                    : 'bg-[#2d2a26] text-white hover:bg-[#3a3632]'
                }`}
              >
                Email & Password
              </button>
            </div>

            {/* Magic Link Form (Supabase) */}
            {activeTab === 'magic' && (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="magic-email" className="block text-sm text-[#8a8478] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="magic-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.slice(0, VALIDATION_LIMITS.EMAIL_MAX))}
                    maxLength={VALIDATION_LIMITS.EMAIL_MAX}
                    required
                    className="w-full px-4 py-3 bg-[#2d2a26] border border-[#3a3632] rounded-md text-[#e8e0d4] placeholder-[#6a6458] focus:outline-none focus:ring-2 focus:ring-[#d4a060] focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-md text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Success message */}
                {success && (
                  <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-md text-green-300 text-sm">
                    {success}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#d4a060] hover:bg-[#c49050] text-[#1c1a17] font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>
            )}

            {/* Password Form (Magento) */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="password-email" className="block text-sm text-[#8a8478] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="password-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.slice(0, VALIDATION_LIMITS.EMAIL_MAX))}
                    maxLength={VALIDATION_LIMITS.EMAIL_MAX}
                    required
                    className="w-full px-4 py-3 bg-[#2d2a26] border border-[#3a3632] rounded-md text-[#e8e0d4] placeholder-[#6a6458] focus:outline-none focus:ring-2 focus:ring-[#d4a060] focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                {/* First Name and Last Name (registration only) */}
                {isRegistering && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="firstname" className="block text-sm text-[#8a8478] mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstname"
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value.slice(0, AUTH_LIMITS.FIRSTNAME_MAX))}
                        maxLength={AUTH_LIMITS.FIRSTNAME_MAX}
                        required
                        className="w-full px-4 py-3 bg-[#2d2a26] border border-[#3a3632] rounded-md text-[#e8e0d4] placeholder-[#6a6458] focus:outline-none focus:ring-2 focus:ring-[#d4a060] focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastname" className="block text-sm text-[#8a8478] mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastname"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value.slice(0, AUTH_LIMITS.LASTNAME_MAX))}
                        maxLength={AUTH_LIMITS.LASTNAME_MAX}
                        required
                        className="w-full px-4 py-3 bg-[#2d2a26] border border-[#3a3632] rounded-md text-[#e8e0d4] placeholder-[#6a6458] focus:outline-none focus:ring-2 focus:ring-[#d4a060] focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm text-[#8a8478] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.slice(0, AUTH_LIMITS.PASSWORD_MAX))}
                    maxLength={AUTH_LIMITS.PASSWORD_MAX}
                    required
                    minLength={AUTH_LIMITS.PASSWORD_MIN}
                    className="w-full px-4 py-3 bg-[#2d2a26] border border-[#3a3632] rounded-md text-[#e8e0d4] placeholder-[#6a6458] focus:outline-none focus:ring-2 focus:ring-[#d4a060] focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                {/* Confirm Password (registration only) */}
                {isRegistering && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm text-[#8a8478] mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value.slice(0, AUTH_LIMITS.PASSWORD_MAX))}
                      maxLength={AUTH_LIMITS.PASSWORD_MAX}
                      required
                      minLength={AUTH_LIMITS.PASSWORD_MIN}
                      className="w-full px-4 py-3 bg-[#2d2a26] border border-[#3a3632] rounded-md text-[#e8e0d4] placeholder-[#6a6458] focus:outline-none focus:ring-2 focus:ring-[#d4a060] focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-md text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Success message */}
                {success && (
                  <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-md text-green-300 text-sm">
                    {success}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || magentoAuth.isLoading}
                  className="w-full py-3 bg-[#d4a060] hover:bg-[#c49050] text-[#1c1a17] font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || magentoAuth.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    isRegistering ? 'Create Account' : 'Sign In'
                  )}
                </button>

                {/* Toggle login/register */}
                <p className="text-center text-sm text-[#8a8478]">
                  {isRegistering ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistering(false);
                          setError(null);
                        }}
                        className="text-[#d4a060] hover:text-[#e8c090] transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistering(true);
                          setError(null);
                        }}
                        className="text-[#d4a060] hover:text-[#e8c090] transition-colors"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </p>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
