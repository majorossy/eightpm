import type { Metadata } from 'next';
import { Orbitron, Space_Mono, Bebas_Neue, JetBrains_Mono, Instrument_Sans } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import ConditionalAnalytics from '@/components/ConditionalAnalytics';
import EarlyAccessGate from '@/components/EarlyAccessGate';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
  adjustFontFallback: true,
  fallback: ['system-ui', 'sans-serif'],
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
  adjustFontFallback: true,
  fallback: ['Courier New', 'monospace'],
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
  adjustFontFallback: true,
  fallback: ['Impact', 'sans-serif'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  adjustFontFallback: true,
  fallback: ['Courier New', 'monospace'],
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
  adjustFontFallback: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'),
  title: {
    default: '8pm.me - Live Music Archive',
    template: '%s | 8pm.me',
  },
  description: 'Stream high-quality live concert recordings from legendary artists. Discover thousands of shows from Archive.org.',
  keywords: ['live music', 'concert recordings', 'archive.org', 'streaming', 'grateful dead', 'phish', 'jam bands'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: '8pm.me',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: '8pm.me - Live Music Archive',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/og-default.jpg'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '8pm.me',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${spaceMono.variable} ${bebasNeue.variable} ${jetbrainsMono.variable} ${instrumentSans.variable} theme-campfire`}>
      <head>
        {/* Preconnect hints for critical resources - improves LCP */}
        <link rel="preconnect" href="https://magento.test" />
        <link rel="dns-prefetch" href="https://magento.test" />
        <link rel="preconnect" href="https://archive.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://archive.org" />
        {/* Archive.org uses dynamic CDN subdomains like ia800200.us.archive.org */}
        <link rel="preconnect" href="https://ia800200.us.archive.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ia800200.us.archive.org" />
        <link rel="preconnect" href="https://ia600200.us.archive.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ia600200.us.archive.org" />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="8pm.me" />
        <meta name="theme-color" content="#d4a060" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS Web App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="8pm.me" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-152x152.png" />

        {/* iOS Splash Screens - can be generated later */}

        {/* iOS Haptic Feedback Preparation */}
        {/* Note: Add navigator.vibrate() calls at the following touch points:
            - Button press: navigator.vibrate(10) - light tap
            - Swipe complete (expand/collapse): navigator.vibrate([10, 50, 10]) - double tap
            - Delete/remove action: navigator.vibrate(20) - medium tap
            - Play/pause toggle: navigator.vibrate(15) - medium-light tap
        */}
      </head>
      <body className="font-mono">
        <EarlyAccessGate>
          <ClientLayout>{children}</ClientLayout>
          {/* Google Analytics 4 - only loads when user has consented to analytics cookies */}
          <ConditionalAnalytics />
        </EarlyAccessGate>
      </body>
    </html>
  );
}
