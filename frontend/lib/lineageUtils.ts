/**
 * Lineage Utilities
 *
 * Functions for detecting recording types (soundboard, matrix, audience)
 * and formatting lineage text for display in the UI.
 */

/**
 * Check if a lineage string indicates a soundboard recording
 */
export function isSoundboard(lineage?: string): boolean {
  if (!lineage) return false;
  return /\bsoundboard\b/i.test(lineage) || /\bsbd\b/i.test(lineage);
}

/**
 * Check if a lineage string indicates a matrix recording
 */
export function isMatrix(lineage?: string): boolean {
  if (!lineage) return false;
  return /\bmatrix\b/i.test(lineage);
}

/**
 * Determine the recording type from lineage
 * Priority: matrix > soundboard > audience
 */
export function getRecordingType(lineage?: string): 'soundboard' | 'matrix' | 'audience' | null {
  if (!lineage) return null;

  // Check matrix first (higher priority)
  if (isMatrix(lineage)) return 'matrix';

  // Then check soundboard
  if (isSoundboard(lineage)) return 'soundboard';

  // Check for audience indicators
  if (/\baud(?:ience)?\b/i.test(lineage)) return 'audience';

  return null;
}

/**
 * Format lineage text for display
 * Truncates intelligently and provides fallback for missing data
 */
export function formatLineage(lineage?: string, maxLength: number = 50): string {
  if (!lineage || lineage.trim() === '') {
    return 'Source not specified';
  }

  const trimmed = lineage.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  // Truncate intelligently - try to preserve key information
  return trimmed.substring(0, maxLength - 3) + '...';
}

interface RecordingBadgeConfig {
  show: boolean;
  text: string;
  bgColor: string;
  textColor: string;
}

/**
 * Badge config lookup by recording type code
 */
const BADGE_CONFIG: Record<string, RecordingBadgeConfig> = {
  SBD: { show: true, text: 'SBD', bgColor: '#d4a060', textColor: '#1c1a17' },
  MX: { show: true, text: 'MX', bgColor: '#e8a050', textColor: '#1c1a17' },
  FM: { show: true, text: 'FM', bgColor: '#8a8478', textColor: '#1c1a17' },
  WEBCAST: { show: true, text: 'WEB', bgColor: '#8a8478', textColor: '#1c1a17' },
};

/**
 * Get badge configuration for recording type
 * Uses backend recordingType field if available, falls back to lineage parsing
 * Returns null if no badge should be shown (AUD, UNKNOWN, or undetected)
 */
export function getRecordingBadge(lineage?: string, recordingType?: string): RecordingBadgeConfig | null {
  // Prefer backend-computed recordingType when available
  if (recordingType && recordingType !== 'AUD' && recordingType !== 'UNKNOWN') {
    return BADGE_CONFIG[recordingType] || null;
  }

  // Fall back to lineage-based detection
  const type = getRecordingType(lineage);

  if (!type || type === 'audience') {
    return null;
  }

  if (type === 'soundboard') {
    return BADGE_CONFIG.SBD;
  }

  if (type === 'matrix') {
    return BADGE_CONFIG.MX;
  }

  return null;
}
