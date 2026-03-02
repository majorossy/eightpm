import { ComponentType } from 'react';

export type RecordingMedium =
  | 'cassette' | 'dat' | 'minidisc' | 'microcassette'
  | 'reel_to_reel' | 'cd' | 'sd_card' | 'compact_flash'
  | 'flash_recorder' | 'bandcamp' | null;

// Client-side lineage parser (mirrors backend LineageParserService for unimported tracks)
export function getMediumFromLineage(lineage?: string, source?: string): RecordingMedium {
  const text = `${lineage || ''} ${source || ''}`.toLowerCase();
  if (!text.trim()) return null;

  // Priority order matching (same as backend)
  if (/microcassette|micro[- ]?mc|micro[- ]?cassette/.test(text)) return 'microcassette';
  if (/\bcass(ette)?\b|\btape\b/.test(text) && !/\bDAT\b/i.test(`${lineage || ''} ${source || ''}`)) return 'cassette';
  if (/nakamichi/i.test(`${lineage || ''} ${source || ''}`)) return 'cassette';
  if (/\bdat\b|da-[234]\d|fostex d-5|pcm-m1|sv-[34]\d{3}|dtc-\d+/i.test(`${lineage || ''} ${source || ''}`)) return 'dat';
  if (/minidisc|\bmd\b|hi-md|\bmz-/i.test(`${lineage || ''} ${source || ''}`)) return 'minidisc';
  if (/\breel\b|revox|nagra|ampex|studer|otari/i.test(`${lineage || ''} ${source || ''}`)) return 'reel_to_reel';
  if (/cd-?r\b|\bcd>|\beac\b|exact audio copy|\bcdr\b/i.test(`${lineage || ''} ${source || ''}`)) return 'cd';
  if (/\bsd\s*card|\bsdhc|\bmicrosd/i.test(`${lineage || ''} ${source || ''}`)) return 'sd_card';
  if (/\bcf>|\bcf\s|compactflash/i.test(`${lineage || ''} ${source || ''}`)) return 'compact_flash';
  if (/\b722\b|\b744t?\b|\b788t?\b|\b833\b|dr-680|dr-100|dr-40|dr-05|dr-07|iriver|nomad|mixpre|zoom\s*h|pmd\d+|fr-2/i.test(`${lineage || ''} ${source || ''}`)) return 'flash_recorder';
  if (/bandcamp/i.test(`${lineage || ''} ${source || ''}`)) return 'bandcamp';

  return null;
}

export function getMediumLabel(medium: RecordingMedium): string {
  const labels: Record<string, string> = {
    cassette: 'Cassette',
    dat: 'DAT',
    minidisc: 'MiniDisc',
    microcassette: 'Microcassette',
    reel_to_reel: 'Reel-to-Reel',
    cd: 'CD-R',
    sd_card: 'SD Card',
    compact_flash: 'CompactFlash',
    flash_recorder: 'Digital Recorder',
    bandcamp: 'Bandcamp Download',
  };
  return medium ? labels[medium] || 'Unknown Source' : 'Unknown Source';
}

// Dynamic import map
export function getMediumIcon(medium: RecordingMedium): ComponentType<{size?: number; className?: string}> {
  // This returns a lazy reference - actual components imported in RecordingMediumIcon
  // Kept here for type convenience
  throw new Error('Use RecordingMediumIcon component instead');
}
