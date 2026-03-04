'use client';

// EightPmLogo — Canvas wordmark with aurora bars and outlined text
// Uses theme palette vars for colors, Space Mono bold for the font.

import { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface EightPmLogoProps {
  size?: number;
  className?: string;
}

// Cream base RGB for dark themes
const CR = 245, CG = 240, CB = 232;
// Dark base RGB for light themes
const DR = 42, DG = 37, DB = 32;

function creamAt(a: number, light: boolean): string {
  return light
    ? `rgba(${DR},${DG},${DB},${a})`
    : `rgba(${CR},${CG},${CB},${a})`;
}

function buildAurora(tertiary: string, quinary: string, light: boolean): string[] {
  return [
    creamAt(0.2, light), creamAt(0.3, light),
    tertiary, tertiary,
    quinary, quinary,
    creamAt(0.7, light), creamAt(0.6, light),
    creamAt(0.4, light),
    tertiary,
    quinary, quinary,
    creamAt(0.6, light),
    tertiary,
    creamAt(0.5, light),
    quinary,
    creamAt(0.4, light),
    tertiary, tertiary,
    creamAt(0.25, light), creamAt(0.2, light),
  ];
}

function amp(idx: number, t: number): number {
  const env = Math.sin(Math.PI * t);
  const wave = 0.35 + 0.55 * Math.abs(Math.sin(idx * 0.72 + 0.4));
  return Math.max(0.12, Math.min(0.96, wave * (0.45 + 0.65 * env)));
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160;
}

export default function EightPmLogo({ size = 20, className = '' }: EightPmLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  const draw = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;

    const fs = size;
    const dpr = window.devicePixelRatio || 2;
    const text = '8pm.me';

    // Read palette hex vars
    const s = getComputedStyle(document.documentElement);
    const tertiary = s.getPropertyValue('--tertiary').trim() || '#5ab8a0';
    const quinary = s.getPropertyValue('--quinary').trim() || '#c8b468';
    const primary = s.getPropertyValue('--primary').trim() || '#2a4a52';
    const light = isLight(primary);

    // Resolve Space Mono font-family from CSS variable
    const fontVar = s.getPropertyValue('--font-space-mono').trim();
    const font = fontVar || "'Space Mono', monospace";

    const seq = buildAurora(tertiary, quinary, light);
    const outline = light
      ? `rgba(${DR},${DG},${DB},0.85)`
      : `rgba(${CR},${CG},${CB},0.9)`;

    // Measure characters
    const tmp = document.createElement('canvas').getContext('2d')!;
    tmp.font = `700 ${fs}px ${font}`;
    const chars = text.split('');
    const cW = chars.map(c => tmp.measureText(c).width);
    const totalW = cW.reduce((a, b) => a + b, 0);

    const padX = Math.round(fs * 0.1);
    const h = Math.round(fs * 1.3);
    const w = Math.round(totalW) + padX * 2;

    el.width = w * dpr;
    el.height = h * dpr;
    el.style.width = w + 'px';
    el.style.height = h + 'px';

    const ctx = el.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Draw aurora bars
    const barW = Math.max(1.5, fs * 0.058);
    const gap = Math.max(0.8, fs * 0.022);
    let bx = padX;
    let idx = 0;
    while (bx < padX + totalW) {
      const t = (bx - padX) / totalW;
      const a = amp(idx, t);
      const barH = h * a;
      const barTop = (h - barH) / 2;
      const r = Math.min(barW / 2, barH / 2);

      ctx.fillStyle = seq[idx % seq.length];
      ctx.beginPath();
      rrect(ctx, bx, barTop, barW, barH, r);
      ctx.fill();

      bx += barW + gap;
      idx++;
    }

    // Draw outlined text
    ctx.font = `700 ${fs}px ${font}`;
    ctx.textBaseline = 'alphabetic';
    ctx.strokeStyle = outline;
    ctx.lineWidth = Math.max(0.8, fs * 0.021);
    ctx.lineJoin = 'round';

    const baseline = h * 0.80;
    let cx = padX;
    chars.forEach((ch, i) => {
      ctx.strokeText(ch, cx, baseline);
      cx += cW[i];
    });
  }, [size, theme]);

  useEffect(() => {
    document.fonts.ready.then(draw);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block' }}
    />
  );
}
