'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { VenueDetail } from '@/lib/types';
import { getVenues } from '@/lib/api';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths for Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export default function VenueMapClient() {
  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        // Fetch all venues with coordinates
        const result = await getVenues({ pageSize: 500, currentPage: 1 });
        const withCoords = result.items.filter(v => v.latitude && v.longitude);
        setVenues(withCoords);
      } catch (error) {
        console.error('Failed to load venues for map:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-[#252220] rounded-lg flex items-center justify-center">
        <div className="text-[var(--text-subdued)]">Loading map...</div>
      </div>
    );
  }

  // Center on the US by default
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-[#2d2a26]">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {venues.map((venue) => (
          <Marker
            key={venue.slug}
            position={[venue.latitude!, venue.longitude!]}
          >
            <Popup>
              <div className="text-sm">
                <Link
                  href={`/venues/${venue.slug}`}
                  className="font-bold text-[#d4a060] hover:underline"
                >
                  {venue.normalized_name}
                </Link>
                <div className="text-gray-600 mt-1">
                  {[venue.city, venue.state].filter(Boolean).join(', ')}
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {venue.total_shows} shows / {venue.total_artists} artists
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
