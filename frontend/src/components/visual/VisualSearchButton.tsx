import React, { useState } from 'react';
import { RefreshCw, Eye, EyeOff, Sparkles } from 'lucide-react';

interface VisualSearchButtonProps {
  onRefreshVisuals?: () => void;
  onToggleVisibility?: (visible: boolean) => void;
  isVisible?: boolean;
  isRefreshing?: boolean;
}

export const VisualSearchButton: React.FC<VisualSearchButtonProps> = ({
  onRefreshVisuals,
  onToggleVisibility,
  isVisible = true,
  isRefreshing = false,
}) => {
  return (
    <div className="flex items-center gap-1.5 pt-1.5 text-xs">
      {onRefreshVisuals && (
        <button
          onClick={onRefreshVisuals}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/70 hover:bg-gray-700/80 text-gray-300 hover:text-white border border-gray-700/50 transition-colors text-[11px] disabled:opacity-50"
          title="Search again with refined visual queries"
        >
          <RefreshCw className={`w-3 h-3 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refining visuals...' : 'Find better images'}</span>
        </button>
      )}

      {onToggleVisibility && (
        <button
          onClick={() => onToggleVisibility(!isVisible)}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors text-[11px]"
          title={isVisible ? 'Hide images from this response' : 'Show images for this response'}
        >
          {isVisible ? (
            <>
              <EyeOff className="w-3 h-3" />
              <span>Hide visuals</span>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Show visuals</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
