'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLineStartDetection } from '@/hooks/useLineStartDetection';
import { useFestivalSort } from '@/hooks/useFestivalSort';
import AlgorithmSelector from '@/components/AlgorithmSelector';

interface LineupArtist {
  name: string;
  slug: string;
  songCount: number;
  albumCount: number;
  totalShows?: number;
  mostPlayedTrack?: string;
  totalRecordings?: number;
  totalHours?: number;
  totalVenues?: number;
  formationYear?: number;
}

interface FestivalHeroProps {
  artists: LineupArtist[];
  onStartListening?: () => void;
}

interface ArtistStatsTooltipProps {
  totalShows?: number;
  mostPlayedTrack?: string;
  totalRecordings?: number;
  totalHours?: number;
  totalVenues?: number;
  formationYear?: number;
}

function ArtistStatsTooltip({
  totalShows,
  mostPlayedTrack,
  totalRecordings,
  totalHours,
  totalVenues,
  formationYear
}: ArtistStatsTooltipProps) {
  // Don't render if no stats available
  const hasStats = totalShows || mostPlayedTrack || totalRecordings || totalHours || totalVenues || formationYear;
  if (!hasStats) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out pointer-events-none z-50 hidden md:block">
      {/* Vintage Ticket Stub */}
      <div
        className="relative flex overflow-hidden font-mono"
        style={{
          width: '400px',
          height: '120px',
          background: `
            linear-gradient(90deg,
              rgba(139,115,85,0.1) 0%,
              transparent 5%,
              transparent 95%,
              rgba(139,115,85,0.1) 100%
            ),
            linear-gradient(90deg, #ede0cc 0%, #ede0cc 73%, #ddd0b8 73%, #ddd0b8 100%)
          `,
          borderRadius: '4px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.4), inset 0 0 30px rgba(139,115,85,0.15)',
        }}
      >
        {/* Perforation line */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: '73%',
            width: '2px',
            background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 5px, #a99a8a 5px, #a99a8a 10px)',
          }}
        />

        {/* Decorative star */}
        <span
          className="absolute"
          style={{
            top: '8px',
            left: '12px',
            fontSize: '0.7rem',
            color: '#d35400',
          }}
        >
          ★
        </span>

        {/* Main section */}
        <div
          className="flex flex-col justify-center"
          style={{
            flex: '0.73',
            padding: '16px 20px',
            paddingTop: '26px',
          }}
        >
          {/* Stats row */}
          <div className="flex justify-between gap-5">
            {totalShows !== undefined && (
              <div className="text-center flex-1">
                <div className="font-bebas-neue" style={{ fontSize: '1.5rem', color: '#5a8a7a', lineHeight: 1 }}>
                  {totalShows.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.5rem', color: '#8a7a6a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Shows
                </div>
              </div>
            )}
            {totalRecordings !== undefined && (
              <div className="text-center flex-1">
                <div className="font-bebas-neue" style={{ fontSize: '1.5rem', color: '#5a8a7a', lineHeight: 1 }}>
                  {totalRecordings.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.5rem', color: '#8a7a6a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Recordings
                </div>
              </div>
            )}
            {totalVenues !== undefined && (
              <div className="text-center flex-1">
                <div className="font-bebas-neue" style={{ fontSize: '1.5rem', color: '#5a8a7a', lineHeight: 1 }}>
                  {totalVenues.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.5rem', color: '#8a7a6a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Venues
                </div>
              </div>
            )}
          </div>

          {/* Most played track */}
          {mostPlayedTrack && (
            <div
              className="text-center truncate"
              style={{
                marginTop: '10px',
                fontSize: '0.5rem',
                color: '#6a5a4a',
                borderTop: '1px dashed #c4a882',
                paddingTop: '6px',
              }}
            >
              Top Track: <strong style={{ color: '#d35400' }}>{mostPlayedTrack}</strong>
            </div>
          )}
        </div>

        {/* Hours section (stub tear-off) */}
        <div
          className="flex flex-col items-center justify-center"
          style={{ flex: '0.27' }}
        >
          {totalHours !== undefined && (
            <>
              <div className="font-bebas-neue" style={{ fontSize: '2.2rem', color: '#5a8a7a', lineHeight: 1 }}>
                {totalHours.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#8a7a6a', textTransform: 'uppercase' }}>
                Hours
              </div>
            </>
          )}
          {formationYear !== undefined && !totalHours && (
            <>
              <div className="font-bebas-neue" style={{ fontSize: '1.5rem', color: '#5a8a7a', lineHeight: 1 }}>
                {formationYear}
              </div>
              <div style={{ fontSize: '0.5rem', color: '#8a7a6a', textTransform: 'uppercase' }}>
                Est.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Arrow pointer */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #ede0cc',
        }}
      />
    </div>
  );
}

export default function FestivalHero({ artists, onStartListening }: FestivalHeroProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Get sorted artists and algorithm from context
  const { sortedArtists, algorithm } = useFestivalSort();

  // Use sortedArtists from context instead of local sorting
  const lineupArtists = sortedArtists.length > 0 ? sortedArtists : artists;

  // Detect line starts to hide star separators via direct DOM manipulation (no flicker)
  const { containerRef, setItemRef, setStarRef, detectAndHideLineStarts } = useLineStartDetection(lineupArtists.length);

  // Debounce star detection after animations
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLayoutAnimationComplete = useCallback(() => {
    // Clear any pending detection
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }

    // Debounce: wait for all animations to complete before detecting
    detectionTimeoutRef.current = setTimeout(() => {
      // Use double RAF to ensure DOM is fully settled
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          detectAndHideLineStarts();
          detectionTimeoutRef.current = null;
        });
      });
    }, 50); // Small delay after last animation completes
  }, [detectAndHideLineStarts]);

  const getFontSize = (artist: LineupArtist) => {
    let value: number;
    let allValues: number[];

    switch (algorithm) {
      case 'songVersions':
        value = artist.songCount || 0;
        allValues = lineupArtists.map(a => a.songCount || 0);
        break;
      case 'shows':
        value = artist.totalShows || 0;
        allValues = lineupArtists.map(a => a.totalShows || 0);
        break;
      case 'hours':
        value = artist.totalHours || 0;
        allValues = lineupArtists.map(a => a.totalHours || 0);
        break;
      default:
        value = artist.songCount || 0;
        allValues = lineupArtists.map(a => a.songCount || 0);
    }

    // Special case: zero values get their own smallest tier
    if (value === 0) {
      const mobileSize = 0.5;
      const desktopSize = 0.9;
      const slope = (desktopSize - mobileSize) / 0.6;
      const base = mobileSize - (slope * 0.2);
      return {
        min: mobileSize,
        max: desktopSize,
        slope: slope,
        base: base,
      };
    }

    // Filter out zeros for tier calculation (they have their own tier)
    const nonZeroValues = allValues.filter(v => v > 0);
    const sortedValues = [...nonZeroValues].sort((a, b) => b - a);
    const totalArtists = sortedValues.length || 1;

    // Find artist's rank (0 = highest)
    const rank = sortedValues.indexOf(value);

    // Calculate tier (0-3) based on rank quartiles
    // Tier 0: Headliner (top 10%)
    // Tier 1: Main Stage (10-35%)
    // Tier 2: Supporting (35-65%)
    // Tier 3: Opener (bottom 35%)
    let tier: number;
    const percentile = rank / totalArtists;

    if (percentile < 0.10) tier = 0;       // Headliner
    else if (percentile < 0.35) tier = 1;  // Main Stage
    else if (percentile < 0.65) tier = 2;  // Supporting
    else tier = 3;                          // Opener

    // Fluid size ranges - constrained to fit container
    // Mobile (320px):  0.65rem to 1.4rem
    // Desktop (1280px): 1.4rem to 3.5rem
    const tierSizes = {
      mobile: [1.4, 1.05, 0.8, 0.65],   // Headliner -> Opener
      desktop: [3.5, 2.6, 1.9, 1.4],     // Fits within max-w-6xl
    };

    // Get artists in the same tier to calculate within-tier variation
    const tierArtists = nonZeroValues.filter(v => {
      const p = sortedValues.indexOf(v) / totalArtists;
      if (tier === 0) return p < 0.10;
      if (tier === 1) return p >= 0.10 && p < 0.35;
      if (tier === 2) return p >= 0.35 && p < 0.65;
      return p >= 0.65;
    });

    const tierMin = Math.min(...tierArtists);
    const tierMax = Math.max(...tierArtists);
    const tierRange = tierMax - tierMin || 1;
    const withinTierRatio = (value - tierMin) / tierRange;

    // Interpolate within tier (top of tier to bottom of tier)
    const nextTier = Math.min(tier + 1, 3);
    const mobileSize = tierSizes.mobile[tier] -
      (tierSizes.mobile[tier] - tierSizes.mobile[nextTier]) * (1 - withinTierRatio) * 0.5;
    const desktopSize = tierSizes.desktop[tier] -
      (tierSizes.desktop[tier] - tierSizes.desktop[nextTier]) * (1 - withinTierRatio) * 0.5;

    // Fluid typography: clamp(min, calc(baseRem + slopeVw), max)
    // At 320px: 1vw = 3.2px = 0.2rem (assuming 16px base)
    // At 1280px: 1vw = 12.8px = 0.8rem
    // We want: base + slope * 0.2 = mobileSize
    //          base + slope * 0.8 = desktopSize
    // Solving: slope = (desktop - mobile) / 0.6
    //          base = mobile - slope * 0.2
    const slope = (desktopSize - mobileSize) / 0.6;
    const base = mobileSize - (slope * 0.2);

    return {
      min: Math.max(0.65, mobileSize),
      max: Math.max(1.4, desktopSize),
      slope: slope,
      base: base,
    };
  };

  return (
    <section
      className="festival-hero-section flex flex-col items-center relative overflow-hidden pt-0.5 pb-4 px-4 md:pt-1 md:pb-6 md:px-10"
    >
      {/* Decorative stars */}
      <span className="absolute top-[15%] left-[10%] text-4xl md:text-6xl text-[var(--neon-pink)] opacity-40 select-none hidden sm:block">
        &#9733;
      </span>
      <span className="absolute top-[20%] right-[15%] text-3xl md:text-5xl text-[var(--neon-pink)] opacity-30 select-none">
        &#9733;
      </span>
      <span className="absolute top-[60%] left-[5%] text-2xl md:text-4xl text-[var(--neon-pink)] opacity-25 select-none hidden md:block">
        &#9733;
      </span>
      <span className="absolute top-[70%] right-[8%] text-3xl md:text-5xl text-[var(--neon-pink)] opacity-35 select-none hidden sm:block">
        &#9733;
      </span>
      <span className="absolute top-[40%] left-[85%] text-xl md:text-3xl text-[var(--neon-pink)] opacity-20 select-none hidden lg:block">
        &#9733;
      </span>
      <span className="absolute top-[85%] left-[20%] text-2xl md:text-4xl text-[var(--neon-pink)] opacity-30 select-none hidden md:block">
        &#9733;
      </span>

      {/* Main content */}
      <div className="flex flex-col items-center text-center z-10 max-w-[1190px] w-full">
        {/* Eyebrow with gradient lines */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div
            className="h-px w-12"
            style={{ background: 'linear-gradient(90deg, transparent, var(--neon-pink))' }}
          />
          <span
            className="text-[var(--neon-pink)]"
            style={{ letterSpacing: '0.2em', fontSize: '11px' }}
          >
            Archive.org by Albums
          </span>
          <div
            className="h-px w-12"
            style={{ background: 'linear-gradient(90deg, var(--neon-pink), transparent)' }}
          />
        </div>

        {/* Main logo with gold period accent */}
        <h1 className="mb-4">
          <span
            className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-[var(--text)]"
            style={{ fontFamily: 'system-ui' }}
          >
            8PM
          </span>
          <span
            className="text-7xl md:text-8xl lg:text-9xl font-black text-[var(--neon-pink)]"
          >
            .
          </span>
          <span
            className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-[var(--text)]"
            style={{ fontFamily: 'system-ui' }}
          >
            ME
          </span>
        </h1>

        {/* Tagline */}
        <p
          className="text-sm mb-10 text-[var(--text-dim)]"
          style={{ letterSpacing: '0.35em' }}
        >
          'Take me to another time'
          <svg className="inline-block ml-2 -mt-1" width="42" height="42" viewBox="0 0 64 64" aria-label="rooster">
            <path d="M8 38 C4 28 6 16 12 10 L14 24 L16 12 C18 18 18 26 16 34 Z" fill="#922b21"/>
            <path d="M12 36 C9 28 10 18 14 12 L16 22 Z" fill="#c0392b"/>
            <ellipse cx="26" cy="36" rx="14" ry="9.5" fill="#c0392b"/>
            <path d="M18 32 C16 36 17 41 20 43 C22 40 24 36 22 32 Z" fill="#a93226"/>
            <path d="M35 30 C36 26 37 22 38 19 L40 19 C39 23 38 27 37 31 Z" fill="#c0392b"/>
            <circle cx="39" cy="16" r="5.5" fill="#c0392b"/>
            <path d="M36 11 L37.5 5 L39 9 L40.5 4 L42 9 L43.5 6 L43 12 Z" fill="#e74c3c"/>
            <circle cx="40.5" cy="14.5" r="1.3" fill="#1a1714"/>
            <circle cx="41" cy="14.2" r="0.4" fill="#fff"/>
            <polygon points="44,15.5 50,17 44,18.5" fill="#d4a050"/>
            <path d="M39 20 C40 22 39 24.5 37 24 C36 22 37 20.5 39 20 Z" fill="#e74c3c"/>
            <line x1="22" y1="45" x2="20" y2="55" stroke="#d4a050" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="30" y1="44.5" x2="31" y2="55" stroke="#d4a050" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M16 56 L20 54.5 L22 57" stroke="#d4a050" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M27 57 L31 54.5 L33 57" stroke="#d4a050" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </p>

        {/* Algorithm Selector outside the border */}
        <div className="mb-4 flex justify-center">
          <AlgorithmSelector />
        </div>

        {/* Bordered lineup container */}
        <div className="w-full mb-6 md:mb-8">
          <div
            className="relative rounded-xl p-4 md:p-8"
            style={{
              border: '1px solid rgba(212, 160, 96, 0.25)',
              background: 'linear-gradient(180deg, rgba(212, 160, 96, 0.06) 0%, rgba(212, 160, 96, 0.02) 40%, transparent 100%)'
            }}
          >

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 rounded-tl-xl" style={{ borderColor: 'rgba(212, 160, 96, 0.5)' }} />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 rounded-tr-xl" style={{ borderColor: 'rgba(212, 160, 96, 0.5)' }} />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 rounded-bl-xl" style={{ borderColor: 'rgba(212, 160, 96, 0.5)' }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 rounded-br-xl" style={{ borderColor: 'rgba(212, 160, 96, 0.5)' }} />

            {/* Artist names */}
            <div
              ref={containerRef}
              className="flex flex-wrap items-baseline justify-center gap-x-2 md:gap-x-4 gap-y-2 text-[var(--text)] font-bold uppercase tracking-[1px] md:tracking-[2px]"
            >
              {lineupArtists.map((artist, index) => {
                const fontSize = getFontSize(artist);
                return (
                  <motion.span
                    key={artist.slug}
                    ref={setItemRef(index)}
                    layout
                    transition={{
                      layout: {
                        duration: prefersReducedMotion ? 0 : 0.4,
                        ease: 'easeOut',
                      },
                    }}
                    onLayoutAnimationComplete={handleLayoutAnimationComplete}
                    className="flex items-baseline whitespace-nowrap"
                  >
                    {/* Star separator - starts invisible, JS reveals appropriate ones after measurement */}
                    {index > 0 && (
                      <span
                        ref={setStarRef(index)}
                        className="text-[var(--neon-pink)] mr-2 md:mr-4 text-base invisible"
                      >
                        &#9733;
                      </span>
                    )}
                    <span className="relative group inline-block">
                      <Link
                        href={`/artists/${artist.slug}`}
                        className="artist-name-hover"
                        style={{
                          fontSize: `clamp(${fontSize.min}rem, calc(${fontSize.base.toFixed(3)}rem + ${fontSize.slope.toFixed(3)}vw), ${fontSize.max}rem)`,
                        }}
                      >
                        {artist.name}
                      </Link>
                      <ArtistStatsTooltip
                        totalShows={artist.totalShows}
                        mostPlayedTrack={artist.mostPlayedTrack}
                        totalRecordings={artist.totalRecordings}
                        totalHours={artist.totalHours}
                        totalVenues={artist.totalVenues}
                        formationYear={artist.formationYear}
                      />
                    </span>
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-center mt-4 md:mt-6">
          <div>
            <div className="text-xl md:text-3xl font-bold text-[var(--campfire-teal)]">10,000+</div>
            <div className="text-[10px] md:text-xs text-[var(--text-dim)] uppercase tracking-[1px] md:tracking-[2px] mt-0.5">
              Live Shows
            </div>
          </div>
          <div>
            <div className="text-xl md:text-3xl font-bold text-[var(--campfire-teal)]">50+</div>
            <div className="text-[10px] md:text-xs text-[var(--text-dim)] uppercase tracking-[1px] md:tracking-[2px] mt-0.5">
              Years of Music
            </div>
          </div>
          <div>
            <div className="text-xl md:text-3xl font-bold text-[var(--campfire-teal)]">Free</div>
            <div className="text-[10px] md:text-xs text-[var(--text-dim)] uppercase tracking-[1px] md:tracking-[2px] mt-0.5">
              Forever
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <a
          href="https://archive.org/details/etree"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--text-dim)] text-[10px] md:text-xs tracking-[2px] md:tracking-[4px] uppercase opacity-50 mt-6 md:mt-8 hover:opacity-80 hover:text-[var(--campfire-teal)] transition-all duration-200"
        >
          Powered by Archive.org
        </a>
      </div>
    </section>
  );
}
