'use client';

// useGrabToSeek — Rubber-band "grab to scroll to position" for sticky cards.
// When a sticky card is dragged downward, the scroll container interpolates
// toward the card's natural sorted position. Release past threshold to complete;
// release before to snap back.

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseGrabToSeekOptions {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  enabled: boolean;
}

interface GrabToSeekResult {
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  isDragging: boolean;
  cardTranslateY: number;
  scrollProgress: number;
  stickyDisabled: boolean;
  seekLanded: boolean;
}

const DRAG_THRESHOLD = 60;       // px to commit seek
const MAX_CARD_TRANSLATE = 24;   // max visual card displacement
const RUBBER_BAND_EXP = 2.5;    // easing exponent
const MAX_DRAG_RANGE = 300;      // virtual drag range for full interpolation
const STICKY_DISABLE_MS = 1500;  // how long sticky stays off after seek
const SEEK_LANDED_MS = 1200;     // matches CSS animation duration
const SETTLE_DELAY_MS = 250;     // delay before disabling sticky (lets smooth scroll settle)

export function useGrabToSeek({
  scrollContainerRef,
  sentinelRef,
  enabled,
}: UseGrabToSeekOptions): GrabToSeekResult {
  const [isDragging, setIsDragging] = useState(false);
  const [cardTranslateY, setCardTranslateY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [stickyDisabled, setStickyDisabled] = useState(false);
  const [seekLanded, setSeekLanded] = useState(false);

  const dragRef = useRef<{
    startY: number;
    startScrollTop: number;
    targetScrollTop: number;
    pointerId: number;
    rafId: number | null;
  } | null>(null);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (dragRef.current?.rafId) cancelAnimationFrame(dragRef.current.rafId);
  }, []);

  // Cleanup on unmount
  useEffect(() => clearTimers, [clearTimers]);

  // Reset when disabled (e.g. current song filtered out, versions change)
  useEffect(() => {
    if (!enabled) {
      setIsDragging(false);
      setCardTranslateY(0);
      setScrollProgress(0);
      dragRef.current = null;
    }
  }, [enabled]);

  // Calculate the scroll position that places the sentinel at the container top
  const getTargetScrollTop = useCallback(() => {
    const container = scrollContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return 0;
    const cRect = container.getBoundingClientRect();
    const sRect = sentinel.getBoundingClientRect();
    const sentinelTop = sRect.top - cRect.top + container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    return Math.max(0, Math.min(sentinelTop - 8, maxScroll));
  }, [scrollContainerRef, sentinelRef]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled || e.button !== 0) return;
    const container = scrollContainerRef.current;
    if (!container || container.scrollHeight <= container.clientHeight) return;

    // Don't capture when clicking interactive children (links, buttons)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).style.touchAction = 'none';

    dragRef.current = {
      startY: e.clientY,
      startScrollTop: container.scrollTop,
      targetScrollTop: getTargetScrollTop(),
      pointerId: e.pointerId,
      rafId: null,
    };
    setIsDragging(true);
    setCardTranslateY(0);
    setScrollProgress(0);
  }, [enabled, scrollContainerRef, getTargetScrollTop]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    e.preventDefault(); // prevent native scroll/selection

    const container = scrollContainerRef.current;
    if (!container) return;

    const deltaY = e.clientY - drag.startY;

    // Only respond to downward drags
    if (deltaY <= 0) {
      setCardTranslateY(0);
      setScrollProgress(0);
      if (drag.rafId) cancelAnimationFrame(drag.rafId);
      drag.rafId = requestAnimationFrame(() => {
        container.scrollTop = drag.startScrollTop;
      });
      return;
    }

    // Rubber-band easing: fast response initially, diminishing returns
    const rawRatio = Math.min(deltaY / MAX_DRAG_RANGE, 1);
    const easedRatio = 1 - Math.pow(1 - rawRatio, RUBBER_BAND_EXP);

    // Card visual offset — subtle, capped
    setCardTranslateY(Math.min(deltaY * 0.12, MAX_CARD_TRANSLATE));
    setScrollProgress(easedRatio);

    // Interpolate scroll from start toward target
    const scrollDelta = drag.targetScrollTop - drag.startScrollTop;
    const newScrollTop = drag.startScrollTop + scrollDelta * easedRatio;

    if (drag.rafId) cancelAnimationFrame(drag.rafId);
    drag.rafId = requestAnimationFrame(() => {
      container.scrollTop = newScrollTop;
    });
  }, [scrollContainerRef]);

  const finishDrag = useCallback((e: React.PointerEvent, commit: boolean) => {
    const drag = dragRef.current;
    if (!drag) return;

    try { e.currentTarget.releasePointerCapture(drag.pointerId); } catch { /* already released */ }
    (e.currentTarget as HTMLElement).style.touchAction = '';
    if (drag.rafId) cancelAnimationFrame(drag.rafId);

    const container = scrollContainerRef.current;
    const deltaY = e.clientY - drag.startY;
    const pastThreshold = commit && deltaY >= DRAG_THRESHOLD;

    if (pastThreshold && container) {
      // Smooth scroll to natural position, then disable sticky after it settles
      container.scrollTo({ top: drag.targetScrollTop, behavior: 'smooth' });

      clearTimers();
      const t1 = setTimeout(() => {
        setStickyDisabled(true);
        setSeekLanded(true);
      }, SETTLE_DELAY_MS);
      const t2 = setTimeout(() => setStickyDisabled(false), SETTLE_DELAY_MS + STICKY_DISABLE_MS);
      const t3 = setTimeout(() => setSeekLanded(false), SETTLE_DELAY_MS + SEEK_LANDED_MS);
      timersRef.current = [t1, t2, t3];
    } else if (container) {
      // Snap back to original position
      container.scrollTo({ top: drag.startScrollTop, behavior: 'smooth' });
    }

    setIsDragging(false);
    setCardTranslateY(0);
    setScrollProgress(0);
    dragRef.current = null;
  }, [scrollContainerRef, clearTimers]);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => finishDrag(e, true),
    [finishDrag],
  );
  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => finishDrag(e, false),
    [finishDrag],
  );

  return {
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    isDragging,
    cardTranslateY,
    scrollProgress,
    stickyDisabled,
    seekLanded,
  };
}
