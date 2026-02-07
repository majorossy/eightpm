import { notFound } from 'next/navigation';
import { getVenue } from '@/lib/api';
import VenuePageContent from '@/components/VenuePageContent';

interface VenuePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: VenuePageProps) {
  const { slug } = await params;
  const venue = await getVenue(slug);

  if (!venue) {
    return { title: 'Venue Not Found | 8PM' };
  }

  const location = [venue.city, venue.state].filter(Boolean).join(', ');
  const title = location
    ? `${venue.normalized_name} - ${location} | Live Recordings | 8PM`
    : `${venue.normalized_name} | Live Recordings | 8PM`;

  return {
    title,
    description: `Browse ${venue.total_shows} live recordings from ${venue.normalized_name}${location ? ` in ${location}` : ''}. ${venue.total_artists} artists, free streaming.`,
  };
}

export default async function VenuePage({ params }: VenuePageProps) {
  const { slug } = await params;
  const venue = await getVenue(slug);

  if (!venue) {
    notFound();
  }

  return <VenuePageContent venue={venue} />;
}
