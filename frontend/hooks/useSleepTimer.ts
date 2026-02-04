import { useState, useEffect, useCallback, useRef } from 'react';

export type SleepTimerPreset = '5min' | '15min' | '30min' | '1hr' | 'end-of-track';

export interface SleepTimerOptions {
  onTimerComplete: () => void;
  onOneMinuteWarning?: () => void;
  currentSongDuration?: number;
  currentSongProgress?: number;
}

export interface SleepTimerState {
  isActive: boolean;
  timeRemaining: number; // in seconds
  activePreset: SleepTimerPreset | null;
}

const PRESET_DURATIONS: Record<Exclude<SleepTimerPreset, 'end-of-track'>, number> = {
  '5min': 5 * 60,
  '15min': 15 * 60,
  '30min': 30 * 60,
  '1hr': 60 * 60,
};

export function useSleepTimer(options: SleepTimerOptions) {
  const { onTimerComplete, onOneMinuteWarning, currentSongDuration = 0, currentSongProgress = 0 } = options;

  const [state, setState] = useState<SleepTimerState>({
    isActive: false,
    timeRemaining: 0,
    activePreset: null,
  });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const oneMinuteWarningFiredRef = useRef(false);
  const endTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const startTimer = useCallback((preset: SleepTimerPreset) => {
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    let duration: number;

    if (preset === 'end-of-track') {
      // Calculate remaining time in current song
      duration = Math.max(0, currentSongDuration - currentSongProgress);

      // If duration is 0 or very small, default to 5 minutes
      if (duration < 5) {
        duration = PRESET_DURATIONS['5min'];
      }
    } else {
      duration = PRESET_DURATIONS[preset];
    }

    endTimeRef.current = Date.now() + duration * 1000;

    setState({
      isActive: true,
      timeRemaining: duration,
      activePreset: preset,
    });

    oneMinuteWarningFiredRef.current = false;

    // Start countdown interval (uses absolute end time to avoid drift from interval inaccuracy or OS suspension)
    timerIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newTimeRemaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);

        // Fire one-minute warning (use range check in case we skip past exactly 60)
        if (newTimeRemaining <= 60 && prev.timeRemaining > 60 && !oneMinuteWarningFiredRef.current && onOneMinuteWarning) {
          oneMinuteWarningFiredRef.current = true;
          onOneMinuteWarning();
        }

        // Timer complete
        if (newTimeRemaining <= 0) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          onTimerComplete();
          return {
            isActive: false,
            timeRemaining: 0,
            activePreset: null,
          };
        }

        return {
          ...prev,
          timeRemaining: newTimeRemaining,
        };
      });
    }, 1000);
  }, [currentSongDuration, currentSongProgress, onTimerComplete, onOneMinuteWarning]);

  const cancelTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setState({
      isActive: false,
      timeRemaining: 0,
      activePreset: null,
    });

    oneMinuteWarningFiredRef.current = false;
  }, []);

  return {
    ...state,
    startTimer,
    cancelTimer,
  };
}
