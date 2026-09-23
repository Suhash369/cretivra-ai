'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EnergyParticles, type ParticleStage } from './EnergyParticles';
import { LogoFormation } from './LogoFormation';
import { AsuraReveal } from './AsuraReveal';

export type AnimationStage =
  | 'INITIALIZING'   // 0.00s – 0.25s: The First Signal (single particle)
  | 'AWAKENING'      // 0.25s – 0.65s: Intelligence Awakens (particles orbit)
  | 'FORMING'        // 0.65s – 1.05s: Energy Streams (network lines connect)
  | 'LOGO_READY'     // 1.05s – 1.45s: CRETIVRA Logo Formation & sweep
  | 'ASURA_ACTIVE'   // 1.45s – 1.75s: Asura Activation Pulse & wave
  | 'ASURA_REVEAL'   // 1.75s – 2.05s: ASURA AI Identity reveal
  | 'TRANSITIONING'  // 2.05s – 2.45s: Core expands, app reveals
  | 'READY';         // 2.45s+: Animation complete, overlay unmounted

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
  // Check whether animation should be skipped immediately on mount
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (forceReplay) return false;
    try {
      // If already played in this browser session, do not replay
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [stage, setStage] = useState<AnimationStage>('INITIALIZING');
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Stabilize callbacks and props in refs so re-renders in parent NEVER re-trigger animation
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onReplayHandledRef = useRef(onReplayHandled);
  onReplayHandledRef.current = onReplayHandled;
  const isAppReadyRef = useRef(isAppReady);
  isAppReadyRef.current = isAppReady;

  const timersRef = useRef<number[]>([]);
  const hasStartedRef = useRef(false);
  const isFinishedRef = useRef(false);
  const prevForceReplayRef = useRef(forceReplay);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  const finishAnimation = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    clearAllTimers();
    setStage('READY');

    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
      localStorage.setItem(VISITED_KEY, 'true');
    } catch {
      // ignore
    }

    // Smooth exit
    setTimeout(() => {
      setIsDismissed(true);
      onCompleteRef.current?.();
      onReplayHandledRef.current?.();
    }, 180);
  }, [clearAllTimers]);

  // Main animation sequence
  const startSequence = useCallback(() => {
    clearAllTimers();
    isFinishedRef.current = false;
    setIsDismissed(false);

    // 1. Reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true);
      setStage('LOGO_READY');
      const t1 = window.setTimeout(() => setStage('TRANSITIONING'), 300);
      const t2 = window.setTimeout(() => finishAnimation(), 500);
      timersRef.current.push(t1, t2);
      return;
    }

    // 2. Returning visitor check
    let hasVisited = false;
    try {
      hasVisited = localStorage.getItem(VISITED_KEY) === 'true';
    } catch {
      hasVisited = false;
    }

    // Only use returning-user fast track if not an explicit manual replay
    const useFastTrack = !forceReplay && hasVisited;
    setIsReturningUser(useFastTrack);

    if (useFastTrack) {
      // Returning user fast-track (~0.65s)
      setStage('AWAKENING');
      const t1 = window.setTimeout(() => setStage('LOGO_READY'), 150);
      const t2 = window.setTimeout(() => setStage('ASURA_ACTIVE'), 320);
      const t3 = window.setTimeout(() => setStage('TRANSITIONING'), 500);
      const t4 = window.setTimeout(() => finishAnimation(), 680);
      timersRef.current.push(t1, t2, t3, t4);
      return;
    }

    // 3. Full Cinematic Experience (2.4s)
    // Scene 01: 0.00s – 0.25s: The First Signal
    setStage('INITIALIZING');

    // Scene 02: 0.25s – 0.65s: Intelligence Awakens
    const tAwaken = window.setTimeout(() => {
      setStage('AWAKENING');
    }, 250);

    // Scene 03: 0.65s – 1.05s: Energy Streams & Network Formation
    const tForm = window.setTimeout(() => {
      setStage('FORMING');
    }, 650);

    // Scene 04: 1.05s – 1.45s: CRETIVRA Logo Full Formation & sweep
    const tLogo = window.setTimeout(() => {
      setStage('LOGO_READY');
    }, 1050);

    // Scene 05: 1.45s – 1.75s: Asura Activation Pulse
    const tAsuraPulse = window.setTimeout(() => {
      setStage('ASURA_ACTIVE');
    }, 1450);

    // Scene 06: 1.75s – 2.05s: Asura Identity Reveal
    const tAsuraIdentity = window.setTimeout(() => {
      setStage('ASURA_REVEAL');
    }, 1750);

    // Scene 07: 2.05s – 2.40s: Core Expands into Application
    const tTransition = window.setTimeout(() => {
      setStage('TRANSITIONING');
    }, 2050);

    // Final State: 2.40s: Transition complete
    const tFinal = window.setTimeout(() => {
      finishAnimation();
    }, 2400);

    timersRef.current.push(
      tAwaken,
      tForm,
      tLogo,
      tAsuraPulse,
      tAsuraIdentity,
      tTransition,
      tFinal
    );
  }, [clearAllTimers, finishAnimation, forceReplay]);

  // Single-run on initial mount
  useEffect(() => {
    // If already dismissed via sessionStorage check, do nothing
    let alreadyDone = false;
    try {
      alreadyDone = !forceReplay && sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      alreadyDone = false;
    }

    if (alreadyDone) {
      setIsDismissed(true);
      return;
    }

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startSequence();
    }

    return () => clearAllTimers();
  }, []); // Run strictly ONCE on mount

  // Handle explicit manual forceReplay (e.g. user clicked "Replay Asura Awakening")
  useEffect(() => {
    if (forceReplay && !prevForceReplayRef.current) {
      prevForceReplayRef.current = true;
      hasStartedRef.current = true;
      isFinishedRef.current = false;
      startSequence();
    } else if (!forceReplay) {
      prevForceReplayRef.current = false;
    }
  }, [forceReplay, startSequence]);

  // Allow instant skip on click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finishAnimation();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finishAnimation]);

  if (isDismissed || stage === 'READY') {
    return null;
  }

  // Derive component states from stage
  const particleStage: ParticleStage =
    stage === 'INITIALIZING'
      ? 'signal'
      : stage === 'AWAKENING'
      ? 'awakening'
      : stage === 'FORMING'
      ? 'converging'
      : 'dormant';

  const showNetworkLines =
    stage === 'FORMING' || stage === 'LOGO_READY' || stage === 'ASURA_ACTIVE' || stage === 'ASURA_REVEAL';

  const showLogoCore =
    stage === 'LOGO_READY' || stage === 'ASURA_ACTIVE' || stage === 'ASURA_REVEAL' || stage === 'TRANSITIONING';

  const showBrandText =
    stage === 'LOGO_READY' || stage === 'ASURA_ACTIVE';

  const showActivationPulse =
    stage === 'ASURA_ACTIVE';

  const showIdentity =
    stage === 'ASURA_REVEAL' || stage === 'TRANSITIONING';

  const isTransitioning =
    stage === 'TRANSITIONING';

  return (
    <div
      onClick={finishAnimation}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden asura-opening-backdrop transition-all duration-400 ease-out cursor-pointer ${
        isTransitioning
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      aria-label="Asura AI Initialization"
    >
      {/* Ambient Radial Glowing Atmosphere */}
      <div
        className="absolute w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] rounded-full pointer-events-none filter blur-3xl opacity-50 bg-gradient-to-tr from-cyan-200/40 via-blue-100/30 to-violet-200/40 animate-pulse-soft"
        aria-hidden="true"
      />

      {/* Center Stage Presentation Container */}
      <div className="relative w-full max-w-xl mx-auto flex flex-col items-center justify-center p-6">
        {/* Particle Canvas Layer */}
        {!reducedMotion && (
          <EnergyParticles stage={particleStage} />
        )}

        {/* Central CRETIVRA Logo Core & Network Formation */}
        <LogoFormation
          showNetworkLines={showNetworkLines}
          showLogoCore={showLogoCore}
          showBrandText={showBrandText}
          pulseActive={showActivationPulse}
        />

        {/* Asura Activation Wave & Identity Reveal */}
        <AsuraReveal
          showActivationPulse={showActivationPulse}
          showIdentity={showIdentity}
          subtleWave={showActivationPulse}
        />
      </div>

      {/* Non-intrusive skip hint for power users */}
      <div className="absolute bottom-6 text-[11px] text-slate-400 font-medium tracking-wide opacity-50 hover:opacity-100 transition-opacity">
        {isReturningUser ? 'Press Esc or click to enter' : 'Press Esc to skip'}
      </div>
    </div>
  );
};
