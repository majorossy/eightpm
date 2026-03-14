'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useMagentoAuth } from '@/context/MagentoAuthContext';

const AUTH_LIMITS = {
  USERNAME_MAX: 30,
  PASSWORD_MIN: 5,
  PASSWORD_MAX: 128,
  DISPLAY_NAME_MAX: 50,
} as const;

const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

interface SignInFormProps {
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export default function SignInForm({ initialMode = 'signin', onSuccess }: SignInFormProps) {
  const magentoAuth = useMagentoAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const isRegistering = initialMode === 'signup';
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync context-level errors to form state (context error updates after re-render)
  useEffect(() => {
    if (magentoAuth.error) {
      setError(magentoAuth.error);
    }
  }, [magentoAuth.error]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      setError('Username is required');
      return;
    }
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, dots, hyphens, and underscores');
      return;
    }
    if (password.length < AUTH_LIMITS.PASSWORD_MIN) {
      setError(`Password must be at least ${AUTH_LIMITS.PASSWORD_MIN} characters`);
      return;
    }

    if (isRegistering) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!displayName.trim()) {
        setError('Display name is required');
        return;
      }

      setIsSubmitting(true);
      const success = await magentoAuth.signUp({
        username: trimmedUsername,
        password,
        firstname: displayName.trim(),
        lastname: '.',
      });

      setIsSubmitting(false);
      if (success) {
        onSuccess?.();
      }
    } else {
      setIsSubmitting(true);
      const success = await magentoAuth.signIn(trimmedUsername, password);

      setIsSubmitting(false);
      if (success) {
        onSuccess?.();
      }
    }
  }, [username, password, confirmPassword, displayName, isRegistering, magentoAuth, onSuccess]);

  return (
    <div className="bg-surface-card border border-default rounded-lg p-6 shadow-xl">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-serif text-primary mt-2">
          {isRegistering ? 'Create Account' : 'Sign In'}
        </h2>
        <p className="text-secondary text-sm mt-1">
          {isRegistering
            ? 'Join to save your minidiscs and favorites'
            : 'Sign in to sync your library across devices'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="auth-username" className="block text-sm text-secondary mb-1">
            Username
          </label>
          <input
            type="text"
            id="auth-username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, AUTH_LIMITS.USERNAME_MAX))}
            maxLength={AUTH_LIMITS.USERNAME_MAX}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            required
            className="w-full px-4 py-3 bg-surface-elevated border border-default rounded-md text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="deadhead42"
          />
        </div>

        {/* Display Name (registration only) */}
        {isRegistering && (
          <div>
            <label htmlFor="displayName" className="block text-sm text-secondary mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, AUTH_LIMITS.DISPLAY_NAME_MAX))}
              maxLength={AUTH_LIMITS.DISPLAY_NAME_MAX}
              required
              className="w-full px-4 py-3 bg-surface-elevated border border-default rounded-md text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Jerry Garcia"
            />
          </div>
        )}

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm text-secondary mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.slice(0, AUTH_LIMITS.PASSWORD_MAX))}
              maxLength={AUTH_LIMITS.PASSWORD_MAX}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              required
              minLength={AUTH_LIMITS.PASSWORD_MIN}
              className="w-full px-4 py-3 pr-12 bg-surface-elevated border border-default rounded-md text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="--------"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-tertiary hover:text-primary focus:outline-none transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password (registration only) */}
        {isRegistering && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-secondary mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.slice(0, AUTH_LIMITS.PASSWORD_MAX))}
                maxLength={AUTH_LIMITS.PASSWORD_MAX}
                autoComplete="new-password"
                required
                minLength={AUTH_LIMITS.PASSWORD_MIN}
                className="w-full px-4 py-3 pr-12 bg-surface-elevated border border-default rounded-md text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="--------"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-tertiary hover:text-primary focus:outline-none transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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
              <Link
                href="/sign-in"
                className="text-accent hover:text-accent-hover transition-colors"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link
                href="/sign-up"
                className="text-accent hover:text-accent-hover transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
