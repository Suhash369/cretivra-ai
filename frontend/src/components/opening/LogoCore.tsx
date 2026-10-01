'use client';

import React from 'react';
import type { AwakeningStage } from './useOpeningTimeline';
import { CRETIVRA_NODES } from './EnergyParticles';

interface LogoCoreProps {
  stage: AwakeningStage;
}

export const LogoCore: React.FC<LogoCoreProps> = ({ stage }) => {
  const showNodes =
    stage === 'FORMATION' ||
    stage === 'STABILIZE' ||
    stage === 'CONSCIOUS' ||
    stage === 'IDENTITY' ||
    stage === 'TRANSITION';

  const showSurface =
    stage === 'FORMATION' ||
    stage === 'STABILIZE' ||
    stage === 'CONSCIOUS' ||
    stage === 'IDENTITY' ||
    stage === 'TRANSITION';

  // Fluid camera scale progression per stage (GPU-composited)
  const cameraScaleClass =
    stage === 'SIGNAL' || stage === 'FIELD' || stage === 'FLOW'
      ? 'scale-90 opacity-0'
      : stage === 'FORMATION'
      ? 'scale-[0.97] opacity-95'
      : stage === 'STABILIZE'
      ? 'scale-100 opacity-100'
      : stage === 'CONSCIOUS'
      ? 'scale-[1.02] opacity-100'
      : stage === 'IDENTITY'
      ? 'scale-100 opacity-100'
      : stage === 'TRANSITION'
      ? 'scale-[1.3] opacity-0'
      : 'scale-100 opacity-100';

  const isHeartbeat = stage === 'CONSCIOUS';

  return (
    <div
      className={`relative w-[280px] sm:w-[350px] aspect-[736/480] flex items-center justify-center select-none transition-all duration-700 ease-out will-change-transform ${cameraScaleClass} ${
        isHeartbeat ? 'asura-animate-heartbeat' : ''
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Authentic CRETIVRA Core Logo Image Surface with Caustic Radiant Glow */}
      <div
        className={`relative w-full h-full transition-all duration-700 ease-out will-change-transform ${
          showSurface
            ? 'opacity-100 filter drop-shadow-[0_4px_30px_rgba(6,182,212,0.45)] drop-shadow-[0_0_50px_rgba(139,92,246,0.35)]'
            : 'opacity-0 scale-90'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cretivra-core.png"
          alt="CRETIVRA Intelligence Core"
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />

        {/* Luminous Light Sweep Across Infinity Ribbon — MASKED to the logo pixels only (NO rectangular box!) */}
        {showSurface && (stage === 'FORMATION' || stage === 'CONSCIOUS' || stage === 'IDENTITY') && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
              WebkitMaskImage: 'url(/cretivra-core.png)',
              maskImage: 'url(/cretivra-core.png)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          >
            <div
              className="w-1/2 h-full asura-animate-sweep bg-gradient-to-r from-transparent via-white/80 to-transparent blur-xs pointer-events-none"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Layer 1 — The 11 Geometric Nodes with High-Intensity Photon Flares & Soft Stagger */}
      {showNodes && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {CRETIVRA_NODES.map((node, i) => {
            const isCenterNode = i === 0;
            return (
              <div
                key={`photon-node-${i}`}
                className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ease-out will-change-transform"
                style={{
                  left: `${node.x * 100}%`,
                  top: `${node.y * 100}%`,
                  background: `radial-gradient(circle, #ffffff 30%, ${node.color} 80%)`,
                  boxShadow: isCenterNode && isHeartbeat
                    ? `0 0 25px 8px #ffffff, 0 0 45px 16px ${node.color}, 0 0 70px 24px rgba(139, 92, 246, 0.8)`
                    : `0 0 12px 3px ${node.color}, 0 0 20px 6px rgba(6, 182, 212, 0.5)`,
                  transform: `scale(${isCenterNode && isHeartbeat ? 1.7 : 1})`,
                  opacity: showNodes ? 1 : 0,
                  transitionDelay: `${i * 25}ms`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
