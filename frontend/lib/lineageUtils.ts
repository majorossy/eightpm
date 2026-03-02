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
