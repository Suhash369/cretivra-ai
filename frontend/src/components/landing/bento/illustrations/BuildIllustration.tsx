import React from 'react';

export function BuildIllustration() {
  return (
    <div className="relative w-28 h-20 sm:w-34 sm:h-24 md:w-40 md:h-26 shrink-0 overflow-hidden select-none pointer-events-none">
      {/* Background blueprint grid snippet */}
      <div className="absolute inset-0 cv-blueprint-grid opacity-30 rounded-xl" />

      {/* Mini Browser Window Wireframe */}
      <svg
        viewBox="0 0 176 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.03]"
      >
        {/* Outer browser frame */}
        <rect
          x="3"
          y="3"
          width="170"
          height="114"
          rx="10"
          className="fill-[var(--surface-secondary)] stroke-[var(--border)] transition-colors duration-200 group-hover:stroke-cyan-500/50"
          strokeWidth="1.5"
        />

        {/* Browser Top Navigation Bar */}
        <line
          x1="3"
          y1="22"
          x2="173"
          y2="22"
          className="stroke-[var(--border)] transition-colors duration-200 group-hover:stroke-cyan-500/30"
          strokeWidth="1"
        />

        {/* 3 Window Control Traffic Lights */}
        <circle cx="12" cy="12" r="2.5" fill="#f43f5e" opacity="0.85" />
        <circle cx="20" cy="12" r="2.5" fill="#f59e0b" opacity="0.85" />
        <circle cx="28" cy="12" r="2.5" fill="#10b981" opacity="0.85" />

        {/* Mini URL Address Pill */}
        <rect
          x="42"
          y="7"
          width="82"
          height="10"
          rx="4"
          className="fill-[var(--surface)] stroke-[var(--border)]"
          strokeWidth="1"
        />
        <line x1="48" y1="12" x2="68" y2="12" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

        {/* Sidebar wireframe lines */}
        <rect
          x="8"
          y="28"
          width="28"
          height="82"
          rx="5"
          className="fill-[var(--surface)]/50 stroke-[var(--border)] group-hover:stroke-cyan-500/30 transition-colors"
          strokeWidth="1"
        />
        <line x1="13" y1="36" x2="28" y2="36" className="stroke-[var(--muted-foreground)]" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="13" y1="44" x2="25" y2="44" className="stroke-[var(--muted-foreground)]" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="13" y1="52" x2="29" y2="52" className="stroke-[var(--muted-foreground)]" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="13" y1="60" x2="24" y2="60" className="stroke-[var(--muted-foreground)]" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

        {/* Main Content: Hero Banner Block */}
        <rect
          x="42"
          y="28"
          width="126"
          height="32"
          rx="6"
          className="fill-[var(--surface)] stroke-[var(--border)] transition-all duration-300 group-hover:fill-cyan-500/10 group-hover:stroke-cyan-500/50"
          strokeWidth="1"
        />
        {/* Animated Wireframe Title & Subtitle */}
        <line
          x1="50"
          y1="38"
          x2="95"
          y2="38"
          stroke="#06b6d4"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-bento-wireframe"
        />
        <line
          x1="50"
          y1="46"
          x2="120"
          y2="46"
          className="stroke-[var(--muted-foreground)]"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* CTA Button Wireframe */}
        <rect
          x="132"
          y="35"
          width="28"
          height="14"
          rx="4"
          className="fill-cyan-500/20 stroke-cyan-500 transition-all duration-200 group-hover:fill-cyan-500 group-hover:stroke-cyan-400"
          strokeWidth="1"
        />

        {/* 2 Bottom Content Cards */}
        <rect
          x="42"
          y="66"
          width="59"
          height="44"
          rx="6"
          className="fill-[var(--surface)] stroke-[var(--border)] transition-all duration-300 group-hover:fill-cyan-500/5 group-hover:stroke-cyan-500/40"
          strokeWidth="1"
        />
        <line x1="50" y1="76" x2="78" y2="76" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="50" y1="84" x2="88" y2="84" className="stroke-[var(--muted-foreground)]" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="50" y1="92" x2="70" y2="92" className="stroke-[var(--muted-foreground)]" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

        <rect
          x="109"
          y="66"
          width="59"
          height="44"
          rx="6"
          className="fill-[var(--surface)] stroke-[var(--border)] transition-all duration-300 group-hover:fill-cyan-500/5 group-hover:stroke-cyan-500/40"
          strokeWidth="1"
        />
        <line x1="117" y1="76" x2="145" y2="76" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="117" y1="84" x2="155" y2="84" className="stroke-[var(--muted-foreground)]" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="117" y1="92" x2="137" y2="92" className="stroke-[var(--muted-foreground)]" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </svg>

      {/* Photonic Cyan Laser Scanning Sweep Beam across wireframe */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] animate-stitch-laser pointer-events-none opacity-80" />
    </div>
  );
}
