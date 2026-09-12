import React, { useEffect, useRef } from 'react';
import {
  Paperclip,
  Library,
  Image as ImageIcon,
  Globe,
  Megaphone,
  Presentation,
  FileText,
  PenTool,
  BarChart3,
  Check,
} from 'lucide-react';

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export interface ActionMenuItem {
  id: string;
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: () => void;
  onOpenLibrary: () => void;
  onOpenImageStudio: () => void;
  onCreateImage?: () => void;
  onToggleWebSearch: () => void;
  webSearchActive?: boolean;
  onToggleDeepThink: () => void;
  deepThinkActive?: boolean;
  onCreatePresentation: () => void;
  onCreatePdf?: () => void;
  onOpenSketch: () => void;
  onVisualizeData: () => void;
  onOpenGitHub?: () => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  isOpen,
  onClose,
  onUploadFile,
  onOpenLibrary,
  onOpenImageStudio,
  onCreateImage,
  onToggleWebSearch,
  webSearchActive,
  onToggleDeepThink,
  deepThinkActive,
  onCreatePresentation,
  onCreatePdf,
  onOpenSketch,
  onVisualizeData,
  onOpenGitHub,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items: ActionMenuItem[] = [
    {
      id: 'upload',
      icon: <Paperclip className="w-[18px] h-[18px] text-slate-600 dark:text-gray-300 group-hover:text-cyan-600 dark:group-hover:text-white" />,
      title: 'Add photos & files',
      description: 'Upload from computer',
      onClick: () => {
        onClose();
        onUploadFile();
      },
    },
    {
      id: 'library',
      icon: <Library className="w-[18px] h-[18px] text-slate-600 dark:text-gray-300 group-hover:text-cyan-600 dark:group-hover:text-white" />,
      title: 'Add from library',
      description: 'Browse saved files',
      onClick: () => {
        onClose();
        onOpenLibrary();
      },
    },
    {
      id: 'image',
      icon: (
        <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-cyan-400 flex items-center justify-center p-[2px]">
          <ImageIcon className="w-3 h-3 text-white" />
        </div>
      ),
      title: 'Create image',
      description: 'Visualize anything',
      badge: 'FLUX.1',
      onClick: () => {
        onClose();
        if (onCreateImage) {
          onCreateImage();
        } else {
          onOpenImageStudio();
        }
      },
    },
    {
      id: 'search',
      icon: <Globe className={`w-[18px] h-[18px] ${webSearchActive ? 'text-cyan-500 animate-spin-slow' : 'text-sky-500'}`} />,
      title: 'Web search',
      description: 'Real-time facts',
      badge: webSearchActive ? 'Active' : undefined,
      onClick: () => {
        onClose();
        onToggleWebSearch();
      },
    },
    {
      id: 'research',
      icon: <Megaphone className={`w-[18px] h-[18px] ${deepThinkActive ? 'text-cyan-500 animate-pulse' : 'text-cyan-500'}`} />,
      title: 'Deep research',
      description: 'Detailed investigation',
      badge: deepThinkActive ? 'Active' : undefined,
      onClick: () => {
        onClose();
        onToggleDeepThink();
      },
    },
    {
      id: 'presentation',
      icon: <Presentation className="w-[18px] h-[18px] text-amber-500" />,
      title: 'Create slides',
      description: 'PowerPoint (.pptx)',
      badge: 'New',
      onClick: () => {
        onClose();
        onCreatePresentation();
      },
    },
    {
      id: 'pdf',
      icon: <FileText className="w-[18px] h-[18px] text-rose-500" />,
      title: 'Create PDF',
      description: 'Executive PDF report',
      badge: 'PDF',
      onClick: () => {
        onClose();
        onCreatePdf?.();
      },
    },
    {
      id: 'sketch',
      icon: <PenTool className="w-[18px] h-[18px] text-slate-600 dark:text-gray-300 group-hover:text-cyan-600 dark:group-hover:text-white" />,
      title: 'Sketch canvas',
      description: 'Draw & attach image',
      onClick: () => {
        onClose();
        onOpenSketch();
      },
    },
    {
      id: 'visualize',
      icon: <BarChart3 className="w-[18px] h-[18px] text-pink-500" />,
      title: 'Visualize data',
      description: 'Interactive charts',
      onClick: () => {
        onClose();
        onVisualizeData();
      },
    },
    {
      id: 'github',
      icon: <GitHubIcon className="w-[18px] h-[18px] text-slate-600 dark:text-gray-300 group-hover:text-cyan-600 dark:group-hover:text-white" />,
      title: 'GitHub code',
      description: 'PRs, CI & repo review',
      onClick: () => {
        onClose();
        if (onOpenGitHub) onOpenGitHub();
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-3 w-[320px] sm:w-[480px] max-w-[calc(100vw-2rem)] bg-white/98 dark:bg-[#111625]/98 backdrop-blur-2xl border border-slate-200/90 dark:border-gray-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none overflow-hidden"
    >
      <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-100 dark:border-gray-800/80">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
          Tools & Attachments
        </span>
        <span className="text-[10px] text-slate-400 dark:text-gray-500">ESC to close</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[55vh] overflow-y-auto pr-0.5 custom-scrollbar">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
          >
            <div className="shrink-0 flex items-center justify-center w-6 h-6">
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 truncate">
                  {item.title}
                </span>
                {item.badge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 font-mono shrink-0">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] text-slate-500 dark:text-gray-400 truncate block">
                {item.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
