import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  StepNumber,
  LightbulbIcon,
  SearchIcon,
  PlaylistIcon,
  PlayIcon,
  ShareIcon,
  QuestionIcon,
} from '@/components/icons/FooterIcons';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how to use 8pm.me to discover and enjoy thousands of free live concert recordings. Browse artists, search shows, create playlists, and stream music from Archive.org.',
  alternates: {
    canonical: '/how-it-works',
  },
};

// Step data
const steps = [
  {
    number: 1,
    title: 'Browse Artists',
    description: 'Start by exploring our collection of jam bands and live music artists. Each artist page shows their available recordings, organized by date and venue.',
  },
  {
    number: 2,
    title: 'Search Shows',
    description: "Looking for something specific? Use the search feature to find shows by artist, date, venue, or even specific songs. Our advanced search helps you narrow down exactly what you're looking for.",
  },
  {
    number: 3,
    title: 'Create MiniDiscs',
    description: "Found a great show or track? Add it to your library or create custom minidiscs. Your minidiscs are saved locally in your browser, so they're always available when you return.",
  },
  {
    number: 4,
    title: 'Listen & Enjoy',
    description: 'Stream recordings directly from Archive.org. Use keyboard shortcuts for quick controls, enable crossfade for seamless transitions, or set a sleep timer for late-night listening.',
  },
  {
    number: 5,
    title: 'Share the Love',
    description: 'All recordings on 8pm.me are freely shareable. Send links to friends, share on social media, or download tracks for offline listening. Remember: please copy freely — never sell.',
  },
];

// Tips data
const tips = [
  { key: 'Space', action: 'to play/pause' },
  { key: 'N', action: 'for next track' },
  { key: 'P', action: 'for previous track' },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-12 md:py-16">
      {/* Header with icon */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-surface-card rounded-lg border border-default">
          <PlayIcon className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-accent tracking-tight">
          How It Works
        </h1>
      </div>

      <p className="text-secondary text-lg mb-10">
        8pm.me makes it easy to discover and enjoy thousands of live concert recordings
        from Archive.org. Here's how to get started:
      </p>

      {/* Steps with visual timeline */}
      <div className="space-y-6 mb-12">
        {steps.map((step, index) => (
          <div key={step.number} className="relative">
            {/* Connector line - only show if not last item */}
            {index < steps.length - 1 && (
              <div
                className="absolute left-5 top-14 w-0.5 h-[calc(100%-16px)] bg-gradient-to-b from-accent to-border"
                aria-hidden="true"
              />
            )}

            <div className="flex gap-4 md:gap-6">
              {/* Step number circle */}
              <StepNumber number={step.number} />

              {/* Content card */}
              <div className="flex-1 bg-surface-card border border-default rounded-lg p-5 md:p-6">
                <h2 className="text-xl font-semibold text-accent mb-2">
                  {step.title}
                </h2>
                <p className="text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips & Tricks Section */}
      <div className="bg-surface-card border border-default rounded-lg p-6 md:p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <LightbulbIcon className="w-6 h-6 text-accent" />
          <h2 className="text-2xl font-semibold text-accent">
            Tips & Tricks
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Keyboard shortcuts */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-accent uppercase tracking-wider mb-3">
              Keyboard Shortcuts
            </h3>
            {tips.map(tip => (
              <div key={tip.key} className="flex items-center gap-3">
                <kbd className="px-2.5 py-1.5 bg-surface-base rounded border border-default text-accent text-sm font-mono min-w-[40px] text-center">
                  {tip.key}
                </kbd>
                <span className="text-secondary text-sm">{tip.action}</span>
              </div>
            ))}
          </div>

          {/* Quick tips */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-accent uppercase tracking-wider mb-3">
              Pro Tips
            </h3>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span className="text-secondary text-sm">Like songs to find them later in your library</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span className="text-secondary text-sm">Enable crossfade for smooth transitions</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span className="text-secondary text-sm">Check recently played to pick up where you left off</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-card border border-default rounded-lg p-4 text-center">
          <SearchIcon className="w-8 h-8 text-accent mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-accent mb-1">Search</h3>
          <p className="text-xs text-secondary">Find any show instantly</p>
        </div>
        <div className="bg-surface-card border border-default rounded-lg p-4 text-center">
          <PlaylistIcon className="w-8 h-8 text-accent mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-accent mb-1">MiniDiscs</h3>
          <p className="text-xs text-secondary">Organize your favorites</p>
        </div>
        <div className="bg-surface-card border border-default rounded-lg p-4 text-center">
          <ShareIcon className="w-8 h-8 text-accent mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-accent mb-1">Share</h3>
          <p className="text-xs text-secondary">Spread the music</p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-inverse font-semibold rounded hover:bg-accent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        >
          <QuestionIcon className="w-5 h-5" />
          Read the FAQ
        </Link>
      </div>

      <div className="pt-8 text-center">
        <Link
          href="/"
          className="text-sm text-secondary hover:text-accent transition-colors duration-200"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
