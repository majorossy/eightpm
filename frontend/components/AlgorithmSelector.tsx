'use client';

import { useEffect, useRef, useState } from 'react';
import { useFestivalSort } from '@/hooks/useFestivalSort';
import { useHaptic } from '@/hooks/useHaptic';
import type { SortAlgorithm } from '@/utils/festivalSorting';

interface AlgorithmOption {
  id: SortAlgorithm;
  icon: string;
  label: string;
  description: string;
}

const ALGORITHMS: AlgorithmOption[] = [
  {
    id: 'songVersions',
    icon: '',
    label: 'Versions',
    description: 'Sort by number of song versions',
  },
  {
    id: 'shows',
    icon: '',
    label: 'Shows',
    description: 'Sort by number of shows',
  },
  {
    id: 'hours',
    icon: '',
    label: 'Hours',
    description: 'Sort by hours of music',
  },
];

export default function AlgorithmSelector() {
  const { algorithm, setAlgorithm, isAlphaMode, toggleAlphaMode } = useFestivalSort();
  const { vibrate, BUTTON_PRESS } = useHaptic();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bgStyle, setBgStyle] = useState<{ left: number; width: number } | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Measure selected button position for sliding background
  useEffect(() => {
    if (!containerRef.current) return;
    const selectedBtn = containerRef.current.querySelector('[aria-checked="true"]') as HTMLElement | null;
    if (selectedBtn) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const btnRect = selectedBtn.getBoundingClientRect();
      setBgStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [algorithm]);

  const handleSelect = (algo: SortAlgorithm) => {
    vibrate(BUTTON_PRESS);
    if (algo === algorithm) {
      // Already selected - toggle alpha mode
      toggleAlphaMode();
    } else {
      // New algorithm selected
      setAlgorithm(algo);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : ALGORITHMS.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = currentIndex < ALGORITHMS.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelect(ALGORITHMS[currentIndex].id);
        return;
      default:
        return;
    }

    // Focus the new button
    const buttons = document.querySelectorAll('[role="radio"]');
    (buttons[newIndex] as HTMLElement)?.focus();
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Sort algorithm selector"
      className="relative flex flex-row gap-2 justify-center overflow-x-auto md:flex-wrap md:justify-center px-2"
    >
      {/* Sliding background indicator */}
      {bgStyle && (
        <div
          className="absolute bg-[var(--secondary)] rounded-full"
          style={{
            left: bgStyle.left,
            width: bgStyle.width,
            top: 0,
            bottom: 0,
            transition: prefersReducedMotion ? 'none' : 'left 0.25s ease-out, width 0.25s ease-out',
            zIndex: 0,
          }}
        />
      )}

      {ALGORITHMS.map((algo, index) => {
        const isSelected = algorithm === algo.id;

        return (
          <button
            key={algo.id}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${algo.label}: ${algo.description}${isSelected && isAlphaMode ? ' (sorted A-Z)' : ''}`}
            onClick={() => handleSelect(algo.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={isSelected ? 0 : -1}
            className={`
              relative px-3 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm whitespace-nowrap
              border transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]
              active:scale-95
              ${
                isSelected
                  ? 'border-[var(--secondary)] text-white font-semibold'
                  : 'border-[var(--bg-elevated)] text-[var(--text)] bg-[var(--bg-card)] hover:border-[var(--secondary)] hover:bg-[var(--bg-elevated)]'
              }
            `}
            style={{
              minWidth: 'fit-content',
              zIndex: 1,
            }}
          >
            {/* Content */}
            <span className="relative z-10 flex flex-col items-center justify-center">
              <span>{algo.label}</span>
              {/* Subtle underline indicator for alpha mode */}
              {isSelected && isAlphaMode && (
                <span
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full"
                  style={{
                    animation: prefersReducedMotion ? 'none' : 'algo-underline-in 0.2s ease-out both',
                  }}
                  aria-label="Sorted alphabetically"
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
