import React, { useState, useRef } from 'react';
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
  Layers,
  Database,
  Link as LinkIcon,
  X,
  ChevronRight,
  Info,
  Check,
  Plus,
} from 'lucide-react';
import type { Attachment } from '../../types';

interface KnowledgeWorkspaceProps {
  onAskAsura?: (prompt: string) => void;
  onUploadFile?: (file: File) => void;
}

interface ChunkInfo {
  index: number;
  text: string;
  tokens: number;
  score: number;
}

interface KnowledgeDoc {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  status: 'indexed' | 'processing';
  category: 'Research' | 'Documentation' | 'Data' | 'Notes';
  chunksCount: number;
  embeddingDim: number;
  chunks?: ChunkInfo[];
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
    chunksCount: 42,
    embeddingDim: 1536,
    chunks: [
      {
        index: 1,
        tokens: 384,
        score: 0.94,
        text: 'Section 1.1: Core Asura Autonomous Runtime. Asura employs a multi-agent DAG execution pipeline driven by high-efficiency reasoning models. Each task is dynamically decomposed into deterministic DAG nodes...',
      },
      {
        index: 2,
        tokens: 412,
        score: 0.89,
        text: 'Section 2.4: Stitch UI Synthesis Pipeline. The generative frontend compiler translates wireframe ontologies into validated, zero-runtime Tailwind CSS components with cross-platform responsive viewports...',
      },
      {
        index: 3,
        tokens: 298,
        score: 0.85,
        text: 'Section 4.0: Knowledge Retrieval & Grounding. Hybrid vector retrieval utilizing dense 1536-dimensional embeddings combined with BM25 lexical ranking ensures deterministic citation accuracy...',
      },
    ],
  },
  {
    id: '2',
    name: 'Autonomous Agent DAG Protocol Specification.docx',
    type: 'DOCX',
    size: '1.2 MB',
    date: 'Sep 18, 2026',
    status: 'indexed',
    category: 'Documentation',
    chunksCount: 18,
    embeddingDim: 1536,
    chunks: [
      {
        index: 1,
        tokens: 310,
        score: 0.91,
        text: 'DAG Node Lifecycle: PENDING -> PLANNING -> RUNNING -> WAITING_FOR_APPROVAL -> COMPLETED. HITL safety protocols intercept critical shell and payment tools...',
      },
      {
        index: 2,
        tokens: 350,
        score: 0.87,
        text: 'Rollback and State Checkpointing: In the event of tool failure or sandbox container exit codes, the recovery controller triggers branch fallback...',
      },
    ],
  },
  {
    id: '3',
    name: 'Global AI Enterprise Market Sizing & ICP.xlsx',
    type: 'XLSX',
    size: '890 KB',
    date: 'Sep 15, 2026',
    status: 'indexed',
    category: 'Data',
    chunksCount: 14,
    embeddingDim: 1536,
    chunks: [
      {
        index: 1,
        tokens: 220,
        score: 0.96,
        text: 'Enterprise TAM Matrix: Global AI agent workflow market projected at $48.2B by 2028 with 41.5% CAGR across financial modeling and automated engineering...',
      },
    ],
  },
];

export function KnowledgeWorkspace({ onAskAsura, onUploadFile }: KnowledgeWorkspaceProps) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(DEFAULT_DOCS);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isIndexingUrl, setIsIndexingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['all', 'Research', 'Documentation', 'Data'] as const;

  const handleFileProcess = (f: File) => {
    const ext = f.name.split('.').pop()?.toUpperCase() || 'FILE';
    const newDoc: KnowledgeDoc = {
      id: String(Date.now()),
      name: f.name,
      type: ext,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      date: 'Just now',
      status: 'indexed',
      category: 'Research',
      chunksCount: Math.max(3, Math.floor(f.size / 15000)),
      embeddingDim: 1536,
      chunks: [
        {
          index: 1,
          tokens: 280,
          score: 0.95,
          text: `Extracted content preview from ${f.name}. Document parsed and vectorized into 1536-dimensional embeddings for low-latency similarity search.`,
        },
      ],
    };
    setDocs((prev) => [newDoc, ...prev]);
    if (onUploadFile) onUploadFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileProcess(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleIndexUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url) return;
    setIsIndexingUrl(true);
    setTimeout(() => {
      let hostname = 'web-source';
      try {
        hostname = new URL(url).hostname;
      } catch {
        // Fallback
      }
      const newDoc: KnowledgeDoc = {
        id: String(Date.now()),
        name: `${hostname} (Web Link Scrape)`,
        type: 'LINK',
        size: '142 KB',
        date: 'Just now',
        status: 'indexed',
        category: 'Research',
        chunksCount: 8,
        embeddingDim: 1536,
        chunks: [
          {
            index: 1,
            tokens: 310,
            score: 0.93,
            text: `Indexed webpage content from ${url}. Extracted readable DOM nodes, headers, and metadata into vector store.`,
          },
        ],
      };
      setDocs((prev) => [newDoc, ...prev]);
      setUrlInput('');
      setIsIndexingUrl(false);
    }, 900);
  };

  const handleDeleteDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (selectedDoc?.id === id) {
      setSelectedDoc(null);
    }
  };

  const filtered = docs.filter((d) => {
    const matchesCat = activeCategory === 'all' || d.category === activeCategory;
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden transition-colors duration-200">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.json"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Knowledge</h1>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Store documents, technical papers, and data for Asura to ground its reasoning.
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <UploadCloud size={14} />
              <span>Upload Document</span>
            </button>
          </div>

          {/* Upload Drop Zone & Link Input */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Drag & Drop Card */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`lg:col-span-2 p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
                isDragging
                  ? 'border-[#06b6d4] bg-[#06b6d4]/5'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[#06b6d4]/50 hover:bg-[var(--surface-secondary)]/50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)]">
                <UploadCloud size={18} className="text-[#06b6d4]" />
              </div>
              <div className="text-xs font-semibold text-[var(--foreground)]">
                Drag & drop files to index into Knowledge Base
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] max-w-md">
                Supports PDF, Markdown, DOCX, XLSX, and TXT files. Documents are automatically chunked and embedded in vector store.
              </p>
            </div>

            {/* Index Web Link Card */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] mb-1">
                  <LinkIcon size={14} className="text-[#06b6d4]" />
                  <span>Index Web Source</span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Crawl and synchronize documentation pages or URLs into the knowledge graph.
                </p>
              </div>

              <form onSubmit={handleIndexUrl} className="flex gap-1.5 mt-auto">
                <input
                  type="url"
                  placeholder="https://docs.example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#06b6d4]"
                />
                <button
                  type="submit"
                  disabled={!urlInput.trim() || isIndexingUrl}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0 cursor-pointer"
                >
                  {isIndexingUrl ? 'Indexing...' : 'Index'}
                </button>
              </form>
            </div>
          </div>

          {/* Categories & Search Filter Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-xl border border-[var(--border)]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
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
          <div className="space-y-2.5">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-xs text-[var(--muted-foreground)] rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]">
                No documents matching your search. Upload a document to start grounding Asura's reasoning.
              </div>
            ) : (
              filtered.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(isSelected ? null : doc)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--surface)] border-[#06b6d4] shadow-sm ring-1 ring-[#06b6d4]/20'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[#06B6D4] shrink-0">
                        {doc.type === 'LINK' ? (
                          <LinkIcon size={16} />
                        ) : doc.type === 'XLSX' ? (
                          <FileSpreadsheet size={16} />
                        ) : (
                          <FileText size={16} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--foreground)] truncate">
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[var(--surface-secondary)] rounded border border-[var(--border)] uppercase">
                            {doc.type}
                          </span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.date}</span>
                          <span>•</span>
                          <span className="text-[#06b6d4] font-medium">{doc.chunksCount} chunks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={10} />
                        <span>Indexed (1536d)</span>
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[#06b6d4] transition-colors"
                        title="Inspect Chunks"
                      >
                        <Layers size={13} />
                      </button>

                      {onAskAsura && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAskAsura(`Please synthesize insights from ${doc.name}`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[#06B6D4] hover:border-[#06B6D4]/40 text-xs font-medium transition-colors"
                          title="Ask Asura about this document"
                        >
                          <MessageSquare size={12} />
                          <span className="hidden sm:inline">Ask Asura</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDeleteDoc(doc.id, e)}
                        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chunk Inspector Slide-over Panel */}
        {selectedDoc && (
          <div className="w-80 md:w-96 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col h-full overflow-hidden transition-all animate-in slide-in-from-right duration-200">
            {/* Inspector Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-[#06b6d4]" />
                <h3 className="text-xs font-semibold text-[var(--foreground)]">Chunk Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Document Info Metadata */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 space-y-2">
              <div className="text-xs font-semibold text-[var(--foreground)] truncate">
                {selectedDoc.name}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[var(--muted-foreground)] block text-[10px]">Vectors</span>
                  <span className="font-semibold text-[var(--foreground)]">{selectedDoc.chunksCount} chunks</span>
                </div>
                <div className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[var(--muted-foreground)] block text-[10px]">Dimension</span>
                  <span className="font-semibold text-[var(--foreground)]">{selectedDoc.embeddingDim}d</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)] pt-1">
                <span>Embedding Model: text-embedding-3</span>
                <span className="text-emerald-500 font-medium">Ready</span>
              </div>
            </div>

            {/* Chunks List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Extracted Embeddings & Chunks
              </div>

              {selectedDoc.chunks && selectedDoc.chunks.length > 0 ? (
                selectedDoc.chunks.map((chk) => (
                  <div
                    key={chk.index}
                    className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-semibold text-[#06b6d4]">Chunk #{chk.index}</span>
                      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                        <span>{chk.tokens} tokens</span>
                        <span>•</span>
                        <span className="text-emerald-500">{(chk.score * 100).toFixed(0)}% match</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--foreground)] leading-relaxed font-sans line-clamp-4">
                      {chk.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-[11px] text-[var(--muted-foreground)] rounded-xl border border-dashed border-[var(--border)]">
                  Full chunk vector preview available upon querying.
                </div>
              )}
            </div>

            {/* Inspector Footer */}
            {onAskAsura && (
              <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)]">
                <button
                  onClick={() => {
                    onAskAsura(`Please synthesize insights from ${selectedDoc.name}`);
                    setSelectedDoc(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <MessageSquare size={13} />
                  <span>Query in Chat</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
