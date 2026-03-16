'use client';

import { useEffect, useCallback } from 'react';
import { trackKeyboardShortcut } from '@/lib/analytics';

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

  // Find
  onOpenFind?: () => void;

  // Help modal
  onShowHelp?: () => void;

  // Minimize player
  onToggleMinimize?: () => void;

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
 * - K or Cmd+K or Ctrl+K: Open find
 * - Escape: Close queue/modals
 * - ?: Show shortcuts help modal
 * - M: Toggle minimize player
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
    onOpenFind,
    onShowHelp,
    onToggleMinimize,
    isQueueOpen = false,
  } = config;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Some events (dead keys, IME) have no key — ignore them
    if (!e.key) return;

    // Ignore shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    const isTyping =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Special case: Allow Escape and Cmd/Ctrl+K even when typing
    const isEscape = e.key === 'Escape';
    const isFindShortcut = e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey);

    if (isTyping && !isEscape && !isFindShortcut) {
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

    // Handle find shortcut (Cmd/Ctrl+K or just K)
    if (e.key.toLowerCase() === 'k') {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        onOpenFind?.();
        return;
      }
      // Plain 'k' only works outside of input fields
      if (!isTyping) {
        e.preventDefault();
        onOpenFind?.();
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
        trackKeyboardShortcut('space', 'play_pause');
        break;

      case 'n':
      case 'arrowright':
        e.preventDefault();
        onNext();
        trackKeyboardShortcut(e.key.toLowerCase(), 'next');
        break;

      case 'p':
      case 'arrowleft':
        e.preventDefault();
        onPrevious();
        trackKeyboardShortcut(e.key.toLowerCase(), 'previous');
        break;

      case 'arrowup':
        e.preventDefault();
        onVolumeUp();
        trackKeyboardShortcut('arrowup', 'volume_up');
        break;

      case 'arrowdown':
        e.preventDefault();
        onVolumeDown();
        trackKeyboardShortcut('arrowdown', 'volume_down');
        break;

      case 'r':
        e.preventDefault();
        onCycleRepeat();
        trackKeyboardShortcut('r', 'cycle_repeat');
        break;

      case 'l':
        e.preventDefault();
        onToggleLike();
        trackKeyboardShortcut('l', 'toggle_like');
        break;

      case 'q':
        e.preventDefault();
        onToggleQueue();
        trackKeyboardShortcut('q', 'toggle_queue');
        break;

      case '?':
        e.preventDefault();
        onShowHelp?.();
        trackKeyboardShortcut('?', 'show_help');
        break;

      case 'm':
        e.preventDefault();
        onToggleMinimize?.();
        trackKeyboardShortcut('m', 'toggle_minimize');
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
    onOpenFind,
    onShowHelp,
    onToggleMinimize,
    isQueueOpen,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
