'use client';

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Artist, Album, WikipediaSummary } from '@/lib/types';
import { BandMemberData } from '@/lib/types';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { useWishlist } from '@/context/WishlistContext';
import { useHaptic } from '@/hooks/useHaptic';
import AlbumCard from '@/components/AlbumCard';
import BandMembersTimeline from '@/components/artist/BandMembersTimeline';
import BandStatistics from '@/components/artist/BandStatistics';
import VenueCloud from '@/components/artist/VenueCloud';
import BandLinks from '@/components/artist/BandLinks';
import DetailedCassette from '@/components/artist/DetailedCassette';
import PolaroidCard from '@/components/artist/PolaroidCard';
import ExpandedBiography from '@/components/ExpandedBiography';
import { trackArtistView } from '@/lib/analytics';

interface ArtistWithAlbums extends Artist {
  albums: Album[];
  wikipediaSummary?: WikipediaSummary | null;
}

interface ArtistPageContentProps {
  artist: ArtistWithAlbums;
  bandData?: BandMemberData | null;
}

export default function ArtistPageContent({ artist, bandData }: ArtistPageContentProps) {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { followArtist, unfollowArtist, isArtistFollowed } = useWishlist();
  const { vibrate, BUTTON_PRESS } = useHaptic();
  const hasTrackedView = useRef(false);

  const isFollowed = isArtistFollowed(artist.slug);

  useEffect(() => {
    setBreadcrumbs([{ label: artist.name, type: 'artist' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, artist.name]);

  // Track artist page view (once per mount)
  useEffect(() => {
    if (!hasTrackedView.current) {
      trackArtistView({
        ...artist,
        albumCount: artist.albums?.length || 0,
      });
      hasTrackedView.current = true;
    }
  }, [artist]);

  const handleFollowToggle = () => {
    vibrate(BUTTON_PRESS);
    if (isFollowed) {
      unfollowArtist(artist.slug);
    } else {
      followArtist(artist.slug);
    }
  };

  // Extract year from bandData or use a default
  const formationYear = bandData?.recordingStats?.yearsActive?.split('-')[0] || '';

  // Use pre-calculated statistics from category attributes (monthly cron updates)
  const calculatedStats = useMemo(() => {
    if (!artist) return null;

    // Collect years from albums for years active calculation
    const allYears: number[] = [];
    const uniqueShows = new Set<string>();

    artist.albums?.forEach(album => {
      if (album.showDate) {
        uniqueShows.add(album.showDate);
        const year = parseInt(album.showDate.split('-')[0], 10);
        if (!isNaN(year)) {
          allYears.push(year);
        }
      }
    });

    // Use totalShows from backend if available, otherwise fallback to unique show dates
    const totalShows = artist.totalShows || uniqueShows.size || 0;

    // Years active (can use band_formation_date if present)
    // Ensure firstYear is always a number for type safety
    const firstYearRaw = formationYear || (allYears.length ? Math.min(...allYears) : null);
    const firstYear = firstYearRaw ? (typeof firstYearRaw === 'string' ? parseInt(firstYearRaw, 10) : firstYearRaw) : null;
    const lastYear = allYears.length ? Math.max(...allYears) : null;

    return {
      totalRecordings: artist.totalRecordings || 0,
      totalHours: artist.totalHours || 0,
      totalShows,
      totalVenues: artist.totalVenues || 0,
      mostPlayedTrack: artist.mostPlayedTrack
        ? { title: artist.mostPlayedTrack, playCount: 0 }
        : undefined,
      yearsActive: firstYear
        ? {
            first: firstYear,
            last: lastYear || new Date().getFullYear(),
          }
        : undefined,
      recordingStats: {
        total: artist.totalRecordings || 0,
      },
    };
  }, [artist, formationYear]);

  // Combine all bio images (artist web images)
  const allImages = [];
  if (artist.wikipediaSummary?.thumbnail) {
    allImages.push({
      url: artist.wikipediaSummary.thumbnail.source,
      caption: `${artist.wikipediaSummary.title} (Wikipedia)`,
      credit: 'Wikipedia',
    });
  }
  if (bandData?.images) {
    allImages.push(...bandData.images);
  }

  // Get a short excerpt for the quote callout
  const quoteExcerpt = artist.wikipediaSummary?.extract
    ? artist.wikipediaSummary.extract.slice(0, 200) + (artist.wikipediaSummary.extract.length > 200 ? '...' : '')
    : null;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Cassette Tape Design */}
      <section className="relative px-4 md:px-8 pt-4 md:pt-6 pb-8 md:pb-12 overflow-hidden">
        {/* Ambient background layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Organic blob gradients */}
          <div
            className="absolute top-10 left-[5%] w-[400px] h-[350px] rounded-full opacity-[0.08]"
            style={{
              background: 'radial-gradient(ellipse, rgba(90,138,122,0.6) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute top-20 right-[10%] w-[300px] h-[400px] rounded-full opacity-[0.06]"
            style={{
              background: 'radial-gradient(ellipse, rgba(212,160,96,0.6) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <div
            className="absolute bottom-0 left-[30%] w-[500px] h-[300px] rounded-full opacity-[0.05]"
            style={{
              background: 'radial-gradient(ellipse, rgba(168,90,56,0.5) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Fireflies */}
          <div
            className="firefly"
            style={{ top: '15%', left: '20%', animationDelay: '0s' }}
          />
          <div
            className="firefly firefly-2"
            style={{ top: '40%', right: '25%', animationDelay: '1.2s' }}
          />
          <div
            className="firefly firefly-3"
            style={{ bottom: '30%', left: '60%', animationDelay: '2.5s' }}
          />
          <div
            className="firefly"
            style={{ top: '60%', left: '10%', animationDelay: '0.8s' }}
          />
          <div
            className="firefly firefly-2"
            style={{ bottom: '20%', right: '15%', animationDelay: '1.8s' }}
          />
        </div>

        {/* Main hero content - cassette left, info right on desktop */}
        <div className="relative z-10 flex flex-row items-center gap-4 md:gap-8 lg:gap-16 max-w-[1000px] mx-auto">
          {/* Cassette stack */}
          <div className="relative w-[160px] h-[140px] md:w-[240px] md:h-[210px] lg:w-[320px] lg:h-[280px] flex-shrink-0 cassette-stack-float">
            {/* Stack of 4 cassettes with slight offsets */}
            <DetailedCassette
              artistName={artist.name}
              artistFullName={artist.wikipediaSummary?.title}
              year={formationYear}
              rotation={-8}
              offsetX={-15}
              offsetY={60}
              isTop={false}
            />
            <DetailedCassette
              artistName={artist.name}
              artistFullName={artist.wikipediaSummary?.title}
              year={formationYear}
              rotation={5}
              offsetX={25}
              offsetY={40}
              isTop={false}
            />
            <DetailedCassette
              artistName={artist.name}
              artistFullName={artist.wikipediaSummary?.title}
              year={formationYear}
              rotation={-3}
              offsetX={5}
              offsetY={20}
              isTop={false}
            />
            <DetailedCassette
              artistName={artist.name}
              artistFullName={artist.wikipediaSummary?.title}
              year={formationYear}
              rotation={2}
              offsetX={15}
              offsetY={0}
              isTop={true}
              imageUrl={artist.wikipediaSummary?.thumbnail?.source}
              artistImageUrl={artist.image}
            />

            {/* Fire glow beneath cassettes */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[250px] h-[60px] opacity-40"
              style={{
                background: 'radial-gradient(ellipse at 50% 100%, rgba(212,120,50,0.5) 0%, rgba(180,100,40,0.2) 40%, transparent 70%)',
                filter: 'blur(12px)',
                animation: 'flicker 3s ease-in-out infinite',
              }}
            />
          </div>

          {/* Artist info */}
          <div className="flex-1 text-left">
            {/* Artist badge */}
            <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-[#d4a060] bg-[#d4a060]/10 rounded-full mb-4">
              Artist
            </span>

            {/* Artist name - large Georgia serif */}
            <h1
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {artist.name}
            </h1>

            {/* Full name subtitle if different */}
            {artist.wikipediaSummary?.title && artist.wikipediaSummary.title !== artist.name && (
              <p className="text-base md:text-lg text-[#8a8478] mb-4">
                {artist.wikipediaSummary.title}
              </p>
            )}

            {/* Stats line */}
            <p className="text-sm md:text-base text-[#6a6458] mb-6">
              {artist.albums.length} {artist.albums.length === 1 ? 'album' : 'albums'} &bull; {artist.songCount} {artist.songCount === 1 ? 'recording' : 'recordings'}
              {artist.originLocation && (
                <> &bull; {artist.originLocation}</>
              )}
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
              {/* Follow/Heart button */}
              <button
                onClick={handleFollowToggle}
                className="p-3 border border-[#3a3632] hover:border-[#d4a060] rounded-full transition-all hover:scale-105"
                aria-label={isFollowed ? 'Unfollow artist' : 'Follow artist'}
              >
                <svg
                  className="w-5 h-5"
                  fill={isFollowed ? '#d4a060' : 'none'}
                  stroke={isFollowed ? '#d4a060' : '#e8e0d4'}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Quote callout box */}
            {quoteExcerpt && (
              <div className="relative pl-4 border-l-2 border-[#d4a060]/40 max-w-3xl lg:-ml-32">
                <p className="text-sm md:text-base text-[#a8a098] italic leading-relaxed">
                  &ldquo;{quoteExcerpt}&rdquo;
                </p>
                <p className="text-xs text-[#6a6458] mt-2">
                  &mdash; Wikipedia
                </p>
              </div>
            )}
          </div>

          {/* Polaroid Card - Right side */}
          <div className="hidden lg:flex flex-shrink-0 items-start pt-8">
            <PolaroidCard
              imageUrl={artist.image}
              artistName={artist.name}
              caption={formationYear ? `Est. ${formationYear}` : artist.name}
              socialLinks={{
                website: bandData?.socialLinks?.website,
                youtube: bandData?.socialLinks?.youtube,
                facebook: bandData?.socialLinks?.facebook,
                instagram: bandData?.socialLinks?.instagram,
                twitter: bandData?.socialLinks?.twitter,
              }}
              wikipediaThumbnail={artist.wikipediaSummary?.thumbnail}
              imageAttribution={artist.wikipediaSummary?.thumbnailAttribution}
            />
          </div>
        </div>
      </section>

      {/* Discography - Carousel - Keyword-rich heading for SEO */}
      <section className="pb-8 max-w-[1000px] mx-auto px-4 md:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
          {artist.name} Live Recordings &amp; Concert Archive
        </h2>
        <p className="text-sm text-[#8a8478] mb-4 text-center">
          Stream {artist.albums.length} {artist.albums.length === 1 ? 'show' : 'shows'} - High-quality recordings from Archive.org
        </p>
        {artist.albums.length > 0 ? (
          <div className="flex justify-center gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#3a3632] scrollbar-track-transparent">
            {artist.albums.map((album) => (
              <div key={album.id} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]">
                <AlbumCard album={album} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#8a8478] text-center">No albums available.</p>
        )}
      </section>

      {/* Two column: content left, images right */}
      <section className="max-w-[1000px] mx-auto px-4 md:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 lg:gap-12">
          {/* Left Column: bio + members + stats */}
          <div className="space-y-8 md:space-y-12">

            {/* Biography - Keyword-rich heading with expanded content */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                About {artist.name} - Biography, Band Members &amp; History
              </h2>
              <p className="text-sm text-[#6a6458] mb-6">
                {artist.originLocation && `From ${artist.originLocation}`}
                {artist.originLocation && artist.yearsActive && ' - '}
                {artist.yearsActive && `Active ${artist.yearsActive}`}
              </p>
              <ExpandedBiography
                artistName={artist.name}
                extendedBio={artist.wikipediaSummary?.extendedBio || artist.extendedBio}
                wikipediaExtract={artist.wikipediaSummary?.extract}
                wikipediaUrl={artist.wikipediaSummary?.url}
                totalShows={artist.totalShows || artist.albums.length}
                yearsActive={artist.yearsActive}
                genres={artist.genres}
                originLocation={artist.originLocation}
                formationDate={artist.formationDate}
              />
            </div>

            {/* Band Statistics - from real API data */}
            {calculatedStats && (
              <BandStatistics
                statistics={{
                  totalShows: calculatedStats.totalShows,
                  totalHours: calculatedStats.totalHours,
                  totalVenues: calculatedStats.totalVenues,
                  recordingStats: { total: calculatedStats.totalRecordings },
                  yearsActive: formationYear ? { first: parseInt(formationYear, 10), last: new Date().getFullYear() } : calculatedStats.yearsActive,
                  mostPlayedTrack: calculatedStats.mostPlayedTrack,
                }}
              />
            )}

            {/* Venue Cloud */}
            <VenueCloud artistId={artist.id} artistName={artist.name} />

            {/* Band Members */}
            <BandMembersTimeline
              members={bandData?.members?.current}
              formerMembers={bandData?.members?.former}
              foundedYear={formationYear ? parseInt(formationYear, 10) : undefined}
            />
          </div>

          {/* Right Column: Artist web images only (sticky) */}
          {allImages.length > 0 && (
            <div className="mx-auto lg:mx-0 lg:sticky lg:top-24 lg:self-start space-y-4">
              {allImages.slice(0, 3).map((image, index) => (
                <div key={index} className="bg-[#252220] rounded-lg overflow-hidden">
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={image.caption || 'Band photo'}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      quality={85}
                      priority={index === 0}
                      className="object-cover"
                    />
                  </div>
                  {image.caption && (
                    <div className="p-3">
                      <p className="text-xs text-[#8a8478]">{image.caption}</p>
                      {image.credit && (
                        <p className="text-[0.6rem] text-[#6a6a6a] mt-1">
                          Credit: {image.credit}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
