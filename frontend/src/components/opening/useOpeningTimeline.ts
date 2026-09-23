'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type AwakeningStage =
  | 'IDLE'
  | 'SIGNAL'       // 0.00 – 0.30s: The Void & Microscopic Signal
  | 'FIELD'        // 0.30 – 0.65s: Volumetric Energy Field Awakens
  | 'FLOW'         // 0.65 – 1.05s: Procedural Gravitational Wells (Subconscious Infinity)
  | 'FORMATION'    // 1.05 – 1.45s: Progressive Structure & Energy Path Travel
  | 'STABILIZE'    // 1.45 – 1.60s: 150ms Stillness
  | 'CONSCIOUS'    // 1.60 – 1.90s: Consciousness Heartbeat & Environmental Pulse
  | 'IDENTITY'     // 1.90 – 2.35s: ASURA Materialization & Letterform Sweep
  | 'TRANSITION'   // 2.35 – 2.85s: Lens-Through Core Expansion & App Emergence
  | 'READY';       // 2.85s+: Fully Unmounted & Interactive

interface UseOpeningTimelineOptions {
  isReturningUser?: boolean;
  reducedMotion?: boolean;
  forceReplay?: boolean;
  onComplete?: () => void;
}

export function useOpeningTimeline({
  isReturningUser = false,
  reducedMotion = false,
  forceReplay = false,
  onComplete,
}: UseOpeningTimelineOptions) {
  const [stage, setStage] = useState<AwakeningStage>('IDLE');
  const [progress, setProgress] = useState(0); // 0.0 to 1.0 normalized
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);
  const isFinishedRef = useRef(false);

  // Full cinematic timeline duration = 2.85s, Fast-track = 0.65s
  const totalDuration = reducedMotion ? 0.4 : isReturningUser && !forceReplay ? 0.65 : 2.85;

  const finish = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setStage('READY');
    setProgress(1);
    onCompleteRef.current?.();
  }, []);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  useEffect(() => {
    isFinishedRef.current = false;
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    pauseStartRef.current = null;

    if (reducedMotion) {
      setStage('FORMATION');
      const t = setTimeout(() => {
        setStage('TRANSITION');
        setTimeout(() => finish(), 180);
      }, 200);
      return () => clearTimeout(t);
    }

    // Visibility change handler to pause animation in background tabs
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseStartRef.current = performance.now();
      } else if (pauseStartRef.current !== null) {
        pausedTimeRef.current += performance.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const tick = (now: number) => {
      if (isFinishedRef.current) return;

      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }

      // Compute actual active elapsed time factoring in background tab pauses
      const activeElapsedMs = now - startTimeRef.current - pausedTimeRef.current;
      const t = Math.max(0, activeElapsedMs / 1000);
      setElapsedTime(t);

      const norm = Math.min(1, t / totalDuration);
      setProgress(norm);

      if (isReturningUser && !forceReplay) {
        // Fast-track micro-awakening (0.65s total)
        if (t < 0.15) setStage('FLOW');
        else if (t < 0.32) setStage('CONSCIOUS');
        else if (t < 0.50) setStage('TRANSITION');
        else {
          finish();
          return;
        }
      } else {
        // Full Cinematic Awakening (2.85s total)
        if (t < 0.30) {
          setStage('SIGNAL');
        } else if (t < 0.65) {
          setStage('FIELD');
        } else if (t < 1.05) {
          setStage('FLOW');
        } else if (t < 1.45) {
          setStage('FORMATION');
        } else if (t < 1.60) {
          setStage('STABILIZE');
        } else if (t < 1.90) {
          setStage('CONSCIOUS');
        } else if (t < 2.35) {
          setStage('IDENTITY');
        } else if (t < 2.85) {
          setStage('TRANSITION');
        } else {
          finish();
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [totalDuration, isReturningUser, reducedMotion, forceReplay, finish]);

  return {
    stage,
    progress,
    elapsedTime,
    skip,
    finish,
  };
}
