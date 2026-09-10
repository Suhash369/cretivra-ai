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

const OpenAIIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.02-1.1638a.0804.0804 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4022-.6814zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813v6.7227zm1.145-2.2248l3.142-1.8123 3.142 1.8123v3.6294l-3.142 1.8123-3.142-1.8123z" />
  </svg>
);

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
  onOpenPlatformSettings?: () => void;
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
  onOpenPlatformSettings,
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
      id: 'platform',
      icon: <OpenAIIcon className="w-[18px] h-[18px] text-gray-300 group-hover:text-white" />,
      title: 'OpenAI Platform',
      description: 'Manage OpenAI API keys and view organization billing and API usage.',
      onClick: () => {
        onClose();
        if (onOpenPlatformSettings) onOpenPlatformSettings();
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
