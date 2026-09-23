import React from 'react';

interface AsuraRevealProps {
  showActivationPulse: boolean;
  showIdentity: boolean;
  subtleWave: boolean;
}

export const AsuraReveal: React.FC<AsuraRevealProps> = ({
  showActivationPulse,
  showIdentity,
  subtleWave,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center select-none pointer-events-none">
      {/* Concentric Circular Shockwave / Energy Ripple (Scene 05) */}
      {subtleWave && (
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border border-cyan-400 asura-animate-ripple pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Asura Identity Typography Reveal (Scene 06) */}
      <div
        className={`mt-4 flex flex-col items-center text-center transition-all duration-400 ease-out ${
          showIdentity
            ? 'opacity-100 translate-y-0 filter blur-none'
            : 'opacity-0 translate-y-2 filter blur-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1128] font-sans">
            ASURA
          </span>
          <span className="px-2 py-0.5 text-xs sm:text-sm font-bold tracking-widest uppercase rounded-md bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-xs">
            AI
          </span>
        </div>

        <p className="mt-1 text-xs tracking-wider text-slate-500 font-medium uppercase font-sans">
          Frontier Autonomous Intelligence
        </p>
      </div>
    </div>
  );
};
