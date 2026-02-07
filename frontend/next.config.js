const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // Audio files - cache first, 1 week
    {
      urlPattern: /^https?:\/\/.*\.(?:mp3|flac|ogg|wav|m4a)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'audio-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Images - cache first, 30 days
    {
      urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Next.js optimized images - cache first, 30 days
    {
      urlPattern: /^\/_next\/image\?/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-images',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // API calls - network first, 5 min cache
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 minutes
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // GraphQL endpoint - network first
    {
      urlPattern: /\/graphql$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'graphql-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 minutes
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Static assets from same origin
    {
      urlPattern: /^https?:\/\/localhost:3001\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Default - stale while revalidate
    {
      urlPattern: /.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'default-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip TypeScript type checking during build (dev uses editor/IDE for type checking)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ==========================================================================
  // SECURITY HEADERS
  // Added: February 1, 2026
  // These headers protect against common web vulnerabilities
  // ==========================================================================
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          // Strict-Transport-Security (HSTS)
          // Forces HTTPS for 1 year
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS Protection (legacy fallback)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Clickjacking protection
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy
          // Disable sensitive browser features we don't need
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // Content-Security-Policy
          // Allows necessary resources while blocking malicious content
          // =================================================================
          // CSP Directive Reference:
          // - default-src: Fallback for unspecified directives
          // - script-src: JavaScript sources
          // - style-src: CSS sources
          // - img-src: Image sources
          // - font-src: Font sources
          // - connect-src: XHR, WebSocket, fetch destinations
          // - media-src: Audio/video sources
          // - frame-src: iframe sources
          // - frame-ancestors: Who can embed this site
          // - worker-src: Service worker and web worker sources
          // - child-src: Deprecated, but fallback for workers in older browsers
          // - manifest-src: Web app manifest sources
          // - form-action: Form submission destinations
          // - base-uri: Restricts <base> element
          // - object-src: Plugin sources (Flash, etc.)
          // =================================================================
          {
            key: 'Content-Security-Policy',
            value: [
              // Default: only allow same-origin (fallback for unspecified directives)
              "default-src 'self'",

              // Scripts: self, inline/eval (Next.js requires these), Google Analytics
              // 'unsafe-inline' needed for Next.js inline scripts
              // 'unsafe-eval' needed for development hot reload and some runtime evaluation
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",

              // Styles: self + inline (styled-jsx, Tailwind, Next.js requires inline styles)
              "style-src 'self' 'unsafe-inline'",

              // Images: self, data URIs, blobs, external sources
              // - data: for base64 encoded images (placeholder images, icons)
              // - blob: for dynamically created image objects
              // - archive.org: album artwork and metadata images
              // - wikimedia/wikipedia: artist photos and album artwork fallback
              // - magento.test: backend-served images
              // - i.ytimg.com: YouTube video thumbnails
              "img-src 'self' data: blob: https://*.archive.org https://archive.org https://upload.wikimedia.org https://*.wikipedia.org https://magento.test https://magento.8pm.me https://i.ytimg.com",

              // Fonts: self + data URIs + Google Fonts CDN
              // - data: for embedded base64 fonts (if any)
              // - fonts.gstatic.com: Google Fonts woff2 files (cached by PWA)
              // - fonts.googleapis.com: Google Fonts CSS (cached by PWA)
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",

              // Connections: XHR, fetch, WebSocket destinations
              // - magento.test: GraphQL API backend
              // - archive.org: Metadata API and audio streaming
              // - google-analytics.com: Analytics beacons
              // - ws/wss localhost: Next.js hot reload WebSocket (dev only)
              "connect-src 'self' https://magento.test https://magento.8pm.me https://*.archive.org https://archive.org https://www.google-analytics.com https://analytics.google.com wss://localhost:* ws://localhost:*",

              // Media (audio/video): Archive.org streaming and blob URLs
              // - archive.org: Audio files from ia*.us.archive.org subdomains
              // - blob: Web Audio API creates blob URLs for audio analysis
              "media-src 'self' https://*.archive.org https://archive.org blob:",

              // Frames: YouTube embeds
              // - youtube-nocookie.com: Privacy-enhanced YouTube embeds (preferred)
              // - youtube.com: Fallback for some embed types
              "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",

              // Frame ancestors: Prevents this site from being embedded elsewhere (clickjacking protection)
              // 'self' means only same-origin can embed this site
              "frame-ancestors 'self'",

              // Workers: Service worker and web worker sources
              // - 'self': Allow same-origin workers (PWA service worker)
              // - blob: Some libraries create inline workers via blob URLs
              "worker-src 'self' blob:",

              // Child-src: Deprecated but provides fallback for older browsers
              // Same as worker-src for compatibility
              "child-src 'self' blob:",

              // Manifest: Web app manifest source (PWA)
              "manifest-src 'self'",

              // Form submissions: Only allow forms to submit to same-origin
              "form-action 'self'",

              // Base URI: Prevents injection attacks via <base> tag
              "base-uri 'self'",

              // Object/embed/applet: Disable all plugins (Flash, Java, etc.)
              // 'none' because we don't use any plugins
              "object-src 'none'",

              // Upgrade insecure requests: Automatically upgrade HTTP to HTTPS
              // Uncomment for production when HTTPS is fully deployed
              // "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'magento.test',
      },
      {
        protocol: 'https',
        hostname: 'magento.8pm.me',
      },
      {
        protocol: 'https',
        hostname: '**.us.archive.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.wikipedia.org',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  env: {
    MAGENTO_GRAPHQL_URL: process.env.MAGENTO_GRAPHQL_URL || 'https://app:8443/graphql',
  },
};

module.exports = withPWA(nextConfig);
