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
      {/* 1. Pre-Heartbeat Stillness Aura (300ms quiet chamber) */}
      {isStabilizing && (
        <div
          className="w-48 h-48 rounded-full bg-gradient-to-r from-cyan-400/20 via-white/30 to-violet-400/20 filter blur-3xl animate-pulse-soft transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* 2. Soft Luminous Consciousness Energy Ripples (Seamless Dissipating Caustics) */}
      {isConscious && (
        <>
          {/* Wave 1: Immediate primary luminous wave */}
          <div
            className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full asura-animate-ripple pointer-events-none"
            style={{
              background: 'radial-gradient(circle, transparent 60%, rgba(6,182,212,0.18) 78%, rgba(255,255,255,0.7) 90%, transparent 100%)',
              boxShadow: '0 0 30px rgba(6,182,212,0.45)',
            }}
            aria-hidden="true"
          />

          {/* Wave 2: Staggered secondary cosmic violet wave */}
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full asura-animate-ripple pointer-events-none"
            style={{
              animationDelay: '160ms',
              background: 'radial-gradient(circle, transparent 62%, rgba(139,92,246,0.15) 80%, rgba(56,189,248,0.5) 92%, transparent 100%)',
              boxShadow: '0 0 40px rgba(139,92,246,0.35)',
            }}
            aria-hidden="true"
          />

          {/* Wave 3: Wide ambient atmospheric dissipation wave */}
          <div
            className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full asura-animate-ripple pointer-events-none"
            style={{
              animationDelay: '300ms',
              background: 'radial-gradient(circle, transparent 68%, rgba(6,182,212,0.1) 85%, rgba(139,92,246,0.25) 94%, transparent 100%)',
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* 3. Center Node Consciousness Radiant Flare */}
      {isConscious && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-r from-cyan-300/80 via-white to-violet-400/80 filter blur-xl opacity-90 asura-animate-signal pointer-events-none"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
