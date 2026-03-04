'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStarOverlay } from '@/hooks/useStarOverlay';
import { useFestivalSort } from '@/hooks/useFestivalSort';
import DecorativeStars from '@/components/DecorativeStars';
import AlgorithmSelector from '@/components/AlgorithmSelector';
import EightPmLogo from '@/components/EightPmLogo';

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
            color: 'var(--quinary, #d35400)',
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
                <div className="font-bebas-neue" style={{ fontSize: '1.5rem', color: 'var(--tertiary)', lineHeight: 1 }}>
                  {totalShows.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-subdued)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Shows
                </div>
              </div>
            )}
            {totalRecordings !== undefined && (
              <div className="text-center flex-1">
                <div className="font-bebas-neue" style={{ fontSize: '1.5rem', color: 'var(--tertiary)', lineHeight: 1 }}>
                  {totalRecordings.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-subdued)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Recordings
                </div>
              </div>
            )}
            {totalVenues !== undefined && (
              <div className="text-center flex-1">
                <div className="font-bebas-neue" style={{ fontSize: '1.5rem', color: 'var(--tertiary)', lineHeight: 1 }}>
                  {totalVenues.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-subdued)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                color: 'var(--text-subdued)',
                borderTop: '1px dashed var(--border-subtle, #c4a882)',
                paddingTop: '6px',
              }}
            >
              Top Track: <strong style={{ color: 'var(--quinary, #d35400)' }}>{mostPlayedTrack}</strong>
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
              <div className="font-bebas-neue" style={{ fontSize: '2.2rem', color: 'var(--tertiary)', lineHeight: 1 }}>
                {totalHours.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-subdued)', textTransform: 'uppercase' }}>
                Hours
              </div>
            </>
          )}
          {formationYear !== undefined && !totalHours && (
            <>
              <div className="font-bebas-neue" style={{ fontSize: '1.5rem', color: 'var(--tertiary)', lineHeight: 1 }}>
                {formationYear}
              </div>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-subdued)', textTransform: 'uppercase' }}>
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
  const { sortedArtists, algorithm, isAlphaMode } = useFestivalSort();

  // Use sortedArtists from context instead of local sorting
  const lineupArtists = sortedArtists.length > 0 ? sortedArtists : artists;

  const { containerRef, stars, starsReady, hideStars, drawStars } =
    useStarOverlay();

  // Pill click OR alpha-mode toggle: hide stars, wait for animation, redraw
  const sortKey = `${algorithm}-${isAlphaMode}`;
  const prevSortKeyRef = useRef(sortKey);
  const sortTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (prevSortKeyRef.current !== sortKey) {
      prevSortKeyRef.current = sortKey;
      hideStars();
      if (sortTimerRef.current) clearTimeout(sortTimerRef.current);
      sortTimerRef.current = setTimeout(() => {
        drawStars();
        sortTimerRef.current = null;
      }, prefersReducedMotion ? 50 : 500);
    }
    return () => {
      if (sortTimerRef.current) clearTimeout(sortTimerRef.current);
    };
  }, [sortKey, hideStars, drawStars, prefersReducedMotion]);

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
      <DecorativeStars />

      {/* Main content */}
      <div className="flex flex-col items-center text-center z-10 max-w-[1190px] w-full">
        {/* Tagline with icon */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="flex flex-col items-center">
            <span
              className="text-[var(--text-dim)] text-sm"
              style={{ letterSpacing: '0.35em' }}
            >
              Take me to another place she said
            </span>
            <span
              className="text-[var(--text-dim)] text-sm"
              style={{ letterSpacing: '0.35em' }}
            >
              Take me to another time
            </span>
          </div>
          <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-[42px] md:h-[42px] flex-shrink-0" viewBox="0 0 64 64" aria-label="rooster">
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
        </div>

        {/* Wordmark logo with aurora bars */}
        <div className="mb-2 flex justify-center">
          <EightPmLogo size={90} />
        </div>

        {/* Archive.org attribution under 8PM.ME with gradient lines */}
        <div className="mb-6 md:mb-8 flex items-center justify-center gap-3">
          <div
            className="h-px w-12"
            style={{ background: 'linear-gradient(90deg, transparent, var(--secondary))' }}
          />
          <span
            className="text-[var(--secondary)] text-sm"
            style={{ letterSpacing: '0.2em' }}
          >
            it's Archive.org but by Album
          </span>
          <div
            className="h-px w-12"
            style={{ background: 'linear-gradient(90deg, var(--secondary), transparent)' }}
          />
        </div>

        {/* Algorithm Selector - appears under tagline */}
        <div className="mb-6 md:mb-8 flex justify-center w-full">
          <AlgorithmSelector />
        </div>

        {/* Roster (Bordered lineup container) */}
        <div className="w-full mb-6 md:mb-8 flex justify-center">
            <div
              className="relative rounded-xl p-4 md:p-8"
              style={{
                border: '1px solid var(--accent-border-decorative)',
                background: 'linear-gradient(180deg, var(--accent-gradient-warm) 0%, var(--accent-gradient-faint) 40%, transparent 100%)'
              }}
            >

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 rounded-tl-xl" style={{ borderColor: 'var(--accent-border-strong)' }} />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 rounded-tr-xl" style={{ borderColor: 'var(--accent-border-strong)' }} />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 rounded-bl-xl" style={{ borderColor: 'var(--accent-border-strong)' }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 rounded-br-xl" style={{ borderColor: 'var(--accent-border-strong)' }} />

            {/* Artist names */}
            <div
              ref={containerRef}
              className="relative flex flex-wrap items-baseline justify-center gap-x-8 md:gap-x-14 gap-y-2 text-[var(--text)] font-bold uppercase tracking-[1px] md:tracking-[2px]"
            >
              {lineupArtists.map((artist, index) => {
                const fontSize = getFontSize(artist);
                return (
                  <span
                    key={artist.slug}
                    className="whitespace-nowrap"
                    style={{
                      transition: prefersReducedMotion ? 'none' : 'transform 0.4s ease-out, opacity 0.4s ease-out',
                    }}
                  >
                    <span className="relative group inline-block">
                      <Link
                        href={`/artists/${artist.slug}`}
                        className="artist-name-hover"
                        style={{
                          fontSize: `clamp(${fontSize.min}rem, calc(${fontSize.base.toFixed(3)}rem + ${fontSize.slope.toFixed(3)}vw), ${fontSize.max}rem)`,
                          wordSpacing: '-0.25em',
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
                  </span>
                );
              })}

              {/* Star overlay — absolute positioned, removed from flex flow, non-interactive */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                aria-hidden="true"
              >
                {stars.map((star) => (
                  <span
                    key={star.key}
                    className="absolute text-[var(--secondary)] font-bold"
                    style={{
                      left: `${star.left}px`,
                      top: `${star.top}px`,
                      fontSize: `${star.fontSize}px`,
                      transform: 'translate(-50%, -50%)',
                      opacity: starsReady ? 1 : 0,
                      transition: prefersReducedMotion
                        ? 'none'
                        : `opacity ${starsReady ? '0.3s' : '0.15s'} ease-in`,
                    }}
                  >
                    &#9733;
                  </span>
                ))}
              </div>
            </div>
            </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-center mt-4 md:mt-6">
          <div>
            <div className="text-xl md:text-3xl font-bold text-[var(--tertiary)]">10,000+</div>
            <div className="text-[10px] md:text-xs text-[var(--text-dim)] uppercase tracking-[1px] md:tracking-[2px] mt-0.5">
              Live Shows
            </div>
          </div>
          <div>
            <div className="text-xl md:text-3xl font-bold text-[var(--tertiary)]">50+</div>
            <div className="text-[10px] md:text-xs text-[var(--text-dim)] uppercase tracking-[1px] md:tracking-[2px] mt-0.5">
              Years of Music
            </div>
          </div>
          <div>
            <div className="text-xl md:text-3xl font-bold text-[var(--tertiary)]">Free</div>
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
          className="text-[var(--text-dim)] text-[10px] md:text-xs tracking-[2px] md:tracking-[4px] uppercase opacity-50 mt-6 md:mt-8 hover:opacity-80 hover:text-[var(--tertiary)] transition-all duration-200"
        >
          Powered by Archive.org
        </a>
      </div>
    </section>
  );
}
