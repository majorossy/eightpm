import type { Song, AudioQuality } from '@/lib/types';

/** Human-readable label for a quality tier */
export function getQualityLabel(quality: AudioQuality): string {
  switch (quality) {
    case 'high': return 'FLAC';
    case 'medium': return '320k';
    case 'low': return '128k';
  }
}

/** Determine the actual quality a song will play at given user preference */
export function getEffectiveQuality(song: Song, preferred: AudioQuality): AudioQuality {
  if (!song.qualityUrls) return preferred;
  if (song.qualityUrls[preferred]) return preferred;
  if (song.qualityUrls.medium) return 'medium';
  if (song.qualityUrls.high) return 'high';
  if (song.qualityUrls.low) return 'low';
  return preferred;
}
