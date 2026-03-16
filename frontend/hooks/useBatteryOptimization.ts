import { useState, useEffect } from 'react';

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: 'chargingchange' | 'levelchange', listener: () => void): void;
  removeEventListener(type: 'chargingchange' | 'levelchange', listener: () => void): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

export interface BatteryOptimizationState {
  reducedMotion: boolean;
  isLowBattery: boolean;
  isCharging: boolean;
  batteryLevel: number | null;
}

/**
 * useBatteryOptimization
 *
 * Detects low battery and respects user's motion preferences for performance optimization.
 *
 * Features:
 * - Detects battery level < 20% (low battery)
 * - Checks if device is charging
 * - Respects prefers-reduced-motion media query
 * - Handles browsers without Battery API support
 * - Returns reducedMotion flag to disable animations
 *
 * @returns {BatteryOptimizationState} State object with optimization flags
 */
export function useBatteryOptimization(): BatteryOptimizationState {
  const [isLowBattery, setIsLowBattery] = useState(false);
  const [isCharging, setIsCharging] = useState(true); // Default to true (assume charging if unknown)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check prefers-reduced-motion media query
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(e.matches);
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Check battery status (if supported)
  useEffect(() => {
    const nav = navigator as NavigatorWithBattery;

    // Check if Battery API is supported
    if (!nav.getBattery) {
      // Battery API not supported - assume device is charging
      setIsCharging(true);
      setIsLowBattery(false);
      return;
    }

    let battery: BatteryManager | null = null;
    let handleLevelChange: (() => void) | null = null;
    let handleChargingChange: (() => void) | null = null;

    const updateBatteryStatus = (batt: BatteryManager) => {
      const level = batt.level * 100; // Convert to percentage
      setBatteryLevel(level);
      setIsCharging(batt.charging);
      setIsLowBattery(level < 20 && !batt.charging);
    };

    nav.getBattery()
      .then((batt) => {
        battery = batt;
        updateBatteryStatus(batt);

        handleLevelChange = () => updateBatteryStatus(batt);
        handleChargingChange = () => updateBatteryStatus(batt);

        batt.addEventListener('levelchange', handleLevelChange);
        batt.addEventListener('chargingchange', handleChargingChange);
      })
      .catch(() => {
        // Battery API failed - assume device is charging
        setIsCharging(true);
        setIsLowBattery(false);
      });

    return () => {
      if (battery) {
        if (handleLevelChange) battery.removeEventListener('levelchange', handleLevelChange);
        if (handleChargingChange) battery.removeEventListener('chargingchange', handleChargingChange);
      }
    };
  }, []);

  // Calculate reducedMotion flag
  const reducedMotion = prefersReducedMotion || (isLowBattery && !isCharging);

  return {
    reducedMotion,
    isLowBattery,
    isCharging,
    batteryLevel,
  };
}
