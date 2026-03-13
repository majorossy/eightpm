// VenueDisplay — venue name + optional location line (replaces 6+ copies of venue fallback logic)

import VenueLink from '@/components/VenueLink';

/** Title-case a venue name, preserving common abbreviations and small words. */
const SMALL_WORDS = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'as', 'de', 'du', 'le', 'la']);
const UPPER_WORDS = new Set(['bbq', 'uno', 'nyc', 'dc', 'la', 'ii', 'iii', 'iv', 'dj']);

function titleCaseVenue(name: string): string {
  // Already mixed-case (has uppercase beyond first char) — leave as-is
  if (name !== name.toLowerCase() && name !== name.toUpperCase()) return name;

  return name
    .split(' ')
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (UPPER_WORDS.has(lower)) return word.toUpperCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

interface VenueDisplayProps {
  venue?: string;
  location?: string;
  albumName?: string;
  asLink?: boolean;
  truncateLength?: number;
  className?: string;
  locationClassName?: string;
  normalizedName?: string;
  venueSlug?: string;
}

export default function VenueDisplay({
  venue,
  location,
  albumName,
  asLink = false,
  truncateLength,
  className = '',
  locationClassName = '',
  normalizedName,
  venueSlug,
}: VenueDisplayProps) {
  const rawName = venue || albumName || 'Unknown venue';
  const venueName = normalizedName || titleCaseVenue(rawName);

  return (
    <>
      {asLink && venue ? (
        <VenueLink
          venueName={venueName}
          slug={venueSlug}
          className={`font-medium truncate ${className}`}
          truncateLength={truncateLength}
        />
      ) : (
        <span
          className={`font-medium truncate ${className}`}
          style={{ color: 'var(--tertiary)' }}
        >
          {truncateLength && venueName.length > truncateLength
            ? venueName.slice(0, truncateLength - 1) + '\u2026'
            : venueName}
        </span>
      )}
      {location && (
        <span
          className={`font-mono text-[11px] ${locationClassName}`}
          style={{ color: 'var(--text-tertiary)' }}
        >
          {location}
        </span>
      )}
    </>
  );
}
