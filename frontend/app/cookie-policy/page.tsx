import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ShieldIcon,
  CheckIcon,
  InfoIcon,
  GlobeIcon,
} from '@/components/icons/FooterIcons';

// Cookie icon
const CookieIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <circle cx="8" cy="9" r="1.5" fill="currentColor" />
    <circle cx="15" cy="8" r="1" fill="currentColor" />
    <circle cx="10" cy="14" r="1" fill="currentColor" />
    <circle cx="16" cy="13" r="1.5" fill="currentColor" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  </svg>
);

// Chart/Analytics icon
const ChartIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

// Cog/Settings icon
const CogIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Learn about how 8pm.me uses cookies to enhance your experience. Understand your choices for essential, functional, and analytics cookies.',
  alternates: {
    canonical: '/cookie-policy',
  },
};

interface CookieTableRow {
  name: string;
  purpose: string;
  duration: string;
  provider: string;
}

function CookieTable({ cookies }: { cookies: CookieTableRow[] }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-default">
            <th className="text-left py-2 pr-4 text-accent font-medium">Cookie</th>
            <th className="text-left py-2 pr-4 text-accent font-medium">Purpose</th>
            <th className="text-left py-2 pr-4 text-accent font-medium">Duration</th>
            <th className="text-left py-2 text-accent font-medium">Provider</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((cookie, index) => (
            <tr key={index} className="border-b border-default/50">
              <td className="py-2 pr-4 font-mono text-xs text-primary">{cookie.name}</td>
              <td className="py-2 pr-4 text-secondary">{cookie.purpose}</td>
              <td className="py-2 pr-4 text-secondary">{cookie.duration}</td>
              <td className="py-2 text-secondary">{cookie.provider}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiePolicyPage() {
  const essentialCookies: CookieTableRow[] = [
    {
      name: '8pm_cookie_consent',
      purpose: 'Stores your cookie preferences',
      duration: 'Persistent',
      provider: '8pm.me',
    },
    {
      name: 'theme_preference',
      purpose: 'Remembers your display theme',
      duration: 'Persistent',
      provider: '8pm.me',
    },
  ];

  const functionalCookies: CookieTableRow[] = [
    {
      name: '8pm_playlists',
      purpose: 'Stores your created playlists locally',
      duration: 'Persistent',
      provider: '8pm.me',
    },
    {
      name: '8pm_recently_played',
      purpose: 'Remembers your listening history',
      duration: 'Persistent',
      provider: '8pm.me',
    },
    {
      name: '8pm_liked_songs',
      purpose: 'Stores your liked songs',
      duration: 'Persistent',
      provider: '8pm.me',
    },
    {
      name: '8pm_queue',
      purpose: 'Preserves your play queue',
      duration: 'Session',
      provider: '8pm.me',
    },
    {
      name: '8pm_volume',
      purpose: 'Remembers your volume setting',
      duration: 'Persistent',
      provider: '8pm.me',
    },
    {
      name: '8pm_quality',
      purpose: 'Stores your audio quality preference',
      duration: 'Persistent',
      provider: '8pm.me',
    },
  ];

  const analyticsCookies: CookieTableRow[] = [
    {
      name: '_ga',
      purpose: 'Distinguishes unique users',
      duration: '2 years',
      provider: 'Google Analytics',
    },
    {
      name: '_ga_*',
      purpose: 'Maintains session state',
      duration: '2 years',
      provider: 'Google Analytics',
    },
  ];

  return (
    <div className="max-w-[800px] mx-auto px-4 py-12 md:py-16">
      {/* Header with icon */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-surface-card rounded-lg border border-default">
          <CookieIcon className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-accent tracking-tight">
          Cookie Policy
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

        {/* What Are Cookies */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CookieIcon className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-semibold text-accent">
              What Are Cookies?
            </h2>
          </div>
          <p className="mb-4">
            Cookies are small text files stored on your device when you visit a website.
            They help websites remember your preferences and understand how you use them.
          </p>
          <p>
            8pm.me uses cookies and similar technologies (like localStorage) to provide you
            with a better experience. You have control over which cookies we use.
          </p>
        </div>

        {/* Essential Cookies */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Essential Cookies
            </h2>
            <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded">
              Always Active
            </span>
          </div>
          <p className="mb-4">
            These cookies are required for basic site functionality. Without them, the
            site cannot work properly. They cannot be disabled.
          </p>
          <CookieTable cookies={essentialCookies} />
        </div>

        {/* Functional Cookies */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CogIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Functional Cookies
            </h2>
            <span className="ml-auto text-xs bg-border text-secondary px-2 py-1 rounded">
              Optional
            </span>
          </div>
          <p className="mb-4">
            These cookies enable enhanced functionality and personalization. They remember
            your preferences like playlists, liked songs, and playback settings. All this
            data stays in your browser (localStorage) and is never sent to our servers.
          </p>
          <CookieTable cookies={functionalCookies} />
          <p className="mt-4 text-sm">
            <strong className="text-primary">Note:</strong> All functional data is stored
            locally in your browser using localStorage. It never leaves your device unless
            you explicitly enable cross-device sync (requires account).
          </p>
        </div>

        {/* Analytics Cookies */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ChartIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Analytics Cookies
            </h2>
            <span className="ml-auto text-xs bg-border text-secondary px-2 py-1 rounded">
              Optional
            </span>
          </div>
          <p className="mb-4">
            These cookies help us understand how visitors use 8pm.me. They collect anonymous
            information about which pages are visited and how long users stay. This helps
            us improve the site for everyone.
          </p>
          <CookieTable cookies={analyticsCookies} />
          <p className="mt-4 text-sm">
            <strong className="text-primary">We use Google Analytics 4.</strong> GA4
            does not store IP addresses and uses privacy-preserving measurement. You can
            learn more about{' '}
            <a
              href="https://support.google.com/analytics/answer/11593727"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Google's data practices
            </a>
            .
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
          <p className="mb-4">
            8pm.me streams music from Archive.org. When you play a recording, your browser
            connects directly to Archive.org's servers. Please refer to{' '}
            <a
              href="https://archive.org/about/terms.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Archive.org's Terms of Use
            </a>
            {' '}and{' '}
            <a
              href="https://archive.org/about/privacy.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Privacy Policy
            </a>
            {' '}for information about their data practices.
          </p>
          <p>
            YouTube embeds on artist pages use{' '}
            <a
              href="https://support.google.com/youtube/answer/171780"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              YouTube's Privacy-Enhanced Mode
            </a>
            {' '}(youtube-nocookie.com), which prevents YouTube from storing cookies until
            you interact with the video player.
          </p>
        </div>

        {/* Managing Your Preferences */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CogIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Managing Your Preferences
            </h2>
          </div>
          <p className="mb-4">
            You can change your cookie preferences at any time:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-surface-base rounded-lg">
              <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm">Use the cookie banner when you first visit</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-surface-base rounded-lg">
              <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm">Clear cookies via browser settings</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-surface-base rounded-lg">
              <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm">Use browser's "Do Not Track" setting</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-surface-base rounded-lg">
              <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm">Use private/incognito browsing mode</span>
            </div>
          </div>
          <p className="mt-4 text-sm">
            <strong className="text-primary">Note:</strong> Disabling functional cookies
            will clear your playlists, liked songs, and listening history stored in your
            browser.
          </p>
        </div>

        {/* Browser Settings Links */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <h3 className="text-lg font-semibold text-accent mb-4">
            Browser Cookie Settings
          </h3>
          <p className="mb-4 text-sm">
            Learn how to manage cookies in your browser:
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/guide/safari/manage-cookies-sfri11471"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Apple Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
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
            We may update this cookie policy from time to time. If we make significant
            changes to how we use cookies, we will ask for your consent again via the
            cookie banner.
          </p>
        </div>

        {/* Related Policies */}
        <div className="bg-surface-base border border-default rounded-lg p-6">
          <h3 className="text-lg font-semibold text-accent mb-4">
            Related Policies
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/privacy"
              className="px-4 py-2 bg-surface-card text-secondary rounded-lg hover:text-accent hover:border-accent border border-default transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="px-4 py-2 bg-surface-card text-secondary rounded-lg hover:text-accent hover:border-accent border border-default transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="text-sm text-tertiary italic">
          Last updated: February 1, 2026
        </div>

        <div className="pt-4 text-center">
          <Link
            href="/"
            className="text-sm text-secondary hover:text-accent transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
