import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RotateCw, Edit3, ThumbsUp, ThumbsDown, Brain, FileText, Download, Maximize2, Sparkles, Image as ImageIcon } from 'lucide-react';
import type { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
  onEditMessage?: (id: string, newContent: string) => void;
  onRegenerateMessage?: (id: string) => void;
  isGenerating?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onEditMessage,
  onRegenerateMessage,
  isGenerating = false,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSubmit = () => {
    if (onEditMessage && editContent.trim()) {
      onEditMessage(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`w-full py-6 px-4 sm:px-6 transition-colors border-b border-gray-800/40 ${
        isUser ? 'bg-transparent' : 'bg-gray-900/40'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4 items-start">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold shadow-md overflow-hidden ${
            isUser
              ? 'bg-gradient-to-tr from-gray-700 to-gray-600 text-white'
              : 'bg-gray-900 border border-cyan-500/40 p-0.5'
          }`}
        >
          {isUser ? 'U' : <img src="/logo.png" alt="Cretivra Logo" className="w-full h-full object-contain rounded-md" />}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Role Label */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold text-gray-300">{isUser ? 'You' : 'Cretivra AI'}</span>

            {/* Reasoning status indicator */}
            {!isUser && message.reasoning_status && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-900/30 border border-purple-700/50 text-purple-300 text-[11px] font-medium animate-pulse">
                <Brain className="w-3 h-3 text-purple-400" />
                <span>{message.reasoning_status}</span>
              </div>
            )}
          </div>

          {/* User File Attachments if present */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium truncate max-w-[150px]">{att.filename}</span>
                  <span className="text-[10px] text-gray-500">({(att.size / 1024).toFixed(0)} KB)</span>
                </div>
              ))}
            </div>
          )}

          {/* Message Text / Inline Edit */}
          {isUser && isEditing ? (
            <div className="space-y-3 pt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-indigo-500/50 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[100px]"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  Save & Submit
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-sm text-gray-100 leading-relaxed font-sans">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img({ src, alt }) {
                    return <GeneratedImageCard src={src} alt={alt} />;
                  },
                  code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');
                    if (!inline && match) {
                      return (
                        <CodeBlock
                          language={match[1]}
                          value={codeText}
                        />
                      );
                    }
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-gray-800 text-indigo-300 font-mono text-xs" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content || (isGenerating ? 'Thinking...' : '')}
              </ReactMarkdown>
            </div>
          )}

          {/* Assistant / User Action Toolbar */}
          {!isEditing && (
            <div className="flex items-center gap-1.5 pt-2 text-gray-400">
              {/* Copy button */}
              <button
                onClick={() => handleCopy(message.content)}
                className="p-1.5 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Edit button for user message */}
              {isUser && onEditMessage && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors"
                  title="Edit message"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Assistant specific actions */}
              {!isUser && (
                <>
                  {onRegenerateMessage && (
                    <button
                      disabled={isGenerating}
                      onClick={() => onRegenerateMessage(message.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors disabled:opacity-50"
                      title="Regenerate response"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setFeedback(feedback === 'good' ? null : 'good')}
                    className={`p-1.5 rounded-lg hover:bg-gray-800 transition-colors ${
                      feedback === 'good' ? 'text-emerald-400' : 'hover:text-gray-200'
                    }`}
                    title="Good response"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFeedback(feedback === 'bad' ? null : 'bad')}
                    className={`p-1.5 rounded-lg hover:bg-gray-800 transition-colors ${
                      feedback === 'bad' ? 'text-rose-400' : 'hover:text-gray-200'
                    }`}
                    title="Bad response"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Code Block Subcomponent with language label and copy code button
const CodeBlock: React.FC<{ language: string; value: string }> = ({
  language,
  value,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(value);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden bg-gray-950 border border-gray-800 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800/80 text-xs text-gray-400 font-mono">
        <span>{language}</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedCode ? 'Copied ✓' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-xs font-mono text-gray-200 leading-relaxed">
        <pre><code>{value}</code></pre>
      </div>
    </div>
  );
};

// Generated Image Card Subcomponent with Fullscreen Zoom and High-Res Download
export const GeneratedImageCard: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreen]);

  if (!src) return null;

  // Determine model engine badge
  let badgeLabel = 'FLUX.1 Art';
  if (src.includes('model=flux-anime') || (alt && alt.toLowerCase().includes('anime'))) {
    badgeLabel = 'Anime Studio';
  } else if (src.includes('model=flux-3d') || (alt && alt.toLowerCase().includes('3d'))) {
    badgeLabel = '3D Octane';
  } else if (src.includes('model=flux-realism') || (alt && alt.toLowerCase().includes('photo'))) {
    badgeLabel = 'SDXL Realism';
  } else if (src.includes('model=turbo')) {
    badgeLabel = 'Turbo Speed';
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(src);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanName = (alt || 'cretivra-image').slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `${cleanName}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(src, '_blank');
    } finally {
      setDownloading(false);
    }
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
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Copy Image URL"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setFullscreen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="View Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
            title="Download HD Image"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        className="relative aspect-square w-full bg-gray-900/70 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => setFullscreen(true)}
      >
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 animate-pulse text-gray-400 gap-2.5 p-4">
            <ImageIcon className="w-8 h-8 text-purple-400/70 animate-bounce" />
            <span className="text-xs text-purple-300 font-mono">Synthesizing high-res visual with {badgeLabel}...</span>
          </div>
        )}
        <img
          src={src}
          alt={alt || 'Generated AI Art'}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
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
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs text-gray-200 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download HD</span>
                </button>
                <button
                  onClick={() => setFullscreen(false)}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs text-gray-300"
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


