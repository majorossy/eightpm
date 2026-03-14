import Link from 'next/link';
import VenueMap from '@/components/venue/VenueMap';

export const metadata = {
  title: 'Venue Map | Live Recordings | 8PM',
  description: 'Explore live music venues on an interactive map. Discover where your favorite bands have played and find recordings by location.',
};

export default function VenueMapPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Venue Map
          </h1>
          <p className="text-secondary">
            Explore venues where live recordings were captured
          </p>
        </div>
        <Link
          href="/venues"
          className="px-4 py-2 bg-surface-elevated hover:bg-border text-white rounded-lg text-sm transition-colors"
        >
          List View
        </Link>
      </div>

      {/* Map */}
      <VenueMap />
    </div>
  );
}
