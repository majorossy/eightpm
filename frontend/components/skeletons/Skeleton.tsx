export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded ${className}`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 ${className}`}>
      <Skeleton className="w-full aspect-square rounded mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonTrack() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-10 h-10 rounded" />
      <div className="flex-1">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-4 w-12 hidden md:block" />
    </div>
  );
}

export function SkeletonArtistHeader() {
  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
        <Skeleton className="w-48 h-48 rounded-full" />
        <div className="flex-1 text-center md:text-left">
          <Skeleton className="h-8 w-48 mb-4 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonAlbumGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonCassette() {
  return (
    <div className="w-[280px] h-[180px] rounded-lg skeleton border-2 border-border">
      {/* Label area */}
      <div className="mx-6 mt-4 h-[72px] rounded bg-surface-sunken" />
      {/* Tape window */}
      <div
        className="mx-auto mt-3 w-[200px] h-[52px] rounded flex items-center justify-between px-4"
        style={{ background: 'color-mix(in srgb, var(--surface-sunken) 70%, black)' }}
      >
        <div className="w-10 h-10 rounded-full bg-surface-card border-2 border-default" />
        <div className="w-10 h-10 rounded-full bg-surface-card border-2 border-default" />
      </div>
    </div>
  );
}

export function SkeletonMiniCassette() {
  return (
    <div
      className="w-full rounded-lg overflow-hidden border border-default"
      style={{
        aspectRatio: '280 / 180',
        background: 'linear-gradient(180deg, var(--surface-elevated), var(--surface-card))',
      }}
    >
      {/* Header band */}
      <div className="h-5 mx-3 mt-3 rounded-sm skeleton" />
      {/* Label area */}
      <div className="mx-3 mt-1.5 h-10 rounded-sm skeleton" />
      {/* Tape window */}
      <div
        className="mx-auto mt-2 rounded flex items-center justify-between px-3"
        style={{
          width: '72%',
          height: '28%',
          background: 'color-mix(in srgb, var(--surface-sunken) 70%, black)',
        }}
      >
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-surface-card border border-default" />
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-surface-card border border-default" />
      </div>
    </div>
  );
}

export function SkeletonTapeTrackRow() {
  return (
    <div
      className="flex items-center gap-3 px-2 py-2.5"
      style={{ borderBottom: '1px solid color-mix(in srgb, var(--text-primary) 6%, transparent)' }}
    >
      <Skeleton className="w-6 h-4 rounded" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-36 sm:w-48 mb-1 rounded" />
        <Skeleton className="h-3 w-24 sm:w-32 rounded" />
      </div>
      <Skeleton className="h-3 w-10 rounded hidden sm:block" />
    </div>
  );
}

export function SkeletonAlbumPage() {
  return (
    <div className="min-h-screen font-serif text-primary">
      {/* My Cassettes grid */}
      <div className="max-w-[850px] mx-auto px-4 sm:px-8 pt-8">
        <div className="w-full mt-2 mb-6">
          <Skeleton className="h-3 w-24 mx-auto mb-3 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonMiniCassette key={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="max-w-[740px] mx-auto px-4 sm:px-8 flex flex-col items-center">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <Skeleton className="h-11 w-40 rounded-full" />
          <Skeleton className="h-11 w-40 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>

        {/* Cassette tape shell */}
        <div className="tape-shell">
          {/* Label skeleton */}
          <div className="tape-label">
            <div className="h-6 sm:h-7 skeleton rounded-none" />
            <div className="px-4 py-3 sm:py-4" style={{ background: 'var(--cream)' }}>
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 sm:h-6 w-48 mb-2 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
                <div
                  className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 skeleton rounded-sm"
                  style={{
                    background: 'color-mix(in srgb, var(--cream) 70%, var(--surface-card))',
                    transform: 'rotate(6deg)',
                  }}
                />
              </div>
            </div>
            <div className="h-5 sm:h-6 skeleton rounded-none" />
          </div>

          {/* Track list inside tape body */}
          <div className="tape-body">
            <div className="tape-track-scroll">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonTapeTrackRow key={i} />
              ))}
            </div>
          </div>

          {/* Reels */}
          <div className="tape-reels">
            <div className="flex-1 flex justify-center">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-card"
                style={{ border: '2px solid var(--surface-elevated)' }}
              />
            </div>
            <div className="flex-1 flex justify-center">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-card"
                style={{ border: '2px solid var(--surface-elevated)' }}
              />
            </div>
          </div>

          {/* Side indicators */}
          <div className="flex items-center justify-between px-3 pb-1">
            <Skeleton className="h-2 w-12 rounded" />
            <Skeleton className="h-2 w-12 rounded" />
          </div>
        </div>

        {/* Fire glow */}
        <div className="cassette-glow" />
      </div>
    </div>
  );
}

// ============================================
// Page-Specific Skeletons (match actual layouts)
// ============================================

// Festival Hero skeleton - matches the FestivalHero component layout
export function SkeletonFestivalHero() {
  // Generate varied widths for artist name placeholders
  const artistWidths = [
    'w-16', 'w-28', 'w-40', 'w-20', 'w-24', 'w-32', 'w-20', 'w-36',
    'w-28', 'w-24', 'w-44', 'w-20', 'w-32', 'w-24', 'w-28', 'w-20',
    'w-36', 'w-24', 'w-28', 'w-32', 'w-20', 'w-40', 'w-24', 'w-28',
    'w-32', 'w-20', 'w-24', 'w-36', 'w-20', 'w-28', 'w-24', 'w-32',
    'w-20', 'w-40', 'w-24',
  ];

  // Generate varied heights for the "lineup" text sizes
  const artistHeights = [
    'h-6', 'h-5', 'h-7', 'h-4', 'h-5', 'h-6', 'h-4', 'h-5',
    'h-5', 'h-4', 'h-6', 'h-4', 'h-5', 'h-4', 'h-5', 'h-4',
    'h-5', 'h-4', 'h-5', 'h-4', 'h-4', 'h-5', 'h-4', 'h-4',
    'h-5', 'h-4', 'h-4', 'h-5', 'h-4', 'h-4', 'h-4', 'h-5',
    'h-4', 'h-5', 'h-4',
  ];

  return (
    <section
      className="flex flex-col items-center relative overflow-hidden pt-0.5 pb-4 px-4 md:pt-1 md:pb-6 md:px-10"
      style={{
        background: `
          radial-gradient(ellipse at 50% 120%, color-mix(in srgb, var(--accent-primary) 12%, transparent) 0%, transparent 50%),
          radial-gradient(ellipse at 30% 80%, color-mix(in srgb, var(--accent-primary) 6%, transparent) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 90%, color-mix(in srgb, var(--accent-primary) 5%, transparent) 0%, transparent 35%),
          linear-gradient(180deg, var(--surface-base) 0%, var(--surface-base) 100%)
        `,
      }}
    >
      {/* Decorative stars - static, not animated */}
      <span className="absolute top-[15%] left-[10%] text-4xl md:text-6xl text-accent opacity-20 select-none hidden sm:block">
        &#9733;
      </span>
      <span className="absolute top-[20%] right-[15%] text-3xl md:text-5xl text-accent opacity-15 select-none">
        &#9733;
      </span>
      <span className="absolute top-[60%] left-[5%] text-2xl md:text-4xl text-accent opacity-12 select-none hidden md:block">
        &#9733;
      </span>
      <span className="absolute top-[70%] right-[8%] text-3xl md:text-5xl text-accent opacity-18 select-none hidden sm:block">
        &#9733;
      </span>

      {/* Main content */}
      <div className="flex flex-col items-center text-center z-10 max-w-4xl w-full">
        {/* Top decoration - "LIVE FROM THE ARCHIVE" */}
        <Skeleton className="h-4 md:h-5 w-48 md:w-64 mb-2 md:mb-3 rounded" />

        {/* Main title - "CAMPFIRE TAPES" */}
        <div className="mb-2 md:mb-3">
          <Skeleton className="h-12 sm:h-16 md:h-20 lg:h-24 w-72 sm:w-96 md:w-[480px] lg:w-[560px] mb-2 rounded" />
          <Skeleton className="h-12 sm:h-16 md:h-20 lg:h-24 w-56 sm:w-72 md:w-[380px] lg:w-[440px] mx-auto rounded" />
        </div>

        {/* Subtitle - "STREAMING THE GRATEFUL DEAD & BEYOND" */}
        <Skeleton className="h-3 md:h-4 w-64 md:w-80 mb-4 md:mb-6 rounded" />

        {/* Tonight's lineup label */}
        <Skeleton className="h-3 md:h-4 w-32 md:w-40 mb-3 md:mb-4 rounded" />

        {/* Artist name cloud - varied sizes */}
        <div className="flex flex-wrap items-baseline justify-center gap-x-2 md:gap-x-4 gap-y-2 mb-4 md:mb-6 w-full px-2 max-w-3xl">
          {artistWidths.map((width, index) => (
            <Skeleton
              key={index}
              className={`${width} ${artistHeights[index]} rounded`}
            />
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4 md:mb-6 w-full sm:w-auto px-4 sm:px-0">
          <Skeleton className="h-12 md:h-14 w-full sm:w-48 md:w-52 rounded-full" />
          <Skeleton className="h-12 md:h-14 w-full sm:w-48 md:w-52 rounded-full" />
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          <div className="flex flex-col items-center">
            <Skeleton className="h-6 md:h-8 w-20 md:w-24 mb-1 rounded" />
            <Skeleton className="h-2 md:h-3 w-16 md:w-20 rounded" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-6 md:h-8 w-12 md:w-16 mb-1 rounded" />
            <Skeleton className="h-2 md:h-3 w-20 md:w-24 rounded" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-6 md:h-8 w-12 md:w-16 mb-1 rounded" />
            <Skeleton className="h-2 md:h-3 w-14 md:w-16 rounded" />
          </div>
        </div>
      </div>

      {/* Bottom decoration - "Powered by Archive.org" */}
      <Skeleton className="absolute bottom-3 md:bottom-4 h-2 md:h-3 w-36 md:w-44 rounded" />
    </section>
  );
}

// Album grid skeleton - matches the album cards grid on homepage
export function SkeletonAlbumGridHome() {
  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 mx-auto max-w-[1400px]">
      <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg overflow-hidden bg-surface-sunken"
            style={{ width: '140px' }}
          >
            <Skeleton className="w-full aspect-square" />
            <div className="p-2">
              <Skeleton className="h-4 w-full mb-1 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Full home page skeleton
export function SkeletonHomePage() {
  return (
    <div className="pb-8 max-w-[1800px]">
      <SkeletonFestivalHero />
      <SkeletonAlbumGridHome />
    </div>
  );
}

// Polaroid skeleton - matches PolaroidCard component
export function SkeletonPolaroid() {
  return (
    <div
      className="relative"
      style={{ width: 320, perspective: '1000px' }}
    >
      {/* Push pin - uses secondary accent color */}
      <div
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full z-10"
        style={{
          background: 'radial-gradient(circle at 30% 30%, var(--secondary), color-mix(in srgb, var(--secondary) 60%, black))',
          boxShadow: '0 3px 6px color-mix(in srgb, black 40%, transparent)',
        }}
      />

      {/* Polaroid frame - cream */}
      <div
        className="relative w-full"
        style={{
          height: 400,
          background: 'var(--cream)',
          borderRadius: 4,
          padding: 16,
          boxShadow: '0 8px 32px color-mix(in srgb, black 35%, transparent), 0 2px 8px color-mix(in srgb, black 20%, transparent)',
          transform: 'rotate(2deg)',
        }}
      >
        {/* Photo area - skeleton shimmer */}
        <div
          className="w-full mb-4 skeleton"
          style={{
            height: 290,
            background: 'color-mix(in srgb, var(--cream) 80%, var(--surface-card))',
          }}
        />

        {/* Caption skeleton */}
        <div className="flex justify-center">
          <div
            className="h-4 w-24 skeleton rounded"
            style={{
              background: 'color-mix(in srgb, var(--cream) 60%, var(--surface-card))',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Artist page cassette stack hero - with cassettes left, info center, polaroid right
export function SkeletonArtistHero() {
  return (
    <section className="relative px-4 md:px-8 pt-4 md:pt-6 pb-8 md:pb-12 overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-10 left-[5%] w-[400px] h-[350px] rounded-full opacity-[0.04]"
          style={{
            background: 'radial-gradient(ellipse, color-mix(in srgb, var(--accent-secondary) 60%, transparent) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute top-20 right-[10%] w-[300px] h-[400px] rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(ellipse, var(--accent-ambient) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* Main hero content */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 max-w-[1000px] mx-auto">
        {/* Cassette stack - 4 stacked cassettes (matches ArtistPageContent layout) */}
        <div className="relative w-[320px] h-[280px] flex-shrink-0">
          {/* Bottom cassettes (slightly visible) - matching actual offsets */}
          <div
            className="absolute"
            style={{ transform: 'translate(-15px, 60px) rotate(-8deg)' }}
          >
            <SkeletonCassette />
          </div>
          <div
            className="absolute"
            style={{ transform: 'translate(25px, 40px) rotate(5deg)' }}
          >
            <SkeletonCassette />
          </div>
          <div
            className="absolute"
            style={{ transform: 'translate(5px, 20px) rotate(-3deg)' }}
          >
            <SkeletonCassette />
          </div>
          {/* Top cassette */}
          <div
            className="absolute"
            style={{ transform: 'translate(15px, 0px) rotate(2deg)', zIndex: 10 }}
          >
            <SkeletonCassette />
          </div>

          {/* Fire glow beneath */}
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[250px] h-[60px] opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--accent-primary) 50%, transparent) 0%, color-mix(in srgb, var(--accent-primary) 20%, transparent) 40%, transparent 70%)',
              filter: 'blur(12px)',
            }}
          />
        </div>

        {/* Artist info - center */}
        <div className="flex-1 text-center lg:text-left">
          {/* Artist badge */}
          <Skeleton className="h-6 w-16 rounded-full mb-4 mx-auto lg:mx-0" />

          {/* Artist name */}
          <Skeleton className="h-10 md:h-12 lg:h-14 w-64 md:w-80 mb-2 mx-auto lg:mx-0 rounded" />

          {/* Full name subtitle */}
          <Skeleton className="h-5 w-48 mb-4 mx-auto lg:mx-0 rounded" />

          {/* Stats line */}
          <Skeleton className="h-4 w-56 mb-6 mx-auto lg:mx-0 rounded" />

          {/* Follow button */}
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
            <Skeleton className="w-11 h-11 rounded-full" />
          </div>

          {/* Quote callout */}
          <div className="relative pl-4 border-l-2 border-default max-w-md lg:-ml-32">
            <Skeleton className="h-4 w-full mb-2 rounded" />
            <Skeleton className="h-4 w-full mb-2 rounded" />
            <Skeleton className="h-4 w-3/4 mb-2 rounded" />
            <Skeleton className="h-3 w-24 mt-2 rounded" />
          </div>
        </div>

        {/* Polaroid Card - right side (desktop only) */}
        <div className="hidden lg:flex flex-shrink-0 items-start pt-8">
          <SkeletonPolaroid />
        </div>
      </div>
    </section>
  );
}

// Artist discography carousel
export function SkeletonDiscographyCarousel() {
  return (
    <section className="pb-8 max-w-[1000px] mx-auto px-4 md:px-8">
      <Skeleton className="h-7 w-32 mb-4 mx-auto rounded" />
      <div className="flex justify-center gap-4 md:gap-6 overflow-hidden pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]">
            <Skeleton className="w-full aspect-square rounded-lg mb-3" />
            <Skeleton className="h-4 w-3/4 mb-2 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

// Artist bio section with sidebar - matches two-column layout
export function SkeletonArtistBio() {
  return (
    <section className="max-w-[1000px] mx-auto px-4 md:px-8 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 lg:gap-12">
        {/* Left column: Bio, Stats, Members */}
        <div className="space-y-8 md:space-y-12">
          {/* Biography */}
          <div>
            <Skeleton className="h-7 w-28 mb-6 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
            <Skeleton className="h-3 w-40 mt-4 rounded" />
          </div>

          {/* Band Statistics grid */}
          <div>
            <Skeleton className="h-6 w-36 mb-4 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-surface-card rounded-lg p-4">
                  <Skeleton className="h-8 w-16 mb-2 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Band Members Timeline */}
          <div>
            <Skeleton className="h-6 w-32 mb-4 rounded" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 bg-surface-card rounded-lg p-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Sticky image gallery */}
        <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-surface-card rounded-lg overflow-hidden">
              <Skeleton className="w-full aspect-square" />
              <div className="p-3">
                <Skeleton className="h-3 w-full mb-1 rounded" />
                <Skeleton className="h-2 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Full artist page skeleton
export function SkeletonArtistPage() {
  return (
    <div className="min-h-screen bg-surface-base">
      <SkeletonArtistHero />
      <SkeletonDiscographyCarousel />
      <SkeletonArtistBio />
    </div>
  );
}

// Search page skeleton
export function SkeletonSearchPage() {
  return (
    <div className="min-h-screen bg-surface-base pb-[140px] md:pb-[90px]">
      <div className="max-w-[1000px] mx-auto">
        <div className="p-6 md:p-8 border-b border-default">
          <Skeleton className="h-10 w-32 mb-4" />
          <div className="relative max-w-2xl">
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        </div>
        <div className="px-6 md:px-8 py-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Info/legal page skeleton — shared by About, How It Works, FAQ, DMCA, Contact, Privacy, Cookie, Terms, Tapers
export function SkeletonInfoPage({ cardCount = 4 }: { cardCount?: number } = {}) {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-12 md:py-16">
      {/* Header with icon */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-lg skeleton" />
        <Skeleton className="h-10 md:h-12 w-56 md:w-72 rounded" />
      </div>

      {/* Intro paragraph */}
      <div className="mb-8">
        <Skeleton className="h-5 w-full mb-2 rounded" />
        <Skeleton className="h-5 w-3/4 rounded" />
      </div>

      {/* Content cards */}
      <div className="space-y-6">
        {Array.from({ length: cardCount }).map((_, i) => (
          <div key={i} className="bg-surface-card border border-default rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="h-6 w-40 rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Back link */}
      <div className="pt-8 text-center">
        <Skeleton className="h-4 w-28 mx-auto rounded" />
      </div>
    </div>
  );
}

// Playlists list skeleton
export function SkeletonPlaylistsPage() {
  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-6 md:py-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-12 w-40 rounded-full mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Playlist detail skeleton
export function SkeletonPlaylistDetail() {
  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
          <Skeleton className="w-48 h-48 rounded" />
          <div className="flex-1 text-center md:text-left">
            <Skeleton className="h-8 w-48 mb-4 mx-auto md:mx-0" />
            <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
          </div>
        </div>
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonTrack key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
