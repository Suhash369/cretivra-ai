import React, { useState } from 'react';
import { X, Search, FileText, Presentation, Image as ImageIcon, Plus, Check } from 'lucide-react';
import type { Attachment } from '../../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachFile: (file: File) => void;
  onAttachExisting?: (att: Attachment) => void;
  recentAttachments?: Attachment[];
}

const TEMPLATE_DOCUMENTS = [
  {
    id: 'tpl-1',
    name: 'Executive_Pitch_Deck_Outline.pptx',
    type: 'pptx',
    desc: 'High-impact 5-slide venture pitch deck outline',
    content: 'Title: Quantum AI Logistics\nSlide 1: Problem statement\nSlide 2: Unique solution\nSlide 3: Market TAM\nSlide 4: Traction\nSlide 5: Financial projections',
  },
  {
    id: 'tpl-2',
    name: 'Financial_Quarterly_Model.csv',
    type: 'csv',
    desc: 'Quarterly revenue, COGS, and growth margin metrics',
    content: 'Quarter,Revenue,Expenses,NetProfit\nQ1,120000,85000,35000\nQ2,145000,92000,53000\nQ3,180000,105000,75000\nQ4,220000,120000,100000',
  },
  {
    id: 'tpl-3',
    name: 'Product_Requirements_Document.md',
    type: 'md',
    desc: 'PRD specification for autonomous workflows',
    content: '# PRD: Autonomous Workflow Engine\n\n## Objective\nEnable zero-latency asynchronous agentic execution across distributed microservices.',
  },
  {
    id: 'tpl-4',
    name: 'AI_Architecture_Whitepaper.pdf',
    type: 'pdf',
    desc: 'Technical architecture reference document',
    content: 'Technical Whitepaper: Multi-modal neural routing with temporal grounding and verifiable facts.',
  },
];

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  onAttachFile,
  onAttachExisting,
  recentAttachments = [],
}) => {
  const [search, setSearch] = useState('');
  const [attachedIds, setAttachedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const filteredUserFiles = recentAttachments.filter(
    (a) =>
      a.filename.toLowerCase().includes(search.toLowerCase()) ||
      (a.file_type || a.mime_type || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredTemplates = TEMPLATE_DOCUMENTS.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.desc.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectTemplate = (tpl: typeof TEMPLATE_DOCUMENTS[0]) => {
    const blob = new Blob([tpl.content], { type: 'text/plain' });
    const file = new File([blob], tpl.name, { type: 'text/plain' });
    onAttachFile(file);
    setAttachedIds((prev) => new Set(prev).add(tpl.id));
    setTimeout(() => onClose(), 350);
  };

  const handleSelectExisting = (att: Attachment) => {
    if (onAttachExisting) {
      onAttachExisting(att);
    } else {
      const blob = new Blob([att.extracted_text || ''], { type: att.mime_type || 'text/plain' });
      const file = new File([blob], att.filename, { type: att.mime_type || 'text/plain' });
      onAttachFile(file);
    }
    setAttachedIds((prev) => new Set(prev).add(att.id));
    setTimeout(() => onClose(), 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#1e1f20] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-[#252627]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              File & Document Library
            </h3>
            <p className="text-xs text-gray-400">Browse and attach your files, presentations, and starter templates</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-800/80 bg-[#1e1f20]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search files and library documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900/90 border border-gray-700/60 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* User's Uploaded Files (if any) */}
          {filteredUserFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 px-1">
                Your Uploaded Files & Attachments ({filteredUserFiles.length})
              </p>
              {filteredUserFiles.map((att) => {
                const isAttached = attachedIds.has(att.id);
                const isPpt = att.filename.toLowerCase().endsWith('.pptx') || att.filename.toLowerCase().endsWith('.ppt');
                const isImg = att.mime_type.startsWith('image/');
                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-gray-900/70 hover:bg-gray-800/90 border border-gray-800 hover:border-cyan-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-gray-800 border border-gray-700/60 shrink-0">
                        {isImg && att.data_url ? (
                          <img src={att.data_url} alt="" className="w-5 h-5 rounded object-cover" />
                        ) : isPpt ? (
                          <Presentation className="w-4 h-4 text-amber-400" />
                        ) : isImg ? (
                          <ImageIcon className="w-4 h-4 text-purple-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">
                          {att.filename}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {(att.file_type || att.mime_type?.split('/')[1] || 'FILE').toUpperCase()} • {(((att.size || att.file_size || 0) / 1024)).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectExisting(att)}
                      disabled={isAttached}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 transition-all shrink-0 ml-2 cursor-pointer ${
                        isAttached
                          ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                          : 'bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-700/60 text-cyan-300'
                      }`}
                    >
                      {isAttached ? (
                        <>
                          <Check size={12} />
                          <span>Attached</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>Attach</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Starter Templates */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-1">
              Starter Templates & Datasets
            </p>
            {filteredTemplates.map((tpl) => {
              const isAttached = attachedIds.has(tpl.id);
              const isPpt = tpl.type === 'pptx';
              return (
                <div
                  key={tpl.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-gray-800 border border-gray-700/60 shrink-0">
                      {isPpt ? (
                        <Presentation className="w-4 h-4 text-orange-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">
                        {tpl.name}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{tpl.desc}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    disabled={isAttached}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 transition-all shrink-0 ml-2 cursor-pointer ${
                      isAttached
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                        : 'bg-indigo-950/60 hover:bg-indigo-900/80 border-indigo-700/60 text-indigo-300'
                    }`}
                  >
                    {isAttached ? (
                      <>
                        <Check size={12} />
                        <span>Attached</span>
                      </>
                    ) : (
                      <>
                        <Plus size={12} />
                        <span>Attach</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 bg-[#252627] flex items-center justify-between text-xs text-gray-400">
          <span>Click attach to add any file directly into your conversation prompt</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
