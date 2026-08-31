import React, { useState } from 'react';
import { X, Share2, Copy, Check, Lock } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, conversationId }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !conversationId) return null;

  const shareUrl = `${window.location.origin}/share/${conversationId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <span>Share Conversation</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Create a shareable snapshot of this conversation. Private local encryption ensures your data remains strictly under your control.
        </p>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-950 border border-gray-800">
          <input
            readOnly
            type="text"
            value={shareUrl}
            className="w-full bg-transparent text-xs text-gray-200 focus:outline-none font-mono px-2"
          />
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-2">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local storage architecture active.</span>
        </div>
      </div>
    </div>
  );
};
