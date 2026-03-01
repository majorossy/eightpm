'use client';

import { useState } from 'react';
import type { SignalLevel } from '@/lib/signalUtils';

interface SignalStrengthIconProps {
  level: SignalLevel;
  color: string;
  label: string;
  tooltip: string;
  isOffline: boolean;
  size?: number;
  className?: string;
  /** Extra streaming stats for the hover card */
  streamingStats?: {
    networkType: string | null;
    downlinkMbps: number | null;
    bufferedAhead: number;
    bufferedPercent: number;
    isLoading: boolean;
  };
}

/**
 * WiFi-style signal strength indicator with 3 arcs + center dot.
 * Arcs light up based on level; dimmed arcs at 20% opacity.
 * Offline state adds a diagonal slash.
 * Hover shows a styled card with streaming stats.
 */
export default function SignalStrengthIcon({
  level,
  color,
  label,
  tooltip,
  isOffline,
  size = 16,
  className = '',
  streamingStats,
}: SignalStrengthIconProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className="relative inline-flex items-center cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        className={className}
        role="img"
        aria-label={label}
      >
        {/* Arc 3 (outer) */}
        <path
          d="M2.5 6.5a7.2 7.2 0 0 1 11 0"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={level >= 3 ? 1 : 0.2}
        />
        {/* Arc 2 (middle) */}
        <path
          d="M4.5 9a4.8 4.8 0 0 1 7 0"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={level >= 2 ? 1 : 0.2}
        />
        {/* Arc 1 (inner) */}
        <path
          d="M6.5 11.2a2.4 2.4 0 0 1 3 0"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={level >= 1 ? 1 : 0.2}
        />
        {/* Center dot */}
        <circle
          cx="8"
          cy="13.5"
          r="1"
          fill={color}
          opacity={isOffline ? 0.2 : 1}
        />

        {/* Offline slash */}
        {isOffline && (
          <line
            x1="3"
            y1="3"
            x2="13"
            y2="13"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Hover tooltip card */}
      {hovered && (
        <div
          className="absolute bottom-full right-0 mb-2 z-50 pointer-events-none
            min-w-[160px] px-3 py-2.5 rounded-lg
            bg-surface-elevated border border-border-subtle-token
            shadow-lg shadow-black/30
            animate-fade-in"
        >
          {/* Signal label row */}
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[11px] font-medium text-primary whitespace-nowrap">
              {label}
            </span>
          </div>

          {/* Network type + speed */}
          {streamingStats && (streamingStats.networkType || streamingStats.downlinkMbps !== null) && (
            <div className="text-[10px] text-secondary font-jb-mono leading-relaxed">
              {[
                streamingStats.networkType?.toUpperCase(),
                streamingStats.downlinkMbps !== null ? `${streamingStats.downlinkMbps} Mbps` : null,
              ].filter(Boolean).join(' \u00b7 ')}
            </div>
          )}

          {/* Buffer status */}
          {streamingStats && !isOffline && (
            <div className="text-[10px] text-secondary font-jb-mono leading-relaxed">
              {streamingStats.isLoading
                ? 'Buffering\u2026'
                : streamingStats.bufferedAhead > 0
                  ? `${Math.round(streamingStats.bufferedAhead)}s buffered`
                  : 'No buffer'}
            </div>
          )}

          {/* Offline message */}
          {isOffline && (
            <div className="text-[10px] text-secondary font-jb-mono leading-relaxed">
              No internet connection
            </div>
          )}

          {/* Arrow nub */}
          <div
            className="absolute -bottom-1 right-2 w-2 h-2 rotate-45
              bg-surface-elevated border-r border-b border-border-subtle-token"
          />
        </div>
      )}
    </span>
  );
}
