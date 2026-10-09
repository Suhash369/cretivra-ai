import React, { useState, useEffect } from 'react';

export function GameIllustration() {
  const [score, setScore] = useState(1480);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const interval = setInterval(() => {
      setScore((prev) => (prev > 9999 ? 1480 : prev + 40));
    }, 180);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-44 sm:h-52 flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Dark-tinted Cyber Pixel Grid Background with Twinkling Stars */}
      <div
        className="absolute inset-0 opacity-30 rounded-2xl pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.3) 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Twinkling Pixel Stars */}
      <div className="absolute top-4 left-6 w-1.5 h-1.5 bg-violet-400 rounded-xs animate-bento-twinkle" />
      <div className="absolute top-10 right-8 w-2 h-2 bg-fuchsia-400 rounded-xs animate-bento-twinkle [animation-delay:1.2s]" />
      <div className="absolute bottom-6 left-10 w-1.5 h-1.5 bg-cyan-400 rounded-xs animate-bento-twinkle [animation-delay:2.1s]" />
      <div className="absolute top-20 left-4 w-1 h-1 bg-amber-400 rounded-xs animate-bento-twinkle [animation-delay:0.7s]" />

      {/* Floating Retro Score HUD Badge */}
      <div className="absolute top-2 px-2.5 py-1 rounded-md bg-black/60 border border-violet-500/40 backdrop-blur-xs flex items-center gap-2 shadow-md transition-transform duration-200 group-hover:scale-105 z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-mono text-[10px] font-bold text-violet-300 tracking-wider">
          SCORE: {score.toString().padStart(5, '0')}
        </span>
      </div>

      {/* Main Game Stage Artwork */}
      <div className="relative w-48 h-32 flex items-center justify-center mt-3 transition-transform duration-300 group-hover:scale-105">
        {/* Floating Pixel Coins */}
        <div className="absolute -top-1 left-8 w-4 h-4 rounded-full bg-amber-400 border border-amber-200 flex items-center justify-center animate-bento-coin shadow-[0_0_8px_#f59e0b] z-10">
          <span className="text-[8px] font-bold text-amber-950 font-mono">$</span>
        </div>
        <div className="absolute top-2 right-10 w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-200 flex items-center justify-center animate-bento-coin [animation-delay:1s] shadow-[0_0_6px_#f59e0b] z-10">
          <span className="text-[7px] font-bold text-amber-950 font-mono">$</span>
        </div>

        {/* 8-bit Pixel Hero Sprite */}
        <div className="absolute bottom-11 z-20 animate-bento-bob flex flex-col items-center">
          {/* Pixel Knight/Hero in SVG */}
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Head / Helmet */}
            <rect x="5" y="1" width="6" height="5" fill="#8b5cf6" />
            <rect x="6" y="2" width="4" height="2" fill="#c4b5fd" />
            {/* Eyes */}
            <rect x="6" y="3" width="1" height="1" fill="#070a12" />
            <rect x="9" y="3" width="1" height="1" fill="#070a12" />
            {/* Torso */}
            <rect x="4" y="6" width="8" height="5" fill="#7c3aed" />
            <rect x="7" y="7" width="2" height="3" fill="#06b6d4" />
            {/* Sword */}
            <rect x="13" y="4" width="1" height="7" fill="#f8fafc" />
            <rect x="12" y="9" width="3" height="1" fill="#f59e0b" />
            {/* Shield */}
            <rect x="2" y="7" width="2" height="4" fill="#ec4899" />
            {/* Legs */}
            <rect x="5" y="11" width="2" height="3" fill="#581c87" />
            <rect x="9" y="11" width="2" height="3" fill="#581c87" />
          </svg>
        </div>

        {/* Floating Cyber Ground / Platform */}
        <div className="absolute bottom-6 w-36 h-5 rounded-md bg-violet-950/80 border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center justify-center overflow-hidden">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
        </div>

        {/* Retro Gamepad Body Frame at Bottom */}
        <div className="absolute -bottom-2 w-44 h-8 rounded-t-xl bg-neutral-900/90 border-t border-x border-violet-500/40 flex items-center justify-between px-4 z-10 shadow-lg">
          {/* D-Pad cross */}
          <div className="w-4 h-4 relative flex items-center justify-center">
            <div className="absolute w-4 h-1.5 bg-neutral-700 rounded-xs" />
            <div className="absolute w-1.5 h-4 bg-neutral-700 rounded-xs" />
          </div>

          {/* Action Buttons A & B */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_4px_#f43f5e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#06b6d4]" />
          </div>
        </div>
      </div>
    </div>
  );
}
