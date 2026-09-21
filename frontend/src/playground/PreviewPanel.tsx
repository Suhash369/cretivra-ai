import React, { useState } from 'react';
import { Maximize2, Minimize2, ExternalLink, RefreshCw, Monitor, Code, Eye } from 'lucide-react';
import type { Artifact } from '../services/playgroundApi';

interface PreviewPanelProps {
  artifact?: Artifact | null;
  htmlContent?: string | null;
  markdownContent?: string | null;
}

export function PreviewPanel({ artifact, htmlContent, markdownContent }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // If HTML content is provided (e.g. from file_writer on index.html)
  const isHtml = artifact?.type === 'WEBSITE' || artifact?.name?.endsWith('.html') || Boolean(htmlContent);

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-[#232d45] rounded-xl overflow-hidden transition-all shadow-xs ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-white dark:bg-[#060911]' : ''
      }`}
    >
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-[#232d45] flex items-center justify-between bg-slate-50 dark:bg-[#151c2e]/50">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {artifact ? artifact.name : 'Live Application & Artifact Preview'}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {isHtml && (
            <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 mr-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-1 text-[11px] font-medium rounded flex items-center gap-1 transition-colors ${
                  activeTab === 'preview' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" /> Live
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-2 py-1 text-[11px] font-medium rounded flex items-center gap-1 transition-colors ${
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
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
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
          <pre className="p-4 text-xs font-mono text-cyan-300 overflow-auto h-full selection:bg-cyan-900/50">
            {htmlContent}
          </pre>
        ) : artifact?.type === 'PDF' ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-3">
            <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Monitor className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">{artifact.name}</h4>
              <p className="text-xs text-slate-500 mt-1">Publication-grade vector PDF generated with ReportLab</p>
            </div>
            <a
              href={artifact.download_url}
              download
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors"
            >
              Download PDF Report
            </a>
          </div>
        ) : markdownContent ? (
          <div className="p-6 overflow-y-auto h-full text-slate-300 text-xs leading-relaxed prose prose-invert max-w-none">
            {markdownContent}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-600">
            <Monitor className="w-12 h-12 stroke-[1] mb-2 opacity-30" />
            <p className="text-xs">Live application preview or artifact inspector will render here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
