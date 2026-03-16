# Integration Test Infrastructure

## Architecture

```
frontend/test/
  setup.ts              - Global test setup (jsdom, mocks, cleanup)
  render.tsx            - Custom render with all providers (the core utility)
  mocks/
    next.ts             - next/image, next/link, next/navigation
    audio.ts            - HTMLAudioElement mock for jsdom
    magentoSync.ts      - Magento GraphQL sync (fetch, save, merge)
    magentoAuth.ts      - Auth token management
    analytics.ts        - Analytics no-ops (all 60+ functions)
  factories/
    song.ts             - Song, Album, Track, Artist builders
    queue.ts            - QueueItem, batch, standalone builders
    customer.ts         - MagentoCustomer builders

frontend/__tests__/integration/
  auth-flow.test.tsx          - Login, signup, logout, token restore (8 tests)
  queue-playback.test.tsx     - Queue + Player interaction (6 tests)
  wishlist-sync.test.tsx      - Like, follow, server sync on login (6 tests)
  collection-sync.test.tsx    - Cassettes, minidiscs, server sync (6 tests)
  queue-persistence.test.tsx  - localStorage save/restore across mounts (4 tests)
```

## Usage

Every integration test file needs the same mock wiring block at the top:

```tsx
import { vi } from 'vitest';

vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));
```

Then use `renderApp` to render inside the full provider tree:

```tsx
import { renderApp } from '@/test/render';
import { screen, act, waitFor } from '@testing-library/react';
import { setCustomerToReturn } from '@/test/mocks/magentoAuth';
import { buildCustomer } from '@/test/factories/customer';
import { buildSong } from '@/test/factories/song';

it('loads user data on login', async () => {
  setCustomerToReturn(buildCustomer({ firstname: 'Trey' }));

  renderApp(<MyComponent />);

  await act(async () => {
    screen.getByText('Sign In').click();
  });

  await waitFor(() => {
    expect(screen.getByText('Trey')).toBeInTheDocument();
  });
});
```

## Running Tests

```bash
# Unit tests only (407 tests)
npx vitest run --project unit

# Integration tests only (30 tests)
npx vitest run --project integration

# Both
npx vitest run --project unit --project integration

# Watch mode
npx vitest --project integration
```

## Key Design Decisions

- **Real providers, mocked boundaries**: The provider tree is real (same order as ClientLayout.tsx). Only network calls (magentoAuth, magentoSync, analytics) and browser APIs (Audio, matchMedia) are mocked.
- **Controllable mocks**: Use `setCustomerToReturn()`, `setCollections()`, `setAuthFailure()` etc. to control what the mocked APIs return per test.
- **Factory functions**: `buildSong()`, `buildAlbum()`, `buildQueueItem()` etc. generate valid test data with sensible defaults and auto-incrementing IDs.
- **No context mocking**: Unlike component-level tests that mock `useQueue()`, integration tests exercise the actual context interactions.
