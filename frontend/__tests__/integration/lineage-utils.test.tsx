/**
 * Integration test: Lineage / recording type detection
 *
 * Tests lineageUtils functions:
 * - isSoundboard: detects "soundboard", "sbd" (case-insensitive)
 * - isMatrix: detects "matrix" (case-insensitive)
 * - getRecordingType: priority order matrix > soundboard > audience
 * - formatLineage: truncation with ellipsis, fallback for empty
 */
import { describe, it, expect } from 'vitest';
import {
  isSoundboard,
  isMatrix,
  getRecordingType,
  formatLineage,
} from '@/lib/lineageUtils';

describe('Lineage Utils Integration', () => {
  describe('isSoundboard', () => {
    it('detects "Soundboard" (case-insensitive)', () => {
      expect(isSoundboard('Soundboard > DAT')).toBe(true);
      expect(isSoundboard('SOUNDBOARD recording')).toBe(true);
      expect(isSoundboard('soundboard')).toBe(true);
    });

    it('detects "SBD" abbreviation', () => {
      expect(isSoundboard('SBD > DAT > CD')).toBe(true);
      expect(isSoundboard('sbd recording')).toBe(true);
    });

    it('returns false for non-soundboard', () => {
      expect(isSoundboard('AUD > DAT')).toBe(false);
      expect(isSoundboard('audience tape')).toBe(false);
      expect(isSoundboard(undefined)).toBe(false);
      expect(isSoundboard('')).toBe(false);
    });

    it('does not match partial words', () => {
      // "sbd" should be a word boundary match, not substring
      expect(isSoundboard('desbdify')).toBe(false);
    });
  });

  describe('isMatrix', () => {
    it('detects "matrix" (case-insensitive)', () => {
      expect(isMatrix('Matrix blend')).toBe(true);
      expect(isMatrix('MATRIX > SBD + AUD')).toBe(true);
    });

    it('returns false for non-matrix', () => {
      expect(isMatrix('SBD > DAT')).toBe(false);
      expect(isMatrix(undefined)).toBe(false);
    });
  });

  describe('getRecordingType', () => {
    it('returns null for empty/undefined', () => {
      expect(getRecordingType(undefined)).toBeNull();
      expect(getRecordingType('')).toBeNull();
    });

    it('identifies soundboard', () => {
      expect(getRecordingType('SBD > DAT > CD')).toBe('soundboard');
    });

    it('identifies matrix', () => {
      expect(getRecordingType('Matrix of SBD + AUD')).toBe('matrix');
    });

    it('identifies audience', () => {
      expect(getRecordingType('AUD > DAT > CD')).toBe('audience');
      expect(getRecordingType('audience tape')).toBe('audience');
    });

    it('matrix takes priority over soundboard', () => {
      // A matrix can contain "SBD" in the description
      expect(getRecordingType('Matrix: SBD + AUD blend')).toBe('matrix');
    });

    it('returns null for unknown lineage', () => {
      expect(getRecordingType('Unknown recording source')).toBeNull();
    });
  });

  describe('formatLineage', () => {
    it('returns fallback for empty/undefined', () => {
      expect(formatLineage(undefined)).toBe('Source not specified');
      expect(formatLineage('')).toBe('Source not specified');
      expect(formatLineage('   ')).toBe('Source not specified');
    });

    it('returns string as-is when under max length', () => {
      expect(formatLineage('SBD > DAT > CD', 50)).toBe('SBD > DAT > CD');
    });

    it('truncates with ellipsis when over max length', () => {
      const long = 'Soundboard > Digital Audio Tape > Compact Disc > FLAC encoding at 24 bit';
      const result = formatLineage(long, 30);
      expect(result.length).toBe(30);
      expect(result.endsWith('...')).toBe(true);
    });

    it('uses default max length of 50', () => {
      const long = 'a'.repeat(60);
      const result = formatLineage(long);
      expect(result.length).toBe(50);
    });

    it('trims whitespace', () => {
      expect(formatLineage('  SBD > DAT  ')).toBe('SBD > DAT');
    });
  });
});
