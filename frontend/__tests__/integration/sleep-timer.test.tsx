/**
 * Integration test: Sleep timer
 *
 * Tests useSleepTimer hook behavior:
 * - Start timer with preset → isActive, timeRemaining set
 * - Cancel timer → isActive false, timeRemaining 0
 * - Timer complete fires onTimerComplete callback
 * - One-minute warning fires once when crossing 60s threshold
 * - end-of-track preset calculates from song progress
 * - Re-starting timer with different preset replaces the old one
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useState } from 'react';
import { screen, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useSleepTimer, SleepTimerPreset } from '@/hooks/useSleepTimer';

// Mock analytics
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

function SleepTimerDisplay() {
  const [completed, setCompleted] = useState(false);
  const [warned, setWarned] = useState(false);

  const timer = useSleepTimer({
    onTimerComplete: () => setCompleted(true),
    onOneMinuteWarning: () => setWarned(true),
    currentSongDuration: 200,
    currentSongProgress: 150,
  });

  return (
    <div>
      <div data-testid="active">{String(timer.isActive)}</div>
      <div data-testid="remaining">{timer.timeRemaining}</div>
      <div data-testid="preset">{timer.activePreset ?? 'null'}</div>
      <div data-testid="completed">{String(completed)}</div>
      <div data-testid="warned">{String(warned)}</div>
      <button data-testid="start-5min" onClick={() => timer.startTimer('5min')}>5 min</button>
      <button data-testid="start-15min" onClick={() => timer.startTimer('15min')}>15 min</button>
      <button data-testid="start-30min" onClick={() => timer.startTimer('30min')}>30 min</button>
      <button data-testid="start-1hr" onClick={() => timer.startTimer('1hr')}>1 hr</button>
      <button data-testid="start-end" onClick={() => timer.startTimer('end-of-track')}>End of track</button>
      <button data-testid="cancel" onClick={() => timer.cancelTimer()}>Cancel</button>
    </div>
  );
}

describe('Sleep Timer Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('start 5min timer sets active state', async () => {
    render(<SleepTimerDisplay />);

    expect(screen.getByTestId('active').textContent).toBe('false');

    await act(async () => { screen.getByTestId('start-5min').click(); });

    expect(screen.getByTestId('active').textContent).toBe('true');
    expect(screen.getByTestId('remaining').textContent).toBe('300');
    expect(screen.getByTestId('preset').textContent).toBe('5min');
  });

  it('cancel timer resets state', async () => {
    render(<SleepTimerDisplay />);

    await act(async () => { screen.getByTestId('start-5min').click(); });
    expect(screen.getByTestId('active').textContent).toBe('true');

    await act(async () => { screen.getByTestId('cancel').click(); });
    expect(screen.getByTestId('active').textContent).toBe('false');
    expect(screen.getByTestId('remaining').textContent).toBe('0');
    expect(screen.getByTestId('preset').textContent).toBe('null');
  });

  it('timer completes after duration', async () => {
    render(<SleepTimerDisplay />);

    await act(async () => { screen.getByTestId('start-5min').click(); });
    expect(screen.getByTestId('completed').textContent).toBe('false');

    // Advance past 5 minutes
    await act(async () => { vi.advanceTimersByTime(301_000); });

    expect(screen.getByTestId('completed').textContent).toBe('true');
    expect(screen.getByTestId('active').textContent).toBe('false');
  });

  it('one-minute warning fires when crossing 60s threshold', async () => {
    render(<SleepTimerDisplay />);

    // Start a 2-minute equivalent (use 5min, advance to 60s remaining)
    await act(async () => { screen.getByTestId('start-5min').click(); });
    expect(screen.getByTestId('warned').textContent).toBe('false');

    // Advance to ~61 seconds remaining (239 seconds elapsed)
    await act(async () => { vi.advanceTimersByTime(239_000); });
    expect(screen.getByTestId('warned').textContent).toBe('false');

    // Cross the 60-second threshold
    await act(async () => { vi.advanceTimersByTime(2_000); });
    expect(screen.getByTestId('warned').textContent).toBe('true');
  });

  it('end-of-track calculates remaining song duration', async () => {
    render(<SleepTimerDisplay />);

    // currentSongDuration=200, currentSongProgress=150, so remaining=50
    await act(async () => { screen.getByTestId('start-end').click(); });

    expect(screen.getByTestId('active').textContent).toBe('true');
    expect(screen.getByTestId('preset').textContent).toBe('end-of-track');
    expect(screen.getByTestId('remaining').textContent).toBe('50');
  });

  it('re-starting with different preset replaces old timer', async () => {
    render(<SleepTimerDisplay />);

    await act(async () => { screen.getByTestId('start-5min').click(); });
    expect(screen.getByTestId('remaining').textContent).toBe('300');

    await act(async () => { screen.getByTestId('start-15min').click(); });
    expect(screen.getByTestId('remaining').textContent).toBe('900');
    expect(screen.getByTestId('preset').textContent).toBe('15min');
  });

  it('cancel does not fire onTimerComplete', async () => {
    render(<SleepTimerDisplay />);

    await act(async () => { screen.getByTestId('start-5min').click(); });

    // Advance partway
    await act(async () => { vi.advanceTimersByTime(60_000); });

    await act(async () => { screen.getByTestId('cancel').click(); });

    // Advance past original end time
    await act(async () => { vi.advanceTimersByTime(300_000); });

    expect(screen.getByTestId('completed').textContent).toBe('false');
  });

  it('each preset has correct duration', async () => {
    render(<SleepTimerDisplay />);

    await act(async () => { screen.getByTestId('start-5min').click(); });
    expect(screen.getByTestId('remaining').textContent).toBe('300');

    await act(async () => { screen.getByTestId('start-15min').click(); });
    expect(screen.getByTestId('remaining').textContent).toBe('900');

    await act(async () => { screen.getByTestId('start-30min').click(); });
    expect(screen.getByTestId('remaining').textContent).toBe('1800');

    await act(async () => { screen.getByTestId('start-1hr').click(); });
    expect(screen.getByTestId('remaining').textContent).toBe('3600');
  });
});
