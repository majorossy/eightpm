'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useMagentoAuth } from '@/context/MagentoAuthContext';
import { VALIDATION_LIMITS } from '@/lib/validation';
import { useBackToClose } from '@/hooks/useBackToClose';

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
  useBackToClose(isOpen, onClose);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [isRegistering, setIsRegistering] = useState(initialMode === 'signup');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const magentoAuth = useMagentoAuth();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstname('');
      setLastname('');
      setError(null);
      setIsRegistering(initialMode === 'signup');
    }
  }, [isOpen, initialMode]);

  // Handle password submission (Magento)
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
          <div className="relative bg-surface-base border border-default rounded-lg w-full max-w-md mx-4 p-6 shadow-xl">
            {/* Close button */}
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>

            {/* Header */}
            <div className="text-center mb-4">
              <Dialog.Title className="text-xl font-serif text-primary mt-2">
                {isRegistering ? 'Create Account' : 'Sign In'}
              </Dialog.Title>
              <Dialog.Description className="text-secondary text-sm mt-1">
                {isRegistering
                  ? 'Join to save your playlists and favorites'
                  : 'Sign in to sync your library across devices'}
              </Dialog.Description>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="auth-email" className="block text-sm text-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="auth-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, VALIDATION_LIMITS.EMAIL_MAX))}
                  maxLength={VALIDATION_LIMITS.EMAIL_MAX}
                  required
                  className="w-full px-4 py-3 bg-surface-elevated border border-default rounded-md text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {/* First Name and Last Name (registration only) */}
              {isRegistering && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstname" className="block text-sm text-secondary mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value.slice(0, AUTH_LIMITS.FIRSTNAME_MAX))}
                      maxLength={AUTH_LIMITS.FIRSTNAME_MAX}
                      required
                      className="w-full px-4 py-3 bg-surface-elevated border border-default rounded-md text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastname" className="block text-sm text-secondary mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value.slice(0, AUTH_LIMITS.LASTNAME_MAX))}
                      maxLength={AUTH_LIMITS.LASTNAME_MAX}
                      required
                      className="w-full px-4 py-3 bg-surface-elevated border border-default rounded-md text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm text-secondary mb-1">
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
                  className="w-full px-4 py-3 bg-surface-elevated border border-default rounded-md text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {/* Confirm Password (registration only) */}
              {isRegistering && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-secondary mb-1">
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
                    className="w-full px-4 py-3 bg-surface-elevated border border-default rounded-md text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
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

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || magentoAuth.isLoading}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-inverse font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <p className="text-center text-sm text-secondary">
                {isRegistering ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(false);
                        setError(null);
                      }}
                      className="text-accent hover:text-accent-hover transition-colors"
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
                      className="text-accent hover:text-accent-hover transition-colors"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
