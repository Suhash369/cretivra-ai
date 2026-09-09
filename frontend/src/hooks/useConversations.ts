import { useState, useEffect, useCallback, useRef } from 'react';
import type { Conversation, GroupedConversations } from '../types';
import {
  fetchConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  bulkDeleteConversations,
  getAuthToken,
} from '../services/api';

const EMPTY_GROUPED: GroupedConversations = {
  pinned: [],
  today: [],
  yesterday: [],
  previous_7_days: [],
  older: [],
};

function groupConversations(list: Conversation[], pinnedSet: Set<string>): GroupedConversations {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const sevenDaysStart = todayStart - 6 * 86400000;

  const result: GroupedConversations = {
    pinned: [],
    today: [],
    yesterday: [],
    previous_7_days: [],
    older: [],
  };

  for (const conv of list) {
    if (pinnedSet.has(conv.id)) {
      result.pinned!.push(conv);
      continue;
    }

    const t = conv.updated_at ? new Date(conv.updated_at).getTime() : (conv.created_at ? new Date(conv.created_at).getTime() : now.getTime());

    if (t >= todayStart) {
      result.today.push(conv);
    } else if (t >= yesterdayStart) {
      result.yesterday.push(conv);
    } else if (t >= sevenDaysStart) {
      result.previous_7_days.push(conv);
    } else {
      result.older.push(conv);
    }
  }

  return result;
}

export function useConversations(user?: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [grouped, setGrouped] = useState<GroupedConversations>(EMPTY_GROUPED);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('cretivra_pinned_chats');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const pinnedRef = useRef(pinnedIds);
  pinnedRef.current = pinnedIds;

  const updateConversationsList = useCallback((list: Conversation[]) => {
    setConversations(list);
    setGrouped(groupConversations(list, pinnedRef.current));
  }, []);

  const loadConversations = useCallback(async (query?: string) => {
    if (!user && !getAuthToken()) {
      setConversations([]);
      setGrouped(EMPTY_GROUPED);
      setLoading(false);
      try {
        localStorage.removeItem('cretivra_guest_conversations');
      } catch {}
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversations(query);
      const list = data.conversations || [];
      updateConversationsList(list);
    } catch (err: any) {
      console.warn('Failed to fetch conversations from server:', err);
      setError(err.message || 'Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  }, [user, updateConversationsList]);

  useEffect(() => {
    loadConversations(searchQuery);
  }, [searchQuery, loadConversations, user]);

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('cretivra_pinned_chats', JSON.stringify(Array.from(next)));
      } catch {}
      setGrouped(groupConversations(conversations, next));
      return next;
    });
  }, [conversations]);

  const handleCreateNew = async (model_id = 'cretivra-1'): Promise<Conversation> => {
    try {
      const newConv = await createConversation('New Conversation', model_id);
      const nextList = [newConv, ...conversations.filter((c) => c.id !== newConv.id)];
      updateConversationsList(nextList);
      return newConv;
    } catch {
      // Fallback local conversation creation if server offline
      const localConv: Conversation = {
        id: `guest-${Date.now()}`,
        title: 'New Conversation',
        model_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      };
      const nextList = [localConv, ...conversations];
      updateConversationsList(nextList);
      return localConv;
    }
  };

  const addOrUpdateConversation = useCallback((conv: Partial<Conversation> & { id: string }) => {
    setConversations((prev) => {
      const existsIndex = prev.findIndex((c) => c.id === conv.id);
      let nextList: Conversation[];
      if (existsIndex >= 0) {
        nextList = prev.map((c, i) => (i === existsIndex ? { ...c, ...conv, updated_at: new Date().toISOString() } : c));
      } else {
        const fullConv: Conversation = {
          id: conv.id,
          title: conv.title || 'New Conversation',
          model_id: conv.model_id || 'cretivra-1',
          created_at: conv.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: conv.messages || [],
        };
        nextList = [fullConv, ...prev];
      }
      setGrouped(groupConversations(nextList, pinnedRef.current));
      return nextList;
    });
  }, []);

  const handleRename = async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    // Optimistic update
    setConversations((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, title: trimmed, updated_at: new Date().toISOString() } : c));
      setGrouped(groupConversations(next, pinnedRef.current));
      return next;
    });

    try {
      if (!id.startsWith('guest-')) {
        await updateConversation(id, { title: trimmed });
      }
    } catch (err) {
      console.error('Failed to update title on server:', err);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic delete
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setGrouped(groupConversations(next, pinnedRef.current));
      return next;
    });

    try {
      if (!id.startsWith('guest-')) {
        await deleteConversation(id);
      }
    } catch (err) {
      console.error('Failed to delete on server:', err);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const toDeleteSet = new Set(ids);

    // Optimistic delete
    setConversations((prev) => {
      const next = prev.filter((c) => !toDeleteSet.has(c.id));
      setGrouped(groupConversations(next, pinnedRef.current));
      return next;
    });

    try {
      const serverIds = ids.filter((id) => !id.startsWith('guest-'));
      if (serverIds.length > 0) {
        await bulkDeleteConversations(serverIds);
      }
    } catch (err) {
      console.error('Failed to bulk delete on server:', err);
    }
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
    addOrUpdateConversation,
    renameConversation: handleRename,
    deleteConversation: handleDelete,
    bulkDeleteConversations: handleBulkDelete,
    togglePin,
    isPinned: (id: string) => pinnedIds.has(id),
  };
}
