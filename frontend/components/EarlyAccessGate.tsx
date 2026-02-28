'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = '8pm-early-access';
const VALID_USERNAME = 'phish';
const VALID_PASSWORD = 'phish';

export default function EarlyAccessGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setIsAuthenticated(stored === 'true');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      username.toLowerCase() === VALID_USERNAME &&
      password.toLowerCase() === VALID_PASSWORD
    ) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      setError('Invalid credentials');
    }
  };

  // Still checking auth state
  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 bg-surface-base z-[99999] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated - show app
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated - show login modal
  return (
    <div className="fixed inset-0 bg-surface-base z-[99999] flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-xl p-8 max-w-md w-full shadow-2xl border border-default">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold text-accent mb-2"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            8pm.me
          </h1>
          <div className="inline-block px-3 py-1 bg-accent/10 rounded-full">
            <span className="text-xs font-medium text-accent tracking-wider uppercase">
              Early Access
            </span>
          </div>
        </div>

        {/* Message */}
        <p className="text-secondary text-center mb-6 text-sm">
          This site is still under development.<br />
          Enter your credentials to continue.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-secondary mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-surface-base border border-default rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent transition-colors"
              placeholder="Enter username"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-secondary mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface-base border border-default rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent transition-colors"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-accent hover:bg-accent-hover text-inverse font-bold rounded-lg transition-colors"
          >
            Enter
          </button>
        </form>

        {/* Footer */}
        <p className="text-tertiary text-xs text-center mt-6">
          Live music archive • Coming soon
        </p>
      </div>
    </div>
  );
}
