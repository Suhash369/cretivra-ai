import React, { useState } from 'react';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  ExternalLink,
  MessageSquare,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import type { Attachment } from '../../types';

interface KnowledgeWorkspaceProps {
  onAskAsura?: (prompt: string) => void;
  onUploadFile?: (file: File) => void;
}

interface KnowledgeDoc {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  status: 'indexed' | 'processing';
  category: 'Research' | 'Documentation' | 'Data' | 'Notes';
}

const DEFAULT_DOCS: KnowledgeDoc[] = [
  {
    id: '1',
    name: 'Cretivra AI Architecture & Roadmap 2026.pdf',
    type: 'PDF',
    size: '3.4 MB',
    date: 'Sep 20, 2026',
    status: 'indexed',
    category: 'Research',
  },
  {
    id: '2',
    name: 'Autonomous Agent DAG Protocol Specification.docx',
    type: 'DOCX',
    size: '1.2 MB',
    date: 'Sep 18, 2026',
    status: 'indexed',
    category: 'Documentation',
  },
  {
    id: '3',
    name: 'Global AI Enterprise Market Sizing & ICP.xlsx',
    type: 'XLSX',
    size: '890 KB',
    date: 'Sep 15, 2026',
    status: 'indexed',
    category: 'Data',
  },
];

export function KnowledgeWorkspace({ onAskAsura, onUploadFile }: KnowledgeWorkspaceProps) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(DEFAULT_DOCS);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const categories = ['all', 'Research', 'Documentation', 'Data'] as const;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const f = files[0];
      const newDoc: KnowledgeDoc = {
        id: String(Date.now()),
        name: f.name,
        type: f.name.split('.').pop()?.toUpperCase() || 'FILE',
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        date: 'Today',
        status: 'indexed',
        category: 'Research',
      };
      setDocs((prev) => [newDoc, ...prev]);
      if (onUploadFile) onUploadFile(f);
    }
  };

  const filtered = docs.filter((d) => {
    const matchesCat = activeCategory === 'all' || d.category === activeCategory;
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden p-6 transition-colors duration-200">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">Knowledge</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Store documents, technical papers, and data for Asura to ground its reasoning.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06B6D4] text-black text-xs font-semibold hover:bg-[#06B6D4]/90 transition-colors shadow-sm asura-btn-interactive"
        >
          <UploadCloud size={14} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Categories & Search */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-xl border border-[var(--border)]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                activeCategory === cat
                  ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-xs border border-[var(--border)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-2.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search knowledge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#06B6D4]/40"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[#06B6D4]/40 transition-all flex items-center justify-between gap-4 group asura-card-interactive"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[#06B6D4] shrink-0">
                <FileText size={16} />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--foreground)] truncate group-hover:text-[#06B6D4] transition-colors">
                  {doc.name}
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5 flex items-center gap-2">
                  <span className="font-mono uppercase px-1 py-0.2 bg-[var(--surface)] rounded border border-[var(--border)]">
                    {doc.type}
                  </span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex items-center gap-1 font-medium">
                <CheckCircle2 size={10} />
                <span>Indexed</span>
              </span>

              {onAskAsura && (
                <button
                  onClick={() => onAskAsura(`Please synthesize insights from ${doc.name}`)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[#06B6D4] hover:border-[#06B6D4]/40 text-xs font-medium transition-colors"
                  title="Ask Asura about this document"
                >
                  <MessageSquare size={12} />
                  <span className="hidden sm:inline">Ask Asura</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
