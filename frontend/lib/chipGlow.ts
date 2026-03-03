// Unified chip glow system — maps queue actions to visual feedback on chips/rows.
// Three action types, each using its own semantic color token.

export type ChipGlowType = 'swap' | 'play-now' | 'play-next' | 'queued';

export type ChipGlow = { queueIds: string[]; type: ChipGlowType } | null;

const CLASS_MAP: Record<ChipGlowType, string> = {
  'swap': 'swap-glow',
  'play-now': 'play-now-glow',
  'play-next': 'play-next-glow',
  'queued': 'queue-glow',
};

export function glowClassName(type: ChipGlowType): string {
  return CLASS_MAP[type];
}
