import React, { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  subtext?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  subtext,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const confirmBtnStyles =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm active:scale-95'
      : 'bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-sm active:scale-95';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#202123] border border-slate-200 dark:border-gray-700/80 shadow-2xl p-6 text-left transition-all animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <h3
          id="confirm-modal-title"
          className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight"
        >
          {title}
        </h3>

        <div className="mt-3 text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
          {description}
        </div>

        {subtext && (
          <div className="mt-2 text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
            {subtext}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-slate-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-200 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={async () => {
              await onConfirm();
            }}
            className={`px-4 py-2 rounded-full text-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${confirmBtnStyles}`}
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
