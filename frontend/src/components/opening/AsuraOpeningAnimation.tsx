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

  // Hook into continuous high-resolution timeline
  const { stage, elapsedTime, skip, finish } = useOpeningTimeline({
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
      }, 150);
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden asura-opening-backdrop transition-all duration-600 ease-out cursor-pointer ${
        isTransitioning
          ? 'opacity-0 scale-110 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      aria-label="Asura AI Consciousness Awakening"
    >
      {/* 1. Volumetric Particle Field with Procedural Lemniscate Physics */}
      {!reducedMotion && (
        <ParticleField stage={stage} elapsedTime={elapsedTime} />
      )}

      {/* 2. Central Chamber: Consciousness Core, Energy Paths, and Pulse */}
      <div className="relative w-full max-w-xl mx-auto flex flex-col items-center justify-center p-6 z-20">
        <div className="relative flex items-center justify-center">
          {/* Geodesic Energy Traces */}
          <EnergyTrace stage={stage} elapsedTime={elapsedTime} />

          {/* Authentic CRETIVRA Core Mark with 3-Layer Formation & Camera Scaling */}
          <LogoCore stage={stage} elapsedTime={elapsedTime} />

          {/* Consciousness Stillness & Environmental Pulse */}
          <ConsciousnessPulse stage={stage} />
        </div>

        {/* 3. ASURA Identity Emergence (Light field & Letterform Sweep) */}
        <AsuraIdentity stage={stage} />
      </div>

      {/* Non-intrusive skip hint for power users */}
      <div className="absolute bottom-6 text-[11px] text-slate-400 font-medium tracking-wide opacity-50 hover:opacity-100 transition-opacity z-30">
        {isReturningUser ? 'Press Esc or click to enter' : 'Press Esc to skip'}
      </div>
    </div>
  );
};
