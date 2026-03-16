/**
 * Integration test: Swipe gesture detection
 *
 * Tests useSwipeGesture hook:
 * - Vertical swipe up/down triggers callbacks when past threshold
 * - Horizontal swipe left/right triggers callbacks
 * - Swipe below threshold does NOT trigger
 * - Drag offset tracked during touch move
 * - isDragging activates after 10px of movement
 * - Direction lock: 'vertical' only responds to Y, 'horizontal' only to X
 * - State resets on touch end
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useState, useCallback } from 'react';
import { screen, act, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

function SwipeDisplay({ direction = 'vertical' as 'vertical' | 'horizontal' | 'both' }) {
  const [lastSwipe, setLastSwipe] = useState('none');

  const onSwipeUp = useCallback(() => setLastSwipe('up'), []);
  const onSwipeDown = useCallback(() => setLastSwipe('down'), []);
  const onSwipeLeft = useCallback(() => setLastSwipe('left'), []);
  const onSwipeRight = useCallback(() => setLastSwipe('right'), []);

  const gesture = useSwipeGesture({
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    threshold: 50,
    direction,
  });

  return (
    <div>
      <div data-testid="is-dragging">{String(gesture.isDragging)}</div>
      <div data-testid="offset-x">{gesture.dragOffset.x}</div>
      <div data-testid="offset-y">{gesture.dragOffset.y}</div>
      <div data-testid="last-swipe">{lastSwipe}</div>
      <div
        data-testid="swipe-area"
        onTouchStart={gesture.onTouchStart as any}
        onTouchMove={gesture.onTouchMove as any}
        onTouchEnd={gesture.onTouchEnd}
        style={{ width: 300, height: 300 }}
      />
    </div>
  );
}

// Helper to create touch events
function createTouch(clientX: number, clientY: number) {
  return { clientX, clientY };
}

describe('Swipe Gesture Integration', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('vertical swipe down triggers onSwipeDown', () => {
    render(<SwipeDisplay direction="vertical" />);

    const area = screen.getByTestId('swipe-area');

    act(() => { fireEvent.touchStart(area, { touches: [createTouch(100, 100)] }); });
    // Move past 10px drag threshold
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(100, 115)] }); });
    // Move past 50px swipe threshold
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(100, 200)] }); });

    expect(screen.getByTestId('is-dragging').textContent).toBe('true');
    expect(screen.getByTestId('offset-y').textContent).toBe('100');

    act(() => { fireEvent.touchEnd(area); });

    expect(screen.getByTestId('last-swipe').textContent).toBe('down');
    expect(screen.getByTestId('is-dragging').textContent).toBe('false');
  });

  it('vertical swipe up triggers onSwipeUp', () => {
    render(<SwipeDisplay direction="vertical" />);

    const area = screen.getByTestId('swipe-area');

    act(() => { fireEvent.touchStart(area, { touches: [createTouch(100, 200)] }); });
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(100, 185)] }); });
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(100, 100)] }); });
    act(() => { fireEvent.touchEnd(area); });

    expect(screen.getByTestId('last-swipe').textContent).toBe('up');
  });

  it('swipe below threshold does NOT trigger', () => {
    render(<SwipeDisplay direction="vertical" />);

    const area = screen.getByTestId('swipe-area');

    act(() => { fireEvent.touchStart(area, { touches: [createTouch(100, 100)] }); });
    // Move 30px — past 10px drag threshold but under 50px swipe threshold
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(100, 130)] }); });
    // Advance time so velocity = 30px / 2000ms = 0.015 (well under 0.5 threshold)
    act(() => { vi.advanceTimersByTime(2000); });
    act(() => { fireEvent.touchEnd(area); });

    expect(screen.getByTestId('last-swipe').textContent).toBe('none');
  });

  it('horizontal swipe left triggers onSwipeLeft', () => {
    render(<SwipeDisplay direction="horizontal" />);

    const area = screen.getByTestId('swipe-area');

    act(() => { fireEvent.touchStart(area, { touches: [createTouch(200, 100)] }); });
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(185, 100)] }); });
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(100, 100)] }); });
    act(() => { fireEvent.touchEnd(area); });

    expect(screen.getByTestId('last-swipe').textContent).toBe('left');
  });

  it('horizontal swipe right triggers onSwipeRight', () => {
    render(<SwipeDisplay direction="horizontal" />);

    const area = screen.getByTestId('swipe-area');

    act(() => { fireEvent.touchStart(area, { touches: [createTouch(100, 100)] }); });
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(115, 100)] }); });
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(200, 100)] }); });
    act(() => { fireEvent.touchEnd(area); });

    expect(screen.getByTestId('last-swipe').textContent).toBe('right');
  });

  it('vertical direction ignores horizontal movement', () => {
    render(<SwipeDisplay direction="vertical" />);

    const area = screen.getByTestId('swipe-area');

    act(() => { fireEvent.touchStart(area, { touches: [createTouch(100, 100)] }); });
    // Large horizontal movement but small vertical — under 10px drag threshold for vertical mode
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(200, 105)] }); });
    act(() => { fireEvent.touchEnd(area); });

    expect(screen.getByTestId('last-swipe').textContent).toBe('none');
  });

  it('drag offset resets on touch end', () => {
    render(<SwipeDisplay direction="vertical" />);

    const area = screen.getByTestId('swipe-area');

    act(() => { fireEvent.touchStart(area, { touches: [createTouch(100, 100)] }); });
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(100, 200)] }); });

    expect(screen.getByTestId('offset-y').textContent).toBe('100');

    act(() => { fireEvent.touchEnd(area); });

    expect(screen.getByTestId('offset-y').textContent).toBe('0');
    expect(screen.getByTestId('offset-x').textContent).toBe('0');
  });

  it('isDragging only activates after 10px of movement', () => {
    render(<SwipeDisplay direction="vertical" />);

    const area = screen.getByTestId('swipe-area');

    act(() => { fireEvent.touchStart(area, { touches: [createTouch(100, 100)] }); });

    // Move only 5px — under drag activation threshold
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(100, 105)] }); });
    expect(screen.getByTestId('is-dragging').textContent).toBe('false');

    // Move past 10px total
    act(() => { fireEvent.touchMove(area, { touches: [createTouch(100, 115)] }); });
    expect(screen.getByTestId('is-dragging').textContent).toBe('true');
  });
});
