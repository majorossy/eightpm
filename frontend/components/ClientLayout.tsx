'use client';

import { ReactNode, useState, useCallback, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider, useWishlist } from '@/context/WishlistContext';
import { PlaylistProvider } from '@/context/PlaylistContext';
import { QueueProvider, useQueue } from '@/context/QueueContext';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext';
import { RecentlyPlayedProvider } from '@/context/RecentlyPlayedContext';
import { QualityProvider } from '@/context/QualityContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { BreadcrumbProvider } from '@/context/BreadcrumbContext';
import { MobileUIProvider, useMobileUI } from '@/context/MobileUIContext';
import { AuthProvider } from '@/context/AuthContext';
import { MagentoAuthProvider } from '@/context/MagentoAuthContext';
import { UnifiedAuthProvider } from '@/context/UnifiedAuthContext';
import BottomPlayer from '@/components/BottomPlayer';
import EightPmTopBar from '@/components/EightPmTopBar';
import EightPmMobileNav from '@/components/EightPmMobileNav';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ToastContainer';
import InstallPrompt from '@/components/InstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import LoadingBar from '@/components/LoadingBar';
import Footer from '@/components/Footer';
import WebVitalsMonitor from '@/components/WebVitalsMonitor';

// Lazy load heavy components that aren't immediately visible
const Queue = dynamic(() => import('@/components/Queue'), { ssr: false });
const EightPmFullPlayer = dynamic(() => import('@/components/EightPmFullPlayer'), { ssr: false });
const EightPmSearchOverlay = dynamic(
  () => import('@/components/EightPmSearchOverlay').then(mod => ({ default: mod.EightPmSearchOverlay })),
  { ssr: false }
);
const KeyboardShortcutsHelp = dynamic(() => import('@/components/KeyboardShortcutsHelp'), { ssr: false });

// Inner layout that can access player state and contexts
function InnerLayout({ children }: { children: ReactNode }) {
  const { isMobile } = useMobileUI();
  const player = usePlayer();
  const queue = useQueue();
  const wishlist = useWishlist();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Volume control helpers
  const handleVolumeUp = useCallback(() => {
    const newVolume = Math.min(1, player.volume + 0.1);
    player.setVolume(newVolume);
  }, [player]);

  const handleVolumeDown = useCallback(() => {
    const newVolume = Math.max(0, player.volume - 0.1);
    player.setVolume(newVolume);
  }, [player]);

  // Repeat cycle: off → all → one → off
  const handleCycleRepeat = useCallback(() => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(queue.queue.repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    queue.setRepeat(modes[nextIndex]);
  }, [queue]);

  // Toggle like for current song
  const handleToggleLike = useCallback(() => {
    if (!player.currentSong) return;

    if (wishlist.isInWishlist(player.currentSong.id)) {
      const item = wishlist.wishlist.items.find(i => i.song.id === player.currentSong?.id);
      if (item) {
        wishlist.removeFromWishlist(item.id);
      }
    } else {
      wishlist.addToWishlist(player.currentSong);
    }
  }, [player.currentSong, wishlist]);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: player.togglePlay,
    onNext: player.playNext,
    onPrevious: player.playPrev,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
    onCycleRepeat: handleCycleRepeat,
    onToggleLike: handleToggleLike,
    onToggleQueue: player.toggleQueue,
    onOpenSearch: () => setIsSearchOpen(true),
    onShowHelp: () => setIsHelpOpen(true),
    isQueueOpen: player.isQueueOpen,
  });

  // Jamify layout (only theme now)
  return (
    <>
      {/* Top loading bar for navigation */}
      <LoadingBar />

      {/* Skip links for keyboard users */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <a href="#player-controls" className="skip-to-main">
        Skip to player controls
      </a>

      {/* Organic blob background */}
      <div className="blob-bg" />

      {/* Fire glow effect */}
      <div className="fire-glow" />

      {/* Top bar with breadcrumbs - OUTSIDE main for sticky positioning */}
      <EightPmTopBar />

      {/* Main content area */}
      <main
        id="main-content"
        className="min-h-screen bg-[var(--bg)] relative z-10 pb-[200px] pt-14"
      >
        {children}

        {/* Footer */}
        <Footer />
      </main>

      {/* Bottom navigation tabs (all screen sizes) */}
      <EightPmMobileNav />

      {/* Mini player (mobile) or full player bar (desktop) */}
      <BottomPlayer />

      {/* Mobile: Full-screen player (expands from mini player) */}
      {isMobile && <EightPmFullPlayer />}

      {/* Queue drawer (left side) */}
      <Queue />

      {/* Search overlay */}
      <EightPmSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Keyboard shortcuts help modal */}
      <KeyboardShortcutsHelp
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Core Web Vitals monitoring */}
      <WebVitalsMonitor />

    </>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MagentoAuthProvider>
        <UnifiedAuthProvider>
          <ToastProvider>
            <CartProvider>
              <WishlistProvider>
                <PlaylistProvider>
                  <QueueProvider>
                    <RecentlyPlayedProvider>
                      <QualityProvider>
                        <PlayerProvider>
                          <BreadcrumbProvider>
                            <MobileUIProvider>
                              <InnerLayout>{children}</InnerLayout>
                            </MobileUIProvider>
                          </BreadcrumbProvider>
                        </PlayerProvider>
                      </QualityProvider>
                    </RecentlyPlayedProvider>
                  </QueueProvider>
                </PlaylistProvider>
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </UnifiedAuthProvider>
      </MagentoAuthProvider>
    </AuthProvider>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LayoutContent>{children}</LayoutContent>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
