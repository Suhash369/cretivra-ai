'use client';

import React from 'react';
import type { AwakeningStage } from './useOpeningTimeline';
import { CRETIVRA_NODES } from './EnergyParticles';

interface LogoCoreProps {
  stage: AwakeningStage;
  elapsedTime: number;
}

export const LogoCore: React.FC<LogoCoreProps> = ({ stage, elapsedTime }) => {
  // Layer visibility checks
  const showNodes =
    stage === 'FORMATION' ||
    stage === 'STABILIZE' ||
    stage === 'CONSCIOUS' ||
    stage === 'IDENTITY' ||
    stage === 'TRANSITION';

  const showSurface =
    stage === 'FORMATION' ? elapsedTime > 1.20 :
    stage === 'STABILIZE' ||
    stage === 'CONSCIOUS' ||
    stage === 'IDENTITY' ||
    stage === 'TRANSITION';

  // Camera scale progression (Section 23)
  // Formation: 0.92 -> 1.0, Conscious: 1.025, Transition: 1.8+
  const cameraScale =
    stage === 'SIGNAL' || stage === 'FIELD' || stage === 'FLOW'
      ? 0.92
      : stage === 'FORMATION'
      ? 0.96 + Math.min(0.04, (elapsedTime - 1.05) * 0.1)
      : stage === 'CONSCIOUS'
      ? 1.025
      : stage === 'TRANSITION'
      ? 1.85
      : 1.0;

  const isConsciousPulse = stage === 'CONSCIOUS';

  return (
    <div
      className="relative w-[280px] sm:w-[350px] aspect-[736/480] flex items-center justify-center transition-all duration-500 ease-out select-none"
      style={{
        transform: `scale(${cameraScale})`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Authentic CRETIVRA Core Logo Image Surface (Layer 3) */}
      <div
        className={`relative w-full h-full transition-all duration-600 ease-out ${
          showSurface
            ? 'opacity-100 filter drop-shadow-[0_4px_22px_rgba(6,182,212,0.3)]'
            : 'opacity-0 scale-95'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cretivra-core.png"
          alt="CRETIVRA Intelligence Core"
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Luminous Light Sweep Traveling Across Path */}
        {showSurface && stage === 'FORMATION' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="w-1/3 h-full asura-animate-sweep bg-gradient-to-r from-transparent via-white/45 to-transparent blur-xs"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Layer 1 — The 11 Geometric Nodes with Staggered Activation Bloom */}
      {showNodes && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {CRETIVRA_NODES.map((node, i) => {
            const isCenterNode = i === 0;
            return (
              <div
                key={`core-node-${i}`}
                className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-300"
                style={{
                  left: `${node.x * 100}%`,
                  top: `${node.y * 100}%`,
                  background: `radial-gradient(circle, #ffffff 25%, ${node.color} 80%)`,
                  boxShadow: isCenterNode && isConsciousPulse
                    ? `0 0 20px 6px ${node.color}, 0 0 35px 12px rgba(139, 92, 246, 0.6)`
                    : `0 0 10px 2px ${node.color}99`,
                  transform: `scale(${isCenterNode && isConsciousPulse ? 1.5 : 1})`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
