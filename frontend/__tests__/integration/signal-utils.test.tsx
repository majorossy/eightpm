/**
 * Integration test: Signal strength computation
 *
 * Tests computeSignalInfo from lib/signalUtils.ts:
 * - Offline returns level 0 with "Offline" label
 * - No Network API (Safari) returns level 1 "Connected"
 * - 2g/slow-2g returns level 0 (Weak)
 * - 3g returns level 1 (Fair)
 * - 4g thresholds: <2Mbps=1, >=2Mbps=2, >=5Mbps=3
 * - Buffer boost: +1 level when bufferedAhead >= 30s
 * - Buffer boost caps at level 3
 * - Color mapping: weak=coral, fair=gold, good/strong=teal
 * - Tooltip formatting
 */
import { describe, it, expect } from 'vitest';
import { computeSignalInfo, SignalLevel } from '@/lib/signalUtils';

describe('Signal Utils Integration', () => {
  it('offline returns level 0 with Offline label', () => {
    const info = computeSignalInfo(null, null, 0, false);
    expect(info.level).toBe(0);
    expect(info.label).toBe('Offline');
    expect(info.isOffline).toBe(true);
    expect(info.color).toBe('var(--secondary)');
  });

  it('no Network API (Safari/Firefox) returns level 1 Connected', () => {
    const info = computeSignalInfo(null, null, 0, true);
    expect(info.level).toBe(1);
    expect(info.label).toBe('Connected');
    expect(info.isOffline).toBe(false);
    expect(info.tooltip).toBe('Connected');
  });

  it('slow-2g returns level 0 (Weak)', () => {
    const info = computeSignalInfo('slow-2g', 0.1, 0, true);
    expect(info.level).toBe(0);
    expect(info.label).toBe('Weak signal');
  });

  it('2g returns level 0 (Weak)', () => {
    const info = computeSignalInfo('2g', 0.2, 0, true);
    expect(info.level).toBe(0);
    expect(info.label).toBe('Weak signal');
  });

  it('3g returns level 1 (Fair)', () => {
    const info = computeSignalInfo('3g', 1.5, 0, true);
    expect(info.level).toBe(1);
    expect(info.label).toBe('Fair signal');
    expect(info.color).toBe('var(--quinary)'); // gold for fair
  });

  it('4g < 2 Mbps returns level 1', () => {
    const info = computeSignalInfo('4g', 1.5, 0, true);
    expect(info.level).toBe(1);
  });

  it('4g >= 2 Mbps returns level 2 (Good)', () => {
    const info = computeSignalInfo('4g', 3.0, 0, true);
    expect(info.level).toBe(2);
    expect(info.label).toBe('Good signal');
    expect(info.color).toBe('var(--tertiary)'); // teal for good
  });

  it('4g >= 5 Mbps returns level 3 (Strong)', () => {
    const info = computeSignalInfo('4g', 10.0, 0, true);
    expect(info.level).toBe(3);
    expect(info.label).toBe('Strong signal');
    expect(info.color).toBe('var(--tertiary)'); // teal for strong
  });

  it('buffer boost adds +1 level when bufferedAhead >= 30s', () => {
    // 3g normally = level 1, with 30s buffer = level 2
    const info = computeSignalInfo('3g', 1.5, 35, true);
    expect(info.level).toBe(2);
  });

  it('buffer boost caps at level 3', () => {
    // 4g 5Mbps = level 3 already, buffer boost should not exceed 3
    const info = computeSignalInfo('4g', 10.0, 60, true);
    expect(info.level).toBe(3);
  });

  it('buffer boost does not apply when bufferedAhead < 30s', () => {
    const info = computeSignalInfo('3g', 1.5, 20, true);
    expect(info.level).toBe(1); // No boost
  });

  it('tooltip includes network type and speed', () => {
    const info = computeSignalInfo('4g', 25.5, 0, true);
    expect(info.tooltip).toContain('4G');
    expect(info.tooltip).toContain('25.5 Mbps');
  });

  it('tooltip for 3g with speed', () => {
    const info = computeSignalInfo('3g', 1.2, 0, true);
    expect(info.tooltip).toBe('3G \u00b7 1.2 Mbps');
  });

  it('weak signal uses coral color (--secondary)', () => {
    const info = computeSignalInfo('2g', 0.1, 0, true);
    expect(info.color).toBe('var(--secondary)');
  });

  it('fair signal uses gold color (--quinary)', () => {
    const info = computeSignalInfo('3g', 1.0, 0, true);
    expect(info.color).toBe('var(--quinary)');
  });

  it('good/strong signal uses teal color (--tertiary)', () => {
    const good = computeSignalInfo('4g', 3.0, 0, true);
    const strong = computeSignalInfo('4g', 10.0, 0, true);
    expect(good.color).toBe('var(--tertiary)');
    expect(strong.color).toBe('var(--tertiary)');
  });
});
