import React, { useState } from 'react';
import { Maximize2, Minimize2, ExternalLink, RefreshCw, Monitor, Code, Eye, Download, FileText, Presentation, FileSpreadsheet } from 'lucide-react';
import { resolveArtifactDownloadUrl, type Artifact } from '../services/playgroundApi';
import { UIBuildingCanvas } from './UIBuildingCanvas';

interface PreviewPanelProps {
  artifact?: Artifact | null;
  htmlContent?: string | null;
  markdownContent?: string | null;
  isBuilding?: boolean;
  activePhase?: number;
  promptText?: string;
  onUpdateHtml?: (newHtml: string) => void;
}

export function PreviewPanel({
  artifact,
  htmlContent,
  markdownContent,
  isBuilding = false,
  activePhase,
  promptText,
  onUpdateHtml,
}: PreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // If HTML content or website artifact or building state
  const isHtml =
    isBuilding ||
    artifact?.type === 'WEBSITE' ||
    artifact?.name?.endsWith('.html') ||
    artifact?.name?.endsWith('.htm') ||
    Boolean(htmlContent);

  const isPdf = artifact?.type === 'PDF' || artifact?.name?.endsWith('.pdf');
  const isPptx = artifact?.type === 'PRESENTATION' || artifact?.type === 'PPTX' || artifact?.name?.endsWith('.pptx') || artifact?.name?.endsWith('.ppt');
  const isCsv = artifact?.type === 'DATA' || artifact?.type === 'CSV' || artifact?.name?.endsWith('.csv') || artifact?.name?.endsWith('.xlsx');

  // If it is an HTML/Web app or currently building, render the state-of-the-art UIBuildingCanvas
  if (isHtml || isBuilding) {
    return (
      <UIBuildingCanvas
        artifact={artifact}
        htmlContent={htmlContent}
        isBuilding={isBuilding}
        activePhase={activePhase}
        promptText={promptText || artifact?.name || 'Interactive Application'}
        onUpdateHtml={onUpdateHtml}
      />
    );
  }

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-[#232d45] rounded-xl overflow-hidden transition-all shadow-xs ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-white dark:bg-[#060911]' : ''
      }`}
    >
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-[#232d45] flex items-center justify-between bg-slate-50 dark:bg-[#151c2e]/50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Monitor className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
            {artifact ? artifact.name : 'Deliverable Preview'}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {artifact?.download_url && (
            <a
              href={resolveArtifactDownloadUrl(artifact.download_url)}
              target="_blank"
              rel="noopener noreferrer"
              download={artifact.name}
              title="Download or open in new tab"
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {isFullscreen ? (
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              title="Exit Fullscreen (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          ) : (
            <button
              onClick={() => setIsFullscreen(true)}
              title="Expand to Fullscreen"
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-slate-100 dark:bg-slate-950">
        {isPdf && artifact?.download_url ? (
          <div className="w-full h-full flex flex-col relative bg-slate-900">
            <iframe
              key={iframeKey}
              title={artifact.name}
              src={resolveArtifactDownloadUrl(artifact.download_url)}
              className="w-full flex-1 border-0 bg-white"
            />
            <div className="px-4 py-2 border-t border-slate-200 dark:border-[#232d45] flex items-center justify-between bg-slate-50 dark:bg-[#151c2e] shrink-0 text-xs">
              <span className="text-slate-600 dark:text-slate-400 truncate max-w-[220px]">{artifact.name}</span>
              <a
                href={resolveArtifactDownloadUrl(artifact.download_url)}
                download={artifact.name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF Report
              </a>
            </div>
          </div>
        ) : isPptx && artifact?.download_url ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 to-slate-950 text-white text-center">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4 shadow-xl shadow-amber-500/5">
              <Presentation className="w-12 h-12 text-amber-400" />
            </div>
            <h4 className="text-base font-bold text-slate-100 mb-1">{artifact.name}</h4>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              16:9 Widescreen Microsoft PowerPoint Presentation synthesized autonomously by Cretivra Multi-Agent Engine.
              Fully compatible with PowerPoint, Google Slides, and Apple Keynote.
            </p>
            <a
              href={resolveArtifactDownloadUrl(artifact.download_url)}
              download={artifact.name}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Presentation (.pptx)
            </a>
          </div>
        ) : isCsv && artifact?.download_url ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 to-slate-950 text-white text-center">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4 shadow-xl shadow-emerald-500/5">
              <FileSpreadsheet className="w-12 h-12 text-emerald-400" />
            </div>
            <h4 className="text-base font-bold text-slate-100 mb-1">{artifact.name}</h4>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              Structured dataset compiled deterministically with computed statistical metrics and source validation.
            </p>
            <a
              href={resolveArtifactDownloadUrl(artifact.download_url)}
              download={artifact.name}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Dataset (.csv)
            </a>
          </div>
        ) : markdownContent ? (
          <div className="p-6 overflow-y-auto h-full text-slate-700 dark:text-slate-300 text-xs leading-relaxed max-w-none font-sans">
            <div className="p-4 rounded-xl bg-white dark:bg-[#151c2e] border border-slate-200 dark:border-[#232d45] shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-cyan-400 font-semibold">
                <FileText className="w-4 h-4" />
                <span>Execution Summary</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{markdownContent}</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-600">
            <Monitor className="w-12 h-12 stroke-[1] mb-2 opacity-30" />
            <p className="text-xs">Select an artifact to preview or inspect deliverables.</p>
          </div>
        )}
      </div>
    </div>
  );
}
