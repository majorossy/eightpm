// Signal strength calculation for streaming quality indicator.
// Maps Network Information API data + buffer health → visual signal level.

export type SignalLevel = 0 | 1 | 2 | 3;

export interface SignalInfo {
  level: SignalLevel;
  color: string;         // CSS variable name (e.g. "var(--tertiary)")
  label: string;         // accessible label ("Strong", "Good", "Fair", "Weak")
  tooltip: string;       // hover text ("4G · 25.5 Mbps")
  isOffline: boolean;
}

/**
 * Compute signal strength from network conditions and buffer health.
 *
 * Thresholds:
 *   Level 3 (Strong): 4g + ≥5 Mbps
 *   Level 2 (Good):   4g + ≥2 Mbps
 *   Level 1 (Fair):   3g, or 4g < 2 Mbps
 *   Level 0 (Weak):   2g / slow-2g
 *   Offline:          !navigator.onLine
 *   No API (Safari):  online but no data → level 1, muted
 *
 * Buffer boost: if bufferedAhead ≥ 30s, bump level by 1 (max 3).
 */
export function computeSignalInfo(
  networkType: string | null,
  downlinkMbps: number | null,
  bufferedAhead: number,
  isOnline: boolean,
): SignalInfo {
  // Offline
  if (!isOnline) {
    return {
      level: 0,
      color: 'var(--secondary)',
      label: 'Offline',
      tooltip: 'No internet connection',
      isOffline: true,
    };
  }

  // No Network Information API (Safari, Firefox)
  if (networkType === null && downlinkMbps === null) {
    return {
      level: 1,
      color: 'var(--text-secondary)',
      label: 'Connected',
      tooltip: 'Connected',
      isOffline: false,
    };
  }

  // Compute base level from network type + downlink
  let level: SignalLevel = 1;
  const type = networkType?.toLowerCase() ?? '';
  const mbps = downlinkMbps ?? 0;

  if (type === 'slow-2g' || type === '2g') {
    level = 0;
  } else if (type === '3g') {
    level = 1;
  } else if (type === '4g') {
    if (mbps >= 5) level = 3;
    else if (mbps >= 2) level = 2;
    else level = 1;
  }

  // Buffer boost: healthy buffer compensates for momentary dips
  if (bufferedAhead >= 30 && level < 3) {
    level = (level + 1) as SignalLevel;
  }

  // Color: weak = coral, fair = gold, good/strong = teal
  const color = level === 0
    ? 'var(--secondary)'
    : level === 1
      ? 'var(--quinary)'
      : 'var(--tertiary)';

  const labels: Record<SignalLevel, string> = {
    0: 'Weak signal',
    1: 'Fair signal',
    2: 'Good signal',
    3: 'Strong signal',
  };

  // Build tooltip from available data
  const parts: string[] = [];
  if (networkType) parts.push(networkType.toUpperCase());
  if (downlinkMbps !== null) parts.push(`${downlinkMbps} Mbps`);
  const tooltip = parts.length > 0 ? parts.join(' \u00b7 ') : 'Connected';

  return {
    level,
    color,
    label: labels[level],
    tooltip,
    isOffline: false,
  };
}
