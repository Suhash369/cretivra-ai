'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DynamicApp = dynamic(() => import('../../App').then((mod) => mod.App), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-base)] text-cyan-600 dark:text-cyan-400 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      <span className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">Loading Asura AI Studio...</span>
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
