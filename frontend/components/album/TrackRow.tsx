'use client';

import React, { useState, useMemo } from 'react';
import { Track, Song, formatDuration } from '@/lib/api';
import { useQueue } from '@/context/QueueContext';
import { Waveform } from '@/components/AudioVisualizations';
import { getBestVersion } from '@/lib/queueTypes';
import { formatDateShort, getSourceFormat, formatNum, parseLicenseLabel, parseDateOnly } from '@/components/recording/recordingUtils';
import { RecTypeBadge, SourceBadge, Row, TagPills } from '@/components/recording/RecordingBadges';

interface TrackRowProps {
  track: Track;
  displayIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlay: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  waveform?: number[];
}

function getSourceLabel(song: Song): string {
  const format = getSourceFormat(song);
  if (format === 'flac24') return 'FLAC 24';
  if (format === 'flac16') return 'FLAC 16';
  if (format === 'mp3') return 'MP3';
  return '';
}

// ── Segmented Chip ──────────────────────────────────────────────────────
// Displays date | venue | source as connected pill segments

function SegmentedChip({ date, venue, source, muted }: {
  date: string | null;
  venue: string | null;
  source: string;
  muted: boolean;
}) {
  const opacity = muted ? 0.65 : 1;
  const hasDate = !!date;
  const hasVenue = !!venue;
  const hasSource = !!source;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, opacity }}>
      {hasDate && (
        <div style={{
          background: 'var(--quinary-muted)',
          borderTop: '1px solid var(--chip-border)',
          borderBottom: '1px solid var(--chip-border)',
          borderLeft: '1px solid var(--chip-border)',
          borderRight: (hasVenue || hasSource) ? 'none' : '1px solid var(--chip-border)',
          borderRadius: (hasVenue || hasSource) ? '5px 0 0 5px' : '5px',
          padding: '4px 10px',
          fontSize: 11,
          color: 'var(--chip-date-text)',
          fontWeight: 600,
        }}>
          {date}
        </div>
      )}
      {hasVenue && (
        <div style={{
          background: muted ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
          borderTop: '1px solid var(--chip-border)',
          borderBottom: '1px solid var(--chip-border)',
          borderLeft: !hasDate ? '1px solid var(--chip-border)' : undefined,
          borderRadius: !hasDate ? (hasSource ? '5px 0 0 5px' : '5px') : undefined,
          padding: '4px 10px',
          fontSize: 12,
          color: muted ? 'var(--text-subdued)' : 'var(--text-dim)',
          maxWidth: 200,
          whiteSpace: 'nowrap' as const,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {venue}
        </div>
      )}
      {hasSource && (() => {
        const borderColor = `1px solid color-mix(in srgb, var(--accent-secondary) ${muted ? 15 : 25}%, transparent)`;
        return (
          <div style={{
            background: `color-mix(in srgb, var(--accent-secondary) ${muted ? 12 : 20}%, transparent)`,
            borderTop: borderColor,
            borderBottom: borderColor,
            borderRight: borderColor,
            borderLeft: (hasDate || hasVenue) ? 'none' : borderColor,
            borderRadius: (hasDate || hasVenue) ? '0 5px 5px 0' : '5px',
            padding: '4px 8px',
            fontSize: 10,
            color: 'var(--tertiary)',
            fontWeight: 600,
            letterSpacing: 0.3,
          }}>
            {source}
          </div>
        );
      })()}
    </div>
  );
}

// ── Sortable Header ─────────────────────────────────────────────────────

function SortHeader({ label, field, sortBy, sortDir, onSort, className, style }: {
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
    <th
      className={className}
      onClick={(e) => { e.stopPropagation(); onSort(field); }}
      style={{
        padding: '8px 12px',
        fontWeight: 500,
        cursor: 'pointer',
        userSelect: 'none',
        color: active ? 'var(--secondary)' : undefined,
        transition: 'color 0.15s',
        ...style,
      }}
    >
      {label}
      {active && <span style={{ fontSize: 8, marginLeft: 2 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
    </th>
  );
}

// ── Recording Detail Panel ──────────────────────────────────────────────
// Expanded detail view for a single recording

function RecordingDetail({ song, onPlay, onQueue }: {
  song: Song;
  onPlay: () => void;
  onQueue: () => void;
}) {
  const licenseLabel = parseLicenseLabel(song.archiveLicenseUrl);

  return (
    <td colSpan={6} style={{ padding: 0 }}>
      <div style={{
        padding: '0 16px 14px',
        animation: 'fadeIn 0.15s ease',
      }}>
        {/* Two-column detail layout */}
        <div className="recording-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          {/* Left column */}
          <div>
            {/* Recording Source */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid var(--overlay-light)' }}>
                Recording Source
              </div>
              <Row label="Taper" value={song.taper} />
              <Row label="Source" value={song.source} mono />
              <Row label="Lineage" value={song.lineage} mono />
            </div>

            {/* Quality & Stats */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid var(--overlay-light)' }}>
                Quality & Stats
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
                Track Metadata
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
                Archive.org
              </div>
              <Row label="Identifier" value={song.albumIdentifier} mono />
              <Row label="Added" value={parseDateOnly(song.showAddedDate)} />
              <Row label="Public Date" value={parseDateOnly(song.showPublicDate)} />
              <Row label="Streamable" value={song.isStreamable === false ? 'No' : (song.isStreamable === true ? 'Yes' : null)} />
              <Row label="Access" value={song.accessRestriction || 'Public'} />
              {licenseLabel && <Row label="License" value={licenseLabel} link={song.archiveLicenseUrl || undefined} linkLabel={licenseLabel} />}
              {song.archiveDetailUrl && <Row label="View" value="Open on Archive.org" link={song.archiveDetailUrl} linkLabel="Open on Archive.org →" />}
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
    </td>
  );
}

// ── Recording Table ─────────────────────────────────────────────────────
// Sortable headers, expandable rows with detail panels

const MAX_TABLE_HEIGHT = 420;

function RecordingTable({ songs, onPlay, onQueue, currentSongId, isPlaying }: {
  songs: Song[];
  onPlay: (song: Song) => void;
  onQueue: (song: Song) => void;
  currentSongId: string | null;
  isPlaying: boolean;
}) {
  const [sortBy, setSortBy] = useState('rating');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const sorted = useMemo(() => {
    const numFields: Record<string, (s: Song) => number> = {
      rating: s => s.avgRating || 0,
      downloads: s => s.downloads || 0,
      date: s => s.showDate ? new Date(s.showDate + 'T00:00:00').getTime() || 0 : 0,
      time: s => s.duration || 0,
    };
    const strFields: Record<string, (s: Song) => string> = {
      venue: s => s.showVenue || '',
      type: s => s.recordingType || '',
      src: s => getSourceFormat(s) || '',
    };
    return [...songs].sort((a, b) => {
      const m = sortDir === 'desc' ? -1 : 1;
      if (strFields[sortBy]) {
        return strFields[sortBy](a).localeCompare(strFields[sortBy](b)) * m;
      }
      const fn = numFields[sortBy];
      if (fn) return (fn(a) - fn(b)) * m;
      return 0;
    });
  }, [songs, sortBy, sortDir]);

  return (
    <div className="recording-scroll" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: MAX_TABLE_HEIGHT }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--thead-bg)', backdropFilter: 'blur(4px)' }}>
          <tr style={{
            color: 'var(--text-subdued)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
          }}>
            <SortHeader label="Date" field="date" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'left' }} />
            <SortHeader label="Venue" field="venue" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'left' }} />
            <SortHeader label="Type" field="type" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'center' }} />
            <SortHeader label="Src" field="src" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'center' }} />
            <SortHeader label="Time" field="time" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="recording-col-time" style={{ textAlign: 'center' }} />
            <SortHeader label="Rating" field="rating" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'center' }} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((song) => {
            const isCurrent = song.id === currentSongId;
            const isCurrentPlaying = isCurrent && isPlaying;
            const isRowExpanded = expandedId === song.id;
            const date = formatDateShort(song.showDate);
            const sourceLabel = getSourceLabel(song);

            return (
              <React.Fragment key={song.id}>
                <tr
                  onClick={() => setExpandedId(isRowExpanded ? null : song.id)}
                  className="recording-table-row"
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                    background: isRowExpanded
                      ? 'var(--bg-card)'
                      : isCurrent ? 'var(--secondary-muted)' : 'transparent',
                    borderLeft: isCurrent ? '2px solid var(--secondary)' : '2px solid transparent',
                  }}
                >
                  <td style={{
                    padding: '12px 12px',
                    color: isCurrent ? 'var(--secondary)' : 'var(--text-subdued)',
                    whiteSpace: 'nowrap',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isCurrentPlaying && (
                        <span style={{ color: 'var(--secondary)', fontSize: 10 }}>▶</span>
                      )}
                      {isCurrent && !isPlaying && (
                        <span style={{ color: 'var(--secondary)', fontSize: 10 }}>❚❚</span>
                      )}
                      {date || '—'}
                    </span>
                  </td>
                  <td style={{
                    padding: '12px 12px',
                    color: isCurrent ? 'var(--text)' : 'var(--text-dim)',
                    fontWeight: isCurrent ? 600 : 500,
                    maxWidth: 280,
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {song.showVenue || '—'}
                    {song.showLocation && (
                      <span style={{
                        color: 'var(--text-subdued)',
                        fontSize: 11,
                        marginLeft: 6,
                      }}>
                        {song.showLocation}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                    <RecTypeBadge type={song.recordingType} />
                  </td>
                  <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                    {sourceLabel ? (
                      <SourceBadge source={getSourceFormat(song)} />
                    ) : '—'}
                  </td>
                  <td className="recording-col-time" style={{
                    padding: '12px 12px',
                    textAlign: 'center',
                    color: isCurrent ? 'var(--text-dim)' : 'var(--text-subdued)',
                  }}>
                    {formatDuration(song.duration)}
                  </td>
                  <td style={{
                    padding: '12px 12px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}>
                    {song.avgRating ? (
                      <span style={{ color: 'var(--secondary)', fontSize: 12 }}>
                        {'★'.repeat(Math.round(song.avgRating))}
                        <span style={{ marginLeft: 2, fontWeight: 600, fontSize: 11 }}>
                          {song.avgRating.toFixed(1)}
                        </span>
                      </span>
                    ) : <span style={{ color: 'var(--text-subdued)' }}>—</span>}
                  </td>
                </tr>
                {/* Expanded detail row */}
                {isRowExpanded && (
                  <tr style={{ background: 'var(--bg-card)' }}>
                    <RecordingDetail
                      song={song}
                      onPlay={() => onPlay(song)}
                      onQueue={() => onQueue(song)}
                    />
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── TrackRow ────────────────────────────────────────────────────────────
// Left-accent-bar variant with segmented chip and recording table accordion

export const TrackRow = React.memo(function TrackRow({
  track,
  displayIndex,
  isExpanded,
  onToggle,
  onPlay,
  currentSong,
  isPlaying,
  waveform = [],
}: TrackRowProps) {
  const [hovered, setHovered] = useState(false);
  const { addToQueue, trackToItem } = useQueue();
  const isCurrentTrack = track.songs.some(s => s.id === currentSong?.id);

  // Best version for display
  const bestSong = useMemo(() => getBestVersion(track.songs), [track.songs]);

  // Song to show in the chip: currently playing from this track, or best version
  const chipSong = isCurrentTrack && currentSong
    ? track.songs.find(s => s.id === currentSong.id) || bestSong
    : bestSong;

  const chipDate = chipSong ? formatDateShort(chipSong.showDate) : null;
  const chipVenue = chipSong?.showVenue || '';
  const chipSource = chipSong ? getSourceLabel(chipSong) : '';

  // Duration to display: currently playing song's duration, or track total
  const displayDuration = isExpanded && chipSong
    ? formatDuration(chipSong.duration)
    : formatDuration(track.totalDuration);

  return (
    <div
      style={{
        background: isExpanded ? 'var(--expanded-row-bg)' : 'transparent',
        borderRadius: isExpanded ? 10 : 0,
        overflow: 'hidden',
        border: isExpanded ? '1px solid var(--secondary-muted)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}
    >
      {/* Clickable header area */}
      <div
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: 'pointer',
          borderLeft: isExpanded
            ? '3px solid var(--secondary)'
            : hovered
              ? '3px solid var(--secondary-muted)'
              : '3px solid rgba(255,255,255,0.05)',
          background: isExpanded
            ? 'linear-gradient(135deg, var(--secondary-muted) 0%, transparent 60%)'
            : hovered
              ? 'rgba(255,255,255,0.015)'
              : 'transparent',
          transition: 'all 0.3s',
          padding: '14px 20px',
        }}
      >
        {/* Top line: track number/play + title + time + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {isCurrentTrack && isPlaying ? (
              <div style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
                <Waveform waveform={waveform} size="small" />
              </div>
            ) : isExpanded ? (
              <div style={{ color: 'var(--secondary)', fontSize: 14 }}>▶</div>
            ) : (
              <span style={{
                color: 'var(--text-subdued)',
                fontSize: 14,
                width: 20,
                textAlign: 'right' as const,
              }}>
                {displayIndex}.
              </span>
            )}
            <div style={{
              color: 'var(--text)',
              fontWeight: isExpanded ? 600 : 500,
              fontSize: isExpanded ? 17 : 16,
            }}>
              {track.title}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--text-subdued)',
            fontSize: 14,
          }}>
            {isExpanded && (
              <span style={{ color: 'var(--secondary)' }}>+</span>
            )}
            <span>{displayDuration}</span>
            <span style={{
              color: 'var(--secondary)',
              fontSize: 10,
              transition: 'transform 0.3s',
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
            }}>
              ▲
            </span>
          </div>
        </div>

        {/* Second line: segmented chip */}
        <div style={{ marginTop: 7, paddingLeft: isExpanded ? 28 : 34 }}>
          <SegmentedChip
            date={chipDate}
            venue={chipVenue}
            source={chipSource}
            muted={!isExpanded}
          />
        </div>
      </div>

      {/* Accordion content: recording table */}
      {isExpanded && (
        <>
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, var(--secondary-muted) 0%, transparent 100%)',
          }} />
          <div style={{ padding: '4px 8px 8px' }}>
            <RecordingTable
              songs={track.songs}
              onPlay={onPlay}
              onQueue={(song) => addToQueue(trackToItem(song))}
              currentSongId={currentSong?.id ?? null}
              isPlaying={isPlaying}
            />
          </div>
        </>
      )}
    </div>
  );
});

// ── Side Divider ────────────────────────────────────────────────────────

export function SideDivider({ side }: { side: 'A' | 'B' }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--overlay-light))' }}
      />
      <div className="text-[var(--text-subdued)] text-[11px] tracking-[4px] flex items-center gap-2.5">
        <span className={side === 'A' ? 'text-[var(--secondary)] side-divider-symbol' : 'text-[var(--tertiary)]'}>
          {side === 'A' ? '✧' : '☽'}
        </span>
        SIDE {side}
        <span className={side === 'A' ? 'text-[var(--secondary)] side-divider-symbol' : 'text-[var(--tertiary)]'}>
          {side === 'A' ? '✧' : '☽'}
        </span>
      </div>
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(90deg, var(--overlay-light), transparent)' }}
      />
    </div>
  );
}
