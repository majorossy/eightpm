export interface CassetteColorDef {
  name: string;
  source: 'theme' | 'fixed';
  value: string; // CSS var name (e.g. '--secondary') or hex (e.g. '#e84393')
}

export const CASSETTE_PRESETS: CassetteColorDef[] = [
  // Original 5 — theme-aware, backward-compatible at same indices
  { name: 'Coral',     source: 'theme', value: '--secondary' },
  { name: 'Teal',      source: 'theme', value: '--tertiary' },
  { name: 'Lavender',  source: 'theme', value: '--quaternary' },
  { name: 'Gold',      source: 'theme', value: '--quinary' },
  { name: 'Steel',     source: 'theme', value: '--senary' },
  // Fixed colors — don't change with theme
  { name: 'Hot Pink',  source: 'fixed', value: '#e84393' },
  { name: 'Tangerine', source: 'fixed', value: '#e17055' },
  { name: 'Clear',     source: 'fixed', value: '#d0ccc4' },
  { name: 'Forest',    source: 'fixed', value: '#2d6a4f' },
  { name: 'Burgundy',  source: 'fixed', value: '#7b2d3f' },
  { name: 'Sky Blue',  source: 'fixed', value: '#5dade2' },
  { name: 'Midnight',  source: 'fixed', value: '#2c3e6b' },
];

export const CASSETTE_COLOR_COUNT = CASSETTE_PRESETS.length;

// Resolve a color reference to a CSS-usable value string
function ref(def: CassetteColorDef): string {
  return def.source === 'theme' ? `var(${def.value})` : def.value;
}

// Build the full set of CSS custom property overrides for a cassette color
function tintFromColor(colorRef: string): Record<string, string> {
  const c = colorRef;
  return {
    '--cassette-body': `linear-gradient(180deg, color-mix(in srgb, ${c} 65%, black), color-mix(in srgb, ${c} 45%, black), color-mix(in srgb, ${c} 30%, black))`,
    '--cassette-window': `color-mix(in srgb, ${c} 25%, black)`,
    '--cassette-reel': `radial-gradient(circle at 40% 40%, color-mix(in srgb, ${c} 55%, black), color-mix(in srgb, ${c} 30%, black))`,
    '--cassette-tape': `linear-gradient(180deg, color-mix(in srgb, ${c} 25%, black), color-mix(in srgb, ${c} 12%, black), color-mix(in srgb, ${c} 25%, black))`,
    '--cassette-screw': `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${c} 70%, black), color-mix(in srgb, ${c} 55%, black))`,
    '--cassette-border': `color-mix(in srgb, ${c} 55%, black)`,
    '--cassette-header': `linear-gradient(180deg, color-mix(in srgb, ${c} 80%, black), color-mix(in srgb, ${c} 55%, black))`,
    '--cassette-glow': c,
    '--cassette-label-text': `color-mix(in srgb, ${c} 45%, black)`,
    '--cassette-label-muted': `color-mix(in srgb, ${c} 55%, black)`,
    '--cassette-label-accent': c,
    '--cassette-label-ruled': `color-mix(in srgb, ${c} 12%, transparent)`,
  };
}

// Pre-compute tints for all presets
const cassetteTints: Record<string, string>[] = CASSETTE_PRESETS.map(p => tintFromColor(ref(p)));

export function getCassetteTint(index: number): Record<string, string> {
  return cassetteTints[index % cassetteTints.length];
}

// For Phase 3: tint from an arbitrary hex value
export function tintFromHex(hex: string): Record<string, string> {
  return tintFromColor(hex);
}

// Resolve the display color for a swatch (CSS-ready string)
export function getSwatchColor(index: number): string {
  const p = CASSETTE_PRESETS[index % CASSETTE_PRESETS.length];
  return ref(p);
}

// Priority-based tint resolution: brand > hex > preset index
import { getCassetteBrandTint } from './cassetteBrands';

export function resolveCassetteTint(cassette: {
  colorBrand?: string; colorHex?: string; colorIndex?: number;
}): Record<string, string> {
  if (cassette.colorBrand) {
    const brand = getCassetteBrandTint(cassette.colorBrand);
    if (brand) return brand;
  }
  if (cassette.colorHex) return tintFromHex(cassette.colorHex);
  return getCassetteTint(cassette.colorIndex ?? 0);
}

export type CassetteColorMode = 'brand' | 'hex' | 'preset';
export function getCassetteColorMode(c: { colorBrand?: string; colorHex?: string }): CassetteColorMode {
  if (c.colorBrand) return 'brand';
  if (c.colorHex) return 'hex';
  return 'preset';
}
