import React from 'react';
import { UploadCloud } from 'lucide-react';

interface DragAndDropOverlayProps {
  isDragging: boolean;
}

export const DragAndDropOverlay: React.FC<DragAndDropOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-indigo-500/70 p-6 transition-all animate-fade-in">
      <div className="p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 mb-4 animate-bounce">
        <UploadCloud className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Drop files to upload</h2>
      <p className="text-sm text-gray-400 max-w-sm text-center">
        Supported formats: PDF, DOCX, TXT, CSV, Markdown, PNG, JPG, WEBP (Up to 20MB)
      </p>
    </div>
  );
};
