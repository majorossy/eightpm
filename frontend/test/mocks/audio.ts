/**
 * HTMLAudioElement mock for jsdom (which has no media support).
 *
 * Simulates enough of the Audio API for PlayerContext integration tests:
 * - play/pause/load
 * - src assignment
 * - currentTime/duration
 * - Event dispatching (timeupdate, ended, error, etc.)
 */
import { vi } from 'vitest';

export interface MockAudioElement extends HTMLAudioElement {
  _simulateTimeUpdate: (time: number) => void;
  _simulateEnded: () => void;
  _simulateError: (code?: number) => void;
  _simulateCanPlay: () => void;
  _simulateLoadedMetadata: (duration: number) => void;
}

export function createMockAudio(): MockAudioElement {
  let _src = '';
  let _currentTime = 0;
  let _duration = 0;
  let _volume = 1;
  let _paused = true;
  const listeners: Record<string, Set<EventListener>> = {};

  const audio = {
    get src() { return _src; },
    set src(val: string) { _src = val; },
    get currentSrc() { return _src; },
    get currentTime() { return _currentTime; },
    set currentTime(val: number) { _currentTime = val; },
    get duration() { return _duration; },
    get volume() { return _volume; },
    set volume(val: number) { _volume = val; },
    get paused() { return _paused; },
    get readyState() { return _src ? 4 : 0; },
    get error() { return null as MediaError | null; },

    play: vi.fn(() => {
      _paused = false;
      dispatch('play');
      return Promise.resolve();
    }),
    pause: vi.fn(() => {
      _paused = true;
      dispatch('pause');
    }),
    load: vi.fn(),

    addEventListener(event: string, handler: EventListener) {
      if (!listeners[event]) listeners[event] = new Set();
      listeners[event].add(handler);
    },
    removeEventListener(event: string, handler: EventListener) {
      listeners[event]?.delete(handler);
    },

    // Helpers for tests to simulate audio events
    _simulateTimeUpdate(time: number) {
      _currentTime = time;
      dispatch('timeupdate');
    },
    _simulateEnded() {
      _paused = true;
      dispatch('ended');
    },
    _simulateError(code = 2) {
      Object.defineProperty(audio, 'error', {
        value: { code, message: 'Mock error' },
        configurable: true,
      });
      dispatch('error');
    },
    _simulateCanPlay() {
      dispatch('canplay');
    },
    _simulateLoadedMetadata(duration: number) {
      _duration = duration;
      dispatch('loadedmetadata');
    },
  };

  function dispatch(event: string) {
    const evt = new Event(event);
    Object.defineProperty(evt, 'target', { value: audio });
    listeners[event]?.forEach(fn => fn(evt));
  }

  return audio as unknown as MockAudioElement;
}

/**
 * Install a global Audio constructor mock.
 * Returns a ref to the most recently created audio instance.
 */
export function installAudioMock() {
  let lastAudio: MockAudioElement | null = null;

  const origAudio = globalThis.Audio;
  (globalThis as unknown as Record<string, unknown>).Audio = function MockAudioConstructor() {
    lastAudio = createMockAudio();
    return lastAudio;
  };

  return {
    getAudio: () => lastAudio,
    restore: () => { (globalThis as unknown as Record<string, unknown>).Audio = origAudio; },
  };
}
