'use client';

import React from 'react';
import type { AwakeningStage } from './useOpeningTimeline';
import { CRETIVRA_NODES } from './EnergyParticles';

interface LogoCoreProps {
  stage: AwakeningStage;
  elapsedTime: number;
}

export const LogoCore: React.FC<LogoCoreProps> = ({ stage, elapsedTime }) => {
  const showNodes =
    stage === 'FORMATION' ||
    stage === 'STABILIZE' ||
    stage === 'CONSCIOUS' ||
    stage === 'IDENTITY' ||
    stage === 'TRANSITION';

  const showSurface =
    stage === 'FORMATION' ? elapsedTime > 2.35 :
    stage === 'STABILIZE' ||
    stage === 'CONSCIOUS' ||
    stage === 'IDENTITY' ||
    stage === 'TRANSITION';

  // Camera scale progression
  const cameraScale =
    stage === 'SIGNAL' || stage === 'FIELD' || stage === 'FLOW'
      ? 0.92
      : stage === 'FORMATION'
      ? 0.96 + Math.min(0.04, (elapsedTime - 2.20) * 0.06)
      : stage === 'TRANSITION'
      ? 2.65
      : 1.0;

  const isHeartbeat = stage === 'CONSCIOUS';

  return (
    <div
      className={`relative w-[280px] sm:w-[350px] aspect-[736/480] flex items-center justify-center transition-all duration-800 select-none ${
        isHeartbeat ? 'asura-animate-heartbeat' : ''
      }`}
      style={{
        transform: `scale(${cameraScale})`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Authentic CRETIVRA Core Logo Image Surface with Caustic Radiant Glow */}
      <div
        className={`relative w-full h-full transition-all duration-700 ease-out ${
          showSurface
            ? 'opacity-100 filter drop-shadow-[0_4px_30px_rgba(6,182,212,0.45)] drop-shadow-[0_0_50px_rgba(139,92,246,0.35)]'
            : 'opacity-0 scale-90'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cretivra-core.png"
          alt="CRETIVRA Intelligence Core"
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Luminous Light Sweep Across Infinity Ribbon */}
        {showSurface && (stage === 'FORMATION' || stage === 'CONSCIOUS') && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <div
              className="w-2/5 h-full asura-animate-sweep bg-gradient-to-r from-transparent via-white/60 to-transparent blur-xs"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Layer 1 — The 11 Geometric Nodes with High-Intensity Photon Flares */}
      {showNodes && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {CRETIVRA_NODES.map((node, i) => {
            const isCenterNode = i === 0;
            return (
              <div
                key={`photon-node-${i}`}
                className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-300"
                style={{
                  left: `${node.x * 100}%`,
                  top: `${node.y * 100}%`,
                  background: `radial-gradient(circle, #ffffff 30%, ${node.color} 80%)`,
                  boxShadow: isCenterNode && isHeartbeat
                    ? `0 0 25px 8px #ffffff, 0 0 45px 16px ${node.color}, 0 0 70px 24px rgba(139, 92, 246, 0.8)`
                    : `0 0 12px 3px ${node.color}, 0 0 20px 6px rgba(6, 182, 212, 0.5)`,
                  transform: `scale(${isCenterNode && isHeartbeat ? 1.8 : 1})`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
