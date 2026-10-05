import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface VisualSourceProps {
  sourceName: string;
  sourceUrl: string;
  license?: string;
  artist?: string;
}

export const VisualSource: React.FC<VisualSourceProps> = ({
  sourceName,
  sourceUrl,
  license,
  artist,
}) => {
  if (!sourceName && !sourceUrl) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
      <div className="flex items-center gap-1 font-medium text-slate-300">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="truncate max-w-[180px]">{sourceName || 'Verified Source'}</span>
      </div>

      {license && (
        <span className="px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-400 border border-gray-700/50 text-[10px]">
          {license}
        </span>
      )}

      {artist && artist !== 'Verified Source' && artist !== 'Wikimedia Contributor' && (
        <span className="text-gray-400 text-[10px] hidden sm:inline truncate max-w-[140px]">
          by {artist}
        </span>
      )}

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline transition-colors ml-auto text-[11px]"
          title="Visit original source webpage"
        >
          <span>View source</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      )}
    </div>
  );
};
