import React from 'react';
import { CRETIVRA_NODES } from './EnergyParticles';

interface LogoFormationProps {
  showNetworkLines: boolean;
  showLogoCore: boolean;
  showBrandText: boolean;
  pulseActive?: boolean;
}

// Geodesic mesh connection pairs between the 11 nodes
const NETWORK_EDGES: [number, number][] = [
  // Outer circle left lobe
  [3, 1], [1, 0], [0, 2], [2, 4], [4, 5], [5, 3], [3, 2], [4, 1],
  // Outer circle right lobe
  [0, 6], [6, 8], [8, 10], [10, 9], [9, 7], [7, 0], [6, 9], [7, 8],
  // Center cross connections
  [1, 7], [2, 6],
];

export const LogoFormation: React.FC<LogoFormationProps> = ({
  showNetworkLines,
  showLogoCore,
  showBrandText,
  pulseActive = false,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Central Infinity Network Core Container */}
      <div
        className={`relative w-[280px] sm:w-[350px] aspect-[736/480] flex items-center justify-center transition-transform duration-500 ${
          pulseActive ? 'asura-animate-pulse-core' : ''
        }`}
      >
        {/* Luminous Geodesic Network Lines (Energy Streams) */}
        <svg
          viewBox="0 0 100 65.2"
          className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-400 ${
            showNetworkLines ? 'opacity-85' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
            </linearGradient>
            <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {NETWORK_EDGES.map(([startIdx, endIdx], idx) => {
            const start = CRETIVRA_NODES[startIdx];
            const end = CRETIVRA_NODES[endIdx];
            return (
              <line
                key={`edge-${idx}`}
                x1={start.x * 100}
                y1={start.y * 65.2}
                x2={end.x * 100}
                y2={end.y * 65.2}
                stroke="url(#edge-grad)"
                strokeWidth="0.55"
                filter="url(#line-glow)"
                strokeDasharray="100"
                strokeDashoffset={showNetworkLines ? '0' : '100'}
                className="transition-all duration-700 ease-out"
                style={{ transitionDelay: `${idx * 15}ms` }}
              />
            );
          })}
        </svg>

        {/* Authentic CRETIVRA Logo Image Core */}
        <div
          className={`relative w-full h-full transition-all duration-500 ease-out ${
            showLogoCore ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cretivra-core.png"
            alt="CRETIVRA Intelligence Core"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(6,182,212,0.25)]"
          />

          {/* Luminous Light Sweep Across Infinity Paths */}
          {showLogoCore && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="w-1/3 h-full asura-animate-sweep bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* 11 Node Ignition Glowing Overlay Dots */}
        {showLogoCore && (
          <div className="absolute inset-0 pointer-events-none">
            {CRETIVRA_NODES.map((node, i) => (
              <div
                key={`node-glow-${i}`}
                className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full animate-enter"
                style={{
                  left: `${node.x * 100}%`,
                  top: `${node.y * 100}%`,
                  animationDelay: `${i * 30}ms`,
                  background: `radial-gradient(circle, #ffffff 20%, ${node.color} 80%)`,
                  boxShadow: `0 0 10px 2px ${node.color}88`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* CRETIVRA Brand Name Typography (Scene 04) */}
      <div
        className={`mt-3 text-center transition-all duration-500 ease-out ${
          showBrandText ? 'opacity-100 translate-y-0 filter blur-none' : 'opacity-0 translate-y-2 filter blur-xs'
        }`}
      >
        <span
          className="text-2xl sm:text-3xl font-extrabold tracking-[0.22em] text-[#0f1a36] uppercase font-sans pl-[0.22em]"
          style={{ letterSpacing: '0.22em' }}
        >
          CRETIVRA
        </span>
      </div>
    </div>
  );
};
