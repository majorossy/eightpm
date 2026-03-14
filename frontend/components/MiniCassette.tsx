'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

function tintFrom(v: string): Record<string, string> {
  return {
    '--cassette-body': `linear-gradient(180deg, color-mix(in srgb, var(${v}) 45%, black), color-mix(in srgb, var(${v}) 25%, black), color-mix(in srgb, var(${v}) 12%, black))`,
    '--cassette-window': `color-mix(in srgb, var(${v}) 12%, black)`,
    '--cassette-reel': `radial-gradient(circle at 40% 40%, color-mix(in srgb, var(${v}) 40%, black), color-mix(in srgb, var(${v}) 12%, black))`,
    '--cassette-tape': `linear-gradient(180deg, color-mix(in srgb, var(${v}) 12%, black), color-mix(in srgb, var(${v}) 5%, black), color-mix(in srgb, var(${v}) 12%, black))`,
    '--cassette-screw': `radial-gradient(circle at 35% 35%, color-mix(in srgb, var(${v}) 55%, black), color-mix(in srgb, var(${v}) 40%, black))`,
    '--cassette-border': `color-mix(in srgb, var(${v}) 40%, black)`,
  };
}

export const CASSETTE_PALETTE_VARS = [
  '--secondary',   // coral/red
  '--tertiary',    // teal
  '--quaternary',  // purple
  '--quinary',     // gold
  '--senary',      // blue-gray
] as const;

export const cassetteTints: Record<string, string>[] = CASSETTE_PALETTE_VARS.map(v => tintFrom(v));

export const CASSETTE_COLOR_COUNT = cassetteTints.length;

export function getCassetteTint(index: number): Record<string, string> {
  return cassetteTints[index % cassetteTints.length];
}

interface MiniCassetteProps {
  name: string;
  albumName: string;
  artistName: string;
  showDate?: string;
  coverArt?: string;
  selected?: boolean;
  pickCount?: number;
  blank?: boolean;
  tintIndex?: number;
  onNameChange?: (newName: string) => void;
  headerLabel?: string;
}

export default function MiniCassette({ name, albumName, artistName, coverArt, selected, pickCount, blank, tintIndex, onNameChange, headerLabel }: MiniCassetteProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitName = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      onNameChange?.(trimmed);
    } else {
      setDraft(name);
    }
    setEditing(false);
  }, [draft, name, onNameChange]);

  const startEditing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!onNameChange) return;
    e.stopPropagation();
    e.preventDefault();
    setDraft(name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [name, onNameChange]);
  return (
    <div
      className="relative w-full rounded-lg overflow-hidden transition-shadow"
      style={{
        ...(tintIndex != null && !blank ? getCassetteTint(tintIndex) : {}),
        aspectRatio: '4 / 2.6',
        background: blank
          ? 'linear-gradient(180deg, #e8e4de 0%, #d8d4cc 50%, #ccc8c0 100%)'
          : 'var(--cassette-body)',
        border: selected
          ? '2px solid var(--secondary)'
          : blank
            ? '2px solid #c8c4bc'
            : '2px solid var(--cassette-border)',
        boxShadow: selected
          ? '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 12px color-mix(in srgb, var(--secondary) 40%, transparent)'
          : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
      } as React.CSSProperties}
    >
      {/* Corner screws */}
      {[{ top: 5, left: 5 }, { top: 5, right: 5 }, { bottom: 5, left: 5 }, { bottom: 5, right: 5 }].map((pos, i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{ ...pos, background: blank ? '#d0ccc4' : 'var(--cassette-screw)', border: blank ? '1px solid #b8b4ac' : '1px solid var(--cassette-border)' }}
        />
      ))}

      {/* Label area */}
      <div className="absolute top-3.5 left-3.5 right-3.5 bottom-[38%] rounded-sm overflow-hidden"
        style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}
      >
        {/* Header band */}
        <div
          className="h-4 flex items-center justify-between px-2 text-[8.5px] font-bold text-white tracking-wider"
          style={{ background: blank ? '#a8a098' : 'var(--cassette-header)' }}
        >
          <span>{blank ? 'BLANK TAPE' : headerLabel || 'LIVE RECORDING'}</span>
          <span className="opacity-70 font-normal">
            {blank ? 'New' : pickCount != null && pickCount > 0 ? `${pickCount} pick${pickCount !== 1 ? 's' : ''}` : 'Type II'}
          </span>
        </div>

        {/* Label content */}
        <div
          className="relative flex-1 h-[calc(100%-16px)] px-2.5 py-1.5 flex flex-col justify-between"
          style={{ background: 'linear-gradient(180deg, #faf4e8 0%, #f5ebda 50%, #efe1cc 100%)' }}
        >
          {/* Ruled lines */}
          <div className="absolute top-[18px] left-2 right-2 h-px" style={{ background: 'var(--cassette-label-ruled)' }} />
          <div className="absolute top-[28px] left-2 right-2 h-px" style={{ background: 'var(--cassette-label-ruled)', opacity: 0.5 }} />
          {blank && (
            <>
              <div className="absolute top-[38px] left-2 right-2 h-px" style={{ background: 'var(--cassette-label-ruled)', opacity: 0.35 }} />
              <div className="absolute top-[48px] left-2 right-2 h-px" style={{ background: 'var(--cassette-label-ruled)', opacity: 0.2 }} />
            </>
          )}

          {blank ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[13px] italic" style={{ color: 'var(--cassette-label-muted)' }}>
                Blank tape
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 min-w-0">
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitName();
                      if (e.key === 'Escape') { setDraft(name); setEditing(false); }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={33}
                    className="w-full text-[17px] font-semibold bg-transparent border-b border-dashed outline-none"
                    style={{ color: '#1a0f08', fontFamily: 'Georgia, serif', borderColor: '#1a0f0840' }}
                  />
                ) : (
                  <div className="flex items-start gap-1">
                    <p
                      className="text-[17px] font-semibold line-clamp-2 flex-1"
                      style={{ color: '#1a0f08', fontFamily: 'Georgia, serif' }}
                    >
                      {name}
                    </p>
                    {onNameChange && (
                      <button
                        type="button"
                        onClick={startEditing}
                        className="shrink-0 mt-0.5 opacity-40 hover:opacity-80 transition-opacity"
                        aria-label="Edit cassette name"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="#1a0f08" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                <p className="text-[13px] truncate" style={{ color: 'var(--cassette-label-text)' }}>
                  {albumName}
                </p>
                <p className="text-[11px] italic truncate" style={{ color: 'var(--cassette-label-muted)' }}>
                  {artistName}
                </p>
              </div>
              {coverArt && (
                <div className="relative w-20 h-20 flex-shrink-0" style={{ transform: 'rotate(5deg)', marginTop: '-10px', marginRight: '-6px' }}>
                  <Image
                    src={coverArt}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover rounded-[1px]"
                    style={{ border: '2px solid white', boxShadow: '0 3px 10px rgba(0,0,0,0.35)' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tape window */}
      <div
        className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-sm flex items-center justify-between px-2.5"
        style={{
          width: '65%',
          height: '26%',
          background: blank ? '#b8b4ac' : 'var(--cassette-window)',
          border: blank ? '1.5px solid #a8a4a0' : '1.5px solid var(--cassette-border)',
          boxShadow: blank ? 'inset 0 2px 4px rgba(0,0,0,0.15)' : 'inset 0 2px 4px rgba(0,0,0,0.4)',
        }}
      >
        {/* Left reel */}
        <div className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: blank ? '#ccc8c0' : 'var(--cassette-reel)', border: blank ? '1.5px solid #a8a4a0' : '1.5px solid var(--cassette-border)' }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: blank ? '#b8b4ac' : 'var(--cassette-window)', border: blank ? '1px solid #a8a4a0' : '1px solid var(--cassette-border)' }} />
        </div>
        {/* Tape path */}
        <div className="flex-1 mx-1.5 h-1 rounded-sm" style={{ background: blank ? '#a8a4a0' : 'var(--cassette-tape)' }} />
        {/* Right reel */}
        <div className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: blank ? '#ccc8c0' : 'var(--cassette-reel)', border: blank ? '1.5px solid #a8a4a0' : '1.5px solid var(--cassette-border)' }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: blank ? '#b8b4ac' : 'var(--cassette-window)', border: blank ? '1px solid #a8a4a0' : '1px solid var(--cassette-border)' }} />
        </div>
      </div>
    </div>
  );
}
