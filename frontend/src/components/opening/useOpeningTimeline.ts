'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type AwakeningStage =
  | 'IDLE'
  | 'SIGNAL'       // 0.00 – 0.60s: The Void & Microscopic Signal
  | 'FIELD'        // 0.60 – 1.40s: Volumetric Energy Field Awakens
  | 'FLOW'         // 1.40 – 2.20s: Procedural Gravitational Wells (Subconscious Infinity)
  | 'FORMATION'    // 2.20 – 2.90s: Progressive Structure & Energy Path Travel
  | 'STABILIZE'    // 2.90 – 3.20s: 300ms Chamber Stillness & Anticipation
  | 'CONSCIOUS'    // 3.20 – 3.70s: Consciousness Heartbeat & Environmental Pulse
  | 'IDENTITY'     // 3.70 – 4.70s: ASURA Materialization, Optical Tracking & Letterform Sweep
  | 'TRANSITION'   // 4.70 – 5.40s: Lens-Through Core Expansion & App Emergence
  | 'READY';       // 5.40s+: Fully Unmounted & Interactive

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

  // Cinema-grade timeline duration = 5.40s (Allows every phase to breathe with majestic pacing)
  const totalDuration = reducedMotion ? 0.4 : 5.40;

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

      // Full Master-Class Cinematic Awakening (5.40s total)
      if (t < 0.60) {
        setStage('SIGNAL');
      } else if (t < 1.40) {
        setStage('FIELD');
      } else if (t < 2.20) {
        setStage('FLOW');
      } else if (t < 2.90) {
        setStage('FORMATION');
      } else if (t < 3.20) {
        setStage('STABILIZE');
      } else if (t < 3.70) {
        setStage('CONSCIOUS');
      } else if (t < 4.70) {
        setStage('IDENTITY');
      } else if (t < 5.40) {
        setStage('TRANSITION');
      } else {
        finish();
        return;
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
