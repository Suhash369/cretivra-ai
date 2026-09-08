import React, { useState } from 'react';
import { X, Share2, Copy, Check, Lock, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, conversationId }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !conversationId) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${conversationId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text)] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[var(--text)] text-base">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <span>Share Conversation</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Create a shareable snapshot of this conversation. Anyone with this link will be able to view this conversation snapshot.
        </p>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border)]">
          <input
            readOnly
            type="text"
            value={shareUrl}
            className="w-full bg-transparent text-xs text-[var(--text)] focus:outline-none font-mono px-2"
          />
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted public snapshot.</span>
          </div>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
          >
            <span>Open preview</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

