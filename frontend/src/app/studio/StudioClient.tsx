'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DynamicApp = dynamic(() => import('../../App').then((mod) => mod.App), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center asura-opening-backdrop select-none" />
  ),
});

export function StudioClient() {
  return (
    <div className="h-[100dvh] w-full max-h-[100dvh] overflow-hidden bg-[var(--bg-base)] text-[var(--text)]">
      <DynamicApp />
    </div>
  );
}
