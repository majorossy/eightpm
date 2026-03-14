'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Accordion, AccordionGroup } from '@/components/Accordion';
import { QuestionIcon, SearchIcon, XMarkIcon } from '@/components/icons/FooterIcons';

// FAQ data structure
interface FAQItem {
  id: string;
  question: string;
  answer: string | React.ReactNode;
}

const faqData: FAQItem[] = [
  {
    id: 'free',
    question: 'Is 8pm.me really free?',
    answer: "Yes! 8pm.me is completely free to use. All recordings come from Archive.org, which hosts legally shareable live music. There are no subscriptions, no ads, and no hidden fees."
  },
  {
    id: 'recordings',
    question: 'Where do the recordings come from?',
    answer: "All recordings are hosted on Archive.org, a non-profit digital library. The live music collection contains thousands of shows recorded by fans (tapers) with permission from the artists. 8pm.me currently features 35+ artists from the jam band and live music scene."
  },
  {
    id: 'download',
    question: 'Can I download shows for offline listening?',
    answer: "8pm.me is built for streaming. For downloads, each recording links back to its original Archive.org page where you can download the full show in various formats (MP3, FLAC, OGG, etc.)."
  },
  {
    id: 'legal',
    question: 'Are these recordings legal?',
    answer: "Yes! All artists featured on 8pm.me allow or encourage taping and sharing of their live performances. This is a long-standing tradition in the jam band community that helps spread the music and build fan communities."
  },
  {
    id: 'account',
    question: 'Do I need to create an account?',
    answer: "No account is required — you can browse and listen immediately. Creating a free account lets you save Cassettes (favorite recording versions), build MiniDisc playlists, and sync your collection across devices."
  },
  {
    id: 'cassettes-minidiscs',
    question: 'What are Cassettes and MiniDiscs?',
    answer: "Cassettes save your preferred version of a recording — when multiple recordings of the same show exist, pick the one you like best. MiniDiscs are custom playlists you build from any tracks across any artist. Both sync to your account if you're signed in."
  },
  {
    id: 'color-coding',
    question: 'What do the different colors mean?',
    answer: (
      <div className="space-y-3">
        {[
          { color: 'var(--action-play)', action: 'Play / Favorite', desc: 'Now playing, added to favorites' },
          { color: 'var(--action-play-next)', action: 'Play Next', desc: 'Track queued to play next' },
          { color: 'var(--action-queue)', action: 'Queue', desc: 'Added to queue' },
          { color: 'var(--action-swap)', action: 'Swap', desc: 'Switching recording versions' },
          { color: 'white', action: 'MiniDisc', desc: 'Save to a MiniDisc playlist' },
        ].map(({ color, action, desc }) => (
          <div key={action} className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span><strong>{action}</strong> — {desc}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'share',
    question: 'Can I share shows with friends?',
    answer: "Absolutely! Every show and artist page has a shareable link. You can also share directly to social media from the player. Remember our ethos: please copy freely — never sell."
  },
  {
    id: 'contribute',
    question: 'How can I report an issue or give feedback?',
    answer: "Head to the contact page to send us a message. Whether it's missing shows, incorrect metadata, or a feature request — we'd love to hear from you."
  },
  {
    id: 'name',
    question: 'Why is it called "8PM"?',
    answer: "8PM represents the magic hour when most concerts begin — that moment of anticipation before the lights dim and the music starts. It's our tribute to the live music experience."
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqData;
    }
    const query = searchQuery.toLowerCase();
    return faqData.filter(faq =>
      faq.question.toLowerCase().includes(query) ||
      (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-12 md:py-16">
      {/* Header with icon */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-surface-card rounded-lg border border-default">
          <QuestionIcon className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-accent tracking-tight">
          Frequently Asked Questions
        </h1>
      </div>

      <p className="text-secondary text-lg mb-8">
        Find answers to common questions about 8pm.me and how it works.
      </p>

      {/* Search input */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="w-5 h-5 text-tertiary" />
        </div>
        <input
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-3 bg-surface-card border border-default rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
          aria-label="Search FAQs"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-tertiary hover:text-secondary transition-colors duration-150"
            aria-label="Clear search"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {searchQuery && (
        <p className="text-sm text-tertiary mb-4">
          {filteredFaqs.length === 0
            ? 'No questions found'
            : `${filteredFaqs.length} question${filteredFaqs.length === 1 ? '' : 's'} found`}
        </p>
      )}

      {/* FAQ Accordions */}
      {filteredFaqs.length > 0 ? (
        <AccordionGroup allowMultiple defaultOpenIds={filteredFaqs.map(f => f.id)}>
          {filteredFaqs.map((faq) => (
            <Accordion key={faq.id} id={faq.id} title={faq.question}>
              {typeof faq.answer === 'string' ? <p>{faq.answer}</p> : faq.answer}
            </Accordion>
          ))}
        </AccordionGroup>
      ) : (
        <div className="text-center py-12 bg-surface-card border border-default rounded-lg">
          <QuestionIcon className="w-12 h-12 text-tertiary mx-auto mb-4" />
          <p className="text-secondary mb-2">No questions match your search.</p>
          <button
            onClick={clearSearch}
            className="text-accent hover:text-accent transition-colors duration-200 underline"
          >
            Clear search and view all questions
          </button>
        </div>
      )}

      {/* Still have questions section */}
      <div className="mt-12 pt-8 border-t border-default/30">
        <h2 className="text-2xl font-semibold text-accent mb-4">
          Still have questions?
        </h2>
        <p className="text-secondary mb-6">
          Can't find the answer you're looking for? We're here to help!
        </p>
        <Link
          href="/contact"
          className="inline-block px-6 py-3 bg-accent text-inverse font-semibold rounded hover:bg-accent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        >
          Contact Us
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
