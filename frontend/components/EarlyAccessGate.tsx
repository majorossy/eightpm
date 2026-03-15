'use client';

import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = '8pm-early-access';

export default function EarlyAccessGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Check auth on mount — use localStorage as fast cache, verify with server
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      // Fast path: trust localStorage cache, verify in background
      setIsAuthenticated(true);
      fetch('/api/auth/early-access')
        .then(r => r.json())
        .then(data => {
          if (!data.authenticated) {
            localStorage.removeItem(STORAGE_KEY);
            setIsAuthenticated(false);
          }
        })
        .catch(() => {}); // keep cached state on network error
    } else {
      // No cache: check server
      fetch('/api/auth/early-access')
        .then(r => r.json())
        .then(data => {
          if (data.authenticated) {
            localStorage.setItem(STORAGE_KEY, 'true');
          }
          setIsAuthenticated(data.authenticated);
        })
        .catch(() => setIsAuthenticated(false));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsAuthenticated(true);
      } else {
        setError('Invalid credentials');
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
      }
    } catch {
      setError('Connection error. Please try again.');
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    } finally {
      setIsSubmitting(false);
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
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-6px); }
          30%, 70% { transform: translateX(6px); }
        }
        .shake-card {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        .error-flash {
          border-color: #ef4444 !important;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.05);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
      `}</style>
      <div
        ref={cardRef}
        className={`bg-surface-card rounded-xl p-8 max-w-md w-full shadow-2xl border transition-all duration-300 ${
          shaking ? 'shake-card error-flash' : 'border-default'
        }`}
      >
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
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="w-full px-4 py-3 bg-surface-base border border-default rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              placeholder="Enter username"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-secondary mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 pr-12 bg-surface-base border border-default rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-inverse font-bold rounded-lg transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Entering...' : 'Enter'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-tertiary text-xs text-center mt-6">
          Live music archive &bull; Coming soon
        </p>
      </div>
    </div>
  );
}
