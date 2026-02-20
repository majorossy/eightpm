'use client';

import React from 'react';
import { SleepTimerPreset } from '@/hooks/useSleepTimer';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sleepTimer: {
    isActive: boolean;
    timeRemaining: number;
    startTimer: (preset: SleepTimerPreset) => void;
    cancelTimer: () => void;
  };
  crossfadeDuration: number;
  setCrossfadeDuration: (duration: number) => void;
  vibrate: (pattern: number | number[]) => void;
  BUTTON_PRESS: number;
}

export function SettingsPanel({
  isOpen,
  onClose,
  sleepTimer,
  crossfadeDuration,
  setCrossfadeDuration,
  vibrate,
  BUTTON_PRESS,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center md:justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="bg-[#2d2a26] w-full md:w-96 md:rounded-lg p-6 space-y-4 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="settings-title" className="text-white text-lg font-bold">Sleep Timer</h3>
          <button
            onClick={() => {
              vibrate(BUTTON_PRESS);
              onClose();
            }}
            className="p-2 text-[#8a8478] hover:text-white"
            aria-label="Close settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Active timer display */}
        {sleepTimer.isActive && (
          <div className="bg-[#d4a060]/20 border border-[#d4a060] rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#d4a060] text-sm font-medium">Timer Active</p>
                <p className="text-white text-2xl font-bold font-mono mt-1">
                  {Math.floor(sleepTimer.timeRemaining / 60)}:{(sleepTimer.timeRemaining % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-[#8a8478] text-xs mt-1">
                  Music will stop in {Math.floor(sleepTimer.timeRemaining / 60)} minute{Math.floor(sleepTimer.timeRemaining / 60) !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  sleepTimer.cancelTimer();
                }}
                className="px-4 py-2 bg-[#8a8478]/20 text-white rounded-full text-sm font-medium hover:bg-[#8a8478]/30"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Timer presets */}
        <div className="space-y-2">
          <p className="text-[#8a8478] text-sm mb-3">Set a timer to automatically stop music</p>
          {(['5min', '15min', '30min', '1hr', 'end-of-track'] as const).map((preset) => {
            const labels: Record<string, string> = {
              '5min': '5 minutes',
              '15min': '15 minutes',
              '30min': '30 minutes',
              '1hr': '1 hour',
              'end-of-track': 'End of current track',
            };
            return (
              <button
                key={preset}
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  sleepTimer.startTimer(preset);
                  onClose();
                }}
                className="w-full px-4 py-3 bg-[#3a3632] hover:bg-[#3a3632] text-white rounded-lg text-left font-medium transition-colors"
              >
                {labels[preset]}
              </button>
            );
          })}
        </div>

        {/* Crossfade Settings */}
        <div className="border-t border-[#3a3632] pt-4 mt-4">
          <h4 className="text-white text-sm font-medium mb-3">Crossfade</h4>
          <p className="text-[#8a8478] text-xs mb-3">Seamless transition between songs</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#8a8478] text-sm">
                {crossfadeDuration === 0 ? 'Off' : `${crossfadeDuration} second${crossfadeDuration !== 1 ? 's' : ''}`}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={crossfadeDuration}
              onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
              className="w-full h-1 bg-[#3a3632] rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #d4a060 0%, #d4a060 ${(crossfadeDuration / 12) * 100}%, #3a3632 ${(crossfadeDuration / 12) * 100}%, #3a3632 100%)`
              }}
            />

            <div className="flex justify-between text-[10px] text-[#8a8478]">
              <span>Off</span>
              <span>12s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
