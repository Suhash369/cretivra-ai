import React, { useState } from 'react';
import { Copy, Check, RotateCw, Edit3, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';
import { IntelligenceCacheCard } from './IntelligenceCacheCard';
import { SourceLinksCard } from './SourceLinksCard';
import { MarkdownRenderer } from './MarkdownRenderer';
import { GeneratedImageCard } from './GeneratedImageCard';
import { VisualAnswer } from '../visual';
import type { Message, VisualAnswerData } from '../../types';

export { GeneratedImageCard };

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
    <div
      className={`w-full py-6 px-4 sm:px-6 transition-colors border-b border-gray-800/40 ${
        isUser ? 'bg-transparent' : 'bg-gray-900/40'
      }`}
    >
      <div className="max-w-5xl xl:max-w-6xl mx-auto flex gap-4 items-start">
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
            <span className="font-semibold text-slate-700 dark:text-gray-300">{isUser ? 'You' : 'Asura AI by Cretivra'}</span>
          </div>

          {/* Cretivra Intelligence Cache Indicator */}
          {!isUser && (
            <>
              <IntelligenceCacheCard
                reasoningStatus={message.reasoning_status}
                isGenerating={isGenerating}
                cacheItems={message.cache_items}
              />
              <SourceLinksCard sources={message.sources} messageContent={message.content} />
            </>
          )}

          {/* User File Attachments if present */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-xs text-slate-700 dark:text-gray-300"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span className="font-medium truncate max-w-[150px]">{att.filename}</span>
                  <span className="text-[10px] text-slate-500 dark:text-gray-500">({(att.size / 1024).toFixed(0)} KB)</span>
                </div>
              ))}
            </div>
          )}

          {/* ASURA Visual Intelligence Renderer */}
          {!isUser && (
            <VisualAnswer
              visualData={activeVisualData}
              isLoading={message.visual_loading}
              query={cleanContent.slice(0, 80)}
              onRefreshVisuals={handleRefreshVisuals}
            />
          )}

          {/* Message Text / Inline Edit */}
          {isUser && isEditing ? (
            <div className="space-y-3 pt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-gray-800 border border-indigo-500/50 text-slate-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[100px]"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 text-xs font-medium"
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
          ) : cleanContent ? (
            <MarkdownRenderer content={cleanContent} />
          ) : isGenerating ? (
            <div className="flex items-center gap-2 py-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span>{message.reasoning_status || 'Formulating response...'}</span>
            </div>
          ) : null}

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



