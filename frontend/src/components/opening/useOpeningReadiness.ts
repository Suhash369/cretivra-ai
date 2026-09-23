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

  useEffect(() => {
    // When animation reaches TRANSITION, check if essential app is ready
    if (stage === 'TRANSITION') {
      if (isAppReadyRef.current) {
        onCanTransitionRef.current?.();
      }
    }
  }, [stage]);

  // When app becomes ready after slow backend during transition hold
  useEffect(() => {
    if (isAppReady && stage === 'TRANSITION') {
      onCanTransitionRef.current?.();
    }
  }, [isAppReady, stage]);
}
