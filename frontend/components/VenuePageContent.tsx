'use client';

import { useState, useEffect } from 'react';
import { VenueDetail, VenueArtist, VenueSongStat } from '@/lib/types';
import { getVenueArtists, getVenueTopSongs } from '@/lib/api';
import VenueHeader from '@/components/venue/VenueHeader';
import VenueStats from '@/components/venue/VenueStats';
import VenueShowsGrid from '@/components/venue/VenueShowsGrid';
import VenueTracksTable from '@/components/venue/VenueTracksTable';
import VenueArtistsGrid from '@/components/venue/VenueArtistsGrid';
import NearbyVenues from '@/components/venue/NearbyVenues';
import ArtistCloud from '@/components/venue/ArtistCloud';
import VenueTopSongsTeaser from '@/components/venue/VenueTopSongsTeaser';
import VenueSetlistTab from '@/components/venue/VenueSetlistTab';

interface VenuePageContentProps {
  venue: VenueDetail;
}

type Tab = 'shows' | 'tracks' | 'artists' | 'setlist';

export default function VenuePageContent({ venue }: VenuePageContentProps) {
  const [artists, setArtists] = useState<VenueArtist[]>([]);
  const [topSongs, setTopSongs] = useState<VenueSongStat[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('shows');

  useEffect(() => {
    async function loadData() {
      try {
        const [artistData, songsData] = await Promise.all([
          getVenueArtists(venue.slug),
          getVenueTopSongs(venue.slug, 25),
        ]);
        setArtists(artistData);
        setTopSongs(songsData);
      } catch (error) {
        console.error('Failed to load venue data:', error);
      }
    }
    loadData();
  }, [venue.slug]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'shows', label: 'Shows' },
    { key: 'tracks', label: 'Tracks' },
    { key: 'artists', label: 'Artists' },
    { key: 'setlist', label: 'Setlist' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <VenueHeader venue={venue} />
      <VenueStats venue={venue} />

      {/* Artist Cloud */}
      {artists.length > 0 && <ArtistCloud artists={artists} />}

      {/* Top Songs teaser */}
      <VenueTopSongsTeaser
        songs={topSongs}
        onViewAll={() => setActiveTab('setlist')}
      />

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-default">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-[var(--text-subdued)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'shows' && (
        <VenueShowsGrid venueSlug={venue.slug} />
      )}

      {activeTab === 'tracks' && (
        <VenueTracksTable venueSlug={venue.slug} />
      )}

      {activeTab === 'artists' && (
        <VenueArtistsGrid artists={artists} />
      )}

      {activeTab === 'setlist' && (
        <VenueSetlistTab songs={topSongs} />
      )}

      {/* Nearby venues */}
      {venue.latitude && venue.longitude && (
        <NearbyVenues venueSlug={venue.slug} />
      )}
    </div>
  );
}
