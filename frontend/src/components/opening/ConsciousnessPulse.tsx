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
      {/* 1. Pre-Heartbeat Stillness Aura (150ms quiet chamber) */}
      {isStabilizing && (
        <div
          className="w-40 h-40 rounded-full bg-gradient-to-r from-cyan-400/20 via-white/30 to-violet-400/20 filter blur-2xl animate-pulse-soft"
          aria-hidden="true"
        />
      )}

      {/* 2. Double Heartbeat Shockwave Ripples (Wave 1 and Wave 2) */}
      {isConscious && (
        <>
          {/* Wave 1: Immediate primary high-intensity blast */}
          <div
            className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full border-2 border-white asura-animate-ripple pointer-events-none filter drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]"
            aria-hidden="true"
          />

          {/* Wave 2: Staggered secondary cosmic violet ripple */}
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border border-cyan-400/80 asura-animate-ripple pointer-events-none filter drop-shadow-[0_0_16px_rgba(139,92,246,0.7)]"
            style={{ animationDelay: '120ms' }}
            aria-hidden="true"
          />

          {/* Wave 3: Wide ambient atmospheric dissipation ring */}
          <div
            className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full border border-violet-400/40 asura-animate-ripple pointer-events-none"
            style={{ animationDelay: '220ms' }}
            aria-hidden="true"
          />
        </>
      )}

      {/* 3. Center Node Consciousness Flare */}
      {isConscious && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-r from-cyan-300 via-white to-violet-400 filter blur-md opacity-95 animate-ping"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
