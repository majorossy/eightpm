import { Song } from '@/lib/types';

export function formatNum(n: number | null | undefined): string | null {
  if (n == null) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function getSourceFormat(song: Song): 'flac24' | 'flac16' | 'mp3' | null {
  // 1. Check albumIdentifier for format hints
  if (song.albumIdentifier) {
    const id = song.albumIdentifier.toLowerCase();
    if (id.includes('.flac24') || id.includes('.24bit')) return 'flac24';
    if (id.includes('.flac16') || id.includes('.16bit')) return 'flac16';
    if (id.includes('.shn')) return 'flac16';
    if (id.includes('.mp3')) return 'mp3';
  }
  // 2. Check trackOriginalFile extension
  if (song.trackOriginalFile) {
    const file = song.trackOriginalFile.toLowerCase();
    if (file.endsWith('.flac')) return 'flac16';
    if (file.endsWith('.mp3')) return 'mp3';
    if (file.endsWith('.shn')) return 'flac16';
  }
  // 3. Check qualityUrls
  if (song.qualityUrls) {
    if (song.qualityUrls.high) return 'flac24';
    if (song.qualityUrls.medium) return 'flac16';
    if (song.qualityUrls.low) return 'mp3';
  }
  return null;
}

export function parseLicenseLabel(url: string | undefined | null): string | null {
  if (!url) return null;
  // Extract from URL like https://creativecommons.org/licenses/by-nc-nd/4.0/
  const match = url.match(/\/licenses\/([^/]+)\/([^/]+)/);
  if (match) {
    return `CC ${match[1].toUpperCase()} ${match[2]}`;
  }
  return null;
}

export function formatDateShort(isoDate: string | undefined | null): string | null {
  if (!isoDate) return null;
  try {
    const d = new Date(isoDate.includes('T') ? isoDate : isoDate + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  } catch {
    return null;
  }
}

export function parseDateOnly(isoDatetime: string | undefined | null): string | null {
  if (!isoDatetime) return null;
  try {
    const d = new Date(isoDatetime);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  } catch {
    return null;
  }
}
