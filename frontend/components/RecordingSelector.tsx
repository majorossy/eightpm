'use client';

import { useState, useMemo, useEffect } from 'react';
import { Song } from '@/lib/types';
import { formatDuration } from '@/lib/api';
import VenueLink from '@/components/VenueLink';

// ============ Props ============

interface RecordingSelectorProps {
  songs: Song[];
  currentSongId: string | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onQueue: (song: Song) => void;
}

// ============ Utility Functions ============

function formatNum(n: number | null | undefined): string | null {
  if (n == null) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getSourceFormat(song: Song): 'flac24' | 'flac16' | 'mp3' | null {
  // 1. Check albumIdentifier for format hints
  if (song.albumIdentifier) {
    const id = song.albumIdentifier.toLowerCase();
    if (id.includes('.flac24') || id.includes('.24bit')) return 'flac24';
    if (id.includes('.flac16') || id.includes('.16bit')) return 'flac16';
    if (id.includes('.shn')) return 'flac16';
    if (id.includes('.mp3')) return 'mp3';
  }
  // 2. Check trackOriginalFile extension
  if (song.trackOriginalFile) {
    const file = song.trackOriginalFile.toLowerCase();
    if (file.endsWith('.flac')) return 'flac16';
    if (file.endsWith('.mp3')) return 'mp3';
    if (file.endsWith('.shn')) return 'flac16';
  }
  // 3. Check qualityUrls
  if (song.qualityUrls) {
    if (song.qualityUrls.high) return 'flac24';
    if (song.qualityUrls.medium) return 'flac16';
    if (song.qualityUrls.low) return 'mp3';
  }
  return null;
}

function parseLicenseLabel(url: string | undefined | null): string | null {
  if (!url) return null;
  // Extract from URL like https://creativecommons.org/licenses/by-nc-nd/4.0/
  const match = url.match(/\/licenses\/([^/]+)\/([^/]+)/);
  if (match) {
    return `CC ${match[1].toUpperCase()} ${match[2]}`;
  }
  return null;
}

function formatDateShort(isoDate: string | undefined | null): string | null {
  if (!isoDate) return null;
  try {
    const d = new Date(isoDate.includes('T') ? isoDate : isoDate + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  } catch {
    return null;
  }
}

function parseDateOnly(isoDatetime: string | undefined | null): string | null {
  if (!isoDatetime) return null;
  try {
    const d = new Date(isoDatetime);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  } catch {
    return null;
  }
}

// ============ Badge Components ============

function RecTypeBadge({ type }: { type: string | undefined }) {
  const cfg: Record<string, { bg: string; border: string; text: string; label: string; title: string }> = {
    SBD: { bg: 'var(--badge-sbd-bg)', border: 'var(--badge-sbd-border)', text: 'var(--badge-sbd-text)', label: 'SBD', title: 'Soundboard' },
    AUD: { bg: 'var(--badge-aud-bg)', border: 'var(--badge-aud-border)', text: 'var(--badge-aud-text)', label: 'AUD', title: 'Audience' },
    MX:  { bg: 'var(--badge-mx-bg)', border: 'var(--badge-mx-border)', text: 'var(--badge-mx-text)', label: 'MX',  title: 'Matrix' },
    MTX: { bg: 'var(--badge-mx-bg)', border: 'var(--badge-mx-border)', text: 'var(--badge-mx-text)', label: 'MTX', title: 'Matrix' },
    FM:  { bg: 'var(--badge-other-bg)', border: 'var(--badge-other-border)', text: 'var(--badge-other-text)', label: 'FM', title: 'FM Broadcast' },
    WEBCAST: { bg: 'var(--badge-other-bg)', border: 'var(--badge-other-border)', text: 'var(--badge-other-text)', label: 'WEB', title: 'Webcast' },
  };
  if (!type) return null;
  const c = cfg[type] || { bg: 'var(--badge-other-bg)', border: 'var(--badge-other-border)', text: 'var(--badge-other-text)', label: type, title: type };
  return (
    <span title={c.title} style={{
      background: c.bg, color: c.text, padding: '2px 7px', borderRadius: 4,
      fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
      border: `1px solid ${c.border}55`, lineHeight: '18px', display: 'inline-block',
    }}>{c.label}</span>
  );
}

function SourceBadge({ source }: { source: 'flac24' | 'flac16' | 'mp3' | null }) {
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

function Stars({ rating, count }: { rating: number | undefined | null; count: number | undefined | null }) {
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

function NowPlayingIndicator() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        display: 'inline-block', width: 16, height: 16,
        border: '2px solid var(--neon-pink)', borderRadius: '50%',
        borderTopColor: 'transparent',
        animation: 'spin 1s linear infinite',
      }} />
      <span style={{ color: 'var(--neon-pink)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>NOW PLAYING</span>
    </span>
  );
}

// ============ Row (label/value pair) ============

function Row({ label, value, mono, link, linkLabel }: {
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
          color: 'var(--campfire-teal)', fontSize: 12, textDecoration: 'none', textAlign: 'right',
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

function TagPills({ tags }: { tags: string | undefined | null }) {
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

function DetailSection({ title, icon, children, defaultOpen = false }: {
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

// ============ Sort Button ============

function SortBtn({ label, active, dir, onClick }: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 6,
      border: active ? '1px solid var(--neon-pink)33' : '1px solid var(--overlay-light)',
      background: active ? 'var(--overlay-medium)' : 'transparent',
      color: active ? 'var(--neon-pink)' : 'var(--text-subdued)',
      fontSize: 11, cursor: 'pointer', fontWeight: active ? 600 : 400,
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {label}{active && <span style={{ fontSize: 9 }}>{dir === 'desc' ? '↓' : '↑'}</span>}
    </button>
  );
}

// ============ SortBar ============

function SortBar({ sortBy, sortDir, viewMode, onSort, onViewChange, songCount, trackTitle }: {
  sortBy: string;
  sortDir: 'asc' | 'desc';
  viewMode: 'cards' | 'compact';
  onSort: (field: string) => void;
  onViewChange: (mode: 'cards' | 'compact') => void;
  songCount: number;
  trackTitle: string;
}) {
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: 15, color: 'var(--neon-pink)' }}>✦</span>
        <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 600, margin: 0, fontFamily: "var(--font-instrument-sans), 'Instrument Sans', sans-serif" }}>Choose Your Recording</h2>
      </div>
      <p style={{ color: 'var(--text-subdued)', fontSize: 12, margin: '2px 0 14px 23px', fontFamily: "var(--font-instrument-sans), 'Instrument Sans', sans-serif" }}>
        {songCount} recording{songCount !== 1 ? 's' : ''} of <span style={{ color: 'var(--text-dim)' }}>&ldquo;{trackTitle}&rdquo;</span>
      </p>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14, flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--text-subdued)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginRight: 2 }}>SORT</span>
          {['rating', 'downloads', 'date', 'length'].map(s => (
            <SortBtn key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} active={sortBy === s} dir={sortDir} onClick={() => onSort(s)} />
          ))}
        </div>
        <div style={{ display: 'flex', background: 'var(--overlay-subtle)', borderRadius: 7, padding: 2, border: '1px solid var(--overlay-light)' }}>
          {([{ k: 'compact' as const, i: '☰' }, { k: 'cards' as const, i: '▦' }]).map(v => (
            <button key={v.k} onClick={() => onViewChange(v.k)} style={{
              padding: '4px 11px', borderRadius: 5, border: 'none',
              background: viewMode === v.k ? 'var(--overlay-medium)' : 'transparent',
              color: viewMode === v.k ? 'var(--neon-pink)' : 'var(--text-subdued)',
              fontSize: 13, cursor: 'pointer',
            }}>{v.i}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ Compact Row ============

const GRID_COLS = '20px 72px 1fr 44px 52px 56px 58px 70px 56px 28px';
const GRID_COLS_MOBILE = '20px 72px 1fr 44px 52px 56px 70px 28px';

function CompactRow({ song, isTopRated, isSongPlaying, expanded, onToggle, onPlay, onQueue }: {
  song: Song;
  isTopRated: boolean;
  isSongPlaying: boolean;
  expanded: boolean;
  onToggle: () => void;
  onPlay: () => void;
  onQueue: () => void;
}) {
  const date = formatDateShort(song.showDate);
  const sourceFormat = getSourceFormat(song);
  const licenseLabel = parseLicenseLabel(song.archiveLicenseUrl);

  return (
    <div style={{
      borderBottom: '1px solid var(--overlay-subtle)',
      borderLeft: isSongPlaying ? '2px solid var(--neon-pink)' : '2px solid transparent',
      background: isSongPlaying ? 'var(--bg-card)' : expanded ? 'var(--bg)' : 'transparent',
      transition: 'all 0.15s',
    }}>
      {/* Summary Row */}
      <div onClick={onToggle} className="compact-row-grid" style={{
        display: 'grid',
        alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer',
      }}>
        {/* Playing */}
        <div>{isSongPlaying ? <span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid var(--neon-pink)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} /> : null}</div>
        {/* Date */}
        <span style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace" }}>{date || '—'}</span>
        {/* Venue + Location */}
        <div style={{ minWidth: 0 }}>
          <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <VenueLink venueName={song.showVenue} className="hover:text-[var(--neon-pink)] hover:underline transition-colors" truncateLength={32} />
          </div>
          <div style={{ color: 'var(--text-subdued)', fontSize: 11 }}>{song.showLocation || ''}</div>
        </div>
        {/* Rec Type */}
        <RecTypeBadge type={song.recordingType} />
        {/* Source */}
        <SourceBadge source={sourceFormat} />
        {/* Track time - hidden on mobile */}
        <span className="compact-col-time" style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace", textAlign: 'right' }}>{formatDuration(song.duration)}</span>
        {/* Taper - hidden on mobile */}
        <span className="compact-col-taper" style={{ color: 'var(--text-subdued)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.taper || '—'}</span>
        {/* Rating */}
        <div style={{ textAlign: 'right' }}>
          {song.avgRating ? (
            <span style={{ color: 'var(--neon-pink)', fontSize: 12 }}>
              {'★'.repeat(Math.round(song.avgRating))}
              <span style={{ marginLeft: 3, fontWeight: 600 }}>{song.avgRating.toFixed(1)}</span>
            </span>
          ) : <span style={{ color: 'var(--star-empty)', fontSize: 11 }}>—</span>}
        </div>
        {/* Downloads - hidden on mobile */}
        <span className="compact-col-downloads" style={{ color: 'var(--text-subdued)', fontSize: 11, textAlign: 'right' }}>{formatNum(song.downloads) || '—'}</span>
        {/* Expand chevron */}
        <span style={{
          color: 'var(--text-subdued)', fontSize: 10, textAlign: 'center',
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
        }}>▾</span>
      </div>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div style={{
          padding: '0 12px 14px',
          paddingLeft: 104,
          animation: 'fadeIn 0.15s ease',
        }} className="compact-detail-panel">
          {/* Two-column detail layout */}
          <div className="compact-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {/* Left column */}
            <div>
              {/* Recording Source */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid var(--overlay-light)' }}>
                  🎙 Recording Source
                </div>
                <Row label="Taper" value={song.taper} />
                <Row label="Source" value={song.source} mono />
                <Row label="Lineage" value={song.lineage} mono />
              </div>

              {/* Quality & Stats */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid var(--overlay-light)' }}>
                  ⭐ Quality & Stats
                </div>
                <Row label="Rating" value={song.avgRating ? `${song.avgRating.toFixed(1)} / 5` : null} />
                <Row label="Reviews" value={(song.numReviews ?? 0) > 0 ? song.numReviews : null} />
                <Row label="Total DLs" value={formatNum(song.downloads)} />
                <Row label="DLs / Week" value={song.downloadsWeek ?? null} />
                <Row label="DLs / Month" value={song.downloadsMonth ?? null} />
                {song.showRuntime && <Row label="Show Runtime" value={song.showRuntime} mono />}
              </div>
            </div>

            {/* Right column */}
            <div>
              {/* Track Metadata */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid var(--overlay-light)' }}>
                  💿 Track Metadata
                </div>
                <Row label="Album" value={song.trackAlbum} />
                <Row label="Original File" value={song.trackOriginalFile} mono />
                {song.showSubject && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '4px 0', borderBottom: '1px solid var(--overlay-subtle)', gap: 16,
                  }}>
                    <span style={{ color: 'var(--text-subdued)', fontSize: 12, flexShrink: 0, minWidth: 90 }}>Tags</span>
                    <TagPills tags={song.showSubject} />
                  </div>
                )}
                {song.notes && (
                  <div style={{ marginTop: 6, padding: '6px 8px', background: 'var(--overlay-subtle)', borderRadius: 6, border: '1px solid var(--overlay-subtle)' }}>
                    <div style={{ color: 'var(--text-subdued)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 3 }}>NOTES</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: 11, lineHeight: 1.5 }}>{song.notes}</div>
                  </div>
                )}
              </div>

              {/* Archive.org */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid var(--overlay-light)' }}>
                  🏛 Archive.org
                </div>
                <Row label="Identifier" value={song.albumIdentifier} mono />
                <Row label="Added" value={parseDateOnly(song.showAddedDate)} />
                <Row label="Public Date" value={parseDateOnly(song.showPublicDate)} />
                <Row label="Streamable" value={song.isStreamable === false ? 'No' : (song.isStreamable === true ? 'Yes' : null)} />
                <Row label="Access" value={song.accessRestriction || 'Public'} />
                {licenseLabel && <Row label="License" value={licenseLabel} link={song.archiveLicenseUrl || undefined} linkLabel={licenseLabel} />}
                {song.archiveDetailUrl && <Row label="View" value="Open on Archive.org →" link={song.archiveDetailUrl} linkLabel="Open on Archive.org →" />}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4, maxWidth: 300 }}>
            <button onClick={(e) => { e.stopPropagation(); onPlay(); }} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px', background: 'var(--neon-pink)', color: 'var(--bg)', border: 'none',
              borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              <span>▶</span> Play
            </button>
            <button onClick={(e) => { e.stopPropagation(); onQueue(); }} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px', background: 'transparent', color: 'var(--text-dim)',
              border: '1px solid var(--overlay-medium)', borderRadius: 7, fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
            }}>
              <span>+</span> Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Recording Card ============

function RecordingCard({ song, topRatedId, isSongPlaying, expanded, onToggleExpand, onPlay, onQueue }: {
  song: Song;
  topRatedId: string | null;
  isSongPlaying: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onPlay: () => void;
  onQueue: () => void;
}) {
  const date = formatDateShort(song.showDate);
  const sourceFormat = getSourceFormat(song);
  const isTop = song.id === topRatedId;
  const licenseLabel = parseLicenseLabel(song.archiveLicenseUrl);

  return (
    <div style={{
      background: isSongPlaying ? 'var(--bg-card)' : 'var(--bg)',
      border: isSongPlaying ? '1px solid var(--neon-pink)44' : '1px solid var(--overlay-light)',
      borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
      position: 'relative',
    }}>
      {/* TIER 1: Always Visible */}
      <div style={{ padding: '14px 14px 10px', cursor: 'pointer' }} onClick={onPlay}>
        {/* Top row: date, badges, playing state */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--neon-pink)', fontSize: 12, fontWeight: 600, fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace" }}>{date || '—'}</span>
          <RecTypeBadge type={song.recordingType} />
          <SourceBadge source={sourceFormat} />
          {isTop && (
            <span style={{
              background: 'var(--neon-pink)', color: 'var(--bg)', padding: '1px 6px', borderRadius: 4,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
            }}>★ TOP</span>
          )}
          <span style={{ flex: 1 }} />
          {isSongPlaying && <NowPlayingIndicator />}
        </div>

        {/* Venue + Location */}
        <h3 style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600, margin: '0 0 2px', lineHeight: 1.3 }}>
          <VenueLink venueName={song.showVenue} className="hover:text-[var(--neon-pink)] hover:underline transition-colors" truncateLength={32} />
        </h3>
        <div style={{ color: 'var(--text-subdued)', fontSize: 12, marginBottom: 10 }}>{song.showLocation || ''}</div>

        {/* Key stats strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          padding: '8px 0 4px', borderTop: '1px solid var(--overlay-light)',
        }}>
          {/* Track length */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--text-subdued)', fontSize: 9, letterSpacing: '0.08em', marginBottom: 2 }}>TRACK</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14, fontWeight: 600, fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace" }}>{formatDuration(song.duration)}</div>
          </div>
          {/* Show runtime */}
          {song.showRuntime && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-subdued)', fontSize: 9, letterSpacing: '0.08em', marginBottom: 2 }}>SHOW</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 13, fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace" }}>{song.showRuntime}</div>
            </div>
          )}
          <div style={{ width: 1, height: 24, background: 'var(--overlay-subtle)' }} />
          {/* Rating */}
          <div>
            <div style={{ color: 'var(--text-subdued)', fontSize: 9, letterSpacing: '0.08em', marginBottom: 2 }}>RATING</div>
            <Stars rating={song.avgRating} count={song.numReviews} />
          </div>
          <span style={{ flex: 1 }} />
          {/* Downloads mini */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-subdued)', fontSize: 9, letterSpacing: '0.08em', marginBottom: 2 }}>DOWNLOADS</div>
            <span style={{ color: 'var(--text-dim)', fontSize: 13, fontWeight: 500 }}>{formatNum(song.downloads) || '—'}</span>
          </div>
        </div>

        {/* Taper line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span style={{ fontSize: 11 }}>{song.recordingType === 'SBD' ? '🎛' : '🎤'}</span>
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
            {song.taper || <span style={{ color: 'var(--text-subdued)', fontStyle: 'italic' }}>Unknown taper</span>}
          </span>
        </div>
      </div>

      {/* EXPAND TOGGLE */}
      <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        width: '100%', padding: '7px', background: expanded ? 'var(--overlay-subtle)' : 'transparent',
        border: 'none', borderTop: '1px solid var(--overlay-light)', color: 'var(--text-subdued)',
        fontSize: 10, cursor: 'pointer', letterSpacing: '0.06em', fontWeight: 600,
      }}>
        {expanded ? 'HIDE DETAILS' : 'ALL DETAILS'}
        <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
      </button>

      {/* TIER 2: Expanded */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', animation: 'fadeIn 0.2s ease' }}>
          {/* Quality & Stats */}
          <DetailSection title="Quality & Stats" icon="⭐" defaultOpen={true}>
            <Row label="Rating" value={song.avgRating ? `${song.avgRating.toFixed(1)} / 5` : null} />
            <Row label="Reviews" value={(song.numReviews ?? 0) > 0 ? song.numReviews : null} />
            <Row label="Total DLs" value={formatNum(song.downloads)} />
            <Row label="DLs / Week" value={song.downloadsWeek ?? null} />
            <Row label="DLs / Month" value={song.downloadsMonth ?? null} />
          </DetailSection>

          {/* Recording Source */}
          <DetailSection title="Recording Source" icon="🎙" defaultOpen={true}>
            <Row label="Taper" value={song.taper} />
            <Row label="Source" value={song.source} mono />
            <Row label="Lineage" value={song.lineage} mono />
          </DetailSection>

          {/* Track Metadata */}
          <DetailSection title="Track Metadata" icon="💿">
            <Row label="Album" value={song.trackAlbum} />
            <Row label="Original File" value={song.trackOriginalFile} mono />
            {song.showSubject && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '4px 0', borderBottom: '1px solid var(--overlay-subtle)', gap: 16,
              }}>
                <span style={{ color: 'var(--text-subdued)', fontSize: 12, flexShrink: 0, minWidth: 90 }}>Tags</span>
                <TagPills tags={song.showSubject} />
              </div>
            )}
            {song.notes && (
              <div style={{ marginTop: 6, padding: '8px 10px', background: 'var(--overlay-subtle)', borderRadius: 6, border: '1px solid var(--overlay-subtle)' }}>
                <div style={{ color: 'var(--text-subdued)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>NOTES</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.5 }}>{song.notes}</div>
              </div>
            )}
          </DetailSection>

          {/* Archive.org */}
          <DetailSection title="Archive.org" icon="🏛">
            <Row label="Identifier" value={song.albumIdentifier} mono />
            <Row label="Added" value={parseDateOnly(song.showAddedDate)} />
            <Row label="Public Date" value={parseDateOnly(song.showPublicDate)} />
            <Row label="Streamable" value={song.isStreamable === false ? 'No' : (song.isStreamable === true ? 'Yes' : null)} />
            <Row label="Access" value={song.accessRestriction || 'Public'} />
            {licenseLabel && <Row label="License" value={licenseLabel} link={song.archiveLicenseUrl || undefined} linkLabel={licenseLabel} />}
            {song.archiveDetailUrl && <Row label="View" value="Open on Archive.org →" link={song.archiveDetailUrl} linkLabel="Open on Archive.org →" />}
          </DetailSection>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={(e) => { e.stopPropagation(); onPlay(); }} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', background: 'var(--neon-pink)', color: 'var(--bg)', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              <span>▶</span> Play
            </button>
            <button onClick={(e) => { e.stopPropagation(); onQueue(); }} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', background: 'transparent', color: 'var(--text-dim)',
              border: '1px solid var(--overlay-medium)', borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}>
              <span>+</span> Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Main RecordingSelector ============

const VIEW_MODE_KEY = 'recording-selector-view-mode';

// Constants for max-height calculation
const COMPACT_ROW_HEIGHT = 42;    // px per compact row (measured from padding:8px + content)
const COMPACT_MAX_ROWS = 8;       // show 8 rows before scrolling
const CARD_MAX_HEIGHT = 400;      // px — roughly 2 collapsed cards

export default function RecordingSelector({ songs, currentSongId, isPlaying, onPlay, onQueue }: RecordingSelectorProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('compact');
  const [sortBy, setSortBy] = useState('rating');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Load view mode from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_KEY);
      if (stored === 'cards' || stored === 'compact') {
        setViewMode(stored);
      }
    } catch {}
  }, []);

  const handleViewChange = (mode: 'cards' | 'compact') => {
    setViewMode(mode);
    try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch {}
  };

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Top-rated song id
  const topRatedId = useMemo(() => {
    let best: Song | null = null;
    for (const s of songs) {
      if (s.avgRating != null && (!best || (s.avgRating > (best.avgRating ?? 0)))) {
        best = s;
      }
    }
    return best?.id ?? null;
  }, [songs]);

  // Sorted songs
  const sorted = useMemo(() => {
    return [...songs].sort((a, b) => {
      const m = sortDir === 'desc' ? -1 : 1;
      const get = (s: Song): number => {
        if (sortBy === 'rating') return s.avgRating || 0;
        if (sortBy === 'downloads') return s.downloads || 0;
        if (sortBy === 'date') {
          if (!s.showDate) return 0;
          return new Date(s.showDate + 'T00:00:00').getTime() || 0;
        }
        if (sortBy === 'length') return s.duration || 0;
        return 0;
      };
      return (get(a) - get(b)) * m;
    });
  }, [songs, sortBy, sortDir]);

  // Track title (from the first song's trackTitle)
  const trackTitle = songs[0]?.trackTitle || songs[0]?.title || 'Unknown Track';

  if (songs.length === 0) return null;

  return (
    <div style={{
      fontFamily: "var(--font-instrument-sans), 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <style>{`
        .compact-row-grid {
          grid-template-columns: ${GRID_COLS};
        }
        @media (max-width: 767px) {
          .compact-row-grid {
            grid-template-columns: ${GRID_COLS_MOBILE};
          }
          .compact-col-taper,
          .compact-col-downloads {
            display: none;
          }
          .compact-detail-panel {
            padding-left: 12px !important;
          }
          .compact-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .recording-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .recording-scroll::-webkit-scrollbar-thumb {
          background: var(--text-subdued);
          border-radius: 3px;
        }
        .recording-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <SortBar
        sortBy={sortBy}
        sortDir={sortDir}
        viewMode={viewMode}
        onSort={handleSort}
        onViewChange={handleViewChange}
        songCount={songs.length}
        trackTitle={trackTitle}
      />

      {viewMode === 'cards' ? (
        <div className="recording-scroll" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 10,
          maxHeight: CARD_MAX_HEIGHT,
          overflowY: 'auto'
        }}>
          {sorted.map(song => (
            <RecordingCard
              key={song.id}
              song={song}
              topRatedId={topRatedId}
              isSongPlaying={song.id === currentSongId && isPlaying}
              expanded={expanded.has(song.id)}
              onToggleExpand={() => toggleExpand(song.id)}
              onPlay={() => onPlay(song)}
              onQueue={() => onQueue(song)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          background: '#15120d',
          borderRadius: 10,
          border: '1px solid #ffffff08',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Column headers - pinned */}
          <div className="compact-row-grid" style={{
            display: 'grid',
            gap: 8,
            padding: '6px 12px',
            borderBottom: '1px solid #ffffff0a',
            color: '#4a4030',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            flexShrink: 0,
            background: '#15120d'
          }}>
            <span></span><span>DATE</span><span>VENUE</span><span>TYPE</span><span>SRC</span>
            <span className="compact-col-time" style={{ textAlign: 'right' }}>TIME</span>
            <span className="compact-col-taper">TAPER</span>
            <span style={{ textAlign: 'right' }}>RATING</span>
            <span className="compact-col-downloads" style={{ textAlign: 'right' }}>DLS</span>
            <span></span>
          </div>
          {/* Scrollable rows */}
          <div className="recording-scroll" style={{
            maxHeight: COMPACT_ROW_HEIGHT * COMPACT_MAX_ROWS,
            overflowY: 'auto'
          }}>
            {sorted.map(song => (
              <CompactRow
                key={song.id}
                song={song}
                isTopRated={song.id === topRatedId}
                isSongPlaying={song.id === currentSongId && isPlaying}
                expanded={expanded.has(song.id)}
                onToggle={() => toggleExpand(song.id)}
                onPlay={() => onPlay(song)}
                onQueue={() => onQueue(song)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
