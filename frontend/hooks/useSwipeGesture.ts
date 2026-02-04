import { useRef, useState, useCallback, TouchEvent } from 'react';

interface SwipeConfig {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum distance in pixels to trigger swipe
  velocityThreshold?: number; // Minimum velocity (px/ms) to trigger swipe
  direction?: 'vertical' | 'horizontal' | 'both';
}

interface SwipeGestureReturn {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
  dragOffset: { x: number; y: number };
  isDragging: boolean;
}

export function useSwipeGesture(config: SwipeConfig): SwipeGestureReturn {
  const {
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    velocityThreshold = 0.5,
    direction = 'vertical',
  } = config;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Update drag offset based on direction
      if (direction === 'vertical') {
        setDragOffset({ x: 0, y: deltaY });
      } else if (direction === 'horizontal') {
        setDragOffset({ x: deltaX, y: 0 });
      } else {
        setDragOffset({ x: deltaX, y: deltaY });
      }
    },
    [direction]
  );

  const onTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;

    const deltaX = dragOffset.x;
    const deltaY = dragOffset.y;
    const deltaTime = Math.max(Date.now() - touchStartRef.current.time, 10);
    const velocityX = Math.min(Math.abs(deltaX) / deltaTime, 5.0);
    const velocityY = Math.min(Math.abs(deltaY) / deltaTime, 5.0);

    // Determine if swipe threshold met
    const isSwipeX = Math.abs(deltaX) > threshold || velocityX > velocityThreshold;
    const isSwipeY = Math.abs(deltaY) > threshold || velocityY > velocityThreshold;

    // Vertical swipes
    if (direction === 'vertical' || direction === 'both') {
      if (isSwipeY) {
        if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        } else if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        }
      }
    }

    // Horizontal swipes
    if (direction === 'horizontal' || direction === 'both') {
      if (isSwipeX) {
        if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
    }

    // Reset state
    touchStartRef.current = null;
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [dragOffset, threshold, velocityThreshold, direction, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    dragOffset,
    isDragging,
  };
}
