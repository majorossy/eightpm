'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Leaflet (it requires window/document)
const VenueMapClient = dynamic(
  () => import('@/components/venue/VenueMapClient'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-[#252220] rounded-lg flex items-center justify-center">
        <div className="text-[var(--text-subdued)]">Loading map...</div>
      </div>
    ),
  }
);

export default function VenueMap() {
  return <VenueMapClient />;
}
