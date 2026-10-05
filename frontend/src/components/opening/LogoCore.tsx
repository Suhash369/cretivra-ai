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

  // Fluid camera scale progression per stage (GPU-composited via translate3d/scale3d)
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
      className={`relative w-[280px] sm:w-[350px] aspect-[736/480] flex items-center justify-center select-none transition-all duration-700 ease-out transform-gpu will-change-transform ${cameraScaleClass} ${
        isHeartbeat ? 'asura-animate-heartbeat' : ''
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transform: 'translateZ(0)',
      }}
    >
      {/* 1. Ambient Caustic Glow Layer (GPU Hardware Composited - No CPU filter re-rasterization!) */}
      <div
        className={`absolute inset-0 -m-3 pointer-events-none transition-all duration-700 ease-out rounded-full blur-2xl transform-gpu ${
          showSurface ? 'opacity-85 scale-105' : 'opacity-0 scale-75'
        }`}
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.45) 0%, rgba(59, 130, 246, 0.3) 45%, rgba(139, 92, 246, 0.22) 70%, transparent 100%)',
          transform: 'translateZ(0)',
          willChange: 'opacity, transform',
        }}
        aria-hidden="true"
      />

      {/* 2. Authentic CRETIVRA Core Logo Image Surface */}
      <div
        className={`relative w-full h-full transition-all duration-700 ease-out transform-gpu will-change-transform ${
          showSurface ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ transform: 'translateZ(0)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cretivra-core.png"
          alt="CRETIVRA Intelligence Core"
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />

        {/* 3. Luminous Light Sweep Across Infinity Ribbon — MASKED to the logo pixels only (Isolated GPU Layer) */}
        {showSurface && (stage === 'FORMATION' || stage === 'CONSCIOUS' || stage === 'IDENTITY') && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu"
            style={{
              WebkitMaskImage: 'url(/cretivra-core.png)',
              maskImage: 'url(/cretivra-core.png)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              transform: 'translateZ(0)',
            }}
          >
            <div
              className="w-1/2 h-full asura-animate-sweep bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none transform-gpu"
              style={{ transform: 'translateZ(0)' }}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* 4. Layer 1 — The 11 Geometric Nodes with High-Intensity Photon Flares & Soft Stagger */}
      {showNodes && (
        <div className="absolute inset-0 pointer-events-none z-20 transform-gpu" style={{ transform: 'translateZ(0)' }}>
          {CRETIVRA_NODES.map((node, i) => {
            const isCenterNode = i === 0;
            return (
              <div
                key={`photon-node-${i}`}
                className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-500 ease-out transform-gpu will-change-transform"
                style={{
                  left: `${node.x * 100}%`,
                  top: `${node.y * 100}%`,
                  background: `radial-gradient(circle, #ffffff 35%, ${node.color} 80%)`,
                  boxShadow: `0 0 12px 3px ${node.color}`,
                  transform: `translate3d(0, 0, 0) scale(${isCenterNode && isHeartbeat ? 1.6 : 1})`,
                  opacity: showNodes ? 1 : 0,
                  transitionDelay: `${i * 18}ms`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
