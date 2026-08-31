import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Calendar } from 'lucide-react';
import type { Conversation } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onSearchQuery: (query: string) => void;
  conversations: Conversation[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
  onSearchQuery,
  conversations,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    onSearchQuery(query);
  }, [query, onSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversation titles or messages..."
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-gray-800/40">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No matching conversations found.</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelectConversation(c.id);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-gray-800/60 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-gray-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-200 group-hover:text-white truncate">
                      {c.title}
                    </h4>
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">{c.model_id}</span>
                  </div>
                </div>
                {c.updated_at && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(c.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
