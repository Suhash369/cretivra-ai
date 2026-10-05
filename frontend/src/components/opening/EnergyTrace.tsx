'use client';

import React from 'react';
import type { AwakeningStage } from './useOpeningTimeline';
import { CRETIVRA_NODES } from './EnergyParticles';

interface EnergyTraceProps {
  stage: AwakeningStage;
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
const INFINITY_PULSE_PATH =
  'M 50 32.6 C 35 15, 10 15, 10 32.6 C 10 50, 35 50, 50 32.6 C 65 15, 90 15, 90 32.6 C 90 50, 65 50, 50 32.6 Z';

export const EnergyTrace: React.FC<EnergyTraceProps> = ({ stage }) => {
  const isForming =
    stage === 'FORMATION' ||
    stage === 'STABILIZE' ||
    stage === 'CONSCIOUS' ||
    stage === 'IDENTITY';

  const isPulseActive = stage === 'FORMATION' || stage === 'CONSCIOUS';

  return (
    <svg
      viewBox="0 0 100 65.2"
      className="absolute inset-0 w-full h-full pointer-events-none z-15 transform-gpu"
      style={{ transform: 'translateZ(0)' }}
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
      </defs>

      {/* Geodesic Mesh Lines with Silky Dual-Pass Vector Technique (Zero CPU Filter Blur) */}
      {GEODESIC_EDGES.map(([startIdx, endIdx], idx) => {
        const start = CRETIVRA_NODES[startIdx];
        const end = CRETIVRA_NODES[endIdx];

        return (
          <g key={`edge-group-${idx}`}>
            {/* Outer soft aura vector */}
            <line
              x1={start.x * 100}
              y1={start.y * 65.2}
              x2={end.x * 100}
              y2={end.y * 65.2}
              stroke="url(#trace-edge-grad)"
              strokeWidth="1.4"
              strokeOpacity="0.25"
              strokeDasharray="100"
              strokeDashoffset={isForming ? '0' : '100'}
              className="transition-all duration-700 ease-out will-change-transform"
              style={{
                transitionDelay: `${idx * 14}ms`,
                opacity: isForming ? 0.75 : 0,
              }}
            />
            {/* Inner high-intensity filament vector */}
            <line
              x1={start.x * 100}
              y1={start.y * 65.2}
              x2={end.x * 100}
              y2={end.y * 65.2}
              stroke="url(#trace-edge-grad)"
              strokeWidth="0.55"
              strokeDasharray="100"
              strokeDashoffset={isForming ? '0' : '100'}
              className="transition-all duration-700 ease-out will-change-transform"
              style={{
                transitionDelay: `${idx * 14}ms`,
                opacity: isForming ? 0.95 : 0,
              }}
            />
          </g>
        );
      })}

      {/* Silky Energy Pulse Traveling the Infinity Path */}
      {isForming && (
        <g>
          {/* Base pulse radiance */}
          <path
            d={INFINITY_PULSE_PATH}
            fill="none"
            stroke="url(#travel-pulse-grad)"
            strokeWidth="2.2"
            strokeOpacity="0.35"
            strokeDasharray="45 155"
            className={`pointer-events-none transition-opacity duration-500 will-change-transform ${
              isPulseActive ? 'opacity-90 asura-animate-infinity-pulse' : 'opacity-0'
            }`}
          />
          {/* Hot core traveling pulse */}
          <path
            d={INFINITY_PULSE_PATH}
            fill="none"
            stroke="url(#travel-pulse-grad)"
            strokeWidth="1.1"
            strokeOpacity="1.0"
            strokeDasharray="45 155"
            className={`pointer-events-none transition-opacity duration-500 will-change-transform ${
              isPulseActive ? 'opacity-100 asura-animate-infinity-pulse' : 'opacity-0'
            }`}
          />
        </g>
      )}
    </svg>
  );
};
