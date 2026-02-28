/**
 * Sanitize a stream URL for browser playback:
 * - Fix double-slash in path after domain (e.g., //24/items/ -> /24/items/)
 * - Convert .flac -> .mp3 (Archive.org derives VBR MP3 for every FLAC)
 */
export function sanitizeStreamUrl(url: string): string {
  if (!url) return url;
  url = url.replace(/^(https?:\/\/[^/]+)\/\//, '$1/');
  if (url.endsWith('.flac')) url = url.replace(/\.flac$/, '.mp3');
  return url;
}
