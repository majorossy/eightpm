/**
 * Integration test: SEO metadata generation
 *
 * Tests seo.ts utilities:
 * - getBaseUrl: returns env var or default localhost:3001
 * - getCanonicalUrl: builds full URL from path
 * - generateSeoMetadata: produces Next.js Metadata object
 *   - title, description, keywords
 *   - canonical URL
 *   - Open Graph tags (title, description, url, image, type)
 *   - Twitter card tags
 *   - Defaults when fields are missing
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBaseUrl, getCanonicalUrl, generateSeoMetadata } from '@/lib/seo';

describe('SEO Utils Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getBaseUrl', () => {
    it('returns env var when set', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://8pm.me';
      expect(getBaseUrl()).toBe('https://8pm.me');
    });

    it('returns localhost:3001 as default', () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;
      expect(getBaseUrl()).toBe('http://localhost:3001');
    });
  });

  describe('getCanonicalUrl', () => {
    it('builds full URL from path', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://8pm.me';
      expect(getCanonicalUrl('/artists/grateful-dead')).toBe(
        'https://8pm.me/artists/grateful-dead'
      );
    });

    it('adds leading slash if missing', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://8pm.me';
      expect(getCanonicalUrl('artists/phish')).toBe(
        'https://8pm.me/artists/phish'
      );
    });
  });

  describe('generateSeoMetadata', () => {
    it('generates complete metadata', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://8pm.me';

      const meta = generateSeoMetadata({
        title: 'Grateful Dead Live at Cornell 77',
        description: 'Stream the legendary Cornell 77 show',
        keywords: 'grateful dead, cornell, 1977, live',
        path: '/artists/grateful-dead/album/gd1977-05-08',
        image: 'https://8pm.me/images/cornell77.jpg',
        type: 'music.album',
      });

      expect(meta.title).toBe('Grateful Dead Live at Cornell 77');
      expect(meta.description).toBe('Stream the legendary Cornell 77 show');
      expect(meta.keywords).toBe('grateful dead, cornell, 1977, live');

      // Canonical URL
      expect((meta.alternates as any).canonical).toBe(
        'https://8pm.me/artists/grateful-dead/album/gd1977-05-08'
      );

      // Open Graph
      const og = meta.openGraph as any;
      expect(og.title).toBe('Grateful Dead Live at Cornell 77');
      expect(og.type).toBe('music.album');
      expect(og.siteName).toBe('8pm.me');
      expect(og.images[0].url).toBe('https://8pm.me/images/cornell77.jpg');
      expect(og.images[0].width).toBe(1200);
      expect(og.images[0].height).toBe(630);

      // Twitter
      const twitter = meta.twitter as any;
      expect(twitter.card).toBe('summary_large_image');
      expect(twitter.title).toBe('Grateful Dead Live at Cornell 77');
    });

    it('uses defaults when fields are missing', () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;

      const meta = generateSeoMetadata({});

      expect(meta.title).toBe('8pm.me - Live Music Archive');
      expect(meta.description).toBe('Stream live concert recordings from Archive.org');

      const og = meta.openGraph as any;
      expect(og.type).toBe('website');
      expect(og.url).toBe('http://localhost:3001');
      expect(og.images[0].url).toContain('og-default.jpg');
    });

    it('generates correct canonical for path', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://8pm.me';

      const meta = generateSeoMetadata({ path: '/artists/railroadearth' });

      expect((meta.alternates as any).canonical).toBe(
        'https://8pm.me/artists/railroadearth'
      );
    });

    it('uses default OG image when none provided', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://8pm.me';

      const meta = generateSeoMetadata({ title: 'Test' });
      const og = meta.openGraph as any;
      expect(og.images[0].url).toBe('https://8pm.me/images/og-default.jpg');
    });
  });
});
