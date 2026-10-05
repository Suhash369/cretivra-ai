import React from 'react';
import { Eye, Sparkles } from 'lucide-react';

interface VisualLoadingProps {
  label?: string;
}

export const VisualLoading: React.FC<VisualLoadingProps> = ({
  label = 'Finding relevant visuals...',
}) => {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 my-2 rounded-xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-transparent border border-cyan-500/20 text-xs text-cyan-300 w-fit animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <span className="absolute w-4 h-4 rounded-full bg-cyan-400/20 animate-ping" />
        <Eye className="w-3.5 h-3.5 text-cyan-400 relative z-10 animate-pulse" />
      </div>
      <span className="font-medium tracking-wide">{label}</span>
      <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
    </div>
  );
};
