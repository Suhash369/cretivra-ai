import React, { useEffect, useRef } from 'react';
import {
  Paperclip,
  Library,
  Palette,
  Globe,
  Megaphone,
  Presentation,
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
  onToggleWebSearch: () => void;
  webSearchActive?: boolean;
  onToggleDeepThink: () => void;
  deepThinkActive?: boolean;
  onCreatePresentation: () => void;
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
  onToggleWebSearch,
  webSearchActive,
  onToggleDeepThink,
  deepThinkActive,
  onCreatePresentation,
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
      icon: <Paperclip className="w-[18px] h-[18px] text-gray-200 group-hover:text-white" />,
      title: 'Add photos & files',
      description: 'Upload from computer',
      onClick: () => {
        onClose();
        onUploadFile();
      },
    },
    {
      id: 'library',
      icon: <Library className="w-[18px] h-[18px] text-gray-200 group-hover:text-white" />,
      title: 'Add from library',
      description: 'Browse and search your files',
      onClick: () => {
        onClose();
        onOpenLibrary();
      },
    },
    {
      id: 'image',
      icon: (
        <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-cyan-400 flex items-center justify-center p-[2px]">
          <Palette className="w-3 h-3 text-white" />
        </div>
      ),
      title: 'Create image',
      description: 'Visualize anything',
      badge: 'FLUX.1',
      onClick: () => {
        onClose();
        onOpenImageStudio();
      },
    },
    {
      id: 'search',
      icon: <Globe className={`w-[18px] h-[18px] ${webSearchActive ? 'text-cyan-400 animate-spin-slow' : 'text-sky-400'}`} />,
      title: 'Web search',
      description: 'Find real-time news and info',
      badge: webSearchActive ? 'Active' : undefined,
      onClick: () => {
        onClose();
        onToggleWebSearch();
      },
    },
    {
      id: 'research',
      icon: <Megaphone className={`w-[18px] h-[18px] ${deepThinkActive ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />,
      title: 'Deep research',
      description: 'Get a detailed report',
      badge: deepThinkActive ? 'Active' : undefined,
      onClick: () => {
        onClose();
        onToggleDeepThink();
      },
    },
    {
      id: 'presentation',
      icon: <Presentation className="w-[18px] h-[18px] text-amber-400" />,
      title: 'Create presentation',
      description: 'Generate PowerPoint (.pptx) deck',
      badge: 'New',
      onClick: () => {
        onClose();
        onCreatePresentation();
      },
    },
    {
      id: 'sketch',
      icon: <PenTool className="w-[18px] h-[18px] text-gray-200 group-hover:text-white" />,
      title: 'Sketch',
      description: 'Draw and attach an image',
      onClick: () => {
        onClose();
        onOpenSketch();
      },
    },
    {
      id: 'visualize',
      icon: <BarChart3 className="w-[18px] h-[18px] text-pink-400" />,
      title: 'Visualize',
      description: 'Create visualizations and interactive tools',
      onClick: () => {
        onClose();
        onVisualizeData();
      },
    },
    {
      id: 'github',
      icon: <GitHubIcon className="w-[18px] h-[18px] text-gray-300 group-hover:text-white" />,
      title: 'GitHub',
      description: 'Trigger PRs, issues, CI and code repository review.',
      onClick: () => {
        onClose();
        if (onOpenGitHub) onOpenGitHub();
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-3 w-[340px] sm:w-[500px] max-w-[calc(100vw-2rem)] bg-[#212121]/98 dark:bg-[#1e1e1e]/98 backdrop-blur-2xl border border-white/10 dark:border-gray-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none overflow-hidden"
    >
      <div className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-0.5 custom-scrollbar">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/10 dark:hover:bg-white/5 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="shrink-0 flex items-center justify-center w-6 h-6">
                {item.icon}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0 flex-1">
                <span className="text-[13px] font-medium text-gray-100 group-hover:text-white whitespace-nowrap">
                  {item.title}
                </span>
                <span className="text-[11.5px] text-gray-400 group-hover:text-gray-300 truncate">
                  {item.description}
                </span>
              </div>
            </div>

            {item.badge && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-gray-300 border border-white/10 font-mono shrink-0">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
