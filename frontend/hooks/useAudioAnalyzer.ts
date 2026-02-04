import { useState, useRef, useEffect, useCallback } from 'react';

export interface AudioAnalyzerData {
  waveform: number[];
  volume: number;
  frequencyData: number[];
}

export interface UseAudioAnalyzerReturn {
  analyzerData: AudioAnalyzerData;
  connectAudioElement: (audioElement: HTMLAudioElement | null) => Promise<void>;
  isConnected: boolean;
  setVolume: (volume: number) => void;
}

/**
 * useAudioAnalyzer - Web Audio API analyzer for real-time audio visualization
 *
 * Features:
 * - Extracts volume level (0-1 normalized)
 * - Extracts waveform data (time domain, -1 to 1)
 * - Extracts frequency data for potential EQ visualization
 * - Handles audio element switching (for crossfade)
 * - Properly cleans up resources
 */
export function useAudioAnalyzer(): UseAudioAnalyzerReturn {
  const [analyzerData, setAnalyzerData] = useState<AudioAnalyzerData>({
    waveform: [],
    volume: 0,
    frequencyData: [],
  });

  const [isConnected, setIsConnected] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);
  // Track which elements have been connected (can only create source once per element)
  const connectedElementsRef = useRef<WeakSet<HTMLAudioElement>>(new WeakSet());
  // Throttle frame rate for better performance (~30fps instead of 60fps)
  const lastFrameTimeRef = useRef<number>(0);
  const FRAME_INTERVAL = 33; // ~30fps (1000ms / 30)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Don't disconnect/close the AudioContext as it can't be reconnected
    // Don't set isConnected to false - keep the connection alive
  }, []);

  // Analysis loop (throttled to ~30fps for performance)
  const analyze = useCallback((timestamp?: number) => {
    // Schedule next frame first
    animationRef.current = requestAnimationFrame(analyze);

    if (!analyzerRef.current) {
      return;
    }

    // Throttle: skip frame if not enough time has passed
    const now = timestamp || performance.now();
    if (now - lastFrameTimeRef.current < FRAME_INTERVAL) {
      return;
    }
    lastFrameTimeRef.current = now;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const frequencyDataArray = new Uint8Array(bufferLength);
    const waveformDataArray = new Uint8Array(bufferLength);

    // Get frequency data (for volume calculation)
    analyzerRef.current.getByteFrequencyData(frequencyDataArray);

    // Get time domain data (for waveform)
    analyzerRef.current.getByteTimeDomainData(waveformDataArray);

    // Calculate volume (average of frequency data, normalized 0-1)
    const sum = frequencyDataArray.reduce((a, b) => a + b, 0);
    const volume = sum / bufferLength / 255;

    // Extract waveform points (normalized -1 to 1)
    const waveformPoints: number[] = [];
    const step = Math.floor(bufferLength / 30);
    for (let i = 0; i < 30; i++) {
      waveformPoints.push((waveformDataArray[i * step] - 128) / 128);
    }

    // Extract frequency bands (for EQ visualization)
    const frequencyBands: number[] = [];
    const freqStep = Math.floor(bufferLength / 16);
    for (let i = 0; i < 16; i++) {
      frequencyBands.push(frequencyDataArray[i * freqStep] / 255);
    }

    setAnalyzerData({
      waveform: waveformPoints,
      volume,
      frequencyData: frequencyBands,
    });
  }, []);

  // Connect to an audio element
  const connectAudioElement = useCallback(async (audioElement: HTMLAudioElement | null) => {
    if (!audioElement) {
      cleanup();
      return;
    }

    // If already connected to this element, just make sure analysis is running
    if (connectedElementRef.current === audioElement && isConnected) {
      if (!animationRef.current) {
        analyze();
      }
      return;
    }

    try {
      // Create AudioContext if needed (requires user interaction)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      // Resume context if suspended (happens after page becomes visible again)
      // MUST await before createMediaElementSource or audio routes through suspended context
      if (audioContextRef.current.state === 'suspended') {
        console.log('[useAudioAnalyzer] ⚠️ AudioContext suspended, resuming...');
        await audioContextRef.current.resume();
        console.log('[useAudioAnalyzer] ✅ AudioContext resumed, state:', audioContextRef.current!.state);
      }

      console.log('[useAudioAnalyzer] AudioContext state:', audioContextRef.current.state);

      // Create gain node for volume control (needed when using Web Audio API)
      if (!gainNodeRef.current) {
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = 1.0; // Full volume initially
        gainNodeRef.current.connect(audioContextRef.current.destination);
        console.log('[useAudioAnalyzer] ✅ Created GainNode for volume control');
      }

      // Create analyzer if needed
      if (!analyzerRef.current) {
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;
        analyzerRef.current.smoothingTimeConstant = 0.8;
        // Connect analyzer to gain node instead of directly to destination
        analyzerRef.current.connect(gainNodeRef.current);
        console.log('[useAudioAnalyzer] ✅ Created AnalyserNode');
      }

      // Check if this element was already connected before
      // MediaElementSource can only be created ONCE per element
      const wasConnected = connectedElementsRef.current.has(audioElement);

      if (!wasConnected) {
        // First time connecting this element - create the source
        try {
          const newSource = audioContextRef.current.createMediaElementSource(audioElement);
          newSource.connect(analyzerRef.current);
          sourceRef.current = newSource;
          connectedElementsRef.current.add(audioElement);
          console.log('[useAudioAnalyzer] ✅ Created new audio source and connected:', {
            analyzerConnected: analyzerRef.current !== null,
            destinationConnected: true,
            contextState: audioContextRef.current.state
          });
        } catch (error) {
          console.error('[useAudioAnalyzer] ❌ Failed to create audio source:', error);
          // Don't proceed if we can't create the source
          return;
        }
      } else {
        // Element was connected before - reuse the existing connection
        console.log('[useAudioAnalyzer] ♻️ Reusing existing audio source for element');
      }

      connectedElementRef.current = audioElement;
      setIsConnected(true);

      // Start the analysis loop
      if (!animationRef.current) {
        analyze();
      }
    } catch (error) {
      console.warn('[useAudioAnalyzer] Failed to connect:', error);
    }
  }, [analyze, cleanup, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();

      // Close audio context on unmount
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {
          // Ignore close errors
        });
      }
    };
  }, [cleanup]);

  // Volume control using GainNode
  const setVolume = useCallback((volume: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
      console.log('[useAudioAnalyzer] 🔊 Volume set to:', Math.round(volume * 100) + '%');
    }
  }, []);

  return {
    analyzerData,
    connectAudioElement,
    isConnected,
    setVolume,
  };
}
