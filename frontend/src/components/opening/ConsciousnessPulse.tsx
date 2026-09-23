'use client';

import React from 'react';
import type { AwakeningStage } from './useOpeningTimeline';

interface ConsciousnessPulseProps {
  stage: AwakeningStage;
}

export const ConsciousnessPulse: React.FC<ConsciousnessPulseProps> = ({ stage }) => {
  const isConscious = stage === 'CONSCIOUS';
  const isStabilizing = stage === 'STABILIZE';

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-15">
      {/* 1. Pre-heartbeat Stillness Aura (100-150ms) */}
      {isStabilizing && (
        <div
          className="w-32 h-32 rounded-full bg-cyan-300/20 filter blur-xl animate-pulse-soft"
          aria-hidden="true"
        />
      )}

      {/* 2. Heartbeat Outward Shockwave Ripple */}
      {isConscious && (
        <>
          <div
            className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full border border-cyan-400 asura-animate-ripple pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border border-violet-400/60 asura-animate-ripple pointer-events-none"
            style={{ animationDelay: '90ms' }}
            aria-hidden="true"
          />
        </>
      )}

      {/* 3. Center Node Consciousness Flare */}
      {isConscious && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 via-white to-violet-500 filter blur-md opacity-90 animate-ping"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
