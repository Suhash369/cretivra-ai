'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useOpeningTimeline, type AwakeningStage } from './useOpeningTimeline';
import { useOpeningReadiness } from './useOpeningReadiness';
import { ParticleField } from './ParticleField';
import { EnergyTrace } from './EnergyTrace';
import { LogoCore } from './LogoCore';
import { ConsciousnessPulse } from './ConsciousnessPulse';
import { AsuraIdentity } from './AsuraIdentity';

export type { AwakeningStage };

interface AsuraOpeningAnimationProps {
  isAppReady?: boolean;
  onComplete?: () => void;
  forceReplay?: boolean;
  onReplayHandled?: () => void;
}

const SESSION_KEY = 'asura_opening_played_session';
const VISITED_KEY = 'cretivra_asura_visited';

export const AsuraOpeningAnimation: React.FC<AsuraOpeningAnimationProps> = ({
  isAppReady = true,
  onComplete,
  forceReplay = false,
  onReplayHandled,
}) => {
  // Session check: skip if already played in this browser session (unless manual forceReplay)
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (forceReplay) return false;
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [reducedMotion, setReducedMotion] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Stabilize external callbacks
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onReplayHandledRef = useRef(onReplayHandled);
  onReplayHandledRef.current = onReplayHandled;

  // Check user environment on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setReducedMotion(prefersReduced);

      const hasVisited = localStorage.getItem(VISITED_KEY) === 'true';
      setIsReturningUser(!forceReplay && hasVisited);
    }
  }, [forceReplay]);

  // Hook into high-performance timeline
  const { stage, skip, finish } = useOpeningTimeline({
    isReturningUser,
    reducedMotion,
    forceReplay,
    onComplete: () => {
      try {
        sessionStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(VISITED_KEY, 'true');
      } catch {
        // ignore
      }
      setTimeout(() => {
        setIsDismissed(true);
        onCompleteRef.current?.();
        onReplayHandledRef.current?.();
      }, 300);
    },
  });

  // Synchronize with app readiness
  useOpeningReadiness({
    stage,
    isAppReady,
    onCanTransition: () => {
      finish();
    },
  });

  // Global skip listener (Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skip]);

  // If dismissed or fully unmounted
  if (isDismissed || stage === 'READY') {
    return null;
  }

  const isTransitioning = stage === 'TRANSITION';

  return (
    <div
      onClick={skip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden asura-opening-backdrop transition-all duration-800 ease-out cursor-pointer will-change-transform ${
        isTransitioning
          ? 'opacity-0 scale-125 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-label="Asura AI Consciousness Awakening"
    >
      {/* 1. Deep Atmospheric Radial Aura (Apple Intelligence / Astra depth - GPU Promoted) */}
      <div
        className="absolute w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full pointer-events-none filter blur-3xl opacity-60 bg-gradient-to-tr from-cyan-200/50 via-blue-100/40 to-violet-200/50 animate-pulse-soft transform-gpu will-change-transform"
        style={{ transform: 'translateZ(0)' }}
        aria-hidden="true"
      />

      {/* 2. Volumetric Particle Field with Additive Glow & Procedural Lemniscate Physics */}
      {!reducedMotion && (
        <ParticleField stage={stage} />
      )}

      {/* 3. Central Chamber: Perfectly Centered in Viewport (Zero-Drift Registration) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-20 pointer-events-none">
        {/* Exact Dead-Center Core: EnergyTrace, LogoCore, ConsciousnessPulse */}
        <div className="relative flex items-center justify-center">
          <EnergyTrace stage={stage} />
          <LogoCore stage={stage} />
          <ConsciousnessPulse stage={stage} />
        </div>

        {/* 4. ASURA Identity Emergence (Anchored precisely below Core without shifting the Core's center) */}
        <div className="absolute top-[calc(50%+110px)] sm:top-[calc(50%+132px)] left-0 right-0 flex justify-center pointer-events-none">
          <AsuraIdentity stage={stage} />
        </div>
      </div>

      {/* 5. Non-intrusive skip hint for power users */}
      <div className="absolute bottom-6 text-[11px] text-slate-400 font-medium tracking-wide opacity-50 hover:opacity-100 transition-opacity z-30">
        {isReturningUser ? 'Press Esc or click to enter' : 'Press Esc to skip'}
      </div>
    </div>
  );
};
