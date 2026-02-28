'use client';

import { memo, useEffect, useState, useMemo } from 'react';

interface VUMeterProps {
  volume: number;
  size?: 'small' | 'normal';
}

/**
 * VUMeter - Classic analog VU meter visualization
 *
 * Displays a semi-circular meter with a swinging needle that responds to volume.
 * Perfect for cassette tape headers and album art.
 *
 * Performance: Uses React.memo with custom comparison to skip re-renders
 * when volume changes by less than 1% (imperceptible).
 */
export const VUMeter = memo(
  function VUMeter({ volume, size = 'normal' }: VUMeterProps) {
    const isSmall = size === 'small';
    const width = isSmall ? 24 : 36;
    const height = isSmall ? 14 : 20;

    // Map volume (0-1) to needle angle (-35° to +35°)
    const angle = -35 + (volume * 70);

    return (
      <div
        className="relative"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          contain: 'layout style paint', // CSS containment for performance
        }}
      >
        {/* Meter background arc */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full opacity-70"
          style={{
            width: `${width}px`,
            height: `${width / 2}px`,
            background: 'linear-gradient(90deg, #3a5a30 0%, #8a8a30 50%, #8a4030 100%)',
          }}
        />

        {/* Needle */}
        <div
          className="absolute bottom-[2px] left-1/2 w-[2px] bg-surface-sunken rounded-sm"
          style={{
            height: `${isSmall ? 12 : 16}px`,
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transition: 'transform 0.08s ease-out',
            willChange: 'transform', // Hint for GPU acceleration
          }}
        />

        {/* Center pivot */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-accent rounded-full"
          style={{
            width: `${isSmall ? 4 : 6}px`,
            height: `${isSmall ? 4 : 6}px`,
          }}
        />
      </div>
    );
  },
  // Custom comparison: only re-render if volume changed by more than 1%
  (prevProps, nextProps) => {
    const volumeChanged = Math.abs(prevProps.volume - nextProps.volume) > 0.01;
    const sizeChanged = prevProps.size !== nextProps.size;
    return !volumeChanged && !sizeChanged;
  }
);

VUMeter.displayName = 'VUMeter';

interface SpinningReelProps {
  volume: number;
  size?: 'small' | 'normal';
  isPlaying?: boolean;
}

/**
 * SpinningReel - Animated tape reel visualization
 *
 * A spinning reel icon that rotates faster with higher volume.
 * Perfect for version cards and recording indicators.
 *
 * Performance: Uses React.memo with custom comparison to only re-render
 * when playing state or size changes. Volume changes are handled internally
 * via useEffect interval, so we can skip those re-renders.
 */
export const SpinningReel = memo(
  function SpinningReel({ volume, size = 'normal', isPlaying = true }: SpinningReelProps) {
    const isSmall = size === 'small';
    const diameter = isSmall ? 14 : 20;
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
      if (!isPlaying) return;

      // Base speed + volume-reactive acceleration
      const speed = 2 + (volume * 8);

      const interval = setInterval(() => {
        setRotation(prev => (prev + speed) % 360);
      }, 50);

      return () => clearInterval(interval);
    }, [volume, isPlaying]);

    return (
      <div
        className="relative"
        style={{
          width: `${diameter}px`,
          height: `${diameter}px`,
          contain: 'layout style paint', // CSS containment for performance
        }}
      >
        {/* Outer ring with warm glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 40%, var(--bg-card, #5a4530), var(--bg, #3a3530))',
            border: `${isSmall ? 2 : 3}px solid var(--secondary)`,
            boxShadow: '0 0 8px var(--accent-glow-subtle), inset 0 0 4px var(--accent-gradient-warm)',
          }}
        />

        {/* Spokes */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.05s linear',
            willChange: 'transform', // Hint for GPU acceleration
          }}
        >
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div
              key={deg}
              className="absolute top-1/2 left-1/2 bg-surface-sunken"
              style={{
                width: `${diameter * 0.35}px`,
                height: '1px',
                transformOrigin: 'left center',
                transform: `rotate(${deg}deg)`,
              }}
            />
          ))}
        </div>

        {/* Center hub */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-border rounded-full border border-default"
          style={{
            width: `${diameter * 0.3}px`,
            height: `${diameter * 0.3}px`,
          }}
        />
      </div>
    );
  },
  // Custom comparison: only re-render if playing state or size changes
  // Volume is handled internally by useEffect interval
  (prevProps, nextProps) => {
    return (
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.size === nextProps.size
    );
  }
);

SpinningReel.displayName = 'SpinningReel';

interface WaveformProps {
  waveform: number[];
  size?: 'small' | 'normal';
  color?: string;
}

/**
 * Waveform - Audio waveform visualization
 *
 * Displays a real-time oscilloscope-style waveform from audio data.
 * Perfect for track rows showing "now playing" state.
 *
 * Performance: Uses React.memo with custom comparison that samples
 * every 5th point for comparison (instead of all 30), skipping
 * re-renders when waveform changes are imperceptible.
 */
export const Waveform = memo(
  function Waveform({ waveform, size = 'normal', color = '#e8a050' }: WaveformProps) {
    const isSmall = size === 'small';
    const width = isSmall ? 30 : 50;
    const height = isSmall ? 12 : 16;

    const path = useMemo(() => {
      if (!waveform || waveform.length === 0) {
        // Flat line when no data
        return `M0,${height / 2} L${width},${height / 2}`;
      }

      const points = waveform.map((val, i) => {
        const x = (i / (waveform.length - 1)) * width;
        const y = (height / 2) + (val * height * 0.4);
        return `${x},${y}`;
      });

      return `M${points.join(' L')}`;
    }, [waveform, width, height]);

    return (
      <div
        className="overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          contain: 'layout style paint', // CSS containment for performance
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ filter: `drop-shadow(0 0 3px ${color}60)` }}
        >
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  },
  // Custom comparison: sample every 5th point for comparison
  (prevProps, nextProps) => {
    if (prevProps.size !== nextProps.size) return false;
    if (prevProps.color !== nextProps.color) return false;
    if (!prevProps.waveform || !nextProps.waveform) return false;
    if (prevProps.waveform.length !== nextProps.waveform.length) return false;

    // Sample every 5th point for comparison (performance optimization)
    const threshold = 0.1; // 10% change threshold
    for (let i = 0; i < prevProps.waveform.length; i += 5) {
      if (Math.abs(prevProps.waveform[i] - nextProps.waveform[i]) > threshold) {
        return false; // Data changed significantly, re-render
      }
    }
    return true; // Data similar, skip re-render
  }
);

Waveform.displayName = 'Waveform';

interface EQBarsProps {
  frequencyData: number[];
  size?: 'small' | 'normal';
  color?: string;
  barCount?: number;
}

/**
 * EQBars - Equalizer bars visualization
 *
 * Classic bouncing EQ bars that respond to frequency data.
 * Alternative to waveform for "now playing" indicators.
 *
 * Performance: Uses React.memo with custom comparison that samples
 * every 4th frequency band, skipping re-renders when changes are
 * imperceptible (< 10% change).
 */
export const EQBars = memo(
  function EQBars({
    frequencyData,
    size = 'normal',
    color = '#e8a050',
    barCount = 3
  }: EQBarsProps) {
    const isSmall = size === 'small';
    const barWidth = isSmall ? 2 : 3;
    const maxHeight = isSmall ? 12 : 16;
    const gap = isSmall ? 1 : 2;

    // Get bar heights from frequency data
    const getBarHeight = (index: number) => {
      if (!frequencyData || frequencyData.length === 0) {
        return maxHeight * 0.3; // Default height
      }

      // Map bar index to frequency band
      const freqIndex = Math.floor((index / barCount) * frequencyData.length);
      const value = frequencyData[freqIndex] || 0;

      // Minimum height + scaled value
      return Math.max(4, value * maxHeight);
    };

    return (
      <div
        className="flex items-end"
        style={{
          height: `${maxHeight}px`,
          gap: `${gap}px`,
          contain: 'layout style paint', // CSS containment for performance
        }}
      >
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: `${barWidth}px`,
              height: `${getBarHeight(i)}px`,
              backgroundColor: color,
              transition: 'height 0.08s ease-out',
              willChange: 'height', // Hint for GPU acceleration
            }}
          />
        ))}
      </div>
    );
  },
  // Custom comparison: sample every 4th frequency band
  (prevProps, nextProps) => {
    if (prevProps.size !== nextProps.size) return false;
    if (prevProps.color !== nextProps.color) return false;
    if (prevProps.barCount !== nextProps.barCount) return false;
    if (!prevProps.frequencyData || !nextProps.frequencyData) return false;
    if (prevProps.frequencyData.length !== nextProps.frequencyData.length) return false;

    // Sample every 4th frequency band for comparison
    const threshold = 0.1; // 10% change threshold
    for (let i = 0; i < prevProps.frequencyData.length; i += 4) {
      if (Math.abs(prevProps.frequencyData[i] - nextProps.frequencyData[i]) > threshold) {
        return false; // Data changed significantly, re-render
      }
    }
    return true; // Data similar, skip re-render
  }
);

EQBars.displayName = 'EQBars';

interface PulsingDotProps {
  isPlaying: boolean;
  color?: string;
  size?: 'small' | 'normal';
}

/**
 * PulsingDot - Simple pulsing indicator
 *
 * A glowing dot that pulses when audio is playing.
 * Minimal CPU usage compared to waveform/EQ.
 *
 * Performance: Already optimized - only re-renders when props change.
 * Added CSS containment for isolation from document reflow.
 */
export const PulsingDot = memo(
  function PulsingDot({ isPlaying, color = '#e8a050', size = 'normal' }: PulsingDotProps) {
    const isSmall = size === 'small';
    const diameter = isSmall ? 6 : 8;

    return (
      <div
        className={`rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
        style={{
          width: `${diameter}px`,
          height: `${diameter}px`,
          backgroundColor: isPlaying ? color : '#4a4038',
          boxShadow: isPlaying ? `0 0 10px ${color}90` : 'none',
          transition: 'all 0.3s ease',
          contain: 'layout style paint', // CSS containment for performance
        }}
      />
    );
  },
  // Simple prop comparison - only re-render if any prop changed
  (prevProps, nextProps) => {
    return (
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.color === nextProps.color &&
      prevProps.size === nextProps.size
    );
  }
);

PulsingDot.displayName = 'PulsingDot';
