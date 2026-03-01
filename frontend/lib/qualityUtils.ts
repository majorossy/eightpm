import type { Song, AudioQuality } from '@/lib/types';
import { getSourceFormat } from '@/components/recording/recordingUtils';

/**
 * Human-readable label for the quality a song will play at.
 * When quality is 'high' and a Song is provided, resolves to the
 * actual source format: "FLAC 24", "FLAC 16", or generic "FLAC".
 */
export function getQualityLabel(quality: AudioQuality, song?: Song): string {
  if (quality === 'high' && song) {
    const fmt = getSourceFormat(song);
    if (fmt === 'flac24') return 'FLAC 24';
    if (fmt === 'flac16') return 'FLAC 16';
    return 'FLAC';
  }
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
