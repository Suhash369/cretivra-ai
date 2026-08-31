import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, Attachment, CretivraModel } from '../types';
import { getConversation, uploadFile, fetchModels } from '../services/api';
import { readSSEStream } from '../services/streaming';

export function useChat() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('cretivra-1');
  const [availableModels, setAvailableModels] = useState<CretivraModel[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reasoningStatus, setReasoningStatus] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load models on startup
  useEffect(() => {
    fetchModels()
      .then((models) => setAvailableModels(models))
      .catch((err) => console.error('Failed to load Cretivra models:', err));
  }, []);

  // Load conversation messages when activeConversationId changes
  const loadConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setError(null);
    try {
      const conv = await getConversation(id);
      setMessages(conv.messages || []);
      setSelectedModel(conv.model_id || 'cretivra-1');
    } catch (err: any) {
      console.error('Failed to load conversation:', err);
      setError(err.message || 'Could not load conversation messages.');
    }
  }, []);

  const clearActiveChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setAttachments([]);
    setError(null);
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
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string, modelId = selectedModel) => {
      if (!content.trim() || isGenerating) return;

      setError(null);
      setIsGenerating(true);
      setReasoningStatus(selectedModel === 'cretivra-reason' ? 'Thinking...' : null);

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
        reasoning_status: selectedModel === 'cretivra-reason' ? 'Thinking...' : null,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      const currentAttachments = [...attachments];
      setAttachments([]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await readSSEStream('/api/chat/stream', {
          method: 'POST',
          body: {
            conversation_id: activeConversationId,
            message: content.trim(),
            model_id: modelId,
            attachments: currentAttachments,
          },
          signal: controller.signal,
          onChunk: (chunk) => {
            if (!activeConversationId && chunk.conversation_id) {
              setActiveConversationId(chunk.conversation_id);
            }
            if (chunk.reasoning_status) {
              setReasoningStatus(chunk.reasoning_status);
            }

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === tempAssistantMsgId) {
                  return {
                    ...msg,
                    conversation_id: chunk.conversation_id,
                    content: chunk.full_content,
                    reasoning_status: chunk.reasoning_status || msg.reasoning_status,
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
      }
    },
    [activeConversationId, selectedModel, attachments, isGenerating]
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!newContent.trim() || isGenerating) return;

      setIsGenerating(true);
      setError(null);
      setReasoningStatus(selectedModel === 'cretivra-reason' ? 'Thinking...' : null);

      // Truncate messages in local UI up to target user message
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

      await readSSEStream(`/api/messages/${messageId}`, {
        method: 'PATCH',
        body: { message: newContent.trim() },
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMsgId
                ? { ...msg, content: chunk.full_content, reasoning_status: chunk.reasoning_status }
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
    },
    [messages, activeConversationId, selectedModel, isGenerating]
  );

  // Regenerate message
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

      await readSSEStream(`/api/messages/${assistantMessageId}/regenerate`, {
        method: 'POST',
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMsgId
                ? { ...msg, content: chunk.full_content, reasoning_status: chunk.reasoning_status }
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
  };
}
