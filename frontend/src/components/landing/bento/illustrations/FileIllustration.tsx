import React from 'react';
import { UploadCloud, FileText, Image, FileSpreadsheet } from 'lucide-react';

interface FileIllustrationProps {
  isDragging?: boolean;
}

export function FileIllustration({ isDragging = false }: FileIllustrationProps) {
  return (
    <div className="relative w-full h-44 sm:h-52 flex flex-col items-center justify-center p-3 select-none pointer-events-none">
      {/* Dashed Outline Drop Target Zone */}
      <div
        className={`w-full h-full rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            : 'border-[var(--border)] group-hover:border-emerald-500/60 group-hover:bg-emerald-500/5'
        }`}
      >
        {/* Interactive Isometric/Front Folder with Animated Lid */}
        <div className="relative w-28 h-20 flex items-center justify-center perspective-[600px] mb-2">
          {/* Floating File Badges rising out on hover/drag */}
          <div
            className={`absolute -top-3 left-1 transition-all duration-300 ${
              isDragging
                ? '-translate-y-4 scale-110'
                : 'group-hover:-translate-y-3 group-hover:-rotate-6'
            }`}
          >
            <div className="w-7 h-9 rounded-md bg-[var(--surface)] border border-rose-500/40 shadow-xs flex flex-col items-center justify-center p-1">
              <span className="text-[6px] font-mono font-bold text-rose-500 uppercase">PDF</span>
            </div>
          </div>

          <div
            className={`absolute -top-4 right-1 transition-all duration-300 ${
              isDragging
                ? '-translate-y-5 scale-110'
                : 'group-hover:-translate-y-3 group-hover:rotate-8'
            }`}
          >
            <div className="w-7 h-9 rounded-md bg-[var(--surface)] border border-emerald-500/40 shadow-xs flex flex-col items-center justify-center p-1">
              <span className="text-[6px] font-mono font-bold text-emerald-500 uppercase">CSV</span>
            </div>
          </div>

          <div
            className={`absolute -top-5 left-10 transition-all duration-300 z-10 ${
              isDragging
                ? '-translate-y-5 scale-110'
                : 'group-hover:-translate-y-4'
            }`}
          >
            <div className="w-7 h-9 rounded-md bg-[var(--surface)] border border-blue-500/40 shadow-xs flex flex-col items-center justify-center p-1">
              <span className="text-[6px] font-mono font-bold text-blue-500 uppercase">PNG</span>
            </div>
          </div>

          {/* Folder Back Body */}
          <div className="absolute inset-0 rounded-xl bg-emerald-600/30 dark:bg-emerald-700/40 border border-emerald-500/60 shadow-md">
            {/* Top Folder Tab */}
            <div className="absolute -top-2 left-2 w-10 h-3 rounded-t-md bg-emerald-600/40 border-t border-x border-emerald-500/60" />
          </div>

          {/* Folder Front Lid (Opens with 3D rotation on hover/drag) */}
          <div
            className={`absolute inset-x-0 bottom-0 h-16 rounded-xl bg-[var(--surface)] border border-emerald-500/60 shadow-lg flex items-center justify-center transition-all duration-300 origin-bottom ${
              isDragging
                ? 'rotate-x-[-35deg] translate-y-1 shadow-emerald-500/20'
                : 'group-hover:rotate-x-[-28deg] group-hover:translate-y-0.5'
            }`}
          >
            <UploadCloud
              size={20}
              className={`transition-colors duration-200 ${
                isDragging
                  ? 'text-emerald-500 animate-bounce'
                  : 'text-[var(--muted-foreground)] group-hover:text-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Dropzone Instructional Text */}
        <div className="text-center">
          <span className="text-[11px] font-semibold text-[var(--foreground)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block">
            {isDragging ? 'Release to upload' : 'Drop or browse'}
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5 font-mono">
            PDF, DOCX, images, code, CSV
          </span>
        </div>
      </div>
    </div>
  );
}
