'use client';

import Link from 'next/link';
import { venueSlug } from '@/lib/api';

interface VenueLinkProps {
  venueName?: string;
  className?: string;
  truncateLength?: number;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '\u2026';
}

/**
 * Renders a venue name as a clickable link to /venues/[slug].
 * Falls back to plain text if venue name is empty.
 */
export default function VenueLink({ venueName, className, truncateLength }: VenueLinkProps) {
  if (!venueName) return null;

  const slug = venueSlug(venueName);
  const display = truncateLength ? truncate(venueName, truncateLength) : venueName;

  return (
    <Link
      href={`/venues/${slug}`}
      className={className || 'hover:underline'}
      title={venueName}
    >
      {display}
    </Link>
  );
}
