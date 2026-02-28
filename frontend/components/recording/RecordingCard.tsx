'use client';

import React from 'react';
import { Song } from '@/lib/types';
import { formatDuration } from '@/lib/api';
import VenueLink from '@/components/VenueLink';
import { formatNum, getSourceFormat, parseLicenseLabel, formatDateShort, parseDateOnly } from './recordingUtils';
import { RecTypeBadge, SourceBadge, Stars, NowPlayingIndicator, Row, TagPills, DetailSection } from './RecordingBadges';

interface RecordingCardProps {
  song: Song;
  topRatedId: string | null;
  isSongPlaying: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onPlay: () => void;
  onQueue: () => void;
}

export const RecordingCard = React.memo(function RecordingCard({
  song, topRatedId, isSongPlaying, expanded, onToggleExpand, onPlay, onQueue,
}: RecordingCardProps) {
  const date = formatDateShort(song.showDate);
  const sourceFormat = getSourceFormat(song);
  const isTop = song.id === topRatedId;
  const licenseLabel = parseLicenseLabel(song.archiveLicenseUrl);

  return (
    <div style={{
      background: isSongPlaying ? 'var(--bg-card)' : 'var(--bg)',
      border: isSongPlaying ? '1px solid var(--secondary)44' : '1px solid var(--overlay-light)',
      borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
      position: 'relative',
    }}>
      {/* TIER 1: Always Visible */}
      <div style={{ padding: '14px 14px 10px', cursor: 'pointer' }} onClick={onPlay}>
        {/* Top row: date, badges, playing state */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--secondary)', fontSize: 12, fontWeight: 600, fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace" }}>{date || '—'}</span>
          <RecTypeBadge type={song.recordingType} />
          <SourceBadge source={sourceFormat} />
          {isTop && (
            <span style={{
              background: 'var(--secondary)', color: 'var(--bg)', padding: '1px 6px', borderRadius: 4,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
            }}>★ TOP</span>
          )}
          <span style={{ flex: 1 }} />
          {isSongPlaying && <NowPlayingIndicator />}
        </div>

        {/* Venue + Location */}
        <h3 style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600, margin: '0 0 2px', lineHeight: 1.3 }}>
          <VenueLink venueName={song.showVenue} className="hover:text-[var(--secondary)] hover:underline transition-colors" truncateLength={32} />
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
              padding: '10px', background: 'var(--secondary)', color: 'var(--bg)', border: 'none',
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
});
