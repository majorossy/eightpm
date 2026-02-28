import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  DocumentIcon,
  ScaleIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  HeartIcon,
  InfoIcon,
  MailIcon,
  ArchiveIcon,
  GlobeIcon,
  ClockIcon,
} from '@/components/icons/FooterIcons';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for 8pm.me, a frontend interface to the Live Music Archive. Stream and share freely, never sell. All content for noncommercial use only.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-12 md:py-16">
      {/* Header with icon */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-surface-card rounded-lg border border-default">
          <DocumentIcon className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-accent tracking-tight">
          Terms of Service
        </h1>
      </div>

      <div className="space-y-6 text-secondary leading-relaxed">
        {/* Student project notice */}
        <div className="bg-surface-card border border-default rounded-lg p-4 flex items-start gap-3">
          <InfoIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm text-accent">
            <strong>Note:</strong> This is a student project placeholder. 8pm.me is an educational
            demonstration and not a commercial service.
          </p>
        </div>

        <p className="text-lg">
          By using 8pm.me, you agree to these terms and to the{' '}
          <a
            href="https://archive.org/about/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent underline"
          >
            Internet Archive's Terms of Use
          </a>
          . Please read them carefully.
        </p>

        {/* Archive.org Relationship - NEW SECTION */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ArchiveIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Our Relationship with Archive.org
            </h2>
          </div>
          <p className="mb-4">
            8pm.me is a frontend interface to the{' '}
            <a
              href="https://archive.org/details/etree"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent underline"
            >
              Live Music Archive
            </a>
            {' '}hosted by the Internet Archive. We do not host any audio files—all
            recordings stream directly from Archive.org's servers.
          </p>
          <p className="mb-4">
            By using 8pm.me, you also agree to abide by the{' '}
            <a
              href="https://archive.org/about/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent underline"
            >
              Internet Archive's Terms of Use
            </a>
            {' '}and the specific policies of the Live Music Archive collection.
          </p>
          <p className="text-sm italic">
            The Internet Archive is a 501(c)(3) non-profit building a digital library
            of Internet sites and other cultural artifacts in digital form.
          </p>
        </div>

        {/* Acceptance of Terms */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ScaleIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Acceptance of Terms
            </h2>
          </div>
          <p>
            By accessing and using 8pm.me, you accept and agree to be bound by these
            Terms of Service and the Internet Archive's terms. If you do not agree
            to these terms, please do not use this service.
          </p>
        </div>

        {/* Use of Service */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Use of Service
            </h2>
          </div>
          <p className="mb-4">
            8pm.me provides a browsing and streaming interface to the Live Music Archive.
            In accordance with Archive.org's policies, you may:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 flex items-center justify-center text-green-400 flex-shrink-0">✓</span>
              <span>Stream and listen to recordings for personal, noncommercial enjoyment</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 flex items-center justify-center text-green-400 flex-shrink-0">✓</span>
              <span>Download recordings for personal use and noncommercial sharing</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 flex items-center justify-center text-green-400 flex-shrink-0">✓</span>
              <span>Create and share playlists with friends</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 flex items-center justify-center text-green-400 flex-shrink-0">✓</span>
              <span>Share links to shows and tracks freely</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 flex items-center justify-center text-green-400 flex-shrink-0">✓</span>
              <span>Trade or give away copies for free (never for profit)</span>
            </li>
          </ul>
        </div>

        {/* The Tape Trading Tradition */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ClockIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              The Tape Trading Tradition
            </h2>
          </div>
          <p className="mb-4">
            Since the early 1970s, a community of concert tapers and traders has
            preserved live music through an informal network built on one core
            principle: <strong className="text-accent">share freely, never profit</strong>.
          </p>
          <p className="mb-4">
            Artists like the Grateful Dead, Phish, and many jam bands have embraced
            this tradition, recognizing that freely traded recordings build community
            and spread their music far wider than any marketing campaign.
          </p>
          <p className="text-sm italic">
            In 2002, the Internet Archive partnered with the etree community to create
            the Live Music Archive, preserving this tradition digitally for future generations.
          </p>
        </div>

        {/* Our Ethos */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <HeartIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Our Ethos: Trade Freely — Never Sell
            </h2>
          </div>
          <p className="mb-4">
            Following the Live Music Archive's policies, all content accessible through
            8pm.me is for <strong className="text-accent">noncommercial, royalty-free
            circulation only</strong>. You may freely share these recordings, but you may not:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Sell recordings or charge for access to them</span>
            </li>
            <li className="flex items-start gap-3">
              <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Use recordings for commercial purposes of any kind</span>
            </li>
            <li className="flex items-start gap-3">
              <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Claim ownership or copyright over recordings you did not create</span>
            </li>
            <li className="flex items-start gap-3">
              <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Remove or alter credits to tapers, the Internet Archive, or artists</span>
            </li>
            <li className="flex items-start gap-3">
              <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Redistribute in ways that violate the artist's specific permissions</span>
            </li>
          </ul>
        </div>

        {/* Artist Rights & Permissions */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <DocumentIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Artist Rights & Permissions
            </h2>
          </div>
          <p className="mb-4">
            <strong className="text-accent">Artists retain full copyright</strong> to
            their performances. Downloads and streams are provided with the understanding
            that artists still hold their copyrights.
          </p>
          <p className="mb-4">
            Artists featured in the Live Music Archive have explicitly granted permission
            for taping and noncommercial sharing of their live performances. Each artist
            may have specific restrictions—these are noted on their Archive.org collection
            pages and must be respected.
          </p>
          <p className="text-sm">
            This permission applies only to live performances that artists have approved
            for sharing. It does <strong>not</strong> extend to:
          </p>
          <ul className="space-y-1 mt-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>Official studio recordings or commercially released material</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>Recordings from satellite radio (XM, Sirius) or other restricted sources</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>Any commercial use whatsoever</span>
            </li>
          </ul>
        </div>

        {/* User Conduct */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              User Conduct
            </h2>
          </div>
          <p className="mb-4">You agree not to:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Interfere with or disrupt the service</span>
            </li>
            <li className="flex items-start gap-3">
              <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Attempt to gain unauthorized access to any systems</span>
            </li>
            <li className="flex items-start gap-3">
              <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Use automated tools to scrape or download content in bulk</span>
            </li>
            <li className="flex items-start gap-3">
              <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Impersonate others or misrepresent your affiliation</span>
            </li>
            <li className="flex items-start gap-3">
              <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Violate any applicable laws or regulations</span>
            </li>
          </ul>
        </div>

        {/* Disclaimers Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-surface-card border border-default rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <InfoIcon className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-accent">
                Disclaimer of Warranties
              </h3>
            </div>
            <p className="text-sm">
              8pm.me is provided "as is" without warranties of any kind. As a student
              project, we make no guarantees about service availability, accuracy of
              metadata, or suitability for any particular purpose.
            </p>
          </div>

          <div className="bg-surface-card border border-default rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <ScaleIcon className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-accent">
                Limitation of Liability
              </h3>
            </div>
            <p className="text-sm">
              8pm.me and its creators shall not be liable for any damages arising from
              your use of the service. This includes data loss, service interruptions,
              or any other issues that may arise.
            </p>
          </div>
        </div>

        {/* External Resources */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <GlobeIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Archive.org Resources
            </h2>
          </div>
          <p className="mb-4 text-sm">
            For complete information about the Live Music Archive's policies:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="https://archive.org/about/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-surface-base rounded-lg hover:bg-surface-card transition-colors group"
            >
              <DocumentIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm text-accent group-hover:text-accent">
                Internet Archive Terms of Use
              </span>
            </a>
            <a
              href="https://help.archive.org/help/live-music-archive-etree-org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-surface-base rounded-lg hover:bg-surface-card transition-colors group"
            >
              <InfoIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm text-accent group-hover:text-accent">
                Live Music Archive Help Center
              </span>
            </a>
            <a
              href="https://archive.org/details/etree"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-surface-base rounded-lg hover:bg-surface-card transition-colors group"
            >
              <ArchiveIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm text-accent group-hover:text-accent">
                Live Music Archive Collection
              </span>
            </a>
            <a
              href="mailto:lma@archive.org"
              className="flex items-center gap-2 p-3 bg-surface-base rounded-lg hover:bg-surface-card transition-colors group"
            >
              <MailIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm text-accent group-hover:text-accent">
                Contact Live Music Archive
              </span>
            </a>
          </div>
        </div>

        {/* Changes and Contact */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-surface-card border border-default rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <DocumentIcon className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-accent">
                Changes to Terms
              </h3>
            </div>
            <p className="text-sm">
              We reserve the right to modify these terms at any time. Continued use
              of 8pm.me after changes constitutes acceptance of the new terms.
            </p>
          </div>

          <div className="bg-surface-card border border-default rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <MailIcon className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-accent">
                Contact
              </h3>
            </div>
            <p className="text-sm">
              If you have questions about these terms, please{' '}
              <Link href="/contact" className="text-accent hover:text-accent underline">
                contact us
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="text-sm text-tertiary italic">
          Last updated: January 30, 2026
        </div>

        <div className="pt-4 text-center">
          <Link
            href="/"
            className="text-sm text-secondary hover:text-accent transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
