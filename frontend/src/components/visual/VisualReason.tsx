import React, { useState } from 'react';
import { HelpCircle, X, Sparkles } from 'lucide-react';

interface VisualReasonProps {
  reason: string;
  entity?: string;
}

export const VisualReason: React.FC<VisualReasonProps> = ({ reason, entity }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!reason) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-cyan-400 transition-colors focus:outline-none"
        title="Why was this image selected?"
        aria-label="Why this image?"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Why this image?</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop click dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover Bubble */}
          <div className="absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 z-50 w-72 p-3 rounded-xl bg-gray-900/95 border border-cyan-500/30 shadow-2xl backdrop-blur-md text-xs text-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-800">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Visual Intelligence Rationale</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="mt-2 text-gray-300 leading-relaxed text-[11.5px]">
              {reason}
            </p>

            {entity && (
              <div className="mt-2 pt-2 border-t border-gray-800/80 text-[10px] text-gray-400 flex items-center justify-between">
                <span>Matched Entity:</span>
                <span className="font-medium text-cyan-300">{entity}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
