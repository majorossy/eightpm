'use client';

import { Track, Song } from '@/lib/types';

interface TaperNotesProps {
  track?: Track;
  song?: Song;
  albumName?: string;
  artistName?: string;
  showDate?: string;
  showVenue?: string;
}

/**
 * TaperNotes - Display taper/recording information
 *
 * Purpose: Show recording source, lineage, and taper info
 * SEO Benefits:
 * - User-generated content improves authenticity
 * - Technical details match search queries like "soundboard recording"
 * - Increases dwell time for audiophiles researching recordings
 */
export default function TaperNotes({
  track,
  song,
  albumName,
  artistName,
  showDate,
  showVenue,
}: TaperNotesProps) {
  // Get recording info from song or first song in track
  const recordingInfo = song || track?.songs?.[0];

  if (!recordingInfo) {
    return null;
  }

  const { taper, source, lineage, notes } = recordingInfo;

  // Check if we have any recording metadata to display
  const hasMetadata = taper || source || lineage || notes;

  if (!hasMetadata) {
    return null;
  }

  // Parse lineage to determine recording type
  const getRecordingType = (lineage?: string): string | null => {
    if (!lineage) return null;
    const lower = lineage.toLowerCase();
    if (lower.includes('soundboard') || lower.includes('sbd')) return 'Soundboard';
    if (lower.includes('matrix')) return 'Matrix';
    if (lower.includes('audience') || lower.includes('aud')) return 'Audience';
    return null;
  };

  const recordingType = getRecordingType(lineage);

  return (
    <section className="mt-8">
      <h3 className="text-lg md:text-xl font-bold text-white mb-4">
        Recording Information
      </h3>
      <div className="bg-surface-elevated rounded-lg p-5 border border-default/30">
        {/* Recording type badge */}
        {recordingType && (
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                recordingType === 'Soundboard'
                  ? 'bg-accent text-inverse'
                  : recordingType === 'Matrix'
                  ? 'bg-accent-secondary text-white'
                  : 'bg-tertiary text-white'
              }`}
            >
              {recordingType} Recording
            </span>
          </div>
        )}

        {/* Taper info */}
        {taper && (
          <div className="mb-3">
            <span className="text-xs text-secondary uppercase tracking-wider block mb-1">
              Recorded by
            </span>
            <p className="text-primary text-sm">{taper}</p>
          </div>
        )}

        {/* Source equipment */}
        {source && (
          <div className="mb-3">
            <span className="text-xs text-secondary uppercase tracking-wider block mb-1">
              Recording Source
            </span>
            <p className="text-primary text-sm font-mono">{source}</p>
          </div>
        )}

        {/* Lineage/transfer chain */}
        {lineage && (
          <div className="mb-3">
            <span className="text-xs text-secondary uppercase tracking-wider block mb-1">
              Lineage
            </span>
            <p className="text-secondary text-sm font-mono leading-relaxed break-words">
              {lineage}
            </p>
          </div>
        )}

        {/* Performance notes */}
        {notes && (
          <div className="mt-4 pt-4 border-t border-default/30">
            <span className="text-xs text-secondary uppercase tracking-wider block mb-2">
              Performance Notes
            </span>
            <p className="text-secondary text-sm leading-relaxed">{notes}</p>
          </div>
        )}

        {/* SEO-friendly description */}
        <div className="mt-4 pt-4 border-t border-default/30">
          <p className="text-xs text-tertiary leading-relaxed">
            {artistName && showVenue && showDate ? (
              <>
                This {recordingType?.toLowerCase() || 'live'} recording of {artistName} at {showVenue} on {showDate} is part of the Archive.org collection.
                Recordings like this are made possible by the dedicated taper community who preserve live music history.
              </>
            ) : (
              <>
                This recording is preserved in the Archive.org live music collection, maintained by the dedicated community of tapers who capture and share live performances.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
