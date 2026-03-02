'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Track, Song, formatDuration } from '@/lib/api';
import { useQueue } from '@/context/QueueContext';
import { Waveform } from '@/components/AudioVisualizations';
import { getBestVersion } from '@/lib/queueTypes';
import { formatNum, parseLicenseLabel, parseDateOnly } from '@/components/recording/recordingUtils';
import { Row, TagPills } from '@/components/recording/RecordingBadges';
import { StarRating, RecTypeBadge } from '@/components/VersionPickerModal';
import RecordingMediumIcon from '@/components/RecordingMediumIcon';

interface TrackRowProps {
  track: Track;
  displayIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlay: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  waveform?: number[];
  preferredSongId?: string | null;
  onSwapVersion?: (songId: string) => void;
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

// ── Recording List ──────────────────────────────────────────────────────
// Card-style rows matching version modal / queue drawer layout

const MAX_LIST_HEIGHT = 420;

function RecordingList({ songs, onPlay, onQueue, currentSongId, isPlaying, onSwap, activeSongId }: {
  songs: Song[];
  onPlay: (song: Song) => void;
  onQueue: (song: Song) => void;
  currentSongId: string | null;
  isPlaying: boolean;
  onSwap?: (songId: string) => void;
  activeSongId?: string | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() =>
    [...songs].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0)),
    [songs]
  );

  // Scroll the active card into view when the list mounts
  useEffect(() => {
    if (activeCardRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const card = activeCardRef.current;
      const offset = card.offsetTop - container.offsetTop;
      container.scrollTop = offset;
    }
  }, [activeSongId]);

  return (
    <div ref={scrollRef} className="recording-scroll flex flex-col gap-2 px-2 py-2" style={{ overflowY: 'auto', maxHeight: MAX_LIST_HEIGHT }}>
      {sorted.map((song) => {
        const isCurrent = song.id === currentSongId;
        const isActive = song.id === activeSongId;
        const isRowExpanded = expandedId === song.id;
        const venue = song.showVenue || '';
        const location = song.showLocation || '';

        return (
          <div key={song.id} ref={isActive ? activeCardRef : undefined}>
            {/* Card row */}
            <div
              onClick={() => setExpandedId(isRowExpanded ? null : song.id)}
              className="rounded-lg overflow-hidden cursor-pointer transition-all"
              style={{
                background: isCurrent
                  ? 'color-mix(in srgb, var(--quinary) 10%, transparent)'
                  : isActive
                    ? 'color-mix(in srgb, var(--quinary) 6%, transparent)'
                    : 'color-mix(in srgb, var(--text) 2%, transparent)',
                border: isCurrent
                  ? '1px solid color-mix(in srgb, var(--quinary) 25%, transparent)'
                  : isActive
                    ? '1px solid color-mix(in srgb, var(--quinary) 15%, transparent)'
                    : '1px solid color-mix(in srgb, var(--text) 6%, transparent)',
                borderLeft: isActive
                  ? '3px solid var(--quinary)'
                  : undefined,
              }}
            >
              {/* Top section: icon + info + duration */}
              <div className="flex items-start gap-3 px-3.5 pt-3 pb-2.5">
                {/* Format icon */}
                <div
                  className="w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(175deg, #2a2622 0%, #1e1a16 50%, #14120c 100%)',
                    border: '1px solid rgba(200,180,140,0.08)',
                  }}
                >
                  <RecordingMediumIcon medium={song.recordingMedium} lineage={song.lineage} source={song.source} size={1.1} />
                </div>

                {/* Info column */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  {/* Row 1: Date · Venue · Location */}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {song.showDate && (
                      <span className="font-jb-mono text-[12px] font-semibold text-primary leading-tight tracking-wide">
                        {song.showDate.replace(/-/g, '/')}
                      </span>
                    )}
                    <span className="text-[12px] font-medium truncate" style={{ color: 'var(--tertiary)' }}>
                      {venue || song.albumName || 'Unknown venue'}
                    </span>
                    {location && (
                      <span className="font-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        {location}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Taper */}
                  {song.taper && (
                    <div className="flex items-center gap-1.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                        <circle cx="10" cy="5" r="3" fill="#b8d0dc"/>
                        <path d="M10 8c-3.5 0-6 2-6 5v2h12v-2c0-3-2.5-5-6-5z" fill="#3a5060"/>
                        <line x1="17" y1="3" x2="17" y2="19" stroke="#90b4c4" strokeWidth="1.5" strokeLinecap="round"/>
                        <rect x="15" y="0.5" width="4" height="4.5" rx="1.5" fill="#b8d0dc"/>
                        <path d="M13 11l4-3.5" stroke="#5a7888" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span className="font-jb-mono text-[10px] font-medium truncate" style={{ color: 'var(--text-tertiary)' }}>
                        {song.taper}
                      </span>
                    </div>
                  )}

                  {/* Row 3: Source badge · Stars · Downloads */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <RecTypeBadge type={song.recordingType} />
                    <StarRating rating={song.avgRating} count={song.numReviews} />
                    {song.downloads != null && song.downloads > 0 && (
                      <span className="font-jb-mono text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                          <path d="M12 2L2 7v1h20V7L12 2z" fill="rgba(200,180,140,0.55)"/>
                          <rect x="4.5" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                          <rect x="9" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                          <rect x="13" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                          <rect x="17.5" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                          <rect x="2" y="17" width="20" height="2" rx="0.5" fill="rgba(200,180,140,0.45)"/>
                        </svg>
                        <svg width="6" height="11" viewBox="0 0 10 16" fill="none" className="flex-shrink-0">
                          <path d="M5 1v11M5 12l-3.5-3.5M5 12l3.5-3.5" stroke="#8fa8b3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {song.downloads.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Duration (top-right) */}
                <span className="font-jb-mono text-[11px] font-medium flex-shrink-0 pt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {formatDuration(song.duration)}
                </span>
              </div>

              {/* Divider + action bar */}
              <div className="mx-3.5" style={{ height: '1px', background: 'color-mix(in srgb, var(--text) 8%, transparent)' }} />
              <div className="flex items-center gap-2 px-3.5 py-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onPlay(song); }}
                  className="font-jb-mono text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5"
                  style={{ color: 'var(--tertiary)', border: '1px solid color-mix(in srgb, var(--tertiary) 30%, transparent)' }}
                >
                  <span className="text-[10px]">▶</span> Play
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onQueue(song); }}
                  className="font-jb-mono text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all flex items-center gap-1"
                  style={{ color: 'var(--text-tertiary)', border: '1px solid color-mix(in srgb, var(--text) 10%, transparent)' }}
                >
                  + Queue
                </button>
                {onSwap && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSwap(song.id); }}
                    className="font-jb-mono text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ml-auto"
                    style={{
                      color: isActive ? 'var(--bg)' : 'var(--quinary)',
                      background: isActive ? 'var(--quinary)' : 'transparent',
                      border: `1px solid color-mix(in srgb, var(--quinary) ${isActive ? '80' : '30'}%, transparent)`,
                    }}
                  >
                    <span className="text-[10px]">⇄</span> {isActive ? 'Default' : 'Swap'}
                  </button>
                )}
              </div>
            </div>

            {/* Expanded detail */}
            {isRowExpanded && (
              <div style={{ padding: '4px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <RecordingDetail song={song} onPlay={() => onPlay(song)} onQueue={() => onQueue(song)} />
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
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
  preferredSongId,
  onSwapVersion,
}: TrackRowProps) {
  const [hovered, setHovered] = useState(false);
  const { addToQueue, trackToItem } = useQueue();
  const isCurrentTrack = track.songs.some(s => s.id === currentSong?.id);

  // Best version for display
  const bestSong = useMemo(() => getBestVersion(track.songs), [track.songs]);

  // Stored preference (if any)
  const preferredSong = preferredSongId
    ? track.songs.find(s => s.id === preferredSongId) ?? null
    : null;

  // Song to show in the chip: currently playing > stored preference > best version
  const chipSong = isCurrentTrack && currentSong
    ? track.songs.find(s => s.id === currentSong.id) || preferredSong || bestSong
    : preferredSong || bestSong;

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
        {/* Row 1: track number/play + title + time + arrow */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {isCurrentTrack && isPlaying ? (
              <div style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
                <Waveform waveform={waveform} size="small" />
              </div>
            ) : isExpanded ? (
              <div style={{ color: 'var(--secondary)', fontSize: 14 }}>▶</div>
            ) : (
              <span className="font-jb-mono text-[14px] w-5 text-right" style={{ color: 'var(--text-subdued)' }}>
                {displayIndex}.
              </span>
            )}
            <span className="text-primary" style={{ fontWeight: isExpanded ? 600 : 500, fontSize: isExpanded ? 17 : 16 }}>
              {track.title}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[14px] flex-shrink-0" style={{ color: 'var(--text-subdued)' }}>
            {isExpanded && <span style={{ color: 'var(--secondary)' }}>+</span>}
            <span>{displayDuration}</span>
            <span style={{ color: 'var(--secondary)', fontSize: 10, transition: 'transform 0.3s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)' }}>▲</span>
          </div>
        </div>

        {/* Metadata rows (matching version modal / queue drawer style) */}
        {chipSong && (
          <div className="flex flex-col gap-1 mt-2" style={{ paddingLeft: isExpanded ? 28 : 34 }}>
            {/* Row 2: Date · Venue · Location */}
            <div className="flex items-baseline gap-2 flex-wrap">
              {chipSong.showDate && (
                <span className="font-jb-mono text-[13px] font-semibold text-primary leading-tight tracking-wide">
                  {chipSong.showDate.replace(/-/g, '/')}
                </span>
              )}
              <span className="text-[13px] font-medium truncate" style={{ color: 'var(--tertiary)' }}>
                {chipSong.showVenue || chipSong.albumName || 'Unknown venue'}
              </span>
              {chipSong.showLocation && (
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  {chipSong.showLocation}
                </span>
              )}
            </div>

            {/* Row 3: Taper */}
            {chipSong.taper && (
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <circle cx="10" cy="5" r="3" fill="#b8d0dc"/>
                  <path d="M10 8c-3.5 0-6 2-6 5v2h12v-2c0-3-2.5-5-6-5z" fill="#3a5060"/>
                  <line x1="17" y1="3" x2="17" y2="19" stroke="#90b4c4" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="15" y="0.5" width="4" height="4.5" rx="1.5" fill="#b8d0dc"/>
                  <path d="M13 11l4-3.5" stroke="#5a7888" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="font-jb-mono text-[11px] font-medium truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {chipSong.taper}
                </span>
              </div>
            )}

            {/* Row 4: Source badge · Stars · Downloads */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <RecTypeBadge type={chipSong.recordingType} />
              <StarRating rating={chipSong.avgRating} count={chipSong.numReviews} />
              {chipSong.downloads != null && chipSong.downloads > 0 && (
                <span className="font-jb-mono text-[11px] flex items-center gap-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <path d="M12 2L2 7v1h20V7L12 2z" fill="rgba(200,180,140,0.55)"/>
                    <rect x="4.5" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="9" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="13" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="17.5" y="9" width="2" height="6.5" rx="0.4" fill="rgba(200,180,140,0.35)"/>
                    <rect x="2" y="17" width="20" height="2" rx="0.5" fill="rgba(200,180,140,0.45)"/>
                  </svg>
                  <svg width="7" height="12" viewBox="0 0 10 16" fill="none" className="flex-shrink-0">
                    <path d="M5 1v11M5 12l-3.5-3.5M5 12l3.5-3.5" stroke="#8fa8b3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {chipSong.downloads.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accordion content: recording table */}
      {isExpanded && (
        <>
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, var(--secondary-muted) 0%, transparent 100%)',
          }} />
          <div style={{ padding: '4px 8px 8px' }}>
            <RecordingList
              songs={track.songs}
              onPlay={onPlay}
              onQueue={(song) => addToQueue(trackToItem(song))}
              currentSongId={currentSong?.id ?? null}
              isPlaying={isPlaying}
              onSwap={onSwapVersion}
              activeSongId={chipSong?.id ?? null}
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
