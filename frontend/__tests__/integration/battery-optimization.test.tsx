/**
 * Integration test: Battery optimization hook
 *
 * Tests useBatteryOptimization from hooks/useBatteryOptimization.ts:
 * - Default state (no Battery API): charging=true, lowBattery=false
 * - reducedMotion from prefers-reduced-motion
 * - Low battery (< 20%) + not charging = isLowBattery + reducedMotion
 * - Charging device: not low battery even at low level
 * - Battery level exposed as percentage
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBatteryOptimization } from '@/hooks/useBatteryOptimization';

// Helpers for mocking matchMedia
function mockMatchMedia(reducedMotion: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  const mql = {
    matches: reducedMotion,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn((_, handler) => listeners.push(handler)),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return { mql, listeners };
}

// Helper to create a mock BatteryManager
function createMockBattery(level: number, charging: boolean) {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    level, // 0-1
    charging,
    chargingTime: charging ? 3600 : Infinity,
    dischargingTime: charging ? Infinity : 7200,
    addEventListener: vi.fn((type: string, handler: () => void) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(handler);
    }),
    removeEventListener: vi.fn(),
    _listeners: listeners,
    // Simulate changing battery state
    _update(newLevel: number, newCharging: boolean) {
      this.level = newLevel;
      this.charging = newCharging;
      listeners['levelchange']?.forEach(fn => fn());
      listeners['chargingchange']?.forEach(fn => fn());
    },
  };
}

describe('Battery Optimization Integration', () => {
  let originalNav: any;

  beforeEach(() => {
    originalNav = { ...navigator };
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to charging=true, lowBattery=false when no Battery API', () => {
    // Ensure getBattery is not available
    Object.defineProperty(navigator, 'getBattery', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useBatteryOptimization());
    expect(result.current.isCharging).toBe(true);
    expect(result.current.isLowBattery).toBe(false);
    expect(result.current.batteryLevel).toBeNull();
  });

  it('detects prefers-reduced-motion', () => {
    mockMatchMedia(true);
    Object.defineProperty(navigator, 'getBattery', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useBatteryOptimization());
    expect(result.current.reducedMotion).toBe(true);
  });

  it('reducedMotion is false when motion not reduced and battery OK', () => {
    mockMatchMedia(false);
    Object.defineProperty(navigator, 'getBattery', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useBatteryOptimization());
    expect(result.current.reducedMotion).toBe(false);
  });

  it('detects low battery (< 20%) on discharge', async () => {
    const mockBattery = createMockBattery(0.15, false);
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve(mockBattery),
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useBatteryOptimization());

    await waitFor(() => {
      expect(result.current.batteryLevel).toBe(15);
    });

    expect(result.current.isLowBattery).toBe(true);
    expect(result.current.isCharging).toBe(false);
    expect(result.current.reducedMotion).toBe(true); // low battery triggers reduced motion
  });

  it('not low battery when charging even at low level', async () => {
    const mockBattery = createMockBattery(0.10, true);
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve(mockBattery),
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useBatteryOptimization());

    await waitFor(() => {
      expect(result.current.batteryLevel).toBe(10);
    });

    expect(result.current.isLowBattery).toBe(false);
    expect(result.current.isCharging).toBe(true);
  });

  it('reports battery level as percentage', async () => {
    const mockBattery = createMockBattery(0.73, true);
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve(mockBattery),
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useBatteryOptimization());

    await waitFor(() => {
      expect(result.current.batteryLevel).toBe(73);
    });
  });

  it('handles getBattery rejection gracefully', async () => {
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.reject(new Error('Not supported')),
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useBatteryOptimization());

    // Should fall back to safe defaults
    await waitFor(() => {
      expect(result.current.isCharging).toBe(true);
      expect(result.current.isLowBattery).toBe(false);
    });
  });
});
