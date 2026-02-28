import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ShieldIcon,
  EyeIcon,
  EyeOffIcon,
  DatabaseIcon,
  GlobeIcon,
  UserIcon,
  CheckIcon,
  InfoIcon,
} from '@/components/icons/FooterIcons';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how 8pm.me handles your data. We prioritize your privacy with local storage, no tracking across websites, and no selling of personal information.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-12 md:py-16">
      {/* Header with icon */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-surface-card rounded-lg border border-default">
          <ShieldIcon className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-accent tracking-tight">
          Privacy Policy
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

        {/* Commitment */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldIcon className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-semibold text-accent">
              Our Commitment to Privacy
            </h2>
          </div>
          <p>
            8pm.me is designed with privacy in mind. We believe your listening habits
            and personal data should remain yours.
          </p>
        </div>

        {/* What We Collect */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <EyeIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              What We Collect
            </h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>Basic account information (email, username) if you create an account</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>Playlists and listening preferences (stored locally in your browser)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>Anonymous usage statistics to improve the service</span>
            </li>
          </ul>
        </div>

        {/* What We Don't Collect */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <EyeOffIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              What We Don't Collect
            </h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-4 h-4 flex items-center justify-center text-green-400 flex-shrink-0 mt-0.5">✓</span>
              <span>We don't sell your data to third parties</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-4 h-4 flex items-center justify-center text-green-400 flex-shrink-0 mt-0.5">✓</span>
              <span>We don't track you across other websites</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-4 h-4 flex items-center justify-center text-green-400 flex-shrink-0 mt-0.5">✓</span>
              <span>We don't collect personally identifiable information without your consent</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-4 h-4 flex items-center justify-center text-green-400 flex-shrink-0 mt-0.5">✓</span>
              <span>We don't use invasive analytics or advertising trackers</span>
            </li>
          </ul>
        </div>

        {/* Local Storage */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <DatabaseIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Local Storage
            </h2>
          </div>
          <p>
            Your playlists, recently played tracks, and app preferences are stored
            locally in your browser using localStorage. This data never leaves your
            device unless you explicitly choose to sync it via an optional account.
          </p>
        </div>

        {/* Third-Party Services */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <GlobeIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Third-Party Services
            </h2>
          </div>
          <p>
            8pm.me streams music directly from Archive.org. When you play a recording,
            your browser connects directly to Archive.org's servers. Please refer to
            Archive.org's privacy policy for information about their data practices.
          </p>
        </div>

        {/* Your Rights */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Your Rights
            </h2>
          </div>
          <p className="mb-4">You have the right to:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-surface-base rounded-lg">
              <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm">Access any data we have about you</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-surface-base rounded-lg">
              <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm">Request deletion of your account</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-surface-base rounded-lg">
              <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm">Opt out of optional data collection</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-surface-base rounded-lg">
              <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm">Export your playlists and history</span>
            </div>
          </div>
        </div>

        {/* Changes */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <InfoIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Changes to This Policy
            </h2>
          </div>
          <p>
            We may update this privacy policy from time to time. We will notify you
            of any significant changes by posting a notice on the site.
          </p>
        </div>

        <div className="text-sm text-tertiary italic">
          Last updated: January 29, 2026
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
