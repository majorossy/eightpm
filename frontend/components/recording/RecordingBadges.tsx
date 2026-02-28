'use client';

import { useState } from 'react';

// ============ Badge Components ============

export function RecTypeBadge({ type }: { type: string | undefined }) {
  const cfg: Record<string, { bg: string; border: string; text: string; label: string; title: string }> = {
    SBD: { bg: 'var(--badge-sbd-bg)', border: 'var(--badge-sbd-border)', text: 'var(--badge-sbd-text)', label: 'SBD', title: 'Soundboard' },
    AUD: { bg: 'var(--badge-aud-bg)', border: 'var(--badge-aud-border)', text: 'var(--badge-aud-text)', label: 'AUD', title: 'Audience' },
    MX:  { bg: 'var(--badge-mx-bg)', border: 'var(--badge-mx-border)', text: 'var(--badge-mx-text)', label: 'MX',  title: 'Matrix' },
    MTX: { bg: 'var(--badge-mx-bg)', border: 'var(--badge-mx-border)', text: 'var(--badge-mx-text)', label: 'MTX', title: 'Matrix' },
    FM:  { bg: 'var(--badge-other-bg)', border: 'var(--badge-other-border)', text: 'var(--badge-other-text)', label: 'FM', title: 'FM Broadcast' },
    WEBCAST: { bg: 'var(--badge-other-bg)', border: 'var(--badge-other-border)', text: 'var(--badge-other-text)', label: 'WEB', title: 'Webcast' },
    UNKNOWN: { bg: 'var(--badge-other-bg)', border: 'var(--badge-other-border)', text: 'var(--badge-other-text)', label: 'UNK', title: 'Unknown recording type' },
  };
  const resolved = type || 'UNKNOWN';
  const c = cfg[resolved] || { bg: 'var(--badge-other-bg)', border: 'var(--badge-other-border)', text: 'var(--badge-other-text)', label: 'UNK', title: 'Unknown recording type' };
  return (
    <span title={c.title} style={{
      background: c.bg, color: c.text, padding: '2px 7px', borderRadius: 4,
      fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
      border: `1px solid ${c.border}55`, lineHeight: '18px', display: 'inline-block',
    }}>{c.label}</span>
  );
}

export function SourceBadge({ source }: { source: 'flac24' | 'flac16' | 'mp3' | null }) {
  if (!source) return null;
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    flac24: { bg: 'var(--badge-flac24-bg)', text: 'var(--badge-flac24-text)', label: 'FLAC 24' },
    flac16: { bg: 'var(--badge-flac16-bg)', text: 'var(--badge-flac16-text)', label: 'FLAC 16' },
    mp3:    { bg: 'var(--badge-mp3-bg)', text: 'var(--badge-mp3-text)', label: 'MP3' },
  };
  const c = cfg[source];
  if (!c) return null;
  return (
    <span style={{
      background: c.bg, color: c.text, padding: '2px 7px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      border: `1px solid ${c.text}30`, lineHeight: '18px', display: 'inline-block',
    }}>{c.label}</span>
  );
}

// ============ Stars ============

export function Stars({ rating, count }: { rating: number | undefined | null; count: number | undefined | null }) {
  if (rating == null) return <span style={{ color: 'var(--text-subdued)', fontSize: 12, fontStyle: 'italic' }}>No ratings</span>;
  const pct = (rating / 5) * 100;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ position: 'relative', display: 'inline-block', width: 70, height: 14 }}>
        <span style={{ color: 'var(--star-empty)', fontSize: 14, letterSpacing: 1, position: 'absolute' }}>★★★★★</span>
        <span style={{ color: 'var(--star-filled)', fontSize: 14, letterSpacing: 1, position: 'absolute', overflow: 'hidden', width: `${pct}%`, whiteSpace: 'nowrap' }}>★★★★★</span>
      </span>
      <span style={{ color: 'var(--star-filled)', fontSize: 13, fontWeight: 600 }}>{rating.toFixed(1)}</span>
      {(count ?? 0) > 0 && <span style={{ color: 'var(--text-subdued)', fontSize: 11 }}>({count})</span>}
    </span>
  );
}

// ============ Now Playing Indicator ============

export function NowPlayingIndicator() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        display: 'inline-block', width: 16, height: 16,
        border: '2px solid var(--secondary)', borderRadius: '50%',
        borderTopColor: 'transparent',
        animation: 'spin 1s linear infinite',
      }} />
      <span style={{ color: 'var(--secondary)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>NOW PLAYING</span>
    </span>
  );
}

// ============ Row (label/value pair) ============

export function Row({ label, value, mono, link, linkLabel }: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  link?: string;
  linkLabel?: string;
}) {
  if (value == null && !link) return null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '4px 0', borderBottom: '1px solid var(--overlay-subtle)', gap: 16,
    }}>
      <span style={{ color: 'var(--text-subdued)', fontSize: 12, flexShrink: 0, minWidth: 90 }}>{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{
          color: 'var(--tertiary)', fontSize: 12, textDecoration: 'none', textAlign: 'right',
          wordBreak: 'break-all', maxWidth: '65%',
        }}>{linkLabel || String(value) || link}</a>
      ) : (
        <span style={{
          color: 'var(--text-dim)', textAlign: 'right', wordBreak: 'break-word',
          maxWidth: '65%',
          fontFamily: mono ? "var(--font-jetbrains-mono), 'JetBrains Mono', monospace" : 'inherit',
          fontSize: mono ? 11 : 12,
        }}>{String(value)}</span>
      )}
    </div>
  );
}

// ============ TagPills ============

export function TagPills({ tags }: { tags: string | undefined | null }) {
  if (!tags) return null;
  const items = tags.split(/[;,]/).map(t => t.trim()).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end', maxWidth: '65%' }}>
      {items.map((t, i) => (
        <span key={i} style={{
          background: 'var(--overlay-light)', color: 'var(--text-dim)', padding: '1px 8px',
          borderRadius: 10, fontSize: 11, border: '1px solid var(--overlay-light)', whiteSpace: 'nowrap',
        }}>{t}</span>
      ))}
    </div>
  );
}

// ============ DetailSection (collapsible, for card view) ============

export function DetailSection({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (children == null) return null;

  return (
    <div style={{ marginBottom: 2 }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} style={{
        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
        padding: '8px 0', background: 'none', border: 'none', borderBottom: '1px solid var(--overlay-light)',
        cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: 11 }}>{icon}</span>
        <span style={{
          color: 'var(--text-dim)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const, flex: 1,
        }}>{title}</span>
        <span style={{
          color: 'var(--text-subdued)', fontSize: 10, transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
        }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '4px 0 8px 0', animation: 'fadeIn 0.15s ease' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ============ SortableHeader ============

export function SortableHeader({ label, field, sortBy, sortDir, onSort, className, style }: {
  label: string;
  field: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const active = sortBy === field;
  return (
    <span
      className={`sortable-header ${className || ''}`}
      onClick={() => onSort(field)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        color: active ? 'var(--secondary)' : undefined,
        transition: 'color 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        ...style,
      }}
    >
      {label}{active && <span style={{ fontSize: 8, lineHeight: 1 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
    </span>
  );
}
