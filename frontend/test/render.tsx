/**
 * Custom render utility wrapping all app providers.
 *
 * This is THE core integration test utility. It renders components inside
 * the real provider tree (same order as ClientLayout.tsx) so tests exercise
 * actual context interactions. Network boundaries are mocked, not contexts.
 *
 * Usage:
 *   import { renderApp } from '@/test/render';
 *   import { setCollections } from '@/test/mocks/magentoSync';
 *   import { setCustomerToReturn } from '@/test/mocks/magentoAuth';
 *   import { buildSong } from '@/test/factories/song';
 *   import { buildCustomer } from '@/test/factories/customer';
 *
 *   it('syncs liked songs on login', async () => {
 *     setCustomerToReturn(buildCustomer());
 *     setCollections({ likedSongs: [buildSong()] });
 *
 *     const { auth } = renderApp(<MyComponent />);
 *     await auth.signIn('user', 'pass');
 *
 *     expect(screen.getByText('Track 1')).toBeInTheDocument();
 *   });
 *
 * IMPORTANT: Tests must call vi.mock() at the top of the test file to wire
 * up the mock modules. See mockModules() below for the required vi.mock calls.
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/context/ThemeContext';
import { MagentoAuthProvider } from '@/context/MagentoAuthContext';
import { ToastProvider } from '@/components/ToastContainer';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CollectionProvider } from '@/context/CollectionContext';
import { QueueProvider } from '@/context/QueueContext';
import { RecentlyPlayedProvider } from '@/context/RecentlyPlayedContext';
import { QualityProvider } from '@/context/QualityContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { BreadcrumbProvider } from '@/context/BreadcrumbContext';
import { MobileUIProvider } from '@/context/MobileUIContext';

// Re-export everything from RTL for convenience
export * from '@testing-library/react';

/**
 * All providers in the same order as ClientLayout.tsx LayoutContent.
 * ThemeProvider wraps the outside (just like ClientLayout).
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
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
                            {children}
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
    </ThemeProvider>
  );
}

/**
 * Render a component inside the full provider tree.
 * Returns standard RTL queries plus helper accessors.
 */
export function renderApp(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Copy-paste this block at the top of integration test files.
 * It wires the mock modules to the real imports used by providers.
 *
 * ```ts
 * vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
 * vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
 * vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
 * vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
 * vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
 * vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
 * vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));
 * ```
 */
