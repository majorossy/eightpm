/**
 * Integration test: Duration formatting utilities
 *
 * Tests formatDuration and formatDurationDisplay from lib/formatDuration.ts:
 * - ISO 8601 format (PT12M34S) for Schema.org
 * - Display format (12:34) for UI
 * - Edge cases: 0, null, undefined, negative, exact minutes, large values
 */
import { describe, it, expect } from 'vitest';
import { formatDuration, formatDurationDisplay } from '@/lib/formatDuration';

describe('Format Duration Integration', () => {
  describe('formatDuration (ISO 8601)', () => {
    it('formats standard duration', () => {
      expect(formatDuration(754)).toBe('PT12M34S');
    });

    it('formats exact minutes', () => {
      expect(formatDuration(300)).toBe('PT5M0S');
    });

    it('formats seconds only', () => {
      expect(formatDuration(45)).toBe('PT0M45S');
    });

    it('formats large durations', () => {
      expect(formatDuration(3661)).toBe('PT61M1S');
    });

    it('returns PT0S for 0', () => {
      expect(formatDuration(0)).toBe('PT0S');
    });

    it('returns PT0S for null', () => {
      expect(formatDuration(null)).toBe('PT0S');
    });

    it('returns PT0S for undefined', () => {
      expect(formatDuration(undefined)).toBe('PT0S');
    });

    it('returns PT0S for negative', () => {
      expect(formatDuration(-10)).toBe('PT0S');
    });
  });

  describe('formatDurationDisplay (human-readable)', () => {
    it('formats standard duration', () => {
      expect(formatDurationDisplay(754)).toBe('12:34');
    });

    it('formats exact minutes', () => {
      expect(formatDurationDisplay(300)).toBe('5:00');
    });

    it('pads seconds to 2 digits', () => {
      expect(formatDurationDisplay(65)).toBe('1:05');
    });

    it('formats seconds only (under 1 minute)', () => {
      expect(formatDurationDisplay(45)).toBe('0:45');
    });

    it('formats large durations (over 1 hour)', () => {
      expect(formatDurationDisplay(3661)).toBe('61:01');
    });

    it('returns 0:00 for 0', () => {
      expect(formatDurationDisplay(0)).toBe('0:00');
    });

    it('returns 0:00 for null', () => {
      expect(formatDurationDisplay(null)).toBe('0:00');
    });

    it('returns 0:00 for undefined', () => {
      expect(formatDurationDisplay(undefined)).toBe('0:00');
    });

    it('returns 0:00 for negative', () => {
      expect(formatDurationDisplay(-10)).toBe('0:00');
    });

    it('handles single-digit seconds with padding', () => {
      expect(formatDurationDisplay(61)).toBe('1:01');
      expect(formatDurationDisplay(3600)).toBe('60:00');
    });
  });
});
