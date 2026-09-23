'use client';

import React from 'react';
import type { AwakeningStage } from './useOpeningTimeline';
import { CRETIVRA_NODES } from './EnergyParticles';

interface EnergyTraceProps {
  stage: AwakeningStage;
  elapsedTime: number;
}

// 18 Geodesic connection edges between the 11 CRETIVRA nodes
const GEODESIC_EDGES: [number, number][] = [
  // Left lobe perimeter & diagonals
  [3, 1], [1, 0], [0, 2], [2, 4], [4, 5], [5, 3], [3, 2], [4, 1],
  // Right lobe perimeter & diagonals
  [0, 6], [6, 8], [8, 10], [10, 9], [9, 7], [7, 0], [6, 9], [7, 8],
  // Center crossover bridges
  [1, 7], [2, 6],
];

// Parametric SVG path tracing the exact infinity figure-eight: Left -> Center -> Right -> Center
// Normalized to viewBox 0 0 100 65.2
const INFINITY_PULSE_PATH =
  'M 50 32.6 C 35 15, 10 15, 10 32.6 C 10 50, 35 50, 50 32.6 C 65 15, 90 15, 90 32.6 C 90 50, 65 50, 50 32.6 Z';

export const EnergyTrace: React.FC<EnergyTraceProps> = ({ stage, elapsedTime }) => {
  const isForming =
    stage === 'FORMATION' ||
    stage === 'STABILIZE' ||
    stage === 'CONSCIOUS' ||
    stage === 'IDENTITY';

  // Energy pulse timing: triggers during formation around 2.30s – 2.85s
  const isPulseActive =
    stage === 'FORMATION' && elapsedTime >= 2.30 && elapsedTime <= 2.85;

  const pulseOffset =
    isPulseActive
      ? ((elapsedTime - 2.30) / 0.55) * 200 // travels smoothly along stroke
      : 200;

  return (
    <svg
      viewBox="0 0 100 65.2"
      className="absolute inset-0 w-full h-full pointer-events-none z-15"
      aria-hidden="true"
    >
      <defs>
        {/* Luminous line gradient */}
        <linearGradient id="trace-edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.85" />
        </linearGradient>

        {/* Traveling energy pulse gradient */}
        <linearGradient id="travel-pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>

        <filter id="trace-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Geodesic Mesh Lines */}
      {GEODESIC_EDGES.map(([startIdx, endIdx], idx) => {
        const start = CRETIVRA_NODES[startIdx];
        const end = CRETIVRA_NODES[endIdx];
        const showLine = isForming;

        return (
          <line
            key={`edge-${idx}`}
            x1={start.x * 100}
            y1={start.y * 65.2}
            x2={end.x * 100}
            y2={end.y * 65.2}
            stroke="url(#trace-edge-grad)"
            strokeWidth="0.55"
            filter="url(#trace-glow)"
            strokeDasharray="100"
            strokeDashoffset={showLine ? '0' : '100'}
            className="transition-all duration-700 ease-out"
            style={{
              transitionDelay: `${idx * 18}ms`,
              opacity: showLine ? 0.75 : 0,
            }}
          />
        );
      })}

      {/* Single Deliberate Energy Pulse Traveling the Infinity Path */}
      {isForming && (
        <path
          d={INFINITY_PULSE_PATH}
          fill="none"
          stroke="url(#travel-pulse-grad)"
          strokeWidth="1.2"
          filter="url(#trace-glow)"
          strokeDasharray="40 160"
          strokeDashoffset={-pulseOffset}
          className="pointer-events-none"
          style={{
            opacity: isPulseActive ? 0.95 : 0,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}
    </svg>
  );
};
