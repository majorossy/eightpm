/**
 * Integration test: Quality context + stream URL resolution
 *
 * Tests QualityContext behavior within the real provider tree:
 * - Default quality selection
 * - Quality change persists to localStorage
 * - getStreamUrl fallback chain (preferred → default → high → medium → low → streamUrl)
 * - getLowerQualityUrl progression
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderApp } from '@/test/render';
import { useQuality } from '@/context/QualityContext';
import { buildSong, resetCounters } from '@/test/factories/song';

// Wire up mocks
vi.mock('next/navigation', () => import('@/test/mocks/next').then(m => m.nextNavigationMock));
vi.mock('next/image', () => import('@/test/mocks/next').then(m => m.nextImageMock));
vi.mock('next/link', () => import('@/test/mocks/next').then(m => m.nextLinkMock));
vi.mock('next/dynamic', () => import('@/test/mocks/next').then(m => m.nextDynamicMock));
vi.mock('@/lib/magentoAuth', () => import('@/test/mocks/magentoAuth'));
vi.mock('@/lib/magentoSync', () => import('@/test/mocks/magentoSync'));
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

function QualityDisplay() {
  const quality = useQuality();

  const fullSong = buildSong({
    id: 'song-full',
    streamUrl: 'https://archive.org/download/test/fallback.mp3',
    qualityUrls: {
      high: 'https://archive.org/download/test/high.flac',
      medium: 'https://archive.org/download/test/medium.mp3',
      low: 'https://archive.org/download/test/low.mp3',
    },
  });

  const partialSong = buildSong({
    id: 'song-partial',
    streamUrl: 'https://archive.org/download/test/only.mp3',
    qualityUrls: {
      high: undefined,
      medium: 'https://archive.org/download/test/medium-only.mp3',
      low: undefined,
    },
  });

  const noQualitySong = buildSong({
    id: 'song-legacy',
    streamUrl: 'https://archive.org/download/test/legacy.mp3',
    qualityUrls: undefined,
  });

  const streamUrl = quality.getStreamUrl(fullSong);
  const partialUrl = quality.getStreamUrl(partialSong);
  const legacyUrl = quality.getStreamUrl(noQualitySong);

  // Test getLowerQualityUrl chain
  // Note: sanitizeStreamUrl converts .flac → .mp3, so pass sanitized URLs
  const lowerFromHigh = quality.getLowerQualityUrl(
    fullSong,
    'https://archive.org/download/test/high.mp3'
  );
  const lowerFromMedium = quality.getLowerQualityUrl(
    fullSong,
    'https://archive.org/download/test/medium.mp3'
  );
  const lowerFromLow = quality.getLowerQualityUrl(
    fullSong,
    'https://archive.org/download/test/low.mp3'
  );

  return (
    <div>
      <div data-testid="preferred">{quality.preferredQuality}</div>
      <div data-testid="stream-url">{streamUrl}</div>
      <div data-testid="partial-url">{partialUrl}</div>
      <div data-testid="legacy-url">{legacyUrl}</div>
      <div data-testid="lower-from-high">{lowerFromHigh ?? 'null'}</div>
      <div data-testid="lower-from-medium">{lowerFromMedium ?? 'null'}</div>
      <div data-testid="lower-from-low">{lowerFromLow ?? 'null'}</div>
      <div data-testid="label-high">{quality.getQualityLabel('high')}</div>
      <div data-testid="label-medium">{quality.getQualityLabel('medium')}</div>
      <div data-testid="label-low">{quality.getQualityLabel('low')}</div>
      <button data-testid="set-high" onClick={() => quality.setPreferredQuality('high')}>High</button>
      <button data-testid="set-medium" onClick={() => quality.setPreferredQuality('medium')}>Medium</button>
      <button data-testid="set-low" onClick={() => quality.setPreferredQuality('low')}>Low</button>
    </div>
  );
}

describe('Quality Context Integration', () => {
  beforeEach(() => {
    resetCounters();
    localStorage.clear();
  });

  it('defaults to high quality', async () => {
    renderApp(<QualityDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('preferred').textContent).toBe('high');
    });
  });

  it('selects preferred quality URL when available', async () => {
    renderApp(<QualityDisplay />);

    // sanitizeStreamUrl converts .flac → .mp3
    await waitFor(() => {
      expect(screen.getByTestId('stream-url').textContent).toContain('high.mp3');
    });
  });

  it('changes quality and persists to localStorage', async () => {
    renderApp(<QualityDisplay />);

    await act(async () => { screen.getByTestId('set-medium').click(); });

    expect(screen.getByTestId('preferred').textContent).toBe('medium');
    expect(localStorage.getItem('audioQuality')).toBe('medium');
  });

  it('falls back when preferred quality unavailable', async () => {
    renderApp(<QualityDisplay />);

    // partialSong only has medium quality, preferred is high
    await waitFor(() => {
      // Should fall back to medium since high is undefined
      expect(screen.getByTestId('partial-url').textContent).toContain('medium-only.mp3');
    });
  });

  it('uses streamUrl when no qualityUrls defined', async () => {
    renderApp(<QualityDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('legacy-url').textContent).toContain('legacy.mp3');
    });
  });

  it('getLowerQualityUrl: high → medium', async () => {
    renderApp(<QualityDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('lower-from-high').textContent).toContain('medium.mp3');
    });
  });

  it('getLowerQualityUrl: medium → low', async () => {
    renderApp(<QualityDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('lower-from-medium').textContent).toContain('low.mp3');
    });
  });

  it('getLowerQualityUrl: low → fallback or null', async () => {
    renderApp(<QualityDisplay />);

    await waitFor(() => {
      const val = screen.getByTestId('lower-from-low').textContent;
      // low → fallback.mp3 (different URL) or null
      expect(val === 'null' || val!.includes('fallback.mp3')).toBe(true);
    });
  });

  it('restores quality from localStorage on mount', async () => {
    localStorage.setItem('audioQuality', 'low');

    renderApp(<QualityDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('preferred').textContent).toBe('low');
    });
  });

  it('provides correct labels', async () => {
    renderApp(<QualityDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('label-high').textContent).toBe('High');
      expect(screen.getByTestId('label-medium').textContent).toBe('Medium');
      expect(screen.getByTestId('label-low').textContent).toBe('Low');
    });
  });
});
