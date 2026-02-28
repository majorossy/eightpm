'use client';

import { useState } from 'react';

interface ArtistFAQProps {
  artistName: string;
  totalShows?: number;
  yearsActive?: string;
  genres?: string[];
  originLocation?: string;
  mostPlayedTrack?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

/**
 * ArtistFAQ - Dynamic FAQ section for artist pages
 *
 * Purpose: Generate artist-specific FAQ content for voice search optimization
 * SEO Benefits:
 * - Targets long-tail "how to..." and "what is..." queries
 * - Eligible for Google's Featured Snippets
 * - Improves voice search discoverability
 * - Increases page content and dwell time
 */
export default function ArtistFAQ({
  artistName,
  totalShows,
  yearsActive,
  genres,
  originLocation,
  mostPlayedTrack,
}: ArtistFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Generate dynamic FAQ questions based on artist data
  const generateFAQs = (): FAQItem[] => {
    const faqs: FAQItem[] = [];

    // How to listen to recordings
    faqs.push({
      question: `How can I listen to ${artistName} live recordings for free?`,
      answer: `8pm.me streams ${totalShows ? `${totalShows.toLocaleString()} ` : ''}${artistName} concert recordings for free, sourced from Archive.org. No subscription or account required. Simply browse to the ${artistName} artist page and select any show to start listening instantly.`,
    });

    // Best shows question
    faqs.push({
      question: `What are the best ${artistName} live shows to listen to?`,
      answer: `The best ${artistName} shows often feature extended improvisational jams and high-energy performances. ${mostPlayedTrack ? `"${mostPlayedTrack}" is one of the most popular tracks. ` : ''}Check the ratings and download counts on each recording - shows with higher ratings typically represent standout performances. Soundboard recordings often offer the best audio quality.`,
    });

    // Are recordings legal
    faqs.push({
      question: `Are these ${artistName} live recordings legal to stream?`,
      answer: `Yes! All ${artistName} recordings on 8pm.me are sourced from Archive.org, which hosts concerts with permission from artists who allow fan taping and trading. ${artistName}${genres?.includes('jam band') || genres?.includes('Jam band') ? ', like many jam bands,' : ''} encourages fans to record and share live performances as part of the taping culture.`,
    });

    // Recording quality
    faqs.push({
      question: `What recording quality can I expect from ${artistName} shows?`,
      answer: `Recording quality varies. Soundboard (SBD) recordings offer direct mixing board captures with excellent clarity. Audience (AUD) recordings capture the venue atmosphere but may have crowd noise. Matrix recordings blend soundboard and audience sources. Each recording shows the source type so you can choose your preferred quality.`,
    });

    // Years active / history
    if (yearsActive || originLocation) {
      faqs.push({
        question: `When was ${artistName} formed and where are they from?`,
        answer: `${artistName}${originLocation ? ` is from ${originLocation}` : ''}${yearsActive ? ` and has been active ${yearsActive}` : ''}. Their extensive touring history${totalShows ? `, documented in over ${totalShows.toLocaleString()} live recordings,` : ''} showcases their evolution as a live act.`,
      });
    }

    // Download vs stream
    faqs.push({
      question: `Can I download ${artistName} recordings or only stream them?`,
      answer: `8pm.me is designed for free streaming. For downloads, each show links to the original Archive.org page where you can download in multiple formats including MP3, FLAC, and Ogg Vorbis. Downloads from Archive.org are also free.`,
    });

    return faqs;
  };

  const faqs = generateFAQs();

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mt-12 pt-8 border-t border-default/30">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
        Frequently Asked Questions About {artistName}
      </h2>
      <p className="text-sm text-secondary mb-6">
        Common questions about streaming {artistName} live recordings on 8pm.me
      </p>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-surface-elevated rounded-lg border border-default/30 overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-border transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="text-primary text-sm md:text-base font-medium">
                {faq.question}
              </span>
              <span
                className={`text-accent transition-transform duration-200 flex-shrink-0 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>
            {openIndex === index && (
              <div className="px-5 pb-4">
                <p className="text-secondary text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Generate FAQ schema for structured data
 * Use this in the page component for SEO
 */
export function generateArtistFAQSchema(
  artistName: string,
  totalShows?: number,
  yearsActive?: string,
  genres?: string[],
  originLocation?: string,
  mostPlayedTrack?: string
) {
  const faqs = [
    {
      question: `How can I listen to ${artistName} live recordings for free?`,
      answer: `8pm.me streams ${totalShows ? `${totalShows.toLocaleString()} ` : ''}${artistName} concert recordings for free, sourced from Archive.org. No subscription or account required. Simply browse to the ${artistName} artist page and select any show to start listening instantly.`,
    },
    {
      question: `What are the best ${artistName} live shows to listen to?`,
      answer: `The best ${artistName} shows often feature extended improvisational jams and high-energy performances. ${mostPlayedTrack ? `"${mostPlayedTrack}" is one of the most popular tracks. ` : ''}Check the ratings and download counts on each recording - shows with higher ratings typically represent standout performances.`,
    },
    {
      question: `Are these ${artistName} live recordings legal to stream?`,
      answer: `Yes! All ${artistName} recordings on 8pm.me are sourced from Archive.org, which hosts concerts with permission from artists who allow fan taping and trading.`,
    },
  ];

  // Add origin/years question if data exists
  if (yearsActive || originLocation) {
    faqs.push({
      question: `When was ${artistName} formed and where are they from?`,
      answer: `${artistName}${originLocation ? ` is from ${originLocation}` : ''}${yearsActive ? ` and has been active ${yearsActive}` : ''}.`,
    });
  }

  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
