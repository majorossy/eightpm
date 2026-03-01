'use client';

import { useEffect, useRef, useCallback, useState, type RefObject } from 'react';

interface StarDescriptor {
  key: string;
  left: number;
  top: number;
  fontSize: number;
}

interface UseStarOverlayReturn {
  containerRef: RefObject<HTMLDivElement>;
  stars: StarDescriptor[];
  starsReady: boolean;
  hideStars: () => void;
  drawStars: () => void;
}

export function useStarOverlay(): UseStarOverlayReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRafId = useRef<number>(0);

  const [stars, setStars] = useState<StarDescriptor[]>([]);
  const [starsReady, setStarsReady] = useState(false);

  const calculateStars = useCallback((): StarDescriptor[] => {
    const container = containerRef.current;
    if (!container) return [];

    // Query artist spans directly from the DOM — no refs needed
    const spans = container.querySelectorAll<HTMLSpanElement>(':scope > span');
    if (spans.length < 2) return [];

    const containerRect = container.getBoundingClientRect();

    const measured: { index: number; rect: DOMRect; fontSize: number }[] = [];

    spans.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const linkEl = el.querySelector('.artist-name-hover') as HTMLElement | null;
      if (!linkEl) return; // skip non-artist spans
      const fontSize = parseFloat(getComputedStyle(linkEl).fontSize);
      measured.push({ index: i, rect, fontSize });
    });

    if (measured.length < 2) return [];

    // Group into rows using vertical bounding box overlap
    const rows: (typeof measured)[] = [[measured[0]]];
    for (let i = 1; i < measured.length; i++) {
      const curr = measured[i].rect;
      const prev = measured[i - 1].rect;
      if (curr.top < prev.bottom && curr.bottom > prev.top) {
        rows[rows.length - 1].push(measured[i]);
      } else {
        rows.push([measured[i]]);
      }
    }

    // Place a star between each adjacent pair on the same row
    const result: StarDescriptor[] = [];
    for (const row of rows) {
      for (let i = 0; i < row.length - 1; i++) {
        const left = row[i];
        const right = row[i + 1];
        const starFontSize = Math.max(12, Math.min(left.fontSize, right.fontSize));
        const starLeft = Math.round(
          (left.rect.right + right.rect.left) / 2 - containerRect.left
        );
        const leftCenterY = (left.rect.top + left.rect.bottom) / 2;
        const rightCenterY = (right.rect.top + right.rect.bottom) / 2;
        const starTop = Math.round(
          (leftCenterY + rightCenterY) / 2 - containerRect.top
        );
        result.push({
          key: `star-${left.index}-${right.index}`,
          left: starLeft,
          top: starTop,
          fontSize: starFontSize,
        });
      }
    }

    return result;
  }, []);

  const hiddenRef = useRef(false);

  // Measure and draw — used on mount, resize, and reorder complete
  const drawStars = useCallback(() => {
    hiddenRef.current = false;
    setStars(calculateStars());
    setStarsReady(true);
  }, [calculateStars]);

  // Hide — used on pill click (suppresses ResizeObserver until drawStars)
  const hideStars = useCallback(() => {
    hiddenRef.current = true;
    setStarsReady(false);
  }, []);

  // Mount + resize
  useEffect(() => {
    drawStars();

    const container = containerRef.current;
    if (!container) return;

    // Debounced ResizeObserver — skips during sort transitions
    const resizeObserver = new ResizeObserver(() => {
      if (hiddenRef.current) return;
      cancelAnimationFrame(resizeRafId.current);
      resizeRafId.current = requestAnimationFrame(() => {
        if (hiddenRef.current) return;
        drawStars();
      });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(resizeRafId.current);
    };
  }, [drawStars]);

  return { containerRef, stars, starsReady, hideStars, drawStars };
}
