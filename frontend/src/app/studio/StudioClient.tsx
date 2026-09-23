'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DynamicApp = dynamic(() => import('../../App').then((mod) => mod.App), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center asura-opening-backdrop select-none">
      {/* Subtle First Signal Glow during dynamic bundle warm-up */}
      <div className="relative flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-cyan-400 asura-animate-signal" />
        <div className="absolute w-12 h-12 rounded-full border border-cyan-300/40 animate-ping" />
      </div>
    </div>
  ),
});

export function StudioClient() {
  return (
    <div className="h-[100dvh] w-full max-h-[100dvh] overflow-hidden bg-[var(--bg-base)] text-[var(--text)]">
      <DynamicApp />
    </div>
  );
}
