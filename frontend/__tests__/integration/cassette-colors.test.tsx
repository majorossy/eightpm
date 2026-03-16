/**
 * Integration test: Cassette color system
 *
 * Tests from lib/cassetteColors.ts:
 * - CASSETTE_PRESETS: 12 color presets (5 theme-aware + 7 fixed)
 * - getCassetteTint: returns full tint map for preset index
 * - tintFromHex: generates tint from arbitrary hex
 * - getSwatchColor: returns CSS-ready color string
 * - resolveCassetteTint: priority resolution (brand > hex > preset)
 * - getCassetteColorMode: determines which color source is active
 */
import { describe, it, expect } from 'vitest';
import {
  CASSETTE_PRESETS,
  CASSETTE_COLOR_COUNT,
  getCassetteTint,
  tintFromHex,
  getSwatchColor,
  resolveCassetteTint,
  getCassetteColorMode,
} from '@/lib/cassetteColors';

describe('Cassette Colors Integration', () => {
  describe('CASSETTE_PRESETS', () => {
    it('has 12 presets', () => {
      expect(CASSETTE_PRESETS).toHaveLength(12);
      expect(CASSETTE_COLOR_COUNT).toBe(12);
    });

    it('first 5 are theme-aware', () => {
      for (let i = 0; i < 5; i++) {
        expect(CASSETTE_PRESETS[i].source).toBe('theme');
        expect(CASSETTE_PRESETS[i].value).toMatch(/^--/);
      }
    });

    it('last 7 are fixed hex colors', () => {
      for (let i = 5; i < 12; i++) {
        expect(CASSETTE_PRESETS[i].source).toBe('fixed');
        expect(CASSETTE_PRESETS[i].value).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('each preset has a name', () => {
      for (const preset of CASSETTE_PRESETS) {
        expect(preset.name).toBeTruthy();
      }
    });
  });

  describe('getCassetteTint', () => {
    it('returns tint map with all CSS variables', () => {
      const tint = getCassetteTint(0);
      expect(tint['--cassette-body']).toBeDefined();
      expect(tint['--cassette-glow']).toBeDefined();
      expect(tint['--cassette-header']).toBeDefined();
      expect(tint['--cassette-border']).toBeDefined();
    });

    it('wraps around when index exceeds preset count', () => {
      const tint0 = getCassetteTint(0);
      const tint12 = getCassetteTint(12);
      expect(tint0).toEqual(tint12);
    });

    it('theme-aware presets use var() references', () => {
      const tint = getCassetteTint(0); // Coral (--secondary)
      expect(tint['--cassette-glow']).toContain('var(--secondary)');
    });

    it('fixed presets use hex values', () => {
      const tint = getCassetteTint(5); // Hot Pink (#e84393)
      expect(tint['--cassette-glow']).toBe('#e84393');
    });
  });

  describe('tintFromHex', () => {
    it('generates tint from hex value', () => {
      const tint = tintFromHex('#ff6600');
      expect(tint['--cassette-glow']).toBe('#ff6600');
      expect(tint['--cassette-body']).toContain('#ff6600');
      expect(tint['--cassette-body']).toContain('color-mix');
    });

    it('includes all required CSS variables', () => {
      const tint = tintFromHex('#123456');
      const requiredKeys = [
        '--cassette-body', '--cassette-window', '--cassette-reel',
        '--cassette-tape', '--cassette-screw', '--cassette-border',
        '--cassette-header', '--cassette-glow',
      ];
      for (const key of requiredKeys) {
        expect(tint).toHaveProperty(key);
      }
    });
  });

  describe('getSwatchColor', () => {
    it('returns var() for theme presets', () => {
      const color = getSwatchColor(0); // Coral
      expect(color).toBe('var(--secondary)');
    });

    it('returns hex for fixed presets', () => {
      const color = getSwatchColor(5); // Hot Pink
      expect(color).toBe('#e84393');
    });

    it('wraps around', () => {
      expect(getSwatchColor(0)).toBe(getSwatchColor(12));
    });
  });

  describe('resolveCassetteTint', () => {
    it('prefers brand over hex and index', () => {
      const tint = resolveCassetteTint({
        colorBrand: 'maxell-xlii',
        colorHex: '#ff0000',
        colorIndex: 3,
      });
      // Brand tint should have the Maxell glow
      expect(tint['--cassette-glow']).toBe('#d4a010');
    });

    it('falls back to hex when brand is unknown', () => {
      const tint = resolveCassetteTint({
        colorBrand: 'unknown-brand',
        colorHex: '#ff6600',
        colorIndex: 0,
      });
      expect(tint['--cassette-glow']).toBe('#ff6600');
    });

    it('falls back to preset index when no brand or hex', () => {
      const tint = resolveCassetteTint({ colorIndex: 5 });
      expect(tint['--cassette-glow']).toBe('#e84393'); // Hot Pink
    });

    it('defaults to index 0 when nothing specified', () => {
      const tint = resolveCassetteTint({});
      expect(tint).toEqual(getCassetteTint(0));
    });
  });

  describe('getCassetteColorMode', () => {
    it('returns brand when colorBrand set', () => {
      expect(getCassetteColorMode({ colorBrand: 'tdk-sa' })).toBe('brand');
    });

    it('returns hex when colorHex set (no brand)', () => {
      expect(getCassetteColorMode({ colorHex: '#ff0000' })).toBe('hex');
    });

    it('returns preset when neither set', () => {
      expect(getCassetteColorMode({})).toBe('preset');
    });

    it('brand takes priority over hex', () => {
      expect(getCassetteColorMode({ colorBrand: 'tdk-sa', colorHex: '#ff0000' })).toBe('brand');
    });
  });
});
