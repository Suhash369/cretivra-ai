import React from 'react';
import { Eye, Sparkles } from 'lucide-react';

interface VisualLoadingProps {
  label?: string;
}

export const VisualLoading: React.FC<VisualLoadingProps> = ({
  label = 'Finding relevant visuals...',
}) => {
  return (
    <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-gray-800/80 bg-gray-950/40 my-3 animate-in fade-in duration-300">
      <div className="grid grid-cols-12 gap-1.5 h-[240px] sm:h-[280px] p-1.5">
        {/* Left Primary Skeleton Card */}
        <div className="col-span-7 h-full rounded-xl bg-gray-900/60 border border-gray-800/50 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-shimmer" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-300 shadow-sm relative z-10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">{label}</span>
          </div>
        </div>

        {/* Right Stacked Skeleton Cards */}
        <div className="col-span-5 h-full flex flex-col gap-1.5">
          <div className="flex-1 rounded-xl bg-gray-900/40 border border-gray-800/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
          </div>
          <div className="flex-1 rounded-xl bg-gray-900/40 border border-gray-800/40 relative overflow-hidden flex items-end justify-end p-2">
            <div className="w-7 h-5 rounded-md bg-gray-800/60" />
          </div>
        </div>
      </div>
    </div>
  );
};
