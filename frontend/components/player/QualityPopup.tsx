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
}

export function QualityPopup({
  preferredQuality,
  onSelect,
  onClose,
  position,
  className = '',
  style,
}: QualityPopupProps) {
  return (
    <div
      className={`w-64 bg-[#1c1a17] border border-[#4a3a28] rounded-lg shadow-2xl overflow-hidden z-50 animate-fadeIn ${className}`}
      style={{ position, ...style }}
    >
      {qualityOptions.map((option, index) => (
        <button
          key={option.value}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSelect(option.value);
            onClose();
          }}
          className={`w-full px-4 py-3 text-left hover:bg-[#2a2520] transition-colors ${
            option.value === preferredQuality ? 'bg-[#2a2520]' : ''
          } ${index !== qualityOptions.length - 1 ? 'border-b border-[#2a2520]' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-[#d4a060]">{option.label}</span>
                {option.recommended && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-[#d4a060] text-[#1c1a17] rounded-full">
                    Recommended
                  </span>
                )}
                {option.value === preferredQuality && (
                  <svg className="w-4 h-4 text-[#d4a060]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="text-xs text-[#a89080]">
                {option.format} • {option.bitrate} • {option.size}
              </div>
            </div>
          </div>
        </button>
      ))}
      <div className="px-4 py-2 bg-[#1c1a17] border-t border-[#2a2520]">
        <p className="text-[10px] text-[#6a6458] text-center italic">
          Quality changes apply to next track
        </p>
      </div>
    </div>
  );
}
