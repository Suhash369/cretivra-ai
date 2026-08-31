import { useState, useEffect, useCallback } from 'react';
import type { Conversation, GroupedConversations } from '../types';
import { fetchConversations, createConversation, updateConversation, deleteConversation } from '../services/api';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [grouped, setGrouped] = useState<GroupedConversations>({
    today: [],
    yesterday: [],
    previous_7_days: [],
    older: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversations(query);
      setConversations(data.conversations);
      setGrouped(data.grouped);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message || 'Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations(searchQuery);
  }, [searchQuery, loadConversations]);

  const handleCreateNew = async (model_id = 'cretivra-1'): Promise<Conversation> => {
    const newConv = await createConversation('New Conversation', model_id);
    await loadConversations(searchQuery);
    return newConv;
  };

  const handleRename = async (id: string, newTitle: string) => {
    await updateConversation(id, { title: newTitle });
    await loadConversations(searchQuery);
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    await loadConversations(searchQuery);
  };

  return {
    conversations,
    grouped,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refresh: loadConversations,
    createNew: handleCreateNew,
    renameConversation: handleRename,
    deleteConversation: handleDelete,
  };
}
