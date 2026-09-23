'use client';

import { useEffect, useRef } from 'react';
import type { AwakeningStage } from './useOpeningTimeline';

interface UseOpeningReadinessOptions {
  stage: AwakeningStage;
  isAppReady: boolean;
  onCanTransition: () => void;
}

export function useOpeningReadiness({
  stage,
  isAppReady,
  onCanTransition,
}: UseOpeningReadinessOptions) {
  const onCanTransitionRef = useRef(onCanTransition);
  onCanTransitionRef.current = onCanTransition;
  const isAppReadyRef = useRef(isAppReady);
  isAppReadyRef.current = isAppReady;

  // We only signal readiness if the timeline reaches READY or requests complete transition
  useEffect(() => {
    if (stage === 'READY') {
      if (isAppReadyRef.current) {
        onCanTransitionRef.current?.();
      }
    }
  }, [stage]);

  useEffect(() => {
    if (isAppReady && stage === 'READY') {
      onCanTransitionRef.current?.();
    }
  }, [isAppReady, stage]);
}
