import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Maximize2, Sparkles, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { getImageProxyUrl } from '../../services/api';

export const GeneratedImageCard: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  // Always default to backend proxy to strip watermarks and avoid Turnstile blocks
  const initialSafeSrc = src ? (getImageProxyUrl(src) || src) : '';
  const [activeSrc, setActiveSrc] = useState<string>(initialSafeSrc);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (src) {
      const safeSrc = getImageProxyUrl(src) || src;
      setActiveSrc(safeSrc);
      setLoaded(false);
      setHasError(false);
    }
  }, [src]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreen]);

  if (!src && !activeSrc) return null;

  // Determine model engine badge
  let badgeLabel = 'FLUX.1 Art';
  const checkUrl = activeSrc || src || '';
  if (checkUrl.includes('/gemini/') || checkUrl.includes('model=gemini') || (alt && alt.toLowerCase().includes('gemini'))) {
    badgeLabel = 'Google Gemini';
  } else if (checkUrl.includes('model=flux-anime') || (alt && alt.toLowerCase().includes('anime'))) {
    badgeLabel = 'Anime Studio';
  } else if (checkUrl.includes('model=flux-3d') || (alt && alt.toLowerCase().includes('3d'))) {
    badgeLabel = '3D Octane';
  } else if (checkUrl.includes('model=flux-realism') || (alt && alt.toLowerCase().includes('photo'))) {
    badgeLabel = 'SDXL Realism';
  } else if (checkUrl.includes('model=turbo')) {
    badgeLabel = 'Turbo Speed';
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(activeSrc || src || '');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const cleanName = (alt || 'cretivra-image').slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
      const downloadUrl = getImageProxyUrl(activeSrc || src || '', cleanName, true);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${cleanName}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(activeSrc || src, '_blank');
    }
  };

  const handleImageError = () => {
    const originalSrc = src || '';
    const proxyUrl = getImageProxyUrl(originalSrc);
    if (activeSrc !== proxyUrl && proxyUrl) {
      // Fallback from direct pollinations URL to backend proxy
      setActiveSrc(proxyUrl);
    } else {
      setHasError(true);
      setLoaded(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setLoaded(false);
    const originalSrc = src || '';
    const proxyUrl = getImageProxyUrl(originalSrc);
    setActiveSrc(proxyUrl);
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden bg-gray-950/90 border border-purple-500/30 shadow-2xl backdrop-blur-xl group max-w-lg transition-all hover:border-purple-500/50">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/90 border-b border-gray-800 text-xs">
        <div className="flex items-center gap-2 text-purple-300 font-medium overflow-hidden">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
          <span className="truncate max-w-[180px] sm:max-w-[240px] text-gray-200">{alt || 'Generated Visual'}</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800/60 text-[10px] text-purple-300 font-mono shrink-0">
            {badgeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Copy Image URL"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="View Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-cyan-400 transition-colors disabled:opacity-50 cursor-pointer"
            title="Download HD Image"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        className="relative aspect-square w-full bg-gray-900/70 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => (!hasError && loaded ? setFullscreen(true) : undefined)}
      >
        {!loaded && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 animate-pulse text-gray-400 gap-2.5 p-4">
            <ImageIcon className="w-8 h-8 text-purple-400/70 animate-bounce" />
            <span className="text-xs text-purple-300 font-mono text-center">Synthesizing high-res visual with {badgeLabel}...</span>
          </div>
        )}
        {hasError ? (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-gray-400">
            <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800/50 text-rose-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-xs text-rose-300 font-medium">Image generation timed out</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <img
            src={activeSrc || src}
            alt={alt || 'Generated AI Art'}
            onLoad={() => setLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] rounded-2xl overflow-hidden border border-purple-500/40 bg-gray-950 p-2 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 mb-2">
              <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="truncate max-w-[400px]">{alt || 'Generated Visual'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs text-gray-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download HD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreen(false)}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs text-gray-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <img src={src} alt={alt} className="max-h-[80vh] w-auto rounded-xl object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};
