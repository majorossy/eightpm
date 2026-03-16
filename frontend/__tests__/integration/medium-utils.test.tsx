/**
 * Integration test: Recording medium detection
 *
 * Tests getMediumFromLineage and getMediumLabel from lib/mediumUtils.ts:
 * - Cassette detection (tape, cassette, Nakamichi)
 * - DAT detection (DAT, DA-series, Fostex, PCM, SV, DTC)
 * - MiniDisc detection (minidisc, md, MZ-)
 * - Microcassette detection (takes priority over cassette)
 * - Reel-to-reel detection (reel, Revox, Nagra, Ampex, Studer, Otari)
 * - CD-R detection (CD-R, CDR, EAC)
 * - SD Card, CompactFlash, Flash recorder, Bandcamp
 * - Null for unknown lineage
 * - getMediumLabel returns human-readable labels
 */
import { describe, it, expect } from 'vitest';
import { getMediumFromLineage, getMediumLabel } from '@/lib/mediumUtils';

describe('Medium Utils Integration', () => {
  describe('getMediumFromLineage', () => {
    it('returns null for empty/undefined lineage', () => {
      expect(getMediumFromLineage()).toBeNull();
      expect(getMediumFromLineage('')).toBeNull();
      expect(getMediumFromLineage(undefined, undefined)).toBeNull();
    });

    it('detects cassette from "tape"', () => {
      expect(getMediumFromLineage('AUD > tape > CDR')).toBe('cassette');
    });

    it('detects cassette from "cassette"', () => {
      expect(getMediumFromLineage('Cassette master > FLAC')).toBe('cassette');
    });

    it('detects cassette from Nakamichi brand', () => {
      expect(getMediumFromLineage('Nakamichi DR-1 > CDR')).toBe('cassette');
    });

    it('detects DAT from "dat" keyword', () => {
      expect(getMediumFromLineage('SBD > DAT > CDR')).toBe('dat');
    });

    it('detects DAT from model numbers (DA-series)', () => {
      expect(getMediumFromLineage('DA-20 > CDR')).toBe('dat');
    });

    it('detects DAT from Fostex D-5', () => {
      expect(getMediumFromLineage('Fostex D-5 > SBD')).toBe('dat');
    });

    it('detects DAT from PCM-M1', () => {
      expect(getMediumFromLineage('PCM-M1 > CDR')).toBe('dat');
    });

    it('detects minidisc from "minidisc"', () => {
      expect(getMediumFromLineage('MiniDisc > CDR')).toBe('minidisc');
    });

    it('detects minidisc from MZ- model prefix', () => {
      expect(getMediumFromLineage('MZ-R50 > WAV')).toBe('minidisc');
    });

    it('detects microcassette (priority over cassette)', () => {
      expect(getMediumFromLineage('Microcassette > DAT')).toBe('microcassette');
    });

    it('detects reel-to-reel from "reel"', () => {
      expect(getMediumFromLineage('Reel master > FLAC')).toBe('reel_to_reel');
    });

    it('detects reel-to-reel from brand names', () => {
      expect(getMediumFromLineage('Revox A77 > FLAC')).toBe('reel_to_reel');
      expect(getMediumFromLineage('Nagra IV-S')).toBe('reel_to_reel');
    });

    it('detects CD-R', () => {
      expect(getMediumFromLineage('SBD > CD-R')).toBe('cd');
      expect(getMediumFromLineage('EAC > FLAC')).toBe('cd');
    });

    it('detects SD card', () => {
      expect(getMediumFromLineage('SD Card > WAV')).toBe('sd_card');
      expect(getMediumFromLineage('microSD > FLAC')).toBe('sd_card');
    });

    it('detects compact flash', () => {
      expect(getMediumFromLineage('CF> WAV > FLAC')).toBe('compact_flash');
    });

    it('detects flash recorder from model numbers', () => {
      expect(getMediumFromLineage('Sound Devices 722 > WAV')).toBe('flash_recorder');
      expect(getMediumFromLineage('Zoom H4n > WAV')).toBe('flash_recorder');
      expect(getMediumFromLineage('DR-40 > WAV')).toBe('flash_recorder');
    });

    it('detects bandcamp', () => {
      expect(getMediumFromLineage('Bandcamp download > FLAC')).toBe('bandcamp');
    });

    it('returns null for unknown lineage', () => {
      expect(getMediumFromLineage('SBD > FLAC')).toBeNull();
      expect(getMediumFromLineage('Matrix blend')).toBeNull();
    });

    it('checks source parameter as well', () => {
      expect(getMediumFromLineage(undefined, 'Recorded on DAT')).toBe('dat');
    });
  });

  describe('getMediumLabel', () => {
    it('returns correct labels for each medium', () => {
      expect(getMediumLabel('cassette')).toBe('Cassette');
      expect(getMediumLabel('dat')).toBe('DAT');
      expect(getMediumLabel('minidisc')).toBe('MiniDisc');
      expect(getMediumLabel('microcassette')).toBe('Microcassette');
      expect(getMediumLabel('reel_to_reel')).toBe('Reel-to-Reel');
      expect(getMediumLabel('cd')).toBe('CD-R');
      expect(getMediumLabel('sd_card')).toBe('SD Card');
      expect(getMediumLabel('compact_flash')).toBe('CompactFlash');
      expect(getMediumLabel('flash_recorder')).toBe('Digital Recorder');
      expect(getMediumLabel('bandcamp')).toBe('Bandcamp Download');
    });

    it('returns "Unknown Source" for null', () => {
      expect(getMediumLabel(null)).toBe('Unknown Source');
    });
  });
});
