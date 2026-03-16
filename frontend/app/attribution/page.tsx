'use client';

import Link from 'next/link';
import {
  HeartIcon,
  ExternalLinkIcon,
  MusicNoteIcon,
  CodeIcon,
} from '@/components/icons/FooterIcons';

const sources = [
  {
    title: 'Music',
    icon: MusicNoteIcon,
    description:
      'All concert recordings are sourced from the Live Music Archive on Archive.org. These recordings are shared by volunteer tapers under community-approved licenses.',
    links: [
      { label: 'Archive.org', href: 'https://archive.org' },
      {
        label: 'Live Music Archive',
        href: 'https://archive.org/details/etree',
      },
    ],
  },
  {
    title: 'Artist Art',
    description:
      'Artist thumbnail images are sourced from Wikipedia via the REST API. Images are used under their respective Creative Commons or public domain licenses.',
    links: [{ label: 'Wikipedia', href: 'https://www.wikipedia.org' }],
  },
  {
    title: 'Album Art',
    description:
      'Album cover artwork is sourced from Wikipedia via their API. Cover images are used under fair use for identification purposes.',
    links: [{ label: 'Wikipedia', href: 'https://www.wikipedia.org' }],
  },
  {
    title: 'Content',
    description:
      'Artist biographies, metadata, genres, and origin information are sourced from Wikipedia. Show metadata, ratings, reviews, and download statistics come from Archive.org.',
    links: [
      { label: 'Wikipedia', href: 'https://www.wikipedia.org' },
      { label: 'Archive.org', href: 'https://archive.org' },
    ],
  },
  {
    title: 'Source Code',
    icon: CodeIcon,
    description:
      '8pm is open source. You can view the code, report issues, and contribute on GitHub.',
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/8pm-me/8pm-pwa',
      },
    ],
  },
];

export default function AttributionPage() {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-12 md:py-16">
      {/* Header with icon */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-surface-card rounded-lg border border-default">
          <HeartIcon className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-accent tracking-tight">
          Attribution
        </h1>
      </div>

      <div className="space-y-6 text-secondary leading-relaxed">
        {/* Intro */}
        <p className="text-lg">
          8pm is built on the generous work of open communities. We want to
          credit the sources that make this project possible.
        </p>

        {/* Source sections */}
        {sources.map((source) => (
          <div
            key={source.title}
            className="bg-surface-card border border-default rounded-lg p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              {source.icon ? (
                <source.icon className="w-7 h-7 text-accent flex-shrink-0 mt-0.5" />
              ) : (
                <ExternalLinkIcon className="w-7 h-7 text-accent flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h2 className="text-xl font-semibold text-accent mb-2">
                  {source.title}
                </h2>
                <p className="mb-3">{source.description}</p>
                <div className="flex flex-wrap gap-3">
                  {source.links.map((link) => (
                    <a
                      key={link.href + link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-secondary hover:text-accent transition-colors inline-flex items-center gap-1.5"
                    >
                      {link.label}
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Back link */}
        <div className="pt-4 text-center">
          <Link
            href="/"
            className="text-sm text-secondary hover:text-accent transition-colors duration-200"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
