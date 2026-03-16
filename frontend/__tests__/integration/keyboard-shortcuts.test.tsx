/**
 * Integration test: Keyboard shortcuts
 *
 * Tests useKeyboardShortcuts hook:
 * - Space → play/pause
 * - N / ArrowRight → next
 * - P / ArrowLeft → previous
 * - ArrowUp / ArrowDown → volume
 * - R → cycle repeat
 * - L → toggle like
 * - Q → toggle queue
 * - Escape → close queue (only when open)
 * - K / Cmd+K → open find
 * - Shortcuts suppressed in input fields
 * - Cmd+K works even in input fields
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useState, useRef } from 'react';
import { screen, act, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Mock analytics
vi.mock('@/lib/analytics', () => import('@/test/mocks/analytics'));

function ShortcutDisplay() {
  const [lastAction, setLastAction] = useState('none');
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  useKeyboardShortcuts({
    onPlayPause: () => setLastAction('play-pause'),
    onNext: () => setLastAction('next'),
    onPrevious: () => setLastAction('previous'),
    onVolumeUp: () => setLastAction('volume-up'),
    onVolumeDown: () => setLastAction('volume-down'),
    onCycleRepeat: () => setLastAction('cycle-repeat'),
    onToggleLike: () => setLastAction('toggle-like'),
    onToggleQueue: () => {
      setIsQueueOpen(prev => !prev);
      setLastAction('toggle-queue');
    },
    onOpenFind: () => setLastAction('open-find'),
    onShowHelp: () => setLastAction('show-help'),
    onToggleMinimize: () => setLastAction('toggle-minimize'),
    isQueueOpen,
  });

  return (
    <div>
      <div data-testid="last-action">{lastAction}</div>
      <div data-testid="queue-open">{String(isQueueOpen)}</div>
      <input data-testid="text-input" type="text" />
    </div>
  );
}

describe('Keyboard Shortcuts Integration', () => {
  beforeEach(() => {
    // Reset by rendering fresh
  });

  it('Space toggles play/pause', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: ' ' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('play-pause');
  });

  it('N triggers next', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: 'n' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('next');
  });

  it('ArrowRight triggers next', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: 'ArrowRight' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('next');
  });

  it('P triggers previous', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: 'p' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('previous');
  });

  it('ArrowUp/ArrowDown controls volume', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: 'ArrowUp' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('volume-up');

    act(() => { fireEvent.keyDown(document, { key: 'ArrowDown' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('volume-down');
  });

  it('R cycles repeat mode', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: 'r' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('cycle-repeat');
  });

  it('L toggles like', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: 'l' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('toggle-like');
  });

  it('Q toggles queue', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: 'q' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('toggle-queue');
    expect(screen.getByTestId('queue-open').textContent).toBe('true');
  });

  it('Escape closes queue when open, no-op when closed', () => {
    render(<ShortcutDisplay />);

    // Queue is closed — Escape should not trigger toggle-queue
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('none');

    // Open queue first
    act(() => { fireEvent.keyDown(document, { key: 'q' }); });
    expect(screen.getByTestId('queue-open').textContent).toBe('true');

    // Escape should close it
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(screen.getByTestId('queue-open').textContent).toBe('false');
  });

  it('K opens find', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: 'k' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('open-find');
  });

  it('? shows help', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: '?' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('show-help');
  });

  it('M toggles minimize', () => {
    render(<ShortcutDisplay />);

    act(() => { fireEvent.keyDown(document, { key: 'm' }); });
    expect(screen.getByTestId('last-action').textContent).toBe('toggle-minimize');
  });

  it('shortcuts suppressed when focused on input', () => {
    render(<ShortcutDisplay />);

    const input = screen.getByTestId('text-input');
    input.focus();

    act(() => { fireEvent.keyDown(input, { key: ' ' }); });
    // Space should NOT trigger play-pause when in input
    expect(screen.getByTestId('last-action').textContent).toBe('none');

    act(() => { fireEvent.keyDown(input, { key: 'l' }); });
    // L should NOT trigger toggle-like when in input
    expect(screen.getByTestId('last-action').textContent).toBe('none');
  });

  it('Cmd+K works even in input fields', () => {
    render(<ShortcutDisplay />);

    const input = screen.getByTestId('text-input');
    input.focus();

    act(() => { fireEvent.keyDown(input, { key: 'k', metaKey: true }); });
    expect(screen.getByTestId('last-action').textContent).toBe('open-find');
  });

  it('Escape works even in input fields when queue is open', () => {
    render(<ShortcutDisplay />);

    // Open queue
    act(() => { fireEvent.keyDown(document, { key: 'q' }); });
    expect(screen.getByTestId('queue-open').textContent).toBe('true');

    // Focus input, press Escape
    const input = screen.getByTestId('text-input');
    input.focus();
    act(() => { fireEvent.keyDown(input, { key: 'Escape' }); });
    expect(screen.getByTestId('queue-open').textContent).toBe('false');
  });
});
