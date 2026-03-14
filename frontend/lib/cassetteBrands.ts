export interface CassetteBrandDef {
  key: string;
  name: string;
  headerLabel: string;
  accent: string;
  tint: Record<string, string>;
}

// Each brand is hand-crafted to match iconic real-world tape aesthetics.
// No shared helper — every tint dict is unique.

export const CASSETTE_BRANDS: CassetteBrandDef[] = [
  // ── Maxell XLII ──────────────────────────────────────────────────
  // "Blown away guy" era. Pure matte black shell, luxurious gold
  // metallic header band, champagne label tones. The gold standard.
  {
    key: 'maxell-xlii',
    name: 'Maxell XLII',
    headerLabel: 'MAXELL XLII',
    accent: '#d4a010',
    tint: {
      '--cassette-body': 'linear-gradient(180deg, #1e1e1e, #121212, #0a0a0a)',
      '--cassette-window': '#080808',
      '--cassette-reel': 'radial-gradient(circle at 40% 40%, #2a2a2a, #0e0e0e)',
      '--cassette-tape': 'linear-gradient(180deg, #181818, #0a0a0a, #181818)',
      '--cassette-screw': 'radial-gradient(circle at 35% 35%, #d4a010, #8a6800)',
      '--cassette-border': '#2a2a2a',
      '--cassette-header': 'linear-gradient(180deg, #e8b820, #c89808, #a07800)',
      '--cassette-glow': '#d4a010',
      '--cassette-label-text': '#7a6020',
      '--cassette-label-muted': '#9a7828',
      '--cassette-label-accent': '#c89808',
      '--cassette-label-ruled': 'color-mix(in srgb, #d4a010 15%, transparent)',
    },
  },

  // ── TDK SA ───────────────────────────────────────────────────────
  // Japanese precision. Smoke-gray translucent shell with a cool
  // blue-teal header. Clean, technical, no-nonsense.
  {
    key: 'tdk-sa',
    name: 'TDK SA',
    headerLabel: 'TDK SA',
    accent: '#00b8a8',
    tint: {
      '--cassette-body': 'linear-gradient(180deg, #38383c, #28282c, #1c1c20)',
      '--cassette-window': 'linear-gradient(180deg, #0c1018, #080c12)',
      '--cassette-reel': 'radial-gradient(circle at 40% 40%, #404048, #20202a)',
      '--cassette-tape': 'linear-gradient(180deg, #1a1a20, #0c0c10, #1a1a20)',
      '--cassette-screw': 'radial-gradient(circle at 35% 35%, #58585e, #38383e)',
      '--cassette-border': '#484850',
      '--cassette-header': 'linear-gradient(180deg, #00d0be, #00a898, #008878)',
      '--cassette-glow': '#00b8a8',
      '--cassette-label-text': '#006858',
      '--cassette-label-muted': '#008070',
      '--cassette-label-accent': '#00a898',
      '--cassette-label-ruled': 'color-mix(in srgb, #00b8a8 12%, transparent)',
    },
  },

  // ── Memorex dBS ──────────────────────────────────────────────────
  // "Is it live, or is it Memorex?" Utilitarian mid-gray shell,
  // punchy red header stripe, chrome-silver screws. All business.
  {
    key: 'memorex-dbs',
    name: 'Memorex dBS',
    headerLabel: 'MEMOREX dBS',
    accent: '#d02828',
    tint: {
      '--cassette-body': 'linear-gradient(180deg, #585858, #484848, #383838)',
      '--cassette-window': '#1a1a1a',
      '--cassette-reel': 'radial-gradient(circle at 40% 40%, #606060, #3a3a3a)',
      '--cassette-tape': 'linear-gradient(180deg, #282828, #141414, #282828)',
      '--cassette-screw': 'radial-gradient(circle at 35% 35%, #a0a0a0, #707070)',
      '--cassette-border': '#505050',
      '--cassette-header': 'linear-gradient(180deg, #e03030, #c02020, #981818)',
      '--cassette-glow': '#d02828',
      '--cassette-label-text': '#801818',
      '--cassette-label-muted': '#a02020',
      '--cassette-label-accent': '#c82020',
      '--cassette-label-ruled': 'color-mix(in srgb, #d02828 12%, transparent)',
    },
  },

  // ── Sony HF ──────────────────────────────────────────────────────
  // Warm bone-white shell, bright tangerine header, minimal and
  // clean. That unmistakable Sony consumer electronics warmth.
  {
    key: 'sony-hf',
    name: 'Sony HF',
    headerLabel: 'SONY HF',
    accent: '#f07828',
    tint: {
      '--cassette-body': 'linear-gradient(180deg, #b8b0a8, #a8a098, #989088)',
      '--cassette-window': '#504840',
      '--cassette-reel': 'radial-gradient(circle at 40% 40%, #c0b8b0, #908880)',
      '--cassette-tape': 'linear-gradient(180deg, #404040, #282828, #404040)',
      '--cassette-screw': 'radial-gradient(circle at 35% 35%, #d0c8c0, #a8a098)',
      '--cassette-border': '#908880',
      '--cassette-header': 'linear-gradient(180deg, #f88830, #e07020, #c06018)',
      '--cassette-glow': '#f07828',
      '--cassette-label-text': '#905020',
      '--cassette-label-muted': '#b06028',
      '--cassette-label-accent': '#e07020',
      '--cassette-label-ruled': 'color-mix(in srgb, #f07828 15%, transparent)',
    },
  },

  // ── BASF Chrome Extra II ─────────────────────────────────────────
  // German engineering. Deep midnight-blue shell, brushed chrome
  // header with steel-blue shimmer. Cold, precise, premium.
  {
    key: 'basf-chrome',
    name: 'BASF Chrome',
    headerLabel: 'BASF CHROME EXTRA II',
    accent: '#a0b8d0',
    tint: {
      '--cassette-body': 'linear-gradient(180deg, #1c2840, #142030, #0e1828)',
      '--cassette-window': '#060c18',
      '--cassette-reel': 'radial-gradient(circle at 40% 40%, #283850, #101828)',
      '--cassette-tape': 'linear-gradient(180deg, #101820, #080c14, #101820)',
      '--cassette-screw': 'radial-gradient(circle at 35% 35%, #c0d0e0, #8090a8)',
      '--cassette-border': '#283848',
      '--cassette-header': 'linear-gradient(180deg, #c8d8e8, #98a8c0, #7888a0)',
      '--cassette-glow': '#a0b8d0',
      '--cassette-label-text': '#506880',
      '--cassette-label-muted': '#687890',
      '--cassette-label-accent': '#8898b0',
      '--cassette-label-ruled': 'color-mix(in srgb, #a0b8d0 10%, transparent)',
    },
  },

  // ── Scotch BX ────────────────────────────────────────────────────
  // 3M's workhorse. Rich tobacco-brown shell, dark chocolate header,
  // warm amber screws. Earthy, analog, Sunday afternoon vibes.
  {
    key: 'scotch-bx',
    name: 'Scotch BX',
    headerLabel: 'SCOTCH BX',
    accent: '#c89040',
    tint: {
      '--cassette-body': 'linear-gradient(180deg, #4a3828, #382818, #2a1c10)',
      '--cassette-window': '#140c08',
      '--cassette-reel': 'radial-gradient(circle at 40% 40%, #584030, #2a1c10)',
      '--cassette-tape': 'linear-gradient(180deg, #201810, #100c08, #201810)',
      '--cassette-screw': 'radial-gradient(circle at 35% 35%, #d0a050, #987030)',
      '--cassette-border': '#503820',
      '--cassette-header': 'linear-gradient(180deg, #5a3c20, #402810, #301c08)',
      '--cassette-glow': '#c89040',
      '--cassette-label-text': '#785020',
      '--cassette-label-muted': '#986830',
      '--cassette-label-accent': '#b88038',
      '--cassette-label-ruled': 'color-mix(in srgb, #c89040 12%, transparent)',
    },
  },
];

export function getCassetteBrandTint(key: string): Record<string, string> | undefined {
  return CASSETTE_BRANDS.find(b => b.key === key)?.tint;
}

export function getCassetteBrand(key: string): CassetteBrandDef | undefined {
  return CASSETTE_BRANDS.find(b => b.key === key);
}
