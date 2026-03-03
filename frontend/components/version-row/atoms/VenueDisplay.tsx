// VenueDisplay — venue name + optional location line (replaces 6+ copies of venue fallback logic)

import VenueLink from '@/components/VenueLink';

interface VenueDisplayProps {
  venue?: string;
  location?: string;
  albumName?: string;
  asLink?: boolean;
  truncateLength?: number;
  className?: string;
  locationClassName?: string;
}

export default function VenueDisplay({
  venue,
  location,
  albumName,
  asLink = false,
  truncateLength,
  className = '',
  locationClassName = '',
}: VenueDisplayProps) {
  const venueName = venue || albumName || 'Unknown venue';

  return (
    <>
      {asLink && venue ? (
        <VenueLink
          venueName={venue}
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
