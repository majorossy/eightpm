/**
 * Integration test: Venue database and location parsing
 *
 * Tests from lib/venues.ts:
 * - getVenueDetails: alias-based lookup with geocoordinates
 * - extractCity: parses city from location string
 * - extractState: parses state from location string
 * - extractCountry: parses country, defaults to US
 * - VENUE_DATABASE: structure validation for key venues
 */
import { describe, it, expect } from 'vitest';
import {
  getVenueDetails,
  extractCity,
  extractState,
  extractCountry,
  VENUE_DATABASE,
} from '@/lib/venues';

describe('Venues Integration', () => {
  describe('VENUE_DATABASE', () => {
    it('contains Red Rocks', () => {
      expect(VENUE_DATABASE['red-rocks']).toBeDefined();
      expect(VENUE_DATABASE['red-rocks'].name).toBe('Red Rocks Amphitheatre');
      expect(VENUE_DATABASE['red-rocks'].city).toBe('Morrison');
      expect(VENUE_DATABASE['red-rocks'].state).toBe('CO');
    });

    it('contains Madison Square Garden', () => {
      expect(VENUE_DATABASE['msg']).toBeDefined();
      expect(VENUE_DATABASE['msg'].name).toBe('Madison Square Garden');
    });

    it('contains Barton Hall', () => {
      expect(VENUE_DATABASE['barton-hall']).toBeDefined();
      expect(VENUE_DATABASE['barton-hall'].city).toBe('Ithaca');
    });

    it('each venue has geocoordinates', () => {
      for (const [key, venue] of Object.entries(VENUE_DATABASE)) {
        expect(typeof venue.lat).toBe('number');
        expect(typeof venue.lon).toBe('number');
        expect(venue.aliases.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getVenueDetails', () => {
    it('finds Red Rocks by alias', () => {
      const venue = getVenueDetails('Red Rocks Amphitheatre');
      expect(venue).not.toBeNull();
      expect(venue!.name).toBe('Red Rocks Amphitheatre');
      expect(venue!.lat).toBeCloseTo(39.665, 1);
    });

    it('finds MSG by partial alias', () => {
      const venue = getVenueDetails('Madison Square Garden');
      expect(venue).not.toBeNull();
      expect(venue!.name).toBe('Madison Square Garden');
    });

    it('is case-insensitive', () => {
      const venue = getVenueDetails('red rocks');
      expect(venue).not.toBeNull();
      expect(venue!.name).toBe('Red Rocks Amphitheatre');
    });

    it('returns null for unknown venue', () => {
      expect(getVenueDetails('Some Random Venue')).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(getVenueDetails(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(getVenueDetails('')).toBeNull();
    });

    it('finds Barton Hall by "cornell" alias', () => {
      const venue = getVenueDetails('Cornell University');
      expect(venue).not.toBeNull();
      expect(venue!.name).toContain('Barton Hall');
    });

    it('finds Beacon Theatre', () => {
      const venue = getVenueDetails('Beacon Theatre');
      expect(venue).not.toBeNull();
      expect(venue!.city).toBe('New York');
    });
  });

  describe('extractCity', () => {
    it('extracts city from "City, ST"', () => {
      expect(extractCity('Ithaca, NY')).toBe('Ithaca');
    });

    it('extracts city from "City, ST, USA"', () => {
      expect(extractCity('San Francisco, CA, USA')).toBe('San Francisco');
    });

    it('returns empty for undefined', () => {
      expect(extractCity(undefined)).toBe('');
    });

    it('returns trimmed city', () => {
      expect(extractCity('  Morrison , CO')).toBe('Morrison');
    });
  });

  describe('extractState', () => {
    it('extracts state from "City, ST"', () => {
      expect(extractState('Ithaca, NY')).toBe('NY');
    });

    it('extracts state from "City, ST, USA"', () => {
      expect(extractState('Morrison, CO, USA')).toBe('CO');
    });

    it('returns empty for undefined', () => {
      expect(extractState(undefined)).toBe('');
    });
  });

  describe('extractCountry', () => {
    it('extracts country from "City, ST, USA"', () => {
      expect(extractCountry('Morrison, CO, USA')).toBe('US');
    });

    it('defaults to US for "City, ST" format', () => {
      expect(extractCountry('Ithaca, NY')).toBe('US');
    });

    it('returns non-US country', () => {
      expect(extractCountry('London, UK, England')).toBe('England');
    });

    it('defaults to US for undefined', () => {
      expect(extractCountry(undefined)).toBe('US');
    });
  });
});
