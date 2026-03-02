'use client';

import { getRecordingType } from '@/lib/lineageUtils';

const TYPE_MAP: Record<string, { label: string; title: string; cls: string }> = {
  SBD:     { label: 'SBD', title: 'Soundboard',    cls: 'rec-source-sbd' },
  AUD:     { label: 'AUD', title: 'Audience',       cls: 'rec-source-aud' },
  MX:      { label: 'MX',  title: 'Matrix',         cls: 'rec-source-mx' },
  MTX:     { label: 'MTX', title: 'Matrix',         cls: 'rec-source-mx' },
  FM:      { label: 'FM',  title: 'FM Broadcast',   cls: 'rec-source-fm' },
  WEBCAST: { label: 'WEB', title: 'Webcast',        cls: 'rec-source-web' },
};

const UNKNOWN = { label: '?', title: 'Unknown', cls: 'rec-source-unknown' };

function resolveType(type?: string, lineage?: string): string | undefined {
  if (type) return type;
  const detected = getRecordingType(lineage);
  if (detected === 'soundboard') return 'SBD';
  if (detected === 'matrix') return 'MX';
  if (detected === 'audience') return 'AUD';
  return undefined;
}

export default function RecSourceIcon({
  type,
  lineage,
  size = 28,
  className = '',
}: {
  type?: string;
  lineage?: string;
  size?: number;
  className?: string;
}) {
  const resolved = resolveType(type, lineage);
  const cfg = (resolved && TYPE_MAP[resolved]) || UNKNOWN;

  const fontSize = Math.max(8, Math.round((size / 28) * 10));
  const radius = Math.max(3, Math.round((size / 28) * 5));

  return (
    <span
      className={`rec-source-icon ${cfg.cls} ${className}`}
      title={cfg.title}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize,
      }}
    >
      <span className="rec-source-label">{cfg.label}</span>
    </span>
  );
}
