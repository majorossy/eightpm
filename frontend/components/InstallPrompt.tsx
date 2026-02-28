'use client';

import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function InstallPrompt() {
  const { isInstallable, isIOS, install, dismiss } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    setIsInstalling(true);
    await install();
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setShowIOSInstructions(false);
    dismiss();
  };

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-[140px] md:bottom-[100px] left-4 right-4 md:left-auto md:right-4 md:w-80 bg-surface-elevated border border-default rounded-lg shadow-xl z-50 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-primary">
                Install 8pm.me
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Add to your home screen for the best experience
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-secondary hover:text-primary transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 py-2 bg-accent hover:bg-accent-hover text-inverse text-sm font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {isInstalling ? 'Installing...' : isIOS ? 'How to Install' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-secondary hover:text-primary text-sm transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowIOSInstructions(false)}
          />
          <div className="relative bg-surface-base border border-default rounded-lg w-full max-w-sm mx-4 p-6 shadow-xl">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <span className="text-3xl">⚡</span>
              <h2 className="text-lg font-serif text-primary mt-2">
                Install on iOS
              </h2>
            </div>

            <ol className="space-y-4 text-sm text-primary">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent text-inverse rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <span>
                  Tap the{' '}
                  <span className="inline-flex items-center gap-1 text-accent">
                    Share
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </span>{' '}
                  button in Safari
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent text-inverse rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <span>
                  Scroll down and tap{' '}
                  <span className="text-accent">&quot;Add to Home Screen&quot;</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent text-inverse rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <span>
                  Tap <span className="text-accent">&quot;Add&quot;</span> in the top right corner
                </span>
              </li>
            </ol>

            <button
              onClick={() => {
                setShowIOSInstructions(false);
                dismiss();
              }}
              className="w-full mt-6 py-3 bg-accent hover:bg-accent-hover text-inverse font-medium rounded-md transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
