'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  // Playback controls
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;

  // Volume controls
  onVolumeUp: () => void;
  onVolumeDown: () => void;

  // Playlist controls
  onCycleRepeat: () => void;

  // Wishlist/like
  onToggleLike: () => void;

  // Queue controls
  onToggleQueue: () => void;

  // Search
  onOpenSearch?: () => void;

  // Help modal
  onShowHelp?: () => void;

  // Get current state for conditional logic
  isQueueOpen?: boolean;
}

/**
 * Global keyboard shortcuts for Jamify music player
 *
 * Shortcuts:
 * - Space: Play/pause
 * - N or Right Arrow: Next track
 * - P or Left Arrow: Previous track
 * - Up Arrow: Volume up (+10%)
 * - Down Arrow: Volume down (-10%)
 * - R: Cycle repeat (off → all → one)
 * - L: Like/unlike current song
 * - Q: Toggle queue drawer
 * - K or Cmd+K or Ctrl+K: Open search
 * - Escape: Close queue/modals
 * - ?: Show shortcuts help modal
 */
export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const {
    onPlayPause,
    onNext,
    onPrevious,
    onVolumeUp,
    onVolumeDown,
    onCycleRepeat,
    onToggleLike,
    onToggleQueue,
    onOpenSearch,
    onShowHelp,
    isQueueOpen = false,
  } = config;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    const isTyping =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Special case: Allow Escape and Cmd/Ctrl+K even when typing
    const isEscape = e.key === 'Escape';
    const isSearchShortcut = e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey);

    if (isTyping && !isEscape && !isSearchShortcut) {
      return;
    }

    // Handle Escape key
    if (isEscape) {
      if (isQueueOpen) {
        e.preventDefault();
        onToggleQueue();
      }
      return;
    }

    // Handle search shortcut (Cmd/Ctrl+K or just K)
    if (e.key.toLowerCase() === 'k') {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        onOpenSearch?.();
        return;
      }
      // Plain 'k' only works outside of input fields
      if (!isTyping) {
        e.preventDefault();
        onOpenSearch?.();
        return;
      }
    }

    // Ignore if typing for all other shortcuts
    if (isTyping) {
      return;
    }

    // Handle other shortcuts
    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        onPlayPause();
        break;

      case 'n':
      case 'arrowright':
        e.preventDefault();
        onNext();
        break;

      case 'p':
      case 'arrowleft':
        e.preventDefault();
        onPrevious();
        break;

      case 'arrowup':
        e.preventDefault();
        onVolumeUp();
        break;

      case 'arrowdown':
        e.preventDefault();
        onVolumeDown();
        break;

      case 'r':
        e.preventDefault();
        onCycleRepeat();
        break;

      case 'l':
        e.preventDefault();
        onToggleLike();
        break;

      case 'q':
        e.preventDefault();
        onToggleQueue();
        break;

      case '?':
        e.preventDefault();
        onShowHelp?.();
        break;
    }
  }, [
    onPlayPause,
    onNext,
    onPrevious,
    onVolumeUp,
    onVolumeDown,
    onCycleRepeat,
    onToggleLike,
    onToggleQueue,
    onOpenSearch,
    onShowHelp,
    isQueueOpen,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
