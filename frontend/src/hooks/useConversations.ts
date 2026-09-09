import { useState, useEffect, useCallback } from 'react';
import type { Conversation, GroupedConversations } from '../types';
import { fetchConversations, createConversation, updateConversation, deleteConversation, bulkDeleteConversations, getAuthToken } from '../services/api';

const EMPTY_GROUPED: GroupedConversations = {
  today: [],
  yesterday: [],
  previous_7_days: [],
  older: [],
};

export function useConversations(user?: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [grouped, setGrouped] = useState<GroupedConversations>(EMPTY_GROUPED);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (query?: string) => {
    // Only load conversations if the user is authenticated
    const token = getAuthToken();
    if (!user && !token) {
      setConversations([]);
      setGrouped(EMPTY_GROUPED);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversations(query);
      setConversations(data.conversations || []);
      setGrouped(data.grouped || EMPTY_GROUPED);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message || 'Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const token = getAuthToken();
    if (user || token) {
      loadConversations(searchQuery);
    } else {
      setConversations([]);
      setGrouped(EMPTY_GROUPED);
    }
  }, [searchQuery, loadConversations, user]);

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

  const handleBulkDelete = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    await bulkDeleteConversations(ids);
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
    bulkDeleteConversations: handleBulkDelete,
  };
}
