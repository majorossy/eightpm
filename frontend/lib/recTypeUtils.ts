// Recording type badge config — shared across queue chips, mobile player, etc.
// Uses badge CSS tokens from tokens.css (themed per Lot/Camp/Shore).

export interface RecTypeBadgeConfig {
  label: string;
  title: string;
  color: string;
  bg: string;
  border: string;
}

const CONFIGS: Record<string, RecTypeBadgeConfig> = {
  SBD:     { label: 'SBD', title: 'Soundboard',          color: 'var(--badge-sbd-text)',   bg: 'var(--badge-sbd-bg)',   border: 'var(--badge-sbd-border)' },
  AUD:     { label: 'AUD', title: 'Audience',             color: 'var(--badge-aud-text)',   bg: 'var(--badge-aud-bg)',   border: 'var(--badge-aud-border)' },
  MX:      { label: 'MX',  title: 'Matrix',               color: 'var(--badge-mx-text)',    bg: 'var(--badge-mx-bg)',    border: 'var(--badge-mx-border)' },
  MTX:     { label: 'MTX', title: 'Matrix',               color: 'var(--badge-mx-text)',    bg: 'var(--badge-mx-bg)',    border: 'var(--badge-mx-border)' },
  FM:      { label: 'FM',  title: 'FM Broadcast',         color: 'var(--badge-other-text)', bg: 'var(--badge-other-bg)', border: 'var(--badge-other-border)' },
  WEBCAST: { label: 'WEB', title: 'Webcast',              color: 'var(--badge-other-text)', bg: 'var(--badge-other-bg)', border: 'var(--badge-other-border)' },
};

const UNKNOWN: RecTypeBadgeConfig = {
  label: 'UNK', title: 'Unknown recording type',
  color: 'var(--badge-other-text)', bg: 'var(--badge-other-bg)', border: 'var(--badge-other-border)',
};

export function getRecTypeBadgeConfig(recordingType?: string): RecTypeBadgeConfig {
  if (!recordingType) return UNKNOWN;
  return CONFIGS[recordingType] ?? UNKNOWN;
}
