'use client';

import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useHaptic } from '@/hooks/useHaptic';
import { ReactNode, useState, useRef, useEffect } from 'react';

interface SwipeableQueueItemProps {
  children: ReactNode;
  onDelete: () => void;
  className?: string;
}

export default function SwipeableQueueItem({
  children,
  onDelete,
  className = '',
}: SwipeableQueueItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 80; // 80px to reveal delete button
  const VELOCITY_THRESHOLD = 0.3; // Lower threshold for faster swipes
  const { vibrate, SWIPE_COMPLETE, DELETE_ACTION } = useHaptic();

  const handleDelete = () => {
    // Simple confirmation for mobile
    vibrate(DELETE_ACTION);
    setIsDeleting(true);
    // Wait for animation before calling onDelete
    setTimeout(() => {
      onDelete();
    }, 300);
  };

  const {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    dragOffset,
    isDragging,
  } = useSwipeGesture({
    direction: 'horizontal',
    threshold: SWIPE_THRESHOLD,
    velocityThreshold: VELOCITY_THRESHOLD,
    onSwipeLeft: () => {
      // Swipe left - reveal delete button
      if (Math.abs(dragOffset.x) >= SWIPE_THRESHOLD) {
        vibrate(SWIPE_COMPLETE);
        setIsRevealed(true);
      }
    },
    onSwipeRight: () => {
      // Swipe right - hide delete button
      vibrate(SWIPE_COMPLETE);
      setIsRevealed(false);
    },
  });

  // Handle touch end to snap to revealed or hidden state
  const handleTouchEnd = () => {
    onTouchEnd();
    // After swipe gesture ends, snap to revealed or hidden based on threshold
    if (!isRevealed && Math.abs(dragOffset.x) < SWIPE_THRESHOLD) {
      setIsRevealed(false);
    }
  };

  // Prevent vertical scroll during horizontal swipe
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && Math.abs(dragOffset.x) > 10) {
      e.preventDefault();
    }
    onTouchMove(e);
  };

  // Calculate transform based on drag or revealed state
  const getTransform = () => {
    if (isDeleting) {
      return 'translateX(-100%)';
    }
    if (isDragging) {
      // Limit swipe to only left direction (negative values)
      const limitedOffset = Math.min(0, dragOffset.x);
      return `translateX(${limitedOffset}px)`;
    }
    if (isRevealed) {
      return 'translateX(-80px)';
    }
    return 'translateX(0)';
  };

  return (
    <div
      ref={itemRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        touchAction: isDragging ? 'none' : 'auto',
      }}
    >
      {/* Delete button underneath — only visible when swiped */}
      <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center">
        <button
          onClick={handleDelete}
          className="flex items-center justify-center w-full h-full text-red-400 hover:text-red-300"
          aria-label="Delete"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Content wrapper - slides left to reveal delete */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative rounded-[inherit] bg-[#252220] touch-none"
        style={{
          transform: getTransform(),
          transition: isDragging ? 'none' : isDeleting ? 'transform 300ms ease-out, opacity 300ms ease-out' : 'transform 250ms ease-out',
          opacity: isDeleting ? 0 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
