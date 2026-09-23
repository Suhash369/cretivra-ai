'use client';

import React from 'react';
import type { AwakeningStage } from './useOpeningTimeline';

interface CoreTransitionProps {
  stage: AwakeningStage;
  children: React.ReactNode;
}

export const CoreTransition: React.FC<CoreTransitionProps> = ({ stage, children }) => {
  const isTransitioning = stage === 'TRANSITION';
  const isReady = stage === 'READY';

  return (
    <div
      className={`relative w-full h-full flex flex-col transition-all duration-600 ease-out ${
        isReady || isTransitioning
          ? 'opacity-100 scale-100 filter blur-none'
          : 'opacity-0 scale-[0.99] filter blur-xs pointer-events-none'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
};
