import { Track, Song } from '@/lib/types';
import { getBestVersion } from '@/lib/queueTypes';

// Sentinel IDs (never persisted)
export const VIRTUAL_BEST_ID = 'virtual-best';
export const VIRTUAL_OLDEST_ID = 'virtual-oldest';
export const VIRTUAL_NEWEST_ID = 'virtual-newest';

// Display names
export const VIRTUAL_BEST_NAME = 'Best Versions';
export const VIRTUAL_OLDEST_NAME = 'Earliest Recording';
export const VIRTUAL_NEWEST_NAME = 'Latest Recording';

// Fixed tint indices (fallback for saved cassettes)
export const VIRTUAL_BEST_TINT = 0;
export const VIRTUAL_OLDEST_TINT = 4;
export const VIRTUAL_NEWEST_TINT = 1;

// Full theme tints for the big CassetteTape — matches each mini cassette's visual design
const BEST_TINT_STYLE: Record<string, string> = {
  '--cassette-body': 'linear-gradient(180deg, #1e1a10, #0e0c06, #1a1608)',
  '--cassette-window': '#080604',
  '--cassette-reel': 'radial-gradient(circle at 40% 40%, #f5e070, #7a5804)',
  '--cassette-tape': 'linear-gradient(180deg, #1e1a08, #0a0804, #1e1a08)',
  '--cassette-screw': 'radial-gradient(circle at 35% 35%, #1e1a10, #0e0c06)',
  '--cassette-border': '#c8940a',
  '--cassette-header': 'linear-gradient(180deg, #c8940a, #7a5804)',
  '--cassette-glow': '#c8940a',
  '--cassette-label-text': '#5a3a04',
  '--cassette-label-muted': '#7a5008',
  '--cassette-label-accent': '#c8940a',
  '--cassette-label-ruled': 'rgba(200,150,10,0.15)',
};

const OLDEST_TINT_STYLE: Record<string, string> = {
  '--cassette-body': 'linear-gradient(180deg, #6b5535, #4a3318, #3d2c14)',
  '--cassette-window': '#1a0e04',
  '--cassette-reel': 'radial-gradient(circle at 40% 40%, #3a2010, #1a0e04)',
  '--cassette-tape': 'linear-gradient(180deg, #2a1808, #0a0600, #2a1808)',
  '--cassette-screw': 'radial-gradient(circle at 35% 35%, #5a3a1a, #3a2810)',
  '--cassette-border': '#3d2c14',
  '--cassette-header': 'linear-gradient(180deg, #6b5535, #3d2c14)',
  '--cassette-glow': '#a07808',
  '--cassette-label-text': '#3a2810',
  '--cassette-label-muted': '#7a5020',
  '--cassette-label-accent': '#a07808',
  '--cassette-label-ruled': 'rgba(100,70,10,0.15)',
};

const NEWEST_TINT_STYLE: Record<string, string> = {
  '--cassette-body': 'linear-gradient(180deg, #e8eef2, #d0dce4, #c8d4da)',
  '--cassette-window': '#b8c8d0',
  '--cassette-reel': 'radial-gradient(circle at 40% 40%, #e0f4ff, #4a8aaa)',
  '--cassette-tape': 'linear-gradient(180deg, #c8dce8, #8ab8d0, #c8dce8)',
  '--cassette-screw': 'radial-gradient(circle at 35% 35%, #d0dce4, #a8bac4)',
  '--cassette-border': '#a8bac4',
  '--cassette-header': 'linear-gradient(180deg, #0d3a52, #0a1a2a)',
  '--cassette-glow': '#5ad0f8',
  '--cassette-label-text': '#5a9ab8',
  '--cassette-label-muted': '#3a8aaa',
  '--cassette-label-accent': '#5ad0f8',
  '--cassette-label-ruled': 'rgba(90,160,200,0.15)',
};

export function getVirtualCassetteTint(id: string | null): Record<string, string> | undefined {
  if (id === VIRTUAL_BEST_ID) return BEST_TINT_STYLE;
  if (id === VIRTUAL_OLDEST_ID) return OLDEST_TINT_STYLE;
  if (id === VIRTUAL_NEWEST_ID) return NEWEST_TINT_STYLE;
  return undefined;
}

const VALID_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(d: string | undefined): d is string {
  return d != null && VALID_DATE_RE.test(d);
}

function pickByDate(songs: Song[], direction: 'asc' | 'desc'): Song | undefined {
  const withDate = songs.filter(s => isValidDate(s.showDate));
  if (withDate.length === 0) return undefined;
  withDate.sort((a, b) => {
    const cmp = a.showDate!.localeCompare(b.showDate!);
    return direction === 'asc' ? cmp : -cmp;
  });
  return withDate[0];
}

export function computeVirtualOverrides(
  tracks: Track[],
  mode: 'best' | 'oldest' | 'newest',
): Record<string, string> {
  const overrides: Record<string, string> = {};

  for (const track of tracks) {
    if (track.songs.length <= 1) continue;

    const best = getBestVersion(track.songs);
    let pick: Song | undefined;

    if (mode === 'best') {
      if (best) overrides[track.id] = best.id;
      continue;
    } else if (mode === 'oldest') {
      pick = pickByDate(track.songs, 'asc');
    } else {
      pick = pickByDate(track.songs, 'desc');
    }

    if (pick && best && pick.id !== best.id) {
      overrides[track.id] = pick.id;
    }
  }

  return overrides;
}

export function isVirtualCassette(id: string | null): boolean {
  return id === VIRTUAL_BEST_ID || id === VIRTUAL_OLDEST_ID || id === VIRTUAL_NEWEST_ID;
}

export function hasMultiVersionTracks(tracks: Track[]): boolean {
  return tracks.some(t => t.songs.length > 1);
}
