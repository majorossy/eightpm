'use client';

import React from 'react';

export const qualityOptions = [
  { value: 'high' as const, label: 'High', format: 'FLAC', bitrate: 'Lossless', size: '~45MB' },
  { value: 'medium' as const, label: 'Medium', format: 'MP3', bitrate: '320kbps', size: '~10MB', recommended: true },
  { value: 'low' as const, label: 'Low', format: 'MP3', bitrate: '128kbps', size: '~4MB' },
];

export function getQualityBadge(preferredQuality: 'high' | 'medium' | 'low') {
  if (preferredQuality === 'high') {
    return { format: 'FLAC', bitrate: 'Lossless', label: 'High' };
  } else if (preferredQuality === 'low') {
    return { format: 'MP3', bitrate: '128k', label: 'Low' };
  } else {
    return { format: 'MP3', bitrate: '320k', label: 'Medium' };
  }
}

interface QualityPopupProps {
  preferredQuality: 'high' | 'medium' | 'low';
  onSelect: (quality: 'high' | 'medium' | 'low') => void;
  onClose: () => void;
  position: 'fixed' | 'absolute';
  className?: string;
  style?: React.CSSProperties;
  availableQualities?: { high?: string; medium?: string; low?: string };
}

export function QualityPopup({
  preferredQuality,
  onSelect,
  onClose,
  position,
  className = '',
  style,
  availableQualities,
}: QualityPopupProps) {
  return (
    <div
      className={`w-64 bg-surface-base border border-default rounded-lg shadow-2xl overflow-hidden z-50 animate-fadeIn ${className}`}
      style={{ position, ...style }}
    >
      {qualityOptions.map((option, index) => {
        const isAvailable = !availableQualities || !!availableQualities[option.value];
        return (
          <button
            key={option.value}
            type="button"
            disabled={!isAvailable}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!isAvailable) return;
              onSelect(option.value);
              onClose();
            }}
            className={`w-full px-4 py-3 text-left transition-colors ${
              !isAvailable ? 'opacity-35 cursor-not-allowed' : 'hover:bg-surface-card'
            } ${
              option.value === preferredQuality && isAvailable ? 'bg-surface-card' : ''
            } ${index !== qualityOptions.length - 1 ? 'border-b border-default' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${isAvailable ? 'text-accent' : 'text-tertiary'}`}>{option.label}</span>
                  {option.recommended && isAvailable && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-accent text-inverse rounded-full">
                      Recommended
                    </span>
                  )}
                  {!isAvailable && (
                    <span className="text-[10px] text-tertiary italic">Unavailable</span>
                  )}
                  {option.value === preferredQuality && isAvailable && (
                    <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className={`text-xs ${isAvailable ? 'text-secondary' : 'text-tertiary'}`}>
                  {option.format} • {option.bitrate} • {option.size}
                </div>
              </div>
            </div>
          </button>
        );
      })}
      <div className="px-4 py-2 bg-surface-base border-t border-default">
        <p className="text-[10px] text-tertiary text-center italic">
          Quality changes apply to next track
        </p>
      </div>
    </div>
  );
}
