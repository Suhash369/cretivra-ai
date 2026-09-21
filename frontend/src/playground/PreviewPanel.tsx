import React, { useState } from 'react';
import { Maximize2, Minimize2, ExternalLink, RefreshCw, Monitor, Code, Eye, Download } from 'lucide-react';
import { resolveArtifactDownloadUrl, type Artifact } from '../services/playgroundApi';

interface PreviewPanelProps {
  artifact?: Artifact | null;
  htmlContent?: string | null;
  markdownContent?: string | null;
}

export function PreviewPanel({ artifact, htmlContent, markdownContent }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Exit fullscreen on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // If HTML content is provided (e.g. from file_writer on index.html)
  const isHtml = artifact?.type === 'WEBSITE' || artifact?.name?.endsWith('.html') || Boolean(htmlContent);
  const isPdf = artifact?.type === 'PDF' || artifact?.name?.endsWith('.pdf');

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
            {artifact ? artifact.name : 'Live Application & Deliverable Preview'}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isHtml && (
            <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 mr-1">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-1 text-[11px] font-medium rounded flex items-center gap-1 transition-colors cursor-pointer ${
                  activeTab === 'preview' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" /> Live
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-2 py-1 text-[11px] font-medium rounded flex items-center gap-1 transition-colors cursor-pointer ${
                  activeTab === 'code' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Code className="w-3 h-3" /> Code
              </button>
            </div>
          )}

          {isHtml && activeTab === 'preview' && (
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              title="Reload preview"
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

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

          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              title="Exit Fullscreen (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          )}

          {!isFullscreen && (
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
        {isHtml && activeTab === 'preview' && htmlContent ? (
          <iframe
            key={iframeKey}
            title="Application Preview"
            srcDoc={htmlContent}
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
            className="w-full h-full border-0 bg-white"
          />
        ) : isHtml && activeTab === 'code' && htmlContent ? (
          <pre className="p-4 text-xs font-mono text-cyan-300 overflow-auto h-full selection:bg-cyan-900/50 bg-slate-950">
            {htmlContent}
          </pre>
        ) : isHtml && !htmlContent ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Loading Application Preview...</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Fetching compiled code for {artifact?.name || 'deliverable'}</p>
            </div>
          </div>
        ) : isPdf && artifact?.download_url ? (
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
        ) : markdownContent ? (
          <div className="p-6 overflow-y-auto h-full text-slate-700 dark:text-slate-300 text-xs leading-relaxed max-w-none font-sans">
            <div className="p-4 rounded-xl bg-white dark:bg-[#151c2e] border border-slate-200 dark:border-[#232d45] shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-cyan-400 font-semibold">
                <Monitor className="w-4 h-4" />
                <span>Execution Summary</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{markdownContent}</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-600">
            <Monitor className="w-12 h-12 stroke-[1] mb-2 opacity-30" />
            <p className="text-xs">Select an artifact above to preview or inspect deliverables.</p>
          </div>
        )}
      </div>
    </div>
  );
}
