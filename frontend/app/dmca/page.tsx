import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ScaleIcon,
  CheckIcon,
  InfoIcon,
  MailIcon,
  ArchiveIcon,
} from '@/components/icons/FooterIcons';

// Shield with exclamation icon for DMCA
const DMCAIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

// Document with checkmark icon
const DocumentCheckIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// Reply/counter icon
const ReplyIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
    />
  </svg>
);

// Ban/prohibition icon
const BanIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
    />
  </svg>
);

export const metadata: Metadata = {
  title: 'DMCA Policy',
  description: 'DMCA Copyright Policy for 8pm.me. Learn about our copyright compliance procedures, how to file takedown notices, and our relationship with Archive.org.',
  alternates: {
    canonical: '/dmca',
  },
};

export default function DMCAPage() {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-12 md:py-16">
      {/* Header with icon */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-surface-card rounded-lg border border-default">
          <ScaleIcon className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-accent tracking-tight">
          DMCA Policy
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

        {/* Introduction */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <DMCAIcon className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-semibold text-accent">
              Copyright Compliance
            </h2>
          </div>
          <p className="mb-4">
            8pm.me respects the intellectual property rights of artists, tapers, and content
            creators. We comply with the Digital Millennium Copyright Act (DMCA) and respond
            promptly to valid takedown notices.
          </p>
          <p>
            This policy explains how to report copyright infringement and how we handle
            such reports.
          </p>
        </div>

        {/* Important: Archive.org Relationship */}
        <div className="bg-surface-base border-2 border-accent/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ArchiveIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Important: Content Hosted by Archive.org
            </h2>
          </div>
          <p className="mb-4">
            <strong className="text-primary">8pm.me does not host any audio recordings.</strong>{' '}
            All live music recordings are hosted by and stream directly from the{' '}
            <a
              href="https://archive.org/details/etree"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Internet Archive's Live Music Archive
            </a>
            .
          </p>
          <p className="mb-4">
            If you believe a recording on Archive.org infringes your copyright, you must
            submit your DMCA takedown notice directly to the Internet Archive:
          </p>
          <div className="bg-surface-card rounded-lg p-4">
            <p className="font-semibold text-primary mb-2">Internet Archive DMCA Agent:</p>
            <p className="mb-1">
              <a
                href="https://archive.org/about/dmca.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                https://archive.org/about/dmca.php
              </a>
            </p>
            <p className="text-sm">
              Email:{' '}
              <a href="mailto:info@archive.org" className="text-accent hover:underline">
                info@archive.org
              </a>
            </p>
          </div>
          <p className="mt-4 text-sm">
            8pm.me will automatically reflect any content removed from Archive.org.
          </p>
        </div>

        {/* What 8pm.me Hosts */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <DocumentCheckIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              What 8pm.me Does Host
            </h2>
          </div>
          <p className="mb-4">
            8pm.me hosts the following content, for which we are responsible:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>The 8pm.me website interface and software</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>Metadata and descriptions we create about shows</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>Artist images and biographies sourced from Wikipedia</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>User-created playlists (stored locally in users' browsers)</span>
            </li>
          </ul>
          <p className="mt-4 text-sm">
            For issues with the above content, contact us directly using the process below.
          </p>
        </div>

        {/* Filing a DMCA Notice */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <MailIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Filing a DMCA Takedown Notice
            </h2>
          </div>
          <p className="mb-4">
            To file a DMCA takedown notice for content hosted by 8pm.me (not audio recordings),
            please provide the following information in writing:
          </p>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="pl-2">
              <span className="text-primary">Identification of the copyrighted work</span>
              <p className="text-sm mt-1 ml-6">
                Describe the copyrighted work you claim has been infringed.
              </p>
            </li>
            <li className="pl-2">
              <span className="text-primary">Identification of the infringing material</span>
              <p className="text-sm mt-1 ml-6">
                Provide the specific URL(s) where the infringing material is located.
              </p>
            </li>
            <li className="pl-2">
              <span className="text-primary">Your contact information</span>
              <p className="text-sm mt-1 ml-6">
                Include your name, address, phone number, and email address.
              </p>
            </li>
            <li className="pl-2">
              <span className="text-primary">Good faith statement</span>
              <p className="text-sm mt-1 ml-6">
                A statement that you have a good faith belief that the use is not authorized
                by the copyright owner, its agent, or the law.
              </p>
            </li>
            <li className="pl-2">
              <span className="text-primary">Accuracy statement</span>
              <p className="text-sm mt-1 ml-6">
                A statement, under penalty of perjury, that the information in your notice
                is accurate and that you are the copyright owner or authorized to act on
                their behalf.
              </p>
            </li>
            <li className="pl-2">
              <span className="text-primary">Your signature</span>
              <p className="text-sm mt-1 ml-6">
                Physical or electronic signature of the copyright owner or authorized person.
              </p>
            </li>
          </ol>
        </div>

        {/* DMCA Agent */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <h3 className="text-lg font-semibold text-accent mb-4">
            8pm.me Designated DMCA Agent
          </h3>
          <div className="bg-surface-base rounded-lg p-4">
            <p className="mb-2">
              <strong className="text-primary">Email:</strong>{' '}
              <a href="mailto:dmca@8pm.me" className="text-accent hover:underline">
                dmca@8pm.me
              </a>
            </p>
            <p className="mb-2">
              <strong className="text-primary">Subject Line:</strong>{' '}
              <span className="font-mono text-sm">DMCA Takedown Notice</span>
            </p>
            <p className="text-sm text-tertiary">
              We aim to respond to valid DMCA notices within 48 hours.
            </p>
          </div>
        </div>

        {/* Counter-Notification */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ReplyIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Counter-Notification
            </h2>
          </div>
          <p className="mb-4">
            If you believe your content was removed in error, you may file a counter-notification.
            Your counter-notification must include:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>Your physical or electronic signature</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>Identification of the material that was removed and its prior location</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>
                A statement under penalty of perjury that you have a good faith belief the
                material was removed by mistake or misidentification
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>Your name, address, and phone number</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>
                Consent to the jurisdiction of federal court in your district (or any judicial
                district if outside the US)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span>
                A statement that you will accept service of process from the original complainant
              </span>
            </li>
          </ul>
          <p className="mt-4 text-sm">
            Upon receiving a valid counter-notification, we will forward it to the original
            complainant. If they do not file a court action within 10-14 business days, we
            may restore the removed material.
          </p>
        </div>

        {/* Repeat Infringer Policy */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <BanIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              Repeat Infringer Policy
            </h2>
          </div>
          <p>
            In accordance with the DMCA, 8pm.me maintains a policy to terminate, in appropriate
            circumstances, users who are deemed to be repeat infringers. We may also, at our
            discretion, limit access or terminate accounts of users who infringe any intellectual
            property rights, whether or not there is any repeat infringement.
          </p>
        </div>

        {/* Live Music Archive Context */}
        <div className="bg-surface-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <InfoIcon className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-accent">
              About Live Music Archive Content
            </h2>
          </div>
          <p className="mb-4">
            The Live Music Archive hosts recordings of artists who have explicitly permitted
            audience taping and noncommercial sharing of their live performances. This tradition
            dates back to the Grateful Dead in the 1960s and continues with hundreds of artists today.
          </p>
          <p className="mb-4">
            Recordings in the Live Music Archive are shared under the following principles:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start gap-3">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <span>Artists have granted permission for noncommercial taping and trading</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <span>All content is for personal, noncommercial use only</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <span>Artists retain full copyright to their performances</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <span>Commercial use or sale is strictly prohibited</span>
            </li>
          </ul>
          <p className="text-sm">
            If you are an artist and wish to have your recordings removed from the Live Music
            Archive, please contact the{' '}
            <a
              href="https://archive.org/about/contact.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Internet Archive directly
            </a>
            .
          </p>
        </div>

        {/* Misrepresentation Warning */}
        <div className="bg-surface-base border border-accent/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-accent mb-3">
            Warning About Misrepresentation
          </h3>
          <p className="text-sm">
            Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents
            that material is infringing, or that material was removed by mistake, may be subject
            to liability. Please ensure your DMCA notice or counter-notification is accurate
            before submitting.
          </p>
        </div>

        {/* Related Policies */}
        <div className="bg-surface-base border border-default rounded-lg p-6">
          <h3 className="text-lg font-semibold text-accent mb-4">
            Related Policies
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/terms"
              className="px-4 py-2 bg-surface-card text-secondary rounded-lg hover:text-accent hover:border-accent border border-default transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="px-4 py-2 bg-surface-card text-secondary rounded-lg hover:text-accent hover:border-accent border border-default transition-colors"
            >
              Privacy Policy
            </Link>
            <a
              href="https://archive.org/about/dmca.php"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-surface-card text-secondary rounded-lg hover:text-accent hover:border-accent border border-default transition-colors"
            >
              Archive.org DMCA Policy
            </a>
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
