/**
 * Integration test: Cassette brand definitions and lookups
 *
 * Tests from lib/cassetteBrands.ts:
 * - CASSETTE_BRANDS array structure and required fields
 * - getCassetteBrand: lookup by key
 * - getCassetteBrandTint: returns tint map for a brand
 * - All 6 brands present with correct keys
 * - Unknown key returns undefined
 */
import { describe, it, expect } from 'vitest';
import {
  CASSETTE_BRANDS,
  getCassetteBrand,
  getCassetteBrandTint,
} from '@/lib/cassetteBrands';

describe('Cassette Brands Integration', () => {
  const EXPECTED_KEYS = [
    'maxell-xlii',
    'tdk-sa',
    'memorex-dbs',
    'sony-hf',
    'basf-chrome',
    'scotch-bx',
  ];

  describe('CASSETTE_BRANDS array', () => {
    it('has exactly 6 brands', () => {
      expect(CASSETTE_BRANDS).toHaveLength(6);
    });

    it('contains all expected brand keys', () => {
      const keys = CASSETTE_BRANDS.map(b => b.key);
      expect(keys).toEqual(EXPECTED_KEYS);
    });

    it('each brand has required fields', () => {
      for (const brand of CASSETTE_BRANDS) {
        expect(brand.key).toBeTruthy();
        expect(brand.name).toBeTruthy();
        expect(brand.headerLabel).toBeTruthy();
        expect(brand.accent).toMatch(/^#[0-9a-f]{6}$/i);
        expect(typeof brand.tint).toBe('object');
      }
    });

    it('each brand tint has standard CSS variables', () => {
      const requiredVars = [
        '--cassette-body',
        '--cassette-window',
        '--cassette-reel',
        '--cassette-tape',
        '--cassette-screw',
        '--cassette-border',
        '--cassette-header',
        '--cassette-glow',
      ];

      for (const brand of CASSETTE_BRANDS) {
        for (const varName of requiredVars) {
          expect(brand.tint).toHaveProperty(varName);
        }
      }
    });
  });

  describe('getCassetteBrand', () => {
    it('returns Maxell XLII by key', () => {
      const brand = getCassetteBrand('maxell-xlii');
      expect(brand).toBeDefined();
      expect(brand!.name).toBe('Maxell XLII');
      expect(brand!.headerLabel).toBe('MAXELL XLII');
    });

    it('returns TDK SA by key', () => {
      const brand = getCassetteBrand('tdk-sa');
      expect(brand).toBeDefined();
      expect(brand!.name).toBe('TDK SA');
      expect(brand!.accent).toBe('#00b8a8');
    });

    it('returns undefined for unknown key', () => {
      expect(getCassetteBrand('unknown-brand')).toBeUndefined();
    });

    it('returns each brand correctly', () => {
      for (const key of EXPECTED_KEYS) {
        const brand = getCassetteBrand(key);
        expect(brand).toBeDefined();
        expect(brand!.key).toBe(key);
      }
    });
  });

  describe('getCassetteBrandTint', () => {
    it('returns tint map for known brand', () => {
      const tint = getCassetteBrandTint('maxell-xlii');
      expect(tint).toBeDefined();
      expect(tint!['--cassette-glow']).toBe('#d4a010');
    });

    it('returns undefined for unknown brand', () => {
      expect(getCassetteBrandTint('fake-brand')).toBeUndefined();
    });

    it('Sony HF has warm orange accent in tint', () => {
      const tint = getCassetteBrandTint('sony-hf');
      expect(tint!['--cassette-glow']).toBe('#f07828');
    });
  });
});
