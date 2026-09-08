'use client';

import React from 'react';
import { App } from '../../App';

export function StudioClient() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text)]">
      <App />
    </div>
  );
}
