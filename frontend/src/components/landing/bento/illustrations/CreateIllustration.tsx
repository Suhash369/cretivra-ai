import React from 'react';

export function CreateIllustration() {
  return (
    <div className="relative w-full h-full max-h-full max-w-[200px] flex items-center justify-center select-none pointer-events-none scale-90 sm:scale-100">
      {/* Background Soft Diagonal Paper Texture Lines */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--border) 0, var(--border) 1px, transparent 0, transparent 12px)',
        }}
      />

      <div className="relative w-28 h-20 sm:w-32 sm:h-24 flex items-center justify-center">
        {/* Sheet 1: Back Document Page (Rotates -12deg on hover) */}
        <div className="absolute w-20 h-24 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] shadow-xs p-2 flex flex-col gap-1 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] -rotate-6 -translate-x-2 group-hover:-rotate-12 group-hover:-translate-x-5 group-hover:-translate-y-1">
          <div className="w-6 h-1.5 rounded bg-amber-500/30 mb-0.5" />
          <div className="w-full h-0.5 rounded bg-[var(--muted-foreground)] opacity-40" />
          <div className="w-4/5 h-0.5 rounded bg-[var(--muted-foreground)] opacity-30" />
          <div className="w-full h-0.5 rounded bg-[var(--muted-foreground)] opacity-30" />
          <div className="w-3/4 h-0.5 rounded bg-[var(--muted-foreground)] opacity-25" />
          <div className="w-full h-0.5 rounded bg-[var(--muted-foreground)] opacity-25" />
        </div>

        {/* Sheet 2: Middle PDF Report Sheet (Slides up and straightens) */}
        <div className="absolute w-20 h-24 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-sm p-2 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] translate-y-0.5 rotate-1 group-hover:-translate-y-2 group-hover:rotate-0 group-hover:border-amber-500/50">
          <div className="flex items-center justify-between">
            <span className="px-1 py-0.2 rounded text-[6.5px] font-mono font-bold uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              PDF
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
          </div>
          <div className="space-y-0.5 my-auto">
            <div className="w-full h-0.5 rounded bg-[var(--muted-foreground)] opacity-50" />
            <div className="w-5/6 h-0.5 rounded bg-[var(--muted-foreground)] opacity-40" />
            <div className="w-full h-0.5 rounded bg-[var(--muted-foreground)] opacity-30" />
          </div>
          <div className="w-6 h-1 rounded bg-amber-500/40" />
        </div>

        {/* Sheet 3: Front Presentation Slide with Growing Bar Chart (Fans right +14deg) */}
        <div className="absolute w-24 h-18 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-md p-2 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] rotate-6 translate-x-3 translate-y-1.5 group-hover:rotate-12 group-hover:translate-x-6 group-hover:translate-y-0.5 group-hover:border-amber-500/60 group-hover:shadow-amber-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-bold tracking-tight text-amber-600 dark:text-amber-400">
              Slide Deck
            </span>
            <span className="text-[6.5px] text-[var(--muted-foreground)] font-mono">16:9</span>
          </div>

          {/* Dynamic Bar Chart with growing heights on hover */}
          <div className="flex items-end justify-between gap-1 h-6 pt-0.5 border-b border-[var(--border)]">
            <div className="w-2.5 rounded-t-sm bg-amber-500/40 transition-all duration-300 h-2.5 group-hover:h-4.5 group-hover:bg-amber-500" />
            <div className="w-2.5 rounded-t-sm bg-orange-500/40 transition-all duration-300 h-3.5 group-hover:h-5.5 group-hover:bg-orange-500" />
            <div className="w-2.5 rounded-t-sm bg-amber-500/40 transition-all duration-300 h-2 group-hover:h-3.5 group-hover:bg-amber-500" />
            <div className="w-2.5 rounded-t-sm bg-amber-600/50 transition-all duration-300 h-4.5 group-hover:h-6 group-hover:bg-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
