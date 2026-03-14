'use client';

import { ReactNode, useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider, useWishlist } from '@/context/WishlistContext';
import { CollectionProvider } from '@/context/CollectionContext';
import { QueueProvider, useQueue } from '@/context/QueueContext';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext';
import { RecentlyPlayedProvider } from '@/context/RecentlyPlayedContext';
import { QualityProvider } from '@/context/QualityContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { BreadcrumbProvider, useBreadcrumbs } from '@/context/BreadcrumbContext';
import { MobileUIProvider, useMobileUI } from '@/context/MobileUIContext';
import { MagentoAuthProvider } from '@/context/MagentoAuthContext';
import BottomPlayer from '@/components/BottomPlayer';
import EightPmTopBar from '@/components/EightPmTopBar';
import EightPmMobileNav from '@/components/EightPmMobileNav';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ToastProvider } from '@/components/ToastContainer';
import InstallPrompt from '@/components/InstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import LoadingBar from '@/components/LoadingBar';
import Footer from '@/components/Footer';
import StarField from '@/components/StarField';
import WebVitalsMonitor from '@/components/WebVitalsMonitor';
import CookieConsentBanner from '@/components/CookieConsentBanner';

// Lazy load heavy components that aren't immediately visible
const Queue = dynamic(() => import('@/components/Queue'), { ssr: false });
const EightPmFullPlayer = dynamic(() => import('@/components/EightPmFullPlayer'), { ssr: false });
const KeyboardShortcutsHelp = dynamic(() => import('@/components/KeyboardShortcutsHelp'), { ssr: false });

// Inner layout that can access player state and contexts
function InnerLayout({ children }: { children: ReactNode }) {
  const { isMobile, isPlayerMinimized, minimizePlayer, restorePlayer } = useMobileUI();
  const player = usePlayer();
  const queue = useQueue();
  const wishlist = useWishlist();
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const handleCloseHelp = useCallback(() => setIsHelpOpen(false), []);

  useAnalytics();

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
    onOpenFind: () => router.push('/find'),
    onShowHelp: () => setIsHelpOpen(true),
    onToggleMinimize: () => {
      if (!isMobile && player.currentSong) {
        isPlayerMinimized ? restorePlayer() : minimizePlayer();
      }
    },
    isQueueOpen: player.isQueueOpen,
  });

  // Measure the fixed bottom player so <main> gets enough padding to avoid overlap
  const [playerHeight, setPlayerHeight] = useState(0);
  useEffect(() => {
    const observe = () => {
      const el = document.getElementById('bottom-player-bar');
      if (!el) { setPlayerHeight(0); return null; }
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          setPlayerHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
        }
      });
      ro.observe(el);
      return ro;
    };
    // Re-observe whenever the player mounts/unmounts (song changes, minimize)
    let ro = observe();
    const mo = new MutationObserver(() => { ro?.disconnect(); ro = observe(); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { ro?.disconnect(); mo.disconnect(); };
  }, []);

  // Desktop minimized: player is still in DOM but translateY(100%) off-screen
  const effectivePlayerHeight = (!isMobile && isPlayerMinimized) ? 0 : playerHeight;
  // 50px nav bar (all screens) + player + 16px breathing room
  const mainPaddingBottom = effectivePlayerHeight + 50 + 16;

  const { breadcrumbs } = useBreadcrumbs();
  const isHeroPage = breadcrumbs.length === 0;

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

      {/* Random star field */}
      <StarField />

      {/* Top bar with breadcrumbs - OUTSIDE main for sticky positioning */}
      <EightPmTopBar />

      {/* Main content area — hero pages handle their own top padding */}
      <main
        id="main-content"
        className={`min-h-screen relative z-10 ${isHeroPage ? 'pt-0' : 'pt-14'}`}
        style={{ paddingBottom: mainPaddingBottom }}
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

      {/* Keyboard shortcuts help modal */}
      <KeyboardShortcutsHelp
        isOpen={isHelpOpen}
        onClose={handleCloseHelp}
      />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Core Web Vitals monitoring */}
      <WebVitalsMonitor />

      {/* Cookie consent banner (auto-hides after consent) */}
      <CookieConsentBanner />

    </>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  return (
    <MagentoAuthProvider>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            <CollectionProvider>
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
            </CollectionProvider>
          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </MagentoAuthProvider>
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
