import { WishlistItem, Song } from '@/lib/types';
import { Cassette } from '@/lib/cassetteTypes';
import { MiniDisc } from '@/lib/minidiscTypes';

export interface RecentItem {
  songId: string;
  song: {
    id: string;
    title: string;
    artistName: string;
    artistSlug: string;
    albumArt: string;
    albumIdentifier: string;
    albumName: string;
    trackTitle: string;
    showDate?: string;
    showVenue?: string;
    recordingType?: string;
  };
  playedAt: string;
  playCount: number;
}

export interface AggregatedVersion {
  trackTitle: string;
  count: number;
  artistName: string;
  artistSlug: string;
  progressPercent: number;
  songs: Song[];
}

export interface DerivedArtist {
  name: string;
  slug: string;
  art?: string;
  likedCount: number;
}

export interface DerivedAlbum {
  artistName: string;
  artistSlug: string;
  albumName: string;
  albumIdentifier: string;
  art?: string;
  showVenue?: string;
  showDate?: string;
  likedCount: number;
}

/** Returns true if the image URL is a real image, not a placeholder */
function isRealImage(url?: string): boolean {
  if (!url) return false;
  return !url.includes('/default.') && !url.includes('placeholder');
}

export const paletteColors = [
  '--secondary',
  '--tertiary',
  '--quaternary',
  '--quinary',
  '--senary',
] as const;

export function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function formatShowDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
}

export function aggregateVersions(wishlistItems: WishlistItem[]): AggregatedVersion[] {
  const groups = new Map<string, { count: number; artistName: string; artistSlug: string; songs: Song[] }>();

  for (const item of wishlistItems) {
    const title = item.song.trackTitle || item.song.title;
    const existing = groups.get(title);
    if (existing) {
      existing.count++;
      existing.songs.push(item.song);
    } else {
      groups.set(title, {
        count: 1,
        artistName: item.song.artistName,
        artistSlug: item.song.artistSlug,
        songs: [item.song],
      });
    }
  }

  const entries = Array.from(groups.entries())
    .map(([trackTitle, data]) => ({ trackTitle, ...data, progressPercent: 0 }))
    .sort((a, b) => b.count - a.count);

  const maxCount = entries[0]?.count || 1;
  for (const entry of entries) {
    entry.progressPercent = Math.round((entry.count / maxCount) * 100);
  }

  return entries;
}

export function deriveArtists(
  wishlistItems: WishlistItem[],
  recentlyPlayed: RecentItem[],
  followedArtists: string[],
): DerivedArtist[] {
  const artistMap = new Map<string, DerivedArtist>();

  const allSongs = [
    ...wishlistItems.map((i) => i.song),
    ...recentlyPlayed.map((i) => i.song),
  ];

  for (const song of allSongs) {
    const existing = artistMap.get(song.artistSlug);
    if (!existing) {
      artistMap.set(song.artistSlug, {
        name: song.artistName,
        slug: song.artistSlug,
        art: isRealImage(song.albumArt) ? song.albumArt : undefined,
        likedCount: 0,
      });
    } else if (!existing.art && isRealImage(song.albumArt)) {
      existing.art = song.albumArt;
    }
  }

  for (const item of wishlistItems) {
    const info = artistMap.get(item.song.artistSlug);
    if (info) info.likedCount++;
  }

  // Include followed artists even if they have no songs
  for (const slug of followedArtists) {
    if (!artistMap.has(slug)) {
      artistMap.set(slug, {
        name: slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        slug,
        likedCount: 0,
      });
    }
  }

  return Array.from(artistMap.values()).sort((a, b) => b.likedCount - a.likedCount);
}

export function deriveAlbums(
  wishlistItems: WishlistItem[],
  recentlyPlayed: RecentItem[],
  followedAlbums: string[],
): DerivedAlbum[] {
  const albumMap = new Map<string, DerivedAlbum>();

  const allSongs = [
    ...wishlistItems.map((i) => i.song),
    ...recentlyPlayed.map((i) => i.song),
  ];

  for (const song of allSongs) {
    const key = `${song.artistSlug}::${song.albumName}`;
    const existing = albumMap.get(key);
    if (!existing) {
      albumMap.set(key, {
        artistName: song.artistName,
        artistSlug: song.artistSlug,
        albumName: song.albumName,
        albumIdentifier: song.albumIdentifier,
        art: isRealImage(song.albumArt) ? song.albumArt : undefined,
        showVenue: song.showVenue,
        showDate: song.showDate,
        likedCount: 0,
      });
    } else {
      if (!existing.art && isRealImage(song.albumArt)) existing.art = song.albumArt;
      if (!existing.showVenue && song.showVenue) existing.showVenue = song.showVenue;
      if (!existing.showDate && song.showDate) existing.showDate = song.showDate;
      if (!existing.albumIdentifier && song.albumIdentifier) existing.albumIdentifier = song.albumIdentifier;
    }
  }

  for (const item of wishlistItems) {
    const key = `${item.song.artistSlug}::${item.song.albumName}`;
    const info = albumMap.get(key);
    if (info) info.likedCount++;
  }

  // Include followed albums
  for (const identifier of followedAlbums) {
    if (!albumMap.has(identifier)) {
      const [artistSlug] = identifier.split('::');
      albumMap.set(identifier, {
        artistName: artistSlug,
        artistSlug,
        albumName: identifier.split('::')[1] || '',
        albumIdentifier: '',
        likedCount: 0,
      });
    }
  }

  return Array.from(albumMap.values()).sort((a, b) => b.likedCount - a.likedCount);
}

export function getLastUpdatedText(
  cassettes: Cassette[],
  minidiscs: MiniDisc[],
  wishlistItems: WishlistItem[],
  recentlyPlayed: RecentItem[],
): string {
  const dates: number[] = [];

  for (const c of cassettes) dates.push(new Date(c.updatedAt).getTime());
  for (const m of minidiscs) dates.push(new Date(m.updatedAt).getTime());
  for (const w of wishlistItems) dates.push(new Date(w.addedAt).getTime());
  for (const r of recentlyPlayed) dates.push(new Date(r.playedAt).getTime());

  if (dates.length === 0) return 'never';

  const latest = Math.max(...dates);
  const diffDays = Math.floor((Date.now() - latest) / 86400000);

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}

export function getArtistInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (words[0]?.[0] || '?').toUpperCase();
}
