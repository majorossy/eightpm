'use client';

import React from 'react';
import { Song } from '@/lib/types';
import { formatDuration } from '@/lib/api';
import VenueLink from '@/components/VenueLink';
import { formatNum, getSourceFormat, parseLicenseLabel, formatDateShort, parseDateOnly } from './recordingUtils';
import { RecTypeBadge, SourceBadge, Row, TagPills } from './RecordingBadges';

interface CompactRowProps {
  song: Song;
  isTopRated: boolean;
  isSongPlaying: boolean;
  expanded: boolean;
  onToggle: () => void;
  onPlay: () => void;
  onQueue: () => void;
}

export const CompactRow = React.memo(function CompactRow({
  song, isTopRated, isSongPlaying, expanded, onToggle, onPlay, onQueue,
}: CompactRowProps) {
  const date = formatDateShort(song.showDate);
  const sourceFormat = getSourceFormat(song);
  const licenseLabel = parseLicenseLabel(song.archiveLicenseUrl);

  return (
    <div style={{
      borderBottom: '1px solid var(--overlay-subtle)',
      borderLeft: isSongPlaying ? '2px solid var(--secondary)' : '2px solid transparent',
      background: isSongPlaying ? 'var(--bg-card)' : expanded ? 'var(--bg)' : 'transparent',
      transition: 'all 0.15s',
    }}>
      {/* Summary Row */}
      <div onClick={onToggle} className="compact-row-grid" style={{
        display: 'grid',
        alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer',
      }}>
        {/* Playing */}
        <div>{isSongPlaying ? <span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid var(--secondary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} /> : null}</div>
        {/* Date */}
        <span style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace", textAlign: date ? undefined : 'center' }}>{date || '—'}</span>
        {/* Venue + Location */}
        <div style={{ minWidth: 0 }}>
          <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <VenueLink venueName={song.showVenue} className="hover:text-[var(--secondary)] hover:underline transition-colors" truncateLength={32} />
          </div>
          <div style={{ color: 'var(--text-subdued)', fontSize: 11 }}>{song.showLocation || ''}</div>
        </div>
        {/* Rec Type */}
        <div><RecTypeBadge type={song.recordingType} /></div>
        {/* Source */}
        <div><SourceBadge source={sourceFormat} /></div>
        {/* Track time - hidden on mobile */}
        <span className="compact-col-time" style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace", textAlign: 'right' }}>{formatDuration(song.duration)}</span>
        {/* Taper - hidden on mobile */}
        <span className="compact-col-taper" style={{ color: 'var(--text-subdued)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: song.taper ? undefined : 'center' }}>{song.taper || '—'}</span>
        {/* Rating */}
        <div style={{ textAlign: song.avgRating ? 'right' : 'center' }}>
          {song.avgRating ? (
            <span style={{ color: 'var(--secondary)', fontSize: 12 }}>
              {'★'.repeat(Math.round(song.avgRating))}
              <span style={{ marginLeft: 3, fontWeight: 600 }}>{song.avgRating.toFixed(1)}</span>
            </span>
          ) : <span style={{ color: 'var(--star-empty)', fontSize: 11 }}>—</span>}
        </div>
        {/* Downloads - hidden on mobile */}
        <span className="compact-col-downloads" style={{ color: 'var(--text-subdued)', fontSize: 11, textAlign: formatNum(song.downloads) ? 'right' : 'center' }}>{formatNum(song.downloads) || '—'}</span>
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
              padding: '8px', background: 'var(--secondary)', color: 'var(--bg)', border: 'none',
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
});
