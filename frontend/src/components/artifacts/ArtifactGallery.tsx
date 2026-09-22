import React, { useState } from 'react';
import {
  FileText,
  Presentation,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Globe,
  Download,
  ExternalLink,
  Eye,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import type { Artifact } from '../../services/playgroundApi';
import { resolveArtifactDownloadUrl } from '../../services/playgroundApi';

interface ArtifactGalleryProps {
  artifacts: Artifact[];
  selectedArtifact?: Artifact | null;
  onSelectArtifact?: (art: Artifact) => void;
  onPreviewArtifact?: (art: Artifact) => void;
}

export function ArtifactGallery({
  artifacts,
  selectedArtifact,
  onSelectArtifact,
  onPreviewArtifact,
}: ArtifactGalleryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (artifacts.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-[#8891A8] italic">
        No deliverables generated yet. Deliverables will appear here as Asura completes each milestone.
      </div>
    );
  }

  const handleCopyLink = (art: Artifact) => {
    const url = resolveArtifactDownloadUrl(art.download_url);
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedId(art.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getArtifactIcon = (type: string, name: string) => {
    const upper = (type || '').toUpperCase();
    if (upper === 'PDF' || name.endsWith('.pdf')) {
      return <FileText size={18} className="text-[#F43F5E]" />;
    }
    if (upper === 'PPTX' || name.endsWith('.pptx')) {
      return <Presentation size={18} className="text-[#F59E0B]" />;
    }
    if (upper === 'CSV' || upper === 'XLSX' || name.endsWith('.csv') || name.endsWith('.xlsx')) {
      return <FileSpreadsheet size={18} className="text-[#10B981]" />;
    }
    if (upper === 'IMAGE' || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.webp')) {
      return <ImageIcon size={18} className="text-[#8B5CF6]" />;
    }
    if (upper === 'WEBSITE' || name.endsWith('.html') || name.endsWith('.htm')) {
      return <Globe size={18} className="text-[#06B6D4]" />;
    }
    return <FileCode size={18} className="text-[#3B82F6]" />;
  };

  return (
    <div className="flex flex-col h-full bg-[#0D121F] border-l border-[#232D45] w-[280px] select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[#232D45]/60 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-[#8891A8] uppercase tracking-wider">
            Deliverables & Artifacts
          </div>
          <div className="text-xs text-[#E7EAF4] font-medium mt-0.5">
            {artifacts.length} file{artifacts.length > 1 ? 's' : ''} available
          </div>
        </div>
      </div>

      {/* Artifact Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-[#232D45]">
        {artifacts.map((art) => {
          const isSelected = selectedArtifact?.id === art.id;
          const downloadUrl = resolveArtifactDownloadUrl(art.download_url);
          const isCopied = copiedId === art.id;

          return (
            <div
              key={art.id}
              onClick={() => onSelectArtifact && onSelectArtifact(art)}
              className={`p-3 rounded-xl border transition-all cursor-pointer group animate-panel ${
                isSelected
                  ? 'bg-[#151C2E] border-[#06B6D4]/50 shadow-md'
                  : 'bg-[#151C2E]/50 border-[#232D45] hover:border-[#232D45]/90 hover:bg-[#151C2E]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#060911] border border-[#232D45] flex items-center justify-center shrink-0">
                  {getArtifactIcon(art.type, art.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#E7EAF4] truncate group-hover:text-[#06B6D4] transition-colors">
                    {art.name}
                  </div>
                  <div className="text-[11px] text-[#8891A8] mt-0.5 flex items-center gap-1.5">
                    <span className="uppercase text-[10px] font-mono px-1 py-0.2 bg-[#060911] rounded border border-[#232D45]">
                      {art.type || 'FILE'}
                    </span>
                    {art.size > 0 && <span>{(art.size / 1024).toFixed(1)} KB</span>}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-2.5 pt-2 border-t border-[#232D45]/50 flex items-center justify-end gap-1">
                {onPreviewArtifact && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewArtifact(art);
                    }}
                    className="p-1.5 rounded-md text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#060911]/60 transition-colors"
                    title="Preview Artifact"
                  >
                    <Eye size={13} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLink(art);
                  }}
                  className="p-1.5 rounded-md text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#060911]/60 transition-colors"
                  title="Copy link"
                >
                  {isCopied ? <Check size={13} className="text-[#10B981]" /> : <Share2 size={13} />}
                </button>
                <a
                  href={downloadUrl}
                  download={art.name}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-md text-[#06B6D4] hover:text-[#06B6D4]/80 hover:bg-[#06B6D4]/10 transition-colors"
                  title="Download File"
                >
                  <Download size={13} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
