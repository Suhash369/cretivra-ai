import React from 'react';
import { FileText, Presentation, FileCode, Download, ExternalLink, Package, FileSpreadsheet, Eye } from 'lucide-react';
import { resolveArtifactDownloadUrl, type Artifact } from '../services/playgroundApi';

interface ArtifactPanelProps {
  artifacts: Artifact[];
  onSelectPreview?: (artifact: Artifact) => void;
  selectedArtifactId?: string;
}

export function ArtifactPanel({ artifacts, onSelectPreview, selectedArtifactId }: ArtifactPanelProps) {
  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'PPTX':
        return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'CSV':
      case 'XLSX':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'WEBSITE':
      case 'HTML':
      case 'SOURCE_CODE':
        return <FileCode className="w-4 h-4 text-cyan-400" />;
      default:
        return <Package className="w-4 h-4 text-violet-400" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-[#232d45] rounded-xl overflow-hidden shadow-xs">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-[#232d45] flex items-center justify-between bg-slate-50 dark:bg-[#151c2e]/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">Generated Artifacts</h3>
        <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{artifacts.length} Files</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {artifacts.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500">
            <Package className="w-8 h-8 stroke-[1.2] mb-1 opacity-40" />
            <p className="text-xs">No artifacts generated yet</p>
          </div>
        ) : (
          artifacts.map((art) => {
            const isSelected = selectedArtifactId === art.id;
            return (
              <div
                key={art.id}
                className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-400 dark:border-cyan-500/50 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-[#151c2e]/50 border-slate-200 dark:border-[#232d45]/70 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                    {getIcon(art.type)}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{art.name}</h5>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {art.type} &bull; {formatSize(art.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onSelectPreview?.(art)}
                    title="Preview Artifact"
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={resolveArtifactDownloadUrl(art.download_url)}
                    download={art.name}
                    title="Download File"
                    className="p-1.5 rounded bg-slate-100 hover:bg-cyan-600 hover:text-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
