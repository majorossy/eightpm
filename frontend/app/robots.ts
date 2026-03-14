import { MetadataRoute } from 'next';

/**
 * Robots.txt configuration for SEO
 *
 * CARD-6 Implementation:
 * - Blocks audio file extensions (bandwidth protection)
 * - Blocks pagination URLs (duplicate content)
 * - Blocks AI training scrapers
 * - Slows down aggressive SEO crawlers
 * - Points to sitemap.xml
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // User accounts (private)
          '/account/',
          // API endpoints
          '/api/',
          // Next.js internals
          '/_next/',
          // Avoid duplicate search results
          '/find?*',
          '/search?*',
          // Pagination URLs (duplicate content)
          '/*?page=*',
          // Sorted views (duplicate content)
          '/*?sort=*',
          // Filtered views (duplicate content)
          '/*?filter=*',
          // Audio files (bandwidth protection - Archive.org streams)
          '/*.mp3$',
          '/*.flac$',
          '/*.ogg$',
          '/*.m3u$',
          '/*.shn$',
        ],
      },
      // Googlebot gets slightly more permissive rules
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/account/',
          '/*.mp3$',
          '/*.flac$',
        ],
      },
      // Block AI training scrapers
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
      {
        userAgent: 'Anthropic-AI',
        disallow: ['/'],
      },
      {
        userAgent: 'ClaudeBot',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'FacebookBot',
        disallow: ['/'],
      },
      {
        userAgent: 'Bytespider',
        disallow: ['/'],
      },
      // Slow down aggressive SEO crawlers
      {
        userAgent: 'AhrefsBot',
        crawlDelay: 30,
        disallow: ['/'],
      },
      {
        userAgent: 'SemrushBot',
        crawlDelay: 30,
        disallow: ['/'],
      },
      {
        userAgent: 'DotBot',
        crawlDelay: 30,
        disallow: ['/'],
      },
      {
        userAgent: 'MJ12bot',
        crawlDelay: 30,
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
