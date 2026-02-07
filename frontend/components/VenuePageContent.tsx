'use client';

import { useState, useEffect } from 'react';
import { VenueDetail, VenueArtist } from '@/lib/types';
import { getVenueArtists } from '@/lib/api';
import VenueHeader from '@/components/venue/VenueHeader';
import VenueStats from '@/components/venue/VenueStats';
import VenueShowsGrid from '@/components/venue/VenueShowsGrid';
import VenueArtistsGrid from '@/components/venue/VenueArtistsGrid';
import NearbyVenues from '@/components/venue/NearbyVenues';
import ArtistCloud from '@/components/venue/ArtistCloud';

interface VenuePageContentProps {
  venue: VenueDetail;
}

export default function VenuePageContent({ venue }: VenuePageContentProps) {
  const [artists, setArtists] = useState<VenueArtist[]>([]);
  const [activeTab, setActiveTab] = useState<'shows' | 'artists'>('shows');

  useEffect(() => {
    async function loadArtists() {
      try {
        const data = await getVenueArtists(venue.slug);
        setArtists(data);
      } catch (error) {
        console.error('Failed to load venue artists:', error);
      }
    }
    loadArtists();
  }, [venue.slug]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <VenueHeader venue={venue} />
      <VenueStats venue={venue} />

      {/* Artist Cloud */}
      {artists.length > 0 && <ArtistCloud artists={artists} />}

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-[#2d2a26]">
        <button
          onClick={() => setActiveTab('shows')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'shows'
              ? 'border-[#d4a060] text-[#d4a060]'
              : 'border-transparent text-[var(--text-subdued)] hover:text-[var(--text)]'
          }`}
        >
          Shows
        </button>
        <button
          onClick={() => setActiveTab('artists')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'artists'
              ? 'border-[#d4a060] text-[#d4a060]'
              : 'border-transparent text-[var(--text-subdued)] hover:text-[var(--text)]'
          }`}
        >
          Artists
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'shows' && (
        <VenueShowsGrid venueSlug={venue.slug} />
      )}

      {activeTab === 'artists' && (
        <VenueArtistsGrid artists={artists} />
      )}

      {/* Nearby venues */}
      {venue.latitude && venue.longitude && (
        <NearbyVenues venueSlug={venue.slug} />
      )}
    </div>
  );
}
