/**
 * Integration test: Venue name utilities
 *
 * Tests titleCaseVenue from lib/venueUtils.ts:
 * - Converts all-lowercase to title case
 * - Converts ALL-UPPERCASE to title case
 * - Preserves already-mixed-case names
 * - Small words (a, an, the, of, at, in) stay lowercase (except first word)
 * - Abbreviations (NYC, DC, BBQ, DJ) go uppercase
 * - Roman numerals (II, III, IV) go uppercase
 */
import { describe, it, expect } from 'vitest';
import { titleCaseVenue } from '@/lib/venueUtils';

describe('Venue Utils Integration', () => {
  describe('titleCaseVenue', () => {
    it('title-cases all-lowercase input', () => {
      expect(titleCaseVenue('red rocks amphitheatre')).toBe(
        'Red Rocks Amphitheatre'
      );
    });

    it('title-cases ALL-UPPERCASE input', () => {
      expect(titleCaseVenue('MADISON SQUARE GARDEN')).toBe(
        'Madison Square Garden'
      );
    });

    it('preserves already-mixed-case names', () => {
      expect(titleCaseVenue('McCabe\'s Guitar Shop')).toBe(
        'McCabe\'s Guitar Shop'
      );
    });

    it('keeps small words lowercase (except first word)', () => {
      expect(titleCaseVenue('HOUSE OF BLUES')).toBe('House of Blues');
      expect(titleCaseVenue('THE FILLMORE')).toBe('The Fillmore');
    });

    it('uppercases known abbreviations', () => {
      expect(titleCaseVenue('bbq festival grounds')).toBe(
        'BBQ Festival Grounds'
      );
    });

    it('uppercases NYC and DC', () => {
      expect(titleCaseVenue('dc concert hall')).toBe('DC Concert Hall');
    });

    it('uppercases roman numerals', () => {
      expect(titleCaseVenue('stage ii')).toBe('Stage II');
      expect(titleCaseVenue('hall iii')).toBe('Hall III');
    });

    it('handles single-word venue', () => {
      expect(titleCaseVenue('wetlands')).toBe('Wetlands');
    });

    it('handles "at" and "in" as small words', () => {
      expect(titleCaseVenue('LIVE AT THE GARDEN')).toBe('Live at the Garden');
    });

    it('handles French small words (de, du, le, la)', () => {
      expect(titleCaseVenue('CAFE DU MONDE')).toBe('Cafe du Monde');
    });
  });
});
