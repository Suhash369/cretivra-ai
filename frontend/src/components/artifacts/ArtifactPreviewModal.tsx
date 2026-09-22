import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Globe,
  FileCode,
  FileText,
  Presentation,
  Maximize2,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { resolveArtifactDownloadUrl, getArtifactContentApi, type Artifact } from '../../services/playgroundApi';

interface ArtifactPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: Artifact | null;
}

export const ArtifactPreviewModal: React.FC<ArtifactPreviewModalProps> = ({
  isOpen,
  onClose,
  artifact,
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!artifact || !isOpen) return;

    const isTextual =
      artifact.type === 'WEBSITE' ||
      artifact.type === 'CODE' ||
      artifact.name.endsWith('.html') ||
      artifact.name.endsWith('.htm') ||
      artifact.name.endsWith('.json') ||
      artifact.name.endsWith('.py') ||
      artifact.name.endsWith('.ts') ||
      artifact.name.endsWith('.tsx') ||
      artifact.name.endsWith('.js') ||
      artifact.name.endsWith('.css') ||
      artifact.name.endsWith('.md') ||
      artifact.name.endsWith('.txt');

    if (isTextual) {
      setLoading(true);
      getArtifactContentApi(artifact.download_url || artifact.id)
        .then((res: any) => {
          setContent(typeof res === 'string' ? res : (res.content || ''));
        })
        .catch(() => {
          setContent('Unable to load inline preview.');
        })
        .finally(() => setLoading(false));
    } else {
      setContent('');
      setLoading(false);
    }
  }, [artifact, isOpen]);

  if (!isOpen || !artifact) return null;

  const downloadUrl = resolveArtifactDownloadUrl(artifact.download_url);
  const isHtml =
    artifact.type === 'WEBSITE' ||
    artifact.name.endsWith('.html') ||
    artifact.name.endsWith('.htm');

  const handleCopy = () => {
    if (content) {
      navigator.clipboard?.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
      <div className="w-full max-w-5xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-scale">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-secondary)]/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              {isHtml ? <Globe size={18} /> : <FileCode size={18} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--foreground)] truncate max-w-md">
                {artifact.name}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                <span className="font-mono uppercase">{artifact.type}</span>
                {artifact.size > 0 && (
                  <span>• {(artifact.size / 1024).toFixed(1)} KB</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewport toggles for HTML preview */}
            {isHtml && (
              <div className="hidden sm:flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] p-1 rounded-lg">
                <button
                  onClick={() => setViewport('desktop')}
                  className={`p-1 rounded ${viewport === 'desktop' ? 'bg-cyan-500/20 text-cyan-500 font-bold' : 'text-[var(--muted-foreground)]'}`}
                  title="Desktop View (100%)"
                >
                  <Monitor size={14} />
                </button>
                <button
                  onClick={() => setViewport('tablet')}
                  className={`p-1 rounded ${viewport === 'tablet' ? 'bg-cyan-500/20 text-cyan-500 font-bold' : 'text-[var(--muted-foreground)]'}`}
                  title="Tablet View (768px)"
                >
                  <Tablet size={14} />
                </button>
                <button
                  onClick={() => setViewport('mobile')}
                  className={`p-1 rounded ${viewport === 'mobile' ? 'bg-cyan-500/20 text-cyan-500 font-bold' : 'text-[var(--muted-foreground)]'}`}
                  title="Mobile View (375px)"
                >
                  <Smartphone size={14} />
                </button>
              </div>
            )}

            {/* Copy button */}
            {content && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] hover:border-cyan-500/40 transition-colors cursor-pointer"
                title="Copy Content"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {/* Download Link */}
            <a
              href={downloadUrl}
              download={artifact.name}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Download size={13} />
              <span>Download</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-[var(--muted-foreground)]">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <span className="text-xs">Loading artifact preview...</span>
            </div>
          ) : isHtml ? (
            <div className={`h-full ${getViewportWidth()} transition-all border border-[var(--border)] rounded-xl overflow-hidden shadow-md bg-white`}>
              <iframe
                title={artifact.name}
                srcDoc={content}
                sandbox="allow-scripts allow-forms allow-same-origin"
                className="w-full h-full border-0"
              />
            </div>
          ) : content ? (
            <div className="w-full h-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 font-mono text-xs leading-relaxed text-[var(--foreground)]">
              <pre className="whitespace-pre-wrap break-words">{content}</pre>
            </div>
          ) : (
            <div className="text-center p-8 space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 mx-auto">
                <Download size={24} />
              </div>
              <h3 className="font-semibold text-sm text-[var(--foreground)]">{artifact.name}</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                This deliverable is ready for export and download.
              </p>
              <a
                href={downloadUrl}
                download={artifact.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Download size={14} />
                <span>Save to Computer</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
