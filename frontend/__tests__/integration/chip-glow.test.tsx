/**
 * Integration test: Chip glow system
 *
 * Tests from lib/chipGlow.ts:
 * - glowClassName maps each ChipGlowType to correct CSS class
 * - ChipGlow type structure
 */
import { describe, it, expect } from 'vitest';
import { glowClassName, type ChipGlowType, type ChipGlow } from '@/lib/chipGlow';

describe('Chip Glow Integration', () => {
  describe('glowClassName', () => {
    it('maps swap to swap-glow', () => {
      expect(glowClassName('swap')).toBe('swap-glow');
    });

    it('maps play-now to play-now-glow', () => {
      expect(glowClassName('play-now')).toBe('play-now-glow');
    });

    it('maps play-next to play-next-glow', () => {
      expect(glowClassName('play-next')).toBe('play-next-glow');
    });

    it('maps queued to queue-glow', () => {
      expect(glowClassName('queued')).toBe('queue-glow');
    });
  });

  describe('ChipGlow type', () => {
    it('can be null', () => {
      const glow: ChipGlow = null;
      expect(glow).toBeNull();
    });

    it('holds queueIds and type', () => {
      const glow: ChipGlow = { queueIds: ['q1', 'q2'], type: 'swap' };
      expect(glow!.queueIds).toEqual(['q1', 'q2']);
      expect(glow!.type).toBe('swap');
    });
  });
});
