import React, { useState } from 'react';
import { Copy, Check, RotateCw, Edit3, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';
import { IntelligenceCacheCard } from './IntelligenceCacheCard';
import { SourceLinksCard } from './SourceLinksCard';
import { MarkdownRenderer } from './MarkdownRenderer';
import { GeneratedImageCard } from './GeneratedImageCard';
import { ImageGallery } from './ImageGallery';
import { RelatedQuestions } from './RelatedQuestions';
import { DeveloperDiagnosticsCard } from './DeveloperDiagnosticsCard';
import { VisualAnswer } from '../visual';
import type { Message, VisualAnswerData } from '../../types';

export { GeneratedImageCard };

interface ChatMessageProps {
  message: Message;
  onEditMessage?: (id: string, newContent: string) => void;
  onRegenerateMessage?: (id: string) => void;
  onSelectRelatedQuestion?: (question: string) => void;
  isGenerating?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onEditMessage,
  onRegenerateMessage,
  onSelectRelatedQuestion,
  isGenerating = false,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);

  // Extract visual data from props or embedded comment in persisted content
  const { cleanContent, visualData: parsedVisualData } = React.useMemo(() => {
    if (message.visual_intelligence) {
      return { cleanContent: message.content, visualData: message.visual_intelligence };
    }
    const match = message.content?.match(/<!--\s*asura_visual_intelligence:\s*(\{.*?\})\s*-->/s);
    if (match) {
      try {
        const visualData = JSON.parse(match[1]);
        const clean = message.content.replace(/<!--\s*asura_visual_intelligence:\s*\{.*?\}\s*-->/s, '').trim();
        return { cleanContent: clean, visualData };
      } catch {
        return { cleanContent: message.content, visualData: null };
      }
    }
    return { cleanContent: message.content, visualData: null };
  }, [message.content, message.visual_intelligence]);

  const [activeVisualData, setActiveVisualData] = useState<VisualAnswerData | null>(parsedVisualData);

  React.useEffect(() => {
    if (parsedVisualData) {
      setActiveVisualData(parsedVisualData);
    }
  }, [parsedVisualData]);

  const handleRefreshVisuals = async (queryStr: string) => {
    try {
      const res = await fetch('/api/visual/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryStr, max_images: 5 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const composeRes = await fetch('/api/visual/compose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: queryStr,
              text_content: cleanContent,
              images: data.results
            })
          });
          if (composeRes.ok) {
            const composed = await composeRes.json();
            setActiveVisualData(composed);
          }
        }
      }
    } catch (e) {
      console.error('Error refreshing visuals:', e);
    }
  };

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
    <div className="w-full py-3 sm:py-5 px-4 sm:px-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        {isUser ? (
          <div className="flex justify-end group my-2">
            {isEditing ? (
              <div className="space-y-3 w-full max-w-2xl bg-slate-100 dark:bg-gray-800/90 border border-indigo-500/50 rounded-2xl p-4 shadow-sm">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-transparent text-slate-900 dark:text-gray-100 text-sm focus:outline-none resize-none min-h-[100px] leading-relaxed"
                  autoFocus
                />
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-200 dark:border-gray-700">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 max-w-2xl">
                {onEditMessage && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      title="Edit message"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="bg-[#2f2f2f] text-white dark:bg-[#303030] dark:text-gray-100 rounded-[24px] px-5 py-3 text-[15px] leading-relaxed shadow-xs border border-transparent dark:border-neutral-700/30 selection:bg-cyan-500/30">
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-2">
                      {message.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-neutral-200"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-medium truncate max-w-[150px]">{att.filename}</span>
                          <span className="text-[10px] text-neutral-400">({(att.size / 1024).toFixed(0)} KB)</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {cleanContent}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3.5 group py-2 sm:py-3">
            {/* Assistant Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500/10 via-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-xs overflow-hidden">
              <img src="/logo.png" alt="Cretivra" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 space-y-2">
              <IntelligenceCacheCard
                reasoningStatus={message.reasoning_status}
                isGenerating={isGenerating}
                cacheItems={message.cache_items}
              />
              <SourceLinksCard sources={message.sources} messageContent={message.content} />
              {message.images && message.images.length > 0 && (
                <ImageGallery images={message.images} />
              )}

              {/* ASURA Visual Intelligence Renderer */}
              <VisualAnswer
                visualData={activeVisualData}
                isLoading={message.visual_loading}
                query={cleanContent.slice(0, 80)}
                onRefreshVisuals={handleRefreshVisuals}
              />

              {/* Bouncing dots thinking indicator when waiting for first token */}
              {!cleanContent && isGenerating && (
                <div className="flex items-center gap-1.5 py-2 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                </div>
              )}

              {/* Markdown Content with streaming cursor */}
              {cleanContent && (
                <div className="text-[15.5px] sm:text-[16px] leading-[1.78] text-slate-900 dark:text-slate-100 font-sans">
                  <MarkdownRenderer content={cleanContent} isStreaming={isGenerating} />
                </div>
              )}

              {/* Related Follow-Up Questions */}
              {message.related_questions && message.related_questions.length > 0 && (
                <RelatedQuestions
                  questions={message.related_questions}
                  onSelectQuestion={onSelectRelatedQuestion}
                />
              )}

              {/* Developer Diagnostics */}
              {message.metadata && (
                <DeveloperDiagnosticsCard metadata={message.metadata} />
              )}

              {/* Assistant Action Toolbar (ChatGPT Style) */}
              <div className="opacity-75 sm:opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity flex items-center gap-1 pt-1.5 text-gray-400">
                <button
                  onClick={() => handleCopy(message.content)}
                  className="p-1.5 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors cursor-pointer"
                  title="Copy response"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setFeedback(feedback === 'good' ? null : 'good')}
                  className={`p-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer ${
                    feedback === 'good' ? 'text-emerald-400' : 'hover:text-gray-200'
                  }`}
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === 'bad' ? null : 'bad')}
                  className={`p-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer ${
                    feedback === 'bad' ? 'text-rose-400' : 'hover:text-gray-200'
                  }`}
                  title="Bad response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
                {onRegenerateMessage && (
                  <button
                    disabled={isGenerating}
                    onClick={() => onRegenerateMessage(message.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors cursor-pointer disabled:opacity-40"
                    title="Regenerate response"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



