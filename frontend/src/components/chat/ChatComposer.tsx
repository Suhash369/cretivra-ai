import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { ModelSelector } from '../model-selector/ModelSelector';
import type { Attachment, CretivraModel } from '../../types';

interface ChatComposerProps {
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  models: CretivraModel[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  attachments: Attachment[];
  onFileUpload: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  models,
  selectedModelId,
  onSelectModel,
  attachments,
  onFileUpload,
  onRemoveAttachment,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((text.trim() || attachments.length > 0) && !isGenerating) {
      onSendMessage(text);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => onFileUpload(file));
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <div className="relative rounded-2xl bg-gray-900/90 border border-gray-800 focus-within:border-indigo-500/50 shadow-2xl backdrop-blur-xl transition-all">
        {/* Uploaded File Chips Bar */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 border-b border-gray-800/60">
            {attachments.map((att) => {
              const isImg = att.mime_type.startsWith('image/');
              return (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700/70 text-xs text-gray-200 group"
                >
                  {isImg ? (
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span className="font-medium truncate max-w-[140px]">{att.filename}</span>
                  <button
                    onClick={() => onRemoveAttachment(att.id)}
                    className="p-0.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Cretivra..."
          className="w-full px-4 pt-3.5 pb-2 rounded-2xl bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none resize-none max-h-52 overflow-y-auto leading-relaxed"
        />

        {/* Composer Action Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-2">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Attach files (PDF, DOCX, TXT, CSV, MD, PNG, JPG)"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.txt,.csv,.md,.png,.jpg,.jpeg,.webp"
            />

            {/* Model Selector dropdown pill */}
            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={onSelectModel}
              disabled={isGenerating}
            />
          </div>

          {/* Send or Stop Generation Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim() && attachments.length === 0}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition-all shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-center text-gray-500 mt-2">
        Cretivra AI processes queries locally. Verify important output.
      </p>
    </div>
  );
};
