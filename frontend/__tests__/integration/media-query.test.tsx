/**
 * Integration test: useMediaQuery hook
 *
 * Tests useMediaQuery from hooks/useMediaQuery.ts:
 * - Returns false initially (SSR-safe default)
 * - Reflects current matchMedia state after mount
 * - Responds to media query changes
 * - Works with different query strings
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

describe('useMediaQuery Integration', () => {
  let listeners: Map<string, Array<(e: MediaQueryListEvent) => void>>;

  beforeEach(() => {
    listeners = new Map();

    window.matchMedia = vi.fn((query: string) => {
      const queryListeners: Array<(e: MediaQueryListEvent) => void> = [];
      listeners.set(query, queryListeners);

      return {
        matches: false,
        media: query,
        addEventListener: vi.fn((_, handler) => queryListeners.push(handler)),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    });
  });

  it('returns false by default', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when query matches', () => {
    window.matchMedia = vi.fn((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })) as any;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('responds to media query changes', () => {
    const queryListeners: Array<(e: any) => void> = [];

    window.matchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((_, handler) => queryListeners.push(handler)),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })) as any;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      queryListeners.forEach(fn => fn({ matches: true } as MediaQueryListEvent));
    });

    expect(result.current).toBe(true);
  });

  it('re-evaluates when query string changes', () => {
    let currentQuery = '(min-width: 768px)';

    window.matchMedia = vi.fn((query: string) => ({
      matches: query === '(max-width: 480px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })) as any;

    const { result, rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(min-width: 768px)' } }
    );

    expect(result.current).toBe(false);

    rerender({ query: '(max-width: 480px)' });
    expect(result.current).toBe(true);
  });

  it('works with prefers-reduced-motion query', () => {
    window.matchMedia = vi.fn((query: string) => ({
      matches: query.includes('reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })) as any;

    const { result } = renderHook(() =>
      useMediaQuery('(prefers-reduced-motion: reduce)')
    );
    expect(result.current).toBe(true);
  });
});
