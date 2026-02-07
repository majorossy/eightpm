'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
      role="radiogroup"
      aria-label="Sort algorithm selector"
      className="flex flex-row gap-2 justify-center overflow-x-auto md:flex-wrap md:justify-center px-2"
    >
      {ALGORITHMS.map((algo, index) => {
        const isSelected = algorithm === algo.id;

        return (
          <motion.button
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
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-pink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]
              active:scale-95
              ${
                isSelected
                  ? 'border-[var(--neon-pink)] text-[var(--bg)] font-semibold'
                  : 'border-[var(--bg-elevated)] text-[var(--text)] bg-[var(--bg-card)] hover:border-[var(--neon-pink)] hover:bg-[var(--bg-elevated)]'
              }
            `}
            style={{
              minWidth: 'fit-content',
            }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          >
            {/* Animated background for selected state */}
            {isSelected && (
              <motion.div
                layoutId="selectedBackground"
                className="absolute inset-0 bg-[var(--neon-pink)] rounded-full"
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 300, damping: 30 }
                }
              />
            )}

            {/* Content */}
            <span className="relative z-10 flex flex-col items-center justify-center">
              <span>{algo.label}</span>
              {/* Subtle underline indicator for alpha mode */}
              {isSelected && isAlphaMode && (
                <motion.span
                  initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--bg)] rounded-full"
                  aria-label="Sorted alphabetically"
                />
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
