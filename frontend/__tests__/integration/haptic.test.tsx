/**
 * Integration test: Haptic feedback
 *
 * Tests useHaptic hook:
 * - Exposes named patterns (BUTTON_PRESS, SWIPE_COMPLETE, etc.)
 * - vibrate calls navigator.vibrate when supported
 * - vibrate is no-op when reduced motion is preferred
 * - vibrate is no-op when navigator.vibrate not available
 * - isSupported reflects navigator.vibrate availability
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useHaptic } from '@/hooks/useHaptic';

function HapticDisplay() {
  const haptic = useHaptic();

  return (
    <div>
      <div data-testid="supported">{String(haptic.isSupported)}</div>
      <div data-testid="reduced-motion">{String(haptic.prefersReducedMotion)}</div>
      <div data-testid="button-press">{haptic.BUTTON_PRESS}</div>
      <div data-testid="delete-action">{haptic.DELETE_ACTION}</div>
      <div data-testid="long-press">{haptic.LONG_PRESS}</div>
      <button
        data-testid="vibrate-10"
        onClick={() => haptic.vibrate(10)}
      >Vibrate 10ms</button>
      <button
        data-testid="vibrate-pattern"
        onClick={() => haptic.vibrate([10, 50, 10])}
      >Vibrate Pattern</button>
    </div>
  );
}

describe('Haptic Feedback Integration', () => {
  beforeEach(() => {
    // Reset matchMedia to not prefer reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('exposes named patterns with correct values', () => {
    // Add vibrate support
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });

    render(<HapticDisplay />);

    expect(screen.getByTestId('button-press').textContent).toBe('10');
    expect(screen.getByTestId('delete-action').textContent).toBe('20');
    expect(screen.getByTestId('long-press').textContent).toBe('50');
  });

  it('isSupported is true when navigator.vibrate exists', () => {
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });

    render(<HapticDisplay />);

    expect(screen.getByTestId('supported').textContent).toBe('true');
  });

  it('vibrate calls navigator.vibrate when supported', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: vibrateMock,
    });

    render(<HapticDisplay />);

    act(() => { screen.getByTestId('vibrate-10').click(); });

    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it('vibrate with pattern calls navigator.vibrate with array', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: vibrateMock,
    });

    render(<HapticDisplay />);

    act(() => { screen.getByTestId('vibrate-pattern').click(); });

    expect(vibrateMock).toHaveBeenCalledWith([10, 50, 10]);
  });

  it('vibrate is no-op when reduced motion is preferred', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: vibrateMock,
    });

    // Override matchMedia to prefer reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<HapticDisplay />);

    expect(screen.getByTestId('reduced-motion').textContent).toBe('true');

    act(() => { screen.getByTestId('vibrate-10').click(); });

    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it('vibrate is no-op when navigator.vibrate not available', () => {
    // Remove vibrate
    const orig = (navigator as any).vibrate;
    delete (navigator as any).vibrate;

    render(<HapticDisplay />);

    expect(screen.getByTestId('supported').textContent).toBe('false');

    // Clicking should not throw
    act(() => { screen.getByTestId('vibrate-10').click(); });

    // Restore
    if (orig) {
      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        configurable: true,
        value: orig,
      });
    }
  });
});
