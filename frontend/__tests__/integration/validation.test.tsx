/**
 * Integration test: Input validation utilities
 *
 * Tests validation functions from lib/validation.ts:
 * - validateSearchQuery: empty, too long, valid
 * - validateEmail: empty, invalid format, too long, valid
 * - validateUid: empty, invalid characters, too long, valid
 * - validateSlug: empty, invalid characters, valid
 * - validateYear: NaN, out of range, valid
 * - validatePageSize: NaN, out of range, valid
 * - validateHexColor: invalid format, valid
 * - truncate: under limit, at limit, over limit
 * - clampNumericInput: NaN, below min, above max, within range
 */
import { describe, it, expect } from 'vitest';
import {
  validateSearchQuery,
  validateEmail,
  validateUid,
  validateSlug,
  validateYear,
  validatePageSize,
  validateHexColor,
  validateName,
  validateMessage,
  validateVenue,
  truncate,
  clampNumericInput,
  VALIDATION_LIMITS,
} from '@/lib/validation';

describe('Validation Utilities Integration', () => {
  describe('validateSearchQuery', () => {
    it('rejects empty string', () => {
      expect(validateSearchQuery('')).toBeDefined();
      expect(validateSearchQuery('   ')).toBeDefined();
    });

    it('rejects string over 200 chars', () => {
      expect(validateSearchQuery('a'.repeat(201))).toBeDefined();
    });

    it('accepts valid query', () => {
      expect(validateSearchQuery('Railroad Earth')).toBeUndefined();
      expect(validateSearchQuery('a'.repeat(200))).toBeUndefined();
    });
  });

  describe('validateEmail', () => {
    it('rejects empty', () => {
      expect(validateEmail('')).toBeDefined();
    });

    it('rejects invalid format', () => {
      expect(validateEmail('notanemail')).toBeDefined();
      expect(validateEmail('missing@tld')).toBeDefined();
      expect(validateEmail('@no-local.com')).toBeDefined();
    });

    it('rejects too long (>254 chars)', () => {
      expect(validateEmail('a'.repeat(250) + '@b.com')).toBeDefined();
    });

    it('accepts valid emails', () => {
      expect(validateEmail('user@example.com')).toBeUndefined();
      expect(validateEmail('test+tag@domain.co.uk')).toBeUndefined();
    });
  });

  describe('validateUid', () => {
    it('rejects empty', () => {
      expect(validateUid('')).toBeDefined();
    });

    it('rejects invalid characters', () => {
      expect(validateUid('has spaces')).toBeDefined();
      expect(validateUid('<script>alert(1)</script>')).toBeDefined();
    });

    it('rejects over 100 chars', () => {
      expect(validateUid('a'.repeat(101))).toBeDefined();
    });

    it('accepts valid UIDs', () => {
      expect(validateUid('abc-123_def')).toBeUndefined();
      expect(validateUid('base64:encoded+value/ok=')).toBeUndefined();
    });
  });

  describe('validateSlug', () => {
    it('rejects empty', () => {
      expect(validateSlug('')).toBeDefined();
    });

    it('rejects invalid characters', () => {
      expect(validateSlug('has spaces')).toBeDefined();
      expect(validateSlug('special!chars')).toBeDefined();
    });

    it('accepts valid slugs', () => {
      expect(validateSlug('railroad-earth')).toBeUndefined();
      expect(validateSlug('grateful_dead')).toBeUndefined();
      expect(validateSlug('moe')).toBeUndefined();
    });
  });

  describe('validateYear', () => {
    it('rejects NaN', () => {
      expect(validateYear('notanumber')).toBeDefined();
    });

    it('rejects out of range', () => {
      expect(validateYear(1899)).toBeDefined();
      expect(validateYear(2101)).toBeDefined();
    });

    it('accepts valid years', () => {
      expect(validateYear(1977)).toBeUndefined();
      expect(validateYear('2024')).toBeUndefined();
      expect(validateYear(1900)).toBeUndefined();
      expect(validateYear(2100)).toBeUndefined();
    });
  });

  describe('validatePageSize', () => {
    it('rejects NaN', () => {
      expect(validatePageSize('abc')).toBeDefined();
    });

    it('rejects out of range', () => {
      expect(validatePageSize(0)).toBeDefined();
      expect(validatePageSize(101)).toBeDefined();
    });

    it('accepts valid page sizes', () => {
      expect(validatePageSize(1)).toBeUndefined();
      expect(validatePageSize(50)).toBeUndefined();
      expect(validatePageSize(100)).toBeUndefined();
    });
  });

  describe('validateHexColor', () => {
    it('rejects invalid format', () => {
      expect(validateHexColor('red')).toBeDefined();
      expect(validateHexColor('#FFF')).toBeDefined(); // Must be 6 digits
      expect(validateHexColor('#GGGGGG')).toBeDefined();
    });

    it('accepts valid hex colors', () => {
      expect(validateHexColor('#FF0000')).toBeUndefined();
      expect(validateHexColor('#c75a5a')).toBeUndefined();
      expect(validateHexColor('#000000')).toBeUndefined();
    });
  });

  describe('validateName', () => {
    it('rejects empty and too short', () => {
      expect(validateName('')).toBeDefined();
      expect(validateName('A')).toBeDefined(); // Min 2
    });

    it('rejects too long', () => {
      expect(validateName('a'.repeat(101))).toBeDefined();
    });

    it('accepts valid names', () => {
      expect(validateName('Jo')).toBeUndefined();
      expect(validateName('Railroad Earth Fan')).toBeUndefined();
    });
  });

  describe('validateMessage', () => {
    it('rejects empty and too short', () => {
      expect(validateMessage('')).toBeDefined();
      expect(validateMessage('Short')).toBeDefined(); // Min 10
    });

    it('rejects too long', () => {
      expect(validateMessage('a'.repeat(5001))).toBeDefined();
    });

    it('accepts valid messages', () => {
      expect(validateMessage('This is a valid message')).toBeUndefined();
    });
  });

  describe('validateVenue', () => {
    it('rejects too long', () => {
      expect(validateVenue('a'.repeat(201))).toBeDefined();
    });

    it('accepts valid venues', () => {
      expect(validateVenue('Red Rocks Amphitheatre')).toBeUndefined();
      expect(validateVenue('')).toBeUndefined(); // Empty is OK for venue
    });
  });

  describe('truncate', () => {
    it('returns string as-is when under limit', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('returns string as-is when at limit', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('truncates with ellipsis when over limit', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });
  });

  describe('clampNumericInput', () => {
    it('returns default for NaN', () => {
      expect(clampNumericInput('abc', 1, 100, 50)).toBe(50);
    });

    it('clamps below min', () => {
      expect(clampNumericInput('-5', 1, 100, 50)).toBe(1);
    });

    it('clamps above max', () => {
      expect(clampNumericInput('200', 1, 100, 50)).toBe(100);
    });

    it('returns parsed value within range', () => {
      expect(clampNumericInput('42', 1, 100, 50)).toBe(42);
    });
  });

  describe('VALIDATION_LIMITS constants', () => {
    it('has expected search limits', () => {
      expect(VALIDATION_LIMITS.SEARCH_QUERY_MAX).toBe(200);
    });

    it('has expected minidisc limits', () => {
      expect(VALIDATION_LIMITS.MINIDISC_NAME_MAX).toBe(100);
      expect(VALIDATION_LIMITS.MINIDISC_DESCRIPTION_MAX).toBe(500);
    });

    it('has expected year range', () => {
      expect(VALIDATION_LIMITS.YEAR_MIN).toBe(1900);
      expect(VALIDATION_LIMITS.YEAR_MAX).toBe(2100);
    });
  });
});
