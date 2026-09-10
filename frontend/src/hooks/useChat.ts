import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, Attachment, CretivraModel, Conversation } from '../types';
import { getConversation, uploadFile, fetchModels, deleteMessage, API_BASE, getAuthToken } from '../services/api';
import { readSSEStream } from '../services/streaming';

interface UseChatOptions {
  onConversationCreated?: (conv: Partial<Conversation> & { id: string }) => void;
}

export function useChat(options?: UseChatOptions) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('cretivra-1');
  const [availableModels, setAvailableModels] = useState<CretivraModel[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reasoningStatus, setReasoningStatus] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Load models on startup
  useEffect(() => {
    fetchModels()
      .then((models) => {
        if (models && models.length > 0) {
          setAvailableModels(models);
        }
      })
      .catch((err) => console.error('Failed to load Cretivra models:', err));
  }, []);

  // Load conversation messages when activeConversationId changes
  const loadConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setError(null);
    try {
      if (!id.startsWith('guest-')) {
        const conv = await getConversation(id);
        setMessages(conv.messages || []);
        if (conv.model_id) {
          setSelectedModel(conv.model_id);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load conversation from server:', err);
      // Fallback: check if messages exist in localStorage
      try {
        const cached = localStorage.getItem(`cretivra_chat_${id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setMessages(parsed.messages || []);
          if (parsed.model_id) setSelectedModel(parsed.model_id);
          return;
        }
      } catch {}
      setError(err.message || 'Could not load conversation messages.');
    }
  }, []);

  const clearActiveChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setActiveConversationId(null);
    setMessages([]);
    setAttachments([]);
    setError(null);
    setIsGenerating(false);
    setReasoningStatus(null);
  }, []);

  // Stop generation logic
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setReasoningStatus(null);
    setMessages((prev) =>
      prev.map((msg, idx) => {
        if (idx === prev.length - 1 && msg.role === 'assistant' && !msg.content.trim()) {
          return { ...msg, content: 'Generation stopped.' };
        }
        return msg;
      })
    );
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string, modelId = selectedModel, forceSearch = false, forceReason = false) => {
      if (!content.trim() || isGenerating) return;

      if (!getAuthToken()) {
        setError('Please sign in to access Asura AI models.');
        return;
      }

      setError(null);
      setIsGenerating(true);
      const isReasoning = forceReason || modelId === 'cretivra-reason';
      setReasoningStatus(isReasoning ? 'Thinking...' : null);

      const tempUserMsgId = `user-${Date.now()}`;
      const tempAssistantMsgId = `assistant-${Date.now()}`;

      const userMsg: Message = {
        id: tempUserMsgId,
        conversation_id: activeConversationId || '',
        role: 'user',
        content: content.trim(),
        attachments: [...attachments],
      };

      const assistantMsg: Message = {
        id: tempAssistantMsgId,
        conversation_id: activeConversationId || '',
        role: 'assistant',
        content: '',
        reasoning_status: isReasoning ? 'Thinking...' : null,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      const currentAttachments = [...attachments];
      setAttachments([]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let createdConvNotified = false;

      try {
        await readSSEStream(`${API_BASE}/chat/stream`, {
          method: 'POST',
          body: {
            conversation_id: activeConversationId?.startsWith('guest-') ? null : activeConversationId,
            message: content.trim(),
            model_id: modelId,
            attachments: currentAttachments,
            system_prompt: forceSearch ? '[REAL-TIME SEARCH]: Search web cache for up-to-date facts.' : undefined,
            web_search: forceSearch,
            deep_research: isReasoning,
          },
          signal: controller.signal,
          onChunk: (chunk) => {
            if (chunk.conversation_id) {
              if (!activeConversationId || activeConversationId.startsWith('guest-')) {
                setActiveConversationId(chunk.conversation_id);
              }
              if (!createdConvNotified) {
                createdConvNotified = true;
                optionsRef.current?.onConversationCreated?.({
                  id: chunk.conversation_id,
                  title: content.trim().slice(0, 45),
                  model_id: modelId,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }
            }

            if (chunk.reasoning_status) {
              setReasoningStatus(chunk.reasoning_status);
            }


            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === tempAssistantMsgId) {
                  return {
                    ...msg,
                    conversation_id: chunk.conversation_id || msg.conversation_id,
                    content: chunk.full_content !== undefined ? chunk.full_content : (msg.content + (chunk.content || '')),
                    reasoning_status: chunk.reasoning_status || msg.reasoning_status,
                    cache_items: chunk.cache_items || msg.cache_items,
                  };
                }
                if (msg.id === tempUserMsgId && chunk.conversation_id) {
                  return { ...msg, conversation_id: chunk.conversation_id };
                }
                return msg;
              })
            );
          },
          onError: (err) => {
            console.error('Streaming error:', err);
            setError("Cretivra couldn't complete that response. Please try again.");
          },
          onComplete: () => {
            setIsGenerating(false);
            setReasoningStatus(null);
            abortControllerRef.current = null;
          },
        });
      } catch (err: any) {
        setIsGenerating(false);
        setReasoningStatus(null);
        if (err.name !== 'AbortError') {
          setError(err.message || 'Error formulating response');
        }
      }
    },
    [activeConversationId, selectedModel, attachments, isGenerating]
  );

  // Edit message in-place
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!newContent.trim() || isGenerating) return;

      setIsGenerating(true);
      setError(null);
      setReasoningStatus(selectedModel === 'cretivra-reason' ? 'Thinking...' : null);

      const targetIndex = messages.findIndex((m) => m.id === messageId);
      if (targetIndex === -1) return;

      const updatedUserMsg: Message = { ...messages[targetIndex], content: newContent.trim() };
      const tempAssistantMsgId = `assistant-regen-${Date.now()}`;
      const newAssistantMsg: Message = {
        id: tempAssistantMsgId,
        conversation_id: activeConversationId || '',
        role: 'assistant',
        content: '',
      };

      setMessages([...messages.slice(0, targetIndex), updatedUserMsg, newAssistantMsg]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // If message has real server ID, use edit endpoint
        if (!messageId.startsWith('user-')) {
          await readSSEStream(`${API_BASE}/messages/${messageId}`, {
            method: 'PATCH',
            body: { message: newContent.trim() },
            signal: controller.signal,
            onChunk: (chunk) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempAssistantMsgId
                    ? { ...msg, content: chunk.full_content, reasoning_status: chunk.reasoning_status, cache_items: chunk.cache_items || msg.cache_items }
                    : msg
                )
              );
            },
            onComplete: () => {
              setIsGenerating(false);
              setReasoningStatus(null);
              abortControllerRef.current = null;
            },
          });
        } else {
          // Fallback stream via chat/stream
          await readSSEStream(`${API_BASE}/chat/stream`, {
            method: 'POST',
            body: {
              conversation_id: activeConversationId,
              message: newContent.trim(),
              model_id: selectedModel,
            },
            signal: controller.signal,
            onChunk: (chunk) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempAssistantMsgId
                    ? { ...msg, content: chunk.full_content, reasoning_status: chunk.reasoning_status, cache_items: chunk.cache_items || msg.cache_items }
                    : msg
                )
              );
            },
            onComplete: () => {
              setIsGenerating(false);
              setReasoningStatus(null);
              abortControllerRef.current = null;
            },
          });
        }
      } catch (err: any) {
        setIsGenerating(false);
        setReasoningStatus(null);
      }
    },
    [messages, activeConversationId, selectedModel, isGenerating]
  );

  // In-place Regenerate message
  const regenerateMessage = useCallback(
    async (assistantMessageId: string) => {
      if (isGenerating) return;

      setIsGenerating(true);
      setError(null);
      setReasoningStatus(selectedModel === 'cretivra-reason' ? 'Thinking...' : null);

      const targetIndex = messages.findIndex((m) => m.id === assistantMessageId);
      if (targetIndex === -1) return;

      const tempAssistantMsgId = `assistant-regen-${Date.now()}`;
      const placeholderAssistantMsg: Message = {
        id: tempAssistantMsgId,
        conversation_id: activeConversationId || '',
        role: 'assistant',
        content: '',
      };

      setMessages([...messages.slice(0, targetIndex), placeholderAssistantMsg]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (!assistantMessageId.startsWith('assistant-')) {
          await readSSEStream(`${API_BASE}/messages/${assistantMessageId}/regenerate`, {
            method: 'POST',
            signal: controller.signal,
            onChunk: (chunk) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempAssistantMsgId
                    ? { ...msg, content: chunk.full_content, reasoning_status: chunk.reasoning_status, cache_items: chunk.cache_items || msg.cache_items }
                    : msg
                )
              );
            },
            onComplete: () => {
              setIsGenerating(false);
              setReasoningStatus(null);
              abortControllerRef.current = null;
            },
          });
        } else {
          // Preceding user message
          const precedingUser = messages.slice(0, targetIndex).reverse().find((m) => m.role === 'user');
          if (precedingUser) {
            await readSSEStream(`${API_BASE}/chat/stream`, {
              method: 'POST',
              body: {
                conversation_id: activeConversationId,
                message: precedingUser.content,
                model_id: selectedModel,
              },
              signal: controller.signal,
              onChunk: (chunk) => {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === tempAssistantMsgId
                      ? { ...msg, content: chunk.full_content, reasoning_status: chunk.reasoning_status, cache_items: chunk.cache_items || msg.cache_items }
                      : msg
                  )
                );
              },
              onComplete: () => {
                setIsGenerating(false);
                setReasoningStatus(null);
                abortControllerRef.current = null;
              },
            });
          }
        }
      } catch (err: any) {
        setIsGenerating(false);
        setReasoningStatus(null);
      }
    },
    [messages, activeConversationId, selectedModel, isGenerating]
  );

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const attachment = await uploadFile(file);
      setAttachments((prev) => [...prev, attachment]);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    }
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  }, []);

  const attachExisting = useCallback((attachment: Attachment) => {
    setAttachments((prev) => {
      if (prev.some((a) => a.id === attachment.id)) return prev;
      return [...prev, attachment];
    });
  }, []);

  const deleteSingleMessage = useCallback(async (messageId: string) => {
    try {
      let idsToDelete = [messageId];
      const targetIndex = messages.findIndex((m) => m.id === messageId);
      if (targetIndex !== -1) {
        const targetMsg = messages[targetIndex];
        // If deleting a user question, also delete the subsequent assistant response
        if (targetMsg.role === 'user' && targetIndex + 1 < messages.length && messages[targetIndex + 1].role === 'assistant') {
          idsToDelete.push(messages[targetIndex + 1].id);
        }
      }

      setMessages((prev) => prev.filter((m) => !idsToDelete.includes(m.id)));

      for (const id of idsToDelete) {
        if (!id.startsWith('user-') && !id.startsWith('assistant-')) {
          await deleteMessage(id);
        }
      }
    } catch (err: any) {
      console.error('Failed to delete message:', err);
    }
  }, [messages]);

  return {
    activeConversationId,
    setActiveConversationId,
    messages,
    selectedModel,
    setSelectedModel,
    availableModels,
    isGenerating,
    reasoningStatus,
    attachments,
    error,
    loadConversation,
    clearActiveChat,
    sendMessage,
    editMessage,
    regenerateMessage,
    stopGeneration,
    handleFileUpload,
    removeAttachment,
    attachExisting,
    deleteSingleMessage,
  };
}
